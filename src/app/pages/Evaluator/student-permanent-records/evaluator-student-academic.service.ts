import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MigrateStudentCurriculumRequest } from '../../../core/models/student-curriculum.model';
import { Student } from '../../../core/models/student.model';
import { StudentEnrollmentOverview } from '../../../core/models/student-enrollments.model';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { StudentsService } from '../../Registrar/students/students.service';
import { SchoolYearTermService } from '../../Registrar/school-year-term/school-year-term.service';
import { CourseService } from '../../Registrar/curriculum-management/course.service';
import { CurriculumManagementService } from '../../Registrar/curriculum-management/curriculum-management.service';
import { ProgramService } from '../../Admin/program-management/program.service';
import {
  buildCurriculumHistoryViewModel,
  enrichCurriculumHistoryEntries,
  type CurriculumHistoryViewModel
} from '../../Registrar/students/student-curriculum.mapper';
import {
  buildAcademicPlan,
  buildStudentAcademicProfile
} from './evaluator-student-academic.mapper';
import {
  buildMigrateCurriculumOptionLabel,
  buildMigrateCurriculumPreview,
  mapCourseFromApi
} from './evaluator-migrate-curriculum.mapper';
import { EvaluatorCurriculumResolutionService } from './evaluator-curriculum-resolution.service';
import { resolveEffectiveCurriculumCode } from './evaluator-curriculum-resolution.util';
import type {
  MigrateCurriculumOption,
  MigrateCurriculumPreview,
  MigrateCurriculumStudentContext,
  StudentAcademicPlan,
  StudentAcademicRecordProfile
} from './evaluator-student-academic.models';
import { Curricula } from '../../../core/models/curricula.model';

const BULK_PAGE = { PageIndex: 1, PageSize: 500, SortDirection: SORT_DEFAULTS.DIRECTION, SortKey: '' } as const;

const EMPTY_ENROLLMENT_OVERVIEW: StudentEnrollmentOverview = {
  enrollments: [],
  summary: { totalUnitsCompleted: 0, cumulativeGpa: null, failedSubjects: 0, retakenSubjects: 0 }
};

@Injectable({ providedIn: 'root' })
export class EvaluatorStudentAcademicService {
  private readonly studentsService = inject(StudentsService);
  private readonly schoolYearTermService = inject(SchoolYearTermService);
  private readonly courseService = inject(CourseService);
  private readonly curriculumService = inject(CurriculumManagementService);
  private readonly programService = inject(ProgramService);
  private readonly curriculumResolutionService = inject(EvaluatorCurriculumResolutionService);

  loadAcademicProfile(studentId: string): Observable<StudentAcademicRecordProfile | null> {
    return forkJoin({
      student: this.studentsService.getStudentById(studentId),
      overview: this.studentsService.getStudentEnrollmentOverview(studentId).pipe(
        catchError(() => of(EMPTY_ENROLLMENT_OVERVIEW))
      ),
      currentSyTerm: this.schoolYearTermService.getCurrentSyTerm().pipe(catchError(() => of(null)))
    }).pipe(
      switchMap(({ student, overview, currentSyTerm }) =>
        this.curriculumResolutionService.resolveCurriculumContext(student).pipe(
          map(({ curricula, curriculumCode, courses }) =>
            buildStudentAcademicProfile(
              student,
              overview.enrollments,
              [...courses],
              curricula,
              curriculumCode,
              currentSyTerm
                ? {
                    schoolYear: currentSyTerm.syYear?.trim() ?? '',
                    semester: currentSyTerm.sySemester?.trim() ?? ''
                  }
                : null
            )
          )
        )
      ),
      catchError(() => of(null))
    );
  }

  loadAcademicPlan(studentId: string): Observable<StudentAcademicPlan | null> {
    return forkJoin({
      student: this.studentsService.getStudentById(studentId),
      overview: this.studentsService.getStudentEnrollmentOverview(studentId).pipe(
        catchError(() => of(EMPTY_ENROLLMENT_OVERVIEW))
      )
    }).pipe(
      switchMap(({ student, overview }) =>
        forkJoin({
          student: of(student),
          overview: of(overview),
          program: this.programService
            .getPrograms({ ...BULK_PAGE, searchTerm: student.programCode })
            .pipe(
              map((res) =>
                (res.data ?? []).find(
                  (item) =>
                    item.programCode.trim().toLowerCase() === student.programCode.trim().toLowerCase()
                ) ?? null
              ),
              catchError(() => of(null))
            )
        }).pipe(
          switchMap(({ student: loadedStudent, overview: loadedOverview, program }) =>
            this.curriculumResolutionService.resolveCurriculumContext(loadedStudent).pipe(
              map(({ courses }) =>
                buildAcademicPlan(
                  [...courses],
                  loadedOverview.enrollments,
                  loadedStudent.yearLevel,
                  program?.programCompletionYears
                )
              )
            )
          )
        )
      ),
      catchError(() => of(null))
    );
  }

