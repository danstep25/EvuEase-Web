import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { StudentPortalService } from '../services/student-portal.service';
import type { StudentPortalGradeHistoryGroup } from '../models/student-portal.models';

@Component({
  selector: 'app-student-portal-grade-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grade-history.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalGradeHistoryComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);

  grouped: StudentPortalGradeHistoryGroup[] = [];
  summary = { totalUnitsCompleted: 0, cumulativeGpa: null as number | null, failedSubjects: 0, retakenSubjects: 0 };
  isLoading = true;

  ngOnInit(): void {
    forkJoin({
      history: this.portalService.getGradeHistory(),
      overview: this.portalService.getEnrollments()
    }).subscribe({
      next: ({ history, overview }) => {
        this.summary = overview.summary;
        this.grouped = [...history];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
