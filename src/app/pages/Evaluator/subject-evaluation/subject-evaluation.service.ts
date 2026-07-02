import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Student } from '../../../core/models/student.model';
import { StudentEnrollmentOverview } from '../../../core/models/student-enrollments.model';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import { StudentsService } from '../../Registrar/students/students.service';
import { ProgramService } from '../../Admin/program-management/program.service';
import { SchoolYearTermService } from '../../Registrar/school-year-term/school-year-term.service';
import { CourseService } from '../../Registrar/curriculum-management/course.service';
import { TuitionFeesService } from '../../Registrar/curriculum-management/fees-and-charges/tuition-fees/tuition-fees.service';
import { OtherSchoolFeesService } from '../../Registrar/curriculum-management/fees-and-charges/other-school-fees/other-school-fees.service';
import { MiscellaneousFeesService } from '../../Registrar/curriculum-management/fees-and-charges/miscellaneous-fees/miscellaneous-fees.service';
import { DownpaymentService } from '../../Registrar/curriculum-management/fees-and-charges/downpayment/downpayment.service';
import { PaymentSchemeService } from '../../Registrar/curriculum-management/fees-and-charges/payment-scheme/payment-scheme.service';
import { mapStudentEnrollmentOverview } from '../../Registrar/students/student-enrollments.mapper';
import { mapCourseFromApi } from '../student-permanent-records/evaluator-migrate-curriculum.mapper';
import { EvaluatorCurriculumResolutionService } from '../student-permanent-records/evaluator-curriculum-resolution.service';
import {
  buildAddSubjectCatalog,
  buildChargeSlipPreview,
  mapFinishedSubjects,
  buildProgramFilterOptions,
  buildStudentSummary,
  buildSubjectSelectionState,
  filterStudents,
  mapUpcomingTerm,
  toStudentOption,
  YEAR_LEVEL_FILTER_OPTIONS
} from './subject-evaluation.mapper';
import type {
  ChargeSlipPreview,
  SubjectEvaluationInitialData,
  SubjectEvaluationStudentWorkflow,
  SubjectSelectionSuggestedRow
} from './subject-evaluation.models';

const BULK_PAGE = { PageIndex: 1, PageSize: 500, SortDirection: SORT_DEFAULTS.DIRECTION, SortKey: '' } as const;

const ACTIVE_STUDENTS_PARAMS = {
  ...BULK_PAGE,
  SortKey: 'student_number',
  status: 'Active'
} as const;

const EMPTY_OVERVIEW: StudentEnrollmentOverview = {
  enrollments: [],
  summary: { totalUnitsCompleted: 0, cumulativeGpa: null, failedSubjects: 0, retakenSubjects: 0 }
};

@Injectable({ providedIn: 'root' })
export class SubjectEvaluationService {
  private readonly studentsService = inject(StudentsService);
  private readonly programService = inject(ProgramService);
  private readonly syTermService = inject(SchoolYearTermService);
  private readonly courseService = inject(CourseService);
  private readonly tuitionFeesService = inject(TuitionFeesService);
  private readonly otherSchoolFeesService = inject(OtherSchoolFeesService);
  private readonly miscellaneousFeesService = inject(MiscellaneousFeesService);
  private readonly downpaymentService = inject(DownpaymentService);
  private readonly paymentSchemeService = inject(PaymentSchemeService);
  private readonly curriculumResolutionService = inject(EvaluatorCurriculumResolutionService);

  private cachedStudents: Student[] = [];