  loadMigrateContext(studentId: string): Observable<{
    context: MigrateCurriculumStudentContext;
    options: MigrateCurriculumOption[];
    student: Student;
    programId?: number;
    curriculaByCode: Map<string, Curricula>;
  } | null> {
    return this.studentsService.getStudentById(studentId).pipe(
      switchMap((student) =>
        this.programService
          .getPrograms({ ...BULK_PAGE, searchTerm: student.programCode })
          .pipe(
            switchMap((programsRes) => {
              const program = (programsRes.data ?? []).find(
                (p) => p.programCode.toLowerCase() === student.programCode.toLowerCase()
              );
              const programId = program?.programId;
              return this.curriculumService
                .getCurricula({
                  ...BULK_PAGE,
                  ...(programId != null ? { programId } : {})
                })
                .pipe(
                  map((res) => {
                    const programCurricula = (res.data ?? []).filter(
                      (c) => c.programCode.toLowerCase() === student.programCode.toLowerCase()
                    );
                    const curriculaByCode = new Map(
                      programCurricula.map((c) => [c.curriculumCode.trim().toLowerCase(), c])
                    );
                    const currentCurriculumCode =
                      resolveEffectiveCurriculumCode(student, programCurricula) || '—';
                    const current = currentCurriculumCode.toLowerCase();
                    const options = programCurricula
                      .filter((c) => c.curriculumCode.trim().toLowerCase() !== current)
                      .sort((a, b) => {
                        const aActive = a.curriculumStatus === 'Active' ? 0 : 1;
                        const bActive = b.curriculumStatus === 'Active' ? 0 : 1;
                        if (aActive !== bActive) {
                          return aActive - bActive;
                        }
                        return (b.syYear ?? '').localeCompare(a.syYear ?? '', undefined, { numeric: true });
                      })
                      .map((c) => ({
                        value: c.curriculumCode,
                        label: buildMigrateCurriculumOptionLabel(c),
                        status: (c.curriculumStatus === 'Active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive'
                      }));

                    return {
                      context: {
                        studentNumber: student.studentNumber,
                        fullName: formatStudentFullName(student),
                        program: student.programCode,
                        yearLevel: student.yearLevel,
                        currentCurriculumCode
                      },
                      options,
                      student,
                      programId: program?.programId,
                      curriculaByCode
                    };
                  })
                );
            })
          )
      ),
      catchError(() => of(null))
    );
  }

  loadMigratePreview(
    studentId: string,
    newCurriculumCode: string
  ): Observable<MigrateCurriculumPreview | null> {
    const code = newCurriculumCode?.trim();
    if (!code) {
      return of(null);
    }

    return this.loadMigrateContext(studentId).pipe(
      switchMap((migrateBundle) => {
        if (!migrateBundle) {
          return of(null);
        }
        return forkJoin({
          overview: this.studentsService.getStudentEnrollmentOverview(studentId).pipe(
            catchError(() => of(EMPTY_ENROLLMENT_OVERVIEW))
          ),
          newCourses: this.courseService
            .getAllCoursesForCurriculum({
              ...BULK_PAGE,
              curriculumCode: code,
              ...(migrateBundle.programId != null ? { programId: migrateBundle.programId } : {})
            })
            .pipe(
              map((courses) =>
                courses.map(mapCourseFromApi).filter((c) => !!c.courseCode.trim())
              ),
              catchError(() => of([]))
            )
        }).pipe(
          map(({ overview, newCourses }) => {
            const newCurricula =
              migrateBundle.curriculaByCode.get(code.toLowerCase()) ?? null;
            const oldCode = migrateBundle.context.currentCurriculumCode?.trim() ?? '';
            const oldCurricula = oldCode
              ? migrateBundle.curriculaByCode.get(oldCode.toLowerCase()) ?? null
              : null;

            return buildMigrateCurriculumPreview(
              code,
              newCourses,
              overview.enrollments,
              newCurricula,
              oldCurricula
            );
          })
        );
      }),
      catchError(() => of(null))
    );
  }

  migrateCurriculum(studentId: string, request: MigrateStudentCurriculumRequest): Observable<Student> {
    return this.studentsService.migrateStudentCurriculum(studentId, request);
  }

  loadCurriculumHistory(studentId: string): Observable<CurriculumHistoryViewModel | null> {
    return forkJoin({
      student: this.studentsService.getStudentById(studentId),
      history: this.studentsService.getStudentCurriculumHistory(studentId).pipe(catchError(() => of([]))),
      curricula: this.curriculumService.getCurricula(BULK_PAGE).pipe(catchError(() => of({ data: [] })))
    }).pipe(
      map(({ student, history, curricula }) => {
        const schoolYearByCode = new Map(
          (curricula.data ?? []).map((c) => [c.curriculumCode.trim().toLowerCase(), c.syYear?.trim() ?? ''])
        );
        const enriched = enrichCurriculumHistoryEntries(history, schoolYearByCode);
        return buildCurriculumHistoryViewModel(
          student.studentNumber,
          student.lastName,
          student.firstName,
          enriched
        );
      }),
      catchError(() => of(null))
    );
  }
}

function formatStudentFullName(student: Student): string {
  const given = [student.firstName, student.middleName].filter(Boolean).join(' ').trim();
  return [student.lastName, given].filter(Boolean).join(', ');
}
