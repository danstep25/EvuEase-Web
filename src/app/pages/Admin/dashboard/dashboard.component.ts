import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { UserService } from '../user-management/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly pageTitle = 'Admin Dashboard';
  readonly pageSubtitle = 'System administration and user management';

  totalUsers = 0;
  activeUsers = 0;
  systemLogsToday = 0;
  isLoading = false;

  userOverview = {
    registrars: 0,
    evaluators: 0,
    administrators: 0
  };

  recentActivity = [
    {
      action: 'CREATE - Programs',
      user: 'Maria Santos',
      description: 'Created program: BSIT',
      date: '1/22/2025, 8:30:00 AM',
      ip: '192.168.1.10'
    },
    {
      action: 'FINALIZE - Subject Evaluation',
      user: 'Juan Dela Cruz',
      description: 'Finalized evaluation for student: 010000145957',
      date: '1/22/2025, 9:15:00 AM',
      ip: '192.168.1.15'
    }
  ];

  ngOnInit(): void {
    this.loadUserStatistics();
  }

  loadUserStatistics(): void {
    this.isLoading = true;
    this.userService.getStatistics().subscribe({
      next: (stats) => {
        this.totalUsers = stats.totalUsers;
        this.activeUsers = stats.activeUsers;
        this.userOverview = {
          registrars: stats.registrars,
          evaluators: stats.evaluators,
          administrators: stats.administrators
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user statistics:', error);
        this.isLoading = false;
        this.totalUsers = 0;
        this.activeUsers = 0;
        this.userOverview = {
          registrars: 0,
          evaluators: 0,
          administrators: 0
        };
      }
    });
  }
}

