import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudentPortalService } from '../services/student-portal.service';
import type { StudentPortalDashboard } from '../models/student-portal.models';

@Component({
  selector: 'app-student-portal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../student-portal.shared.scss', './dashboard.component.scss']
})
export class StudentPortalDashboardComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);

  dashboard: StudentPortalDashboard | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.portalService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load dashboard.';
        this.isLoading = false;
      }
    });
  }
}
