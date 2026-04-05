import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { Student } from '../../../../core/models/student.model';
import { StudentsService } from '../students.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { splitAcademicTermLabel } from '../student-enrollments.mapper';


export interface OverallAcademicSummary {
  totalUnitsCompleted: number;
  cumulativeGpa: number | null;
  failedSubjects: number;
  retakenSubjects: number;
}


export interface EnrolledSubjectRow {
  courseCode: string;
  courseTitle: string;
  units: number;
  schoolYear: string;
  semester: string;
  
  isCurrent?: boolean;
}

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss'
})
export class StudentDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentsService = inject(StudentsService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'Student Details';
  readonly pageSubtitle = 'View and manage student information';

  student: Student | null = null;
  isLoading = true;
  loadError: string | null = null;
  enrollmentsLoadError: string | null = null;
  enrolledSubjects: EnrolledSubjectRow[] = [];
  academicSummary: OverallAcademicSummary | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        void this.router.navigate(['/registrar/students']);
        return;
      }
      this.loadStudent(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStudent(id: string): void {
    this.isLoading = true;
    this.loadError = null;
    this.enrollmentsLoadError = null;
    this.student = null;
    this.enrolledSubjects = [];
    this.academicSummary = null;

    forkJoin({
      student: this.studentsService.getStudentById(id),
      overview: this.studentsService.getStudentEnrollmentOverview(id).pipe(
        catchError(() => {
          this.enrollmentsLoadError = 'Could not load class roster / academic summary.';
          return of(null);
        })
      )
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ student, overview }) => {
          this.student = student;
          if (overview) {
            this.enrolledSubjects = overview.enrollments.map(e => {
              const { schoolYear, semester } = splitAcademicTermLabel(e.academicTerm);
              return {
                courseCode: e.courseCode,
                courseTitle: e.courseTitle,
                units: e.units,
                schoolYear,
                semester,
                isCurrent: !e.officialGrade?.trim()
              };
            });
            this.academicSummary = {
              totalUnitsCompleted: overview.summary.totalUnitsCompleted,
              cumulativeGpa: overview.summary.cumulativeGpa,
              failedSubjects: overview.summary.failedSubjects,
              retakenSubjects: overview.summary.retakenSubjects
            };
          } else {
            this.academicSummary = {
              totalUnitsCompleted: 0,
              cumulativeGpa: null,
              failedSubjects: 0,
              retakenSubjects: 0
            };
          }
        },
        error: () => {
          this.loadError = 'Could not load student.';
        }
      });
  }

  getFullName(s: Student): string {
    const parts = [s.lastName, ', ', s.firstName];
    if (s.middleName?.trim()) {
      parts.push(' ', s.middleName.trim());
    }
    return parts.join('');
  }

  formatBirthdate(value: string | null | undefined): string {
    if (!value?.trim()) {
      return '—';
    }
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.slice(0, 10);
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) {
      return s;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getStatusBadgeClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'active') {
      return 'badge badge--success';
    }
    if (normalized === 'dropped') {
      return 'badge badge--danger';
    }
    return 'badge badge--neutral';
  }

  getTypeBadgeClass(type: string): string {
    const normalized = (type || '').toLowerCase();
    if (normalized === 'regular') {
      return 'badge badge--type-regular';
    }
    if (normalized === 'transferee') {
      return 'badge badge--type-transferee';
    }
    return 'badge badge--neutral';
  }

  displayOrDash(value: string | null | undefined): string {
    const t = value?.trim();
    return t ? t : '—';
  }

  onEdit(): void {
    if (!this.student) {
      return;
    }
    void this.router.navigate(['/registrar/students', String(this.student.id), 'edit']);
  }

  formatGpa(value: number | null): string {
    if (value == null) {
      return '—';
    }
    return value.toFixed(2);
  }

  onViewHistory(_row: EnrolledSubjectRow): void {
    if (!this.student) {
      return;
    }
    void this.router.navigate(['/registrar/students', String(this.student.id), 'academic-records']);
  }
}
