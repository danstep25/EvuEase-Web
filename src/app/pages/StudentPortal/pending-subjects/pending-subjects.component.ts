import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService } from '../services/student-portal.service';
import { groupPendingSubjectsByYearTerm } from '../utils/student-portal-pending.util';
import type { StudentPortalPendingTermGroup } from '../utils/student-portal-pending.util';

@Component({
  selector: 'app-student-portal-pending-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-subjects.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalPendingSubjectsComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);

  groups: StudentPortalPendingTermGroup[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.portalService.getPendingSubjects().subscribe({
      next: (rows) => {
        this.groups = [...groupPendingSubjectsByYearTerm(rows)];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  trackGroup(_index: number, group: StudentPortalPendingTermGroup): string {
    return group.yearTerm;
  }

  trackRow(_index: number, row: { courseCode: string; yearTerm: string }): string {
    return `${row.courseCode}-${row.yearTerm}`;
  }
}
