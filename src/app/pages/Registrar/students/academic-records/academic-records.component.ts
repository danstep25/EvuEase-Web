import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { Student } from '../../../../core/models/student.model';
import {
  AcademicRecordCourseRow,
  AcademicRecordSemesterBlock,
  CourseEnrollmentHistoryRow,
  SemesterLayoutPair
} from '../../../../core/models/academic-records.model';
import { StudentClassEnrollmentRow } from '../../../../core/models/student-enrollments.model';
import { StudentsService } from '../students.service';
import {
  buildCourseEnrollmentHistory,
  buildSemesterLayoutRows,
  groupEnrollmentsIntoSemesterBlocks
} from '../student-enrollments.mapper';

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
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'Academic Records';

  studentId: string | null = null;
  student: Student | null = null;
  isLoadingStudent = true;
  loadError: string | null = null;
  recordsLoadError: string | null = null;

  semesters: AcademicRecordSemesterBlock[] = [];
  
  semesterPairs: SemesterLayoutPair[] = [];
  
  semesterFullWidth: AcademicRecordSemesterBlock[] = [];
  
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
    this.student = null;
    this.semesters = [];
    this.semesterPairs = [];
    this.semesterFullWidth = [];
    this.enrollmentRows = [];
    this.closeCourseHistory();

    forkJoin({
      student: this.studentsService.getStudentById(id),
      overview: this.studentsService.getStudentEnrollmentOverview(id).pipe(
        catchError(() => {
          this.recordsLoadError = 'Could not load enrollment history for academic records.';
          return of(null);
        })
      )
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingStudent = false;
        })
      )
      .subscribe({
        next: ({ student, overview }) => {
          this.student = student;
          if (overview) {
            this.enrollmentRows = overview.enrollments;
            this.semesters = groupEnrollmentsIntoSemesterBlocks(overview.enrollments);
            const layout = buildSemesterLayoutRows(this.semesters);
            this.semesterPairs = layout.pairs;
            this.semesterFullWidth = layout.fullWidthBlocks;
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

  totalUnits(courses: AcademicRecordCourseRow[]): number {
    return courses.reduce((sum, c) => sum + c.units, 0);
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
