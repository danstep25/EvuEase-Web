import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAuthService } from '../services/student-auth.service';
import { StudentPortalService } from '../services/student-portal.service';
import { normalizeStudentYearTerm } from '../../../shared/utils/student-year-level.util';
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

  rows: StudentClassEnrollmentRow[] = [];
  currentTerm = '';
  isLoading = true;

  ngOnInit(): void {
    const student = this.studentAuth.getCurrentStudent();
    this.currentTerm = normalizeStudentYearTerm(student?.yearLevel ?? '');

    this.portalService.getEnrollments().subscribe({
      next: (overview) => {
        this.rows = overview.enrollments.filter(
          (row) => normalizeStudentYearTerm(row.yearLevel) === this.currentTerm
        );
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
