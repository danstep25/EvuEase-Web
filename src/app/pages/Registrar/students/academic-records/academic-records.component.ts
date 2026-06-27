import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { Student } from '../../../../core/models/student.model';
import { EvaluatorCurriculumResolutionService } from '../../../Evaluator/student-permanent-records/evaluator-curriculum-resolution.service';
import { buildCurriculumDisplayLabel } from '../student-curriculum.mapper';
import {
  buildCurriculumSemesterLayoutRows,
  mergeCurriculumWithEnrollments
} from '../academic-records-curriculum.mapper';
import {
  AcademicRecordCourseRow,
  AcademicRecordSemesterBlock,
  CourseEnrollmentHistoryRow,
  SemesterLayoutPair
} from '../../../../core/models/academic-records.model';
import { StudentClassEnrollmentRow } from '../../../../core/models/student-enrollments.model';
import { StudentsService } from '../students.service';
import { SchoolYearTermService } from '../../school-year-term/school-year-term.service';
import {
  buildCourseEnrollmentHistory,
  buildSemesterLayoutRows,
  formatConfiguredTermLabel,
  groupEnrollmentsIntoSemesterBlocks,
  resolvePreviousTerm,
  selectConfiguredTermSemesterBlock
} from '../student-enrollments.mapper';

type RecordsViewMode = 'term' | 'curriculum';