  loadInitialData(): Observable<SubjectEvaluationInitialData> {
    return forkJoin({
      terms: this.syTermService.getSyTerms(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
      programs: this.programService.getPrograms(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
      students: this.studentsService.getStudents(ACTIVE_STUDENTS_PARAMS).pipe(catchError(() => of({ data: [] })))
    }).pipe(
      map(({ terms, programs, students }) => {
        this.cachedStudents = students.data ?? [];
        const programCodes = (programs.data ?? []).map((p) => p.programCode);
        const fromStudents = this.cachedStudents.map((s) => s.programCode);
        const allPrograms = [...new Set([...programCodes, ...fromStudents])];

        return {
          upcomingTerm: mapUpcomingTerm(terms.data ?? []),
          programFilterOptions: buildProgramFilterOptions(allPrograms),
          yearLevelFilterOptions: YEAR_LEVEL_FILTER_OPTIONS
        };
      })
    );
  }

  getStudentOptions(programFilter: string, yearLevelFilter: string): SearchableSelectOption[] {
    return filterStudents(this.cachedStudents, programFilter, yearLevelFilter).map(toStudentOption);
  }

  searchStudentOptions(
    searchTerm: string,
    programFilter: string,
    yearLevelFilter: string
  ): Observable<SearchableSelectOption[]> {
    const term = searchTerm.trim();
    if (term.length < 2) {
      return of(this.getStudentOptions(programFilter, yearLevelFilter));
    }

    return this.studentsService
      .getStudents({
        PageIndex: 1,
        PageSize: 50,
        SortDirection: SORT_DEFAULTS.DIRECTION,
        SortKey: 'student_number',
        searchTerm: term,
        programCode: programFilter !== 'all' ? programFilter : '',
        status: 'Active'
      })
      .pipe(
        map((res) => {
          this.mergeStudentsIntoCache(res.data ?? []);
          return filterStudents(res.data ?? [], programFilter, yearLevelFilter).map(toStudentOption);
        }),
        catchError(() => of([]))
      );
  }

  private mergeStudentsIntoCache(students: readonly Student[]): void {
    for (const student of students) {
      if (!this.cachedStudents.some((cached) => String(cached.id) === String(student.id))) {
        this.cachedStudents.push(student);
      }
    }
  }

  findStudent(studentId: string | null): Student | undefined {
    if (!studentId) {
      return undefined;
    }
    return this.cachedStudents.find((s) => String(s.id) === studentId);
  }

  loadStudentWorkflow(studentId: string): Observable<SubjectEvaluationStudentWorkflow | null> {
    const student = this.findStudent(studentId);
    if (!student) {
      return this.studentsService.getStudentById(studentId).pipe(
        switchMap((s) => this.loadWorkflowForStudent(s))
      );
    }
    return this.loadWorkflowForStudent(student);
  }

  loadChargeSlipPreview(
    studentId: string,
    selectionRows: readonly SubjectSelectionSuggestedRow[],
    selectedIds: readonly string[],
    currentYearTerm: string,
    electiveSelections: ReadonlyMap<string, string> = new Map(),
    schoolYear = '',
    semester = ''
  ): Observable<ChargeSlipPreview | null> {
    const student = this.findStudent(studentId);
    if (!student) {
      return of(null);
    }

    return this.curriculumResolutionService.resolveCurriculumContext(student).pipe(
      switchMap(({ curricula, curriculumCode: resolvedCode }) =>
        forkJoin({
          curricula: of(curricula),
          tuition: this.tuitionFeesService.getTuitionFees(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
          osf: this.otherSchoolFeesService.getOtherSchoolFees(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
          mf: this.miscellaneousFeesService.getMiscellaneousFees(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
          dp: this.downpaymentService.getDownpayments(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
          paymentSchemes: this.paymentSchemeService.getPaymentSchemes(BULK_PAGE).pipe(catchError(() => of({ data: [] }))),
          currentSyTerm: this.syTermService.getCurrentSyTerm().pipe(catchError(() => of(null)))
        }).pipe(
          map(({ curricula: resolvedCurricula, tuition, osf, mf, dp, paymentSchemes, currentSyTerm }) => {
            const resolvedSchoolYear = schoolYear.trim() || currentSyTerm?.syYear?.trim() || '';
            const resolvedSemester = semester.trim() || currentSyTerm?.sySemester?.trim() || '';

            return buildChargeSlipPreview(
              student,
              resolvedCurricula,
              selectionRows,
              selectedIds,
              tuition.data ?? [],
              osf.data ?? [],
              mf.data ?? [],
              dp.data ?? [],
              currentYearTerm,
              resolvedCode,
              electiveSelections,
              paymentSchemes.data ?? [],
              resolvedSchoolYear,
              resolvedSemester
            );
          })
        )
      ),
      catchError(() => of(null))
    );
  }

  getAddSubjectCatalog(
    studentId: string,
    excludeCourseCodes: readonly string[],
    termLabel: string
  ): Observable<readonly import('./subject-evaluation.models').AddSubjectCatalogItem[]> {
    const student = this.findStudent(studentId);
    if (!student) {
      return of([]);
    }

    return this.curriculumResolutionService.resolveCurriculumContext(student).pipe(
      switchMap(({ curriculumCode }) => {
        if (!curriculumCode) {
          return of([]);
        }

        return forkJoin({
          courses: this.courseService
            .getCourses({ ...BULK_PAGE, curriculumCode })
            .pipe(
              map((res) => (res.data ?? []).map(mapCourseFromApi)),
              catchError(() => of([]))
            ),
          overview: this.studentsService.getStudentEnrollmentOverview(studentId).pipe(
            map((raw) => mapStudentEnrollmentOverview(raw)),
            catchError(() => of(EMPTY_OVERVIEW))
          )
        }).pipe(
          map(({ courses, overview }) =>
            buildAddSubjectCatalog(courses, overview.enrollments, excludeCourseCodes, termLabel)
          )
        );
      }),
      catchError(() => of([]))
    );
  }

  private loadWorkflowForStudent(student: Student): Observable<SubjectEvaluationStudentWorkflow | null> {
    return forkJoin({
      overview: this.studentsService.getStudentEnrollmentOverview(String(student.id)).pipe(
        map((raw) => mapStudentEnrollmentOverview(raw)),
        catchError(() => of(EMPTY_OVERVIEW))
      ),
      curriculumContext: this.curriculumResolutionService.resolveCurriculumContext(student),
      electiveOptions: this.loadElectiveOptionsForStudent(student)
    }).pipe(
      map(({ overview, curriculumContext, electiveOptions }) => {
        const courses = curriculumContext.courses.map(mapCourseFromApi);
        const subjectSelection = buildSubjectSelectionState(
          student,
          courses,
          overview.enrollments,
          electiveOptions
        );
        return {
          summary: buildStudentSummary(
            student,
            curriculumContext.curricula,
            curriculumContext.curriculumCode
          ),
          finishedSubjects: mapFinishedSubjects(overview.enrollments),
          subjectSelection
        };
      }),
      catchError(() => of(null))
    );
  }

  private loadElectiveOptionsForStudent(student: Student): Observable<import('../../../core/models/course.model').Course[]> {
    const programCode = student.programCode?.trim();
    if (!programCode) {
      return of([]);
    }

    return this.programService.getPrograms({ ...BULK_PAGE, searchTerm: programCode }).pipe(
      switchMap((programsRes) => {
        const program = (programsRes.data ?? []).find(
          (item) => item.programCode.trim().toLowerCase() === programCode.toLowerCase()
        );
        if (program?.programId == null) {
          return of([]);
        }

        return this.courseService
          .getCourses({ ...BULK_PAGE, programId: program.programId, isElectiveOption: true })
          .pipe(
            map((res) => (res.data ?? []).map(mapCourseFromApi)),
            catchError(() => of([]))
          );
      }),
      catchError(() => of([]))
    );
  }
}
