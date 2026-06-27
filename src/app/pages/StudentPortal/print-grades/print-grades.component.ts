import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAuthService } from '../services/student-auth.service';
import { StudentPortalService } from '../services/student-portal.service';
import type { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';

@Component({
  selector: 'app-student-portal-print-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-grades.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalPrintGradesComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);
  private readonly studentAuth = inject(StudentAuthService);

  studentName = '';
  studentNumber = '';
  programYearLevel = '';
  rows: StudentClassEnrollmentRow[] = [];
  cumulativeGpa: number | null = null;
  isLoading = true;

  ngOnInit(): void {
    const student = this.studentAuth.getCurrentStudent();
    this.studentName = student?.name ?? '';
    this.studentNumber = student?.studentNumber ?? '';
    this.programYearLevel = `${student?.programCode ?? ''} - ${student?.yearLevel ?? ''}`;

    this.portalService.getEnrollments().subscribe({
      next: (overview) => {
        this.rows = [...overview.enrollments];
        this.cumulativeGpa = overview.summary.cumulativeGpa;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onPrint(): void {
    window.print();
  }
}