@Component({
  selector: 'app-academic-records',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './academic-records.component.html',
  styleUrl: './academic-records.component.scss'
})
export class AcademicRecordsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentsService = inject(StudentsService);
  private readonly schoolYearTermService = inject(SchoolYearTermService);
  private readonly curriculumResolution = inject(EvaluatorCurriculumResolutionService);
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'Academic Records';

  studentId: string | null = null;
  student: Student | null = null;
  isLoadingStudent = true;
  loadError: string | null = null;
  recordsLoadError: string | null = null;
  curriculumLabel: string | null = null;
  curriculumLoadWarning: string | null = null;
  usesCurriculumPlan = false;
  viewMode: RecordsViewMode = 'term';

  recentTermBlock: AcademicRecordSemesterBlock | null = null;
  previousTermLabel: string | null = null;
  currentTermWarning: string | null = null;
  overallSemesterPairs: SemesterLayoutPair[] = [];
  overallSemesterFullWidth: AcademicRecordSemesterBlock[] = [];

  private enrollmentRows: StudentClassEnrollmentRow[] = [];

  courseHistoryOpen = false;
  courseHistoryCode = '';
  courseHistoryRows: CourseEnrollmentHistoryRow[] = [];

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        void this.router.navigate(['/registrar/students']);
        return;
      }
      this.studentId = id;
      this.loadData(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.courseHistoryOpen) {
      this.closeCourseHistory();
    }
  }

  private loadData(id: string): void {
    this.isLoadingStudent = true;
    this.loadError = null;
    this.recordsLoadError = null;
    this.curriculumLabel = null;
    this.curriculumLoadWarning = null;
    this.currentTermWarning = null;
    this.usesCurriculumPlan = false;
    this.viewMode = 'term';
    this.student = null;
    this.recentTermBlock = null;
    this.previousTermLabel = null;
    this.currentTermWarning = null;
    this.overallSemesterPairs = [];
    this.overallSemesterFullWidth = [];
    this.enrollmentRows = [];
    this.closeCourseHistory();

    this.studentsService
      .getStudentById(id)
      .pipe(
        switchMap((student) =>
          forkJoin({
            student: of(student),
            overview: this.studentsService.getStudentEnrollmentOverview(id).pipe(
              catchError(() => {
                this.recordsLoadError = 'Could not load enrollment history for academic records.';
                return of(null);
              })
            ),
            curriculum: this.curriculumResolution.resolveCurriculumContext(student).pipe(
              catchError(() =>
                of({
                  programCurricula: [],
                  curricula: null,
                  curriculumCode: student.curriculumCode?.trim() || null,
                  courses: []
                })
              )
            ),
            currentTerm: this.schoolYearTermService.getCurrentSyTerm().pipe(catchError(() => of(null)))
          })
        ),
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingStudent = false;
        })
      )
      .subscribe({
        next: ({ student, overview, curriculum, currentTerm }) => {
          this.student = student;
          const enrollments = overview?.enrollments ?? [];
          this.enrollmentRows = enrollments;

          const curriculumCode = curriculum.curriculumCode?.trim() || null;
          this.curriculumLabel = curriculumCode
            ? buildCurriculumDisplayLabel(curriculumCode, curriculum.curricula)
            : null;

          const enrollmentBlocks = groupEnrollmentsIntoSemesterBlocks(enrollments);
          const schoolYear = currentTerm?.syYear?.trim() ?? '';
          const semester = currentTerm?.sySemester?.trim() ?? '';

          if (schoolYear && semester) {
            const previousTerm = resolvePreviousTerm(schoolYear, semester);
            if (!previousTerm) {
              this.previousTermLabel = null;
              this.recentTermBlock = null;
              this.currentTermWarning =
                'Could not determine the previous term from the configured current school year and semester.';
            } else {
              this.previousTermLabel = formatConfiguredTermLabel(
                previousTerm.schoolYear,
                previousTerm.semester
              );
              this.recentTermBlock = selectConfiguredTermSemesterBlock(
                enrollmentBlocks,
                previousTerm.schoolYear,
                previousTerm.semester
              );
              if (!this.recentTermBlock) {
                this.currentTermWarning = `No enrollments found for the previous term (${this.previousTermLabel}).`;
              }
            }
          } else {
            this.previousTermLabel = null;
            this.recentTermBlock = null;
            this.currentTermWarning =
              'No current school year and semester are configured. Set them on the Registrar Dashboard.';
          }

          if (curriculum.courses.length > 0) {
            this.usesCurriculumPlan = true;
            const merged = mergeCurriculumWithEnrollments([...curriculum.courses], enrollments);
            const layout = buildCurriculumSemesterLayoutRows(merged.blocks);
            this.overallSemesterPairs = layout.pairs;
            this.overallSemesterFullWidth = [...layout.fullWidthBlocks, ...merged.extraEnrollments];
          } else if (overview) {
            if (curriculumCode) {
              this.curriculumLoadWarning =
                'Curriculum courses could not be loaded. Showing class roster enrollments only.';
            } else {
              this.curriculumLoadWarning =
                'No curriculum is assigned to this student. Showing class roster enrollments only.';
            }
            const layout = buildSemesterLayoutRows(enrollmentBlocks);
            this.overallSemesterPairs = layout.pairs;
            this.overallSemesterFullWidth = layout.fullWidthBlocks;
          }
        },
        error: () => {
          this.loadError = 'Could not load student.';
        }
      });
  }

  get subtitle(): string {
    if (!this.student) {
      return 'Grades from class roster enrollments';
    }
    const num = this.student.studentNumber?.trim();
    const name = [this.student.lastName, this.student.firstName].filter(Boolean).join(', ');
    if (num && name) {
      return `${num} · ${name}`;
    }
    return 'Grades from class roster enrollments';
  }

  setViewMode(mode: RecordsViewMode): void {
    this.viewMode = mode;
  }

  get hasCurriculumRecords(): boolean {
    return this.overallSemesterPairs.length > 0 || this.overallSemesterFullWidth.length > 0;
  }

  totalUnits(courses: AcademicRecordCourseRow[]): number {
    return courses.reduce((sum, c) => sum + c.units, 0);
  }

  takenUnits(courses: AcademicRecordCourseRow[]): number {
    return courses.filter((c) => !c.isNotTaken).reduce((sum, c) => sum + c.units, 0);
  }

  trackCourseRow(_index: number, row: AcademicRecordCourseRow): string {
    return row.enrollmentId > 0 ? String(row.enrollmentId) : row.courseCode;
  }

  formatGrade(value: number | null): string {
    if (value == null) {
      return '—';
    }
    return value.toFixed(2);
  }

  openCourseHistory(courseCode: string): void {
    const rows = buildCourseEnrollmentHistory(this.enrollmentRows, courseCode);
    if (rows.length === 0) {
      return;
    }
    this.courseHistoryCode = courseCode.trim();
    this.courseHistoryRows = rows;
    this.courseHistoryOpen = true;
  }

  closeCourseHistory(): void {
    this.courseHistoryOpen = false;
    this.courseHistoryCode = '';
    this.courseHistoryRows = [];
  }
}
