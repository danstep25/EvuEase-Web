import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService } from '../services/student-portal.service';
import type { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';

@Component({
  selector: 'app-student-portal-grade-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grade-history.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalGradeHistoryComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);

  grouped: { term: string; rows: StudentClassEnrollmentRow[] }[] = [];
  summary = { totalUnitsCompleted: 0, cumulativeGpa: null as number | null, failedSubjects: 0, retakenSubjects: 0 };
  isLoading = true;

  ngOnInit(): void {
    this.portalService.getEnrollments().subscribe({
      next: (overview) => {
        this.summary = overview.summary;
        this.grouped = this.groupByTerm(overview.enrollments);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private groupByTerm(rows: readonly StudentClassEnrollmentRow[]): { term: string; rows: StudentClassEnrollmentRow[] }[] {
    const map = new Map<string, StudentClassEnrollmentRow[]>();
    for (const row of rows) {
      const term = row.academicTerm?.trim() || 'Unknown Term';
      const list = map.get(term) ?? [];
      list.push(row);
      map.set(term, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([term, termRows]) => ({ term, rows: termRows }));
  }
}
