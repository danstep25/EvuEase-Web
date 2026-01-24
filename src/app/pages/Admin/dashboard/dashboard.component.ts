import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

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
export class DashboardComponent {
  pageTitle = 'Admin Dashboard';
  pageSubtitle = 'System administration and user management';

  totalUsers = 6;
  activeUsers = 5;
  systemLogsToday = 5;

  userOverview = {
    registrars: 2,
    evaluators: 3,
    administrators: 1
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
}

