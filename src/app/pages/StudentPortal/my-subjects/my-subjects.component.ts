import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentAuthService } from '../services/student-auth.service';
import { StudentPortalService } from '../services/student-portal.service';
import { SchoolYearTermService } from '../../Registrar/school-year-term/school-year-term.service';
import {
  academicTermMatchesConfiguredPeriod,
  formatConfiguredTermLabel
} from '../../Registrar/students/student-enrollments.mapper';
import {
  enrollmentMatchesStudentYearTerm,
  normalizeStudentYearTerm
} from '../../../shared/utils/student-year-level.util';
import type { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';

@Component({
  selector: 'app-student-portal-my-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-subjects.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalMySubjectsComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);
  private readonly studentAuth = inject(StudentAuthService);
  private readonly schoolYearTermService = inject(SchoolYearTermService);

  rows: StudentClassEnrollmentRow[] = [];
  currentTerm = '';
  isLoading = true;

  ngOnInit(): void {
    const student = this.studentAuth.getCurrentStudent();
    const studentYearLevel = student?.yearLevel ?? '';
    this.currentTerm = normalizeStudentYearTerm(studentYearLevel);

    forkJoin({
      overview: this.portalService.getEnrollments(),
      currentSyTerm: this.schoolYearTermService.getCurrentSyTerm().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ overview, currentSyTerm }) => {
        const schoolYear = currentSyTerm?.syYear?.trim() ?? '';
        const semester = currentSyTerm?.sySemester?.trim() ?? '';
        const enrollments = overview.enrollments;

        if (schoolYear && semester) {
          this.currentTerm = formatConfiguredTermLabel(schoolYear, semester);
          this.rows = enrollments.filter((row) =>
            academicTermMatchesConfiguredPeriod(row.academicTerm, schoolYear, semester)
          );
        } else {
          this.rows = enrollments.filter((row) =>
            enrollmentMatchesStudentYearTerm(row.yearLevel, studentYearLevel)
          );
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
