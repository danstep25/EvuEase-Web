import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../user-management/user.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { SystemLog } from '../../../shared/models/system-log.model';
import { DateUtil } from '../../../shared/utils/date.util';

interface AdminDashboardActivity {
  action: string;
  user: string;
  description: string;
  date: string;
  ip: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly systemLogsService = inject(SystemLogsService);

  readonly pageTitle = 'Admin Dashboard';
  readonly pageSubtitle = 'System administration and user management';

  totalUsers = 0;
  activeUsers = 0;
  totalLogEntries = 0;

  userOverview = {
    registrars: 0,
    evaluators: 0,
    administrators: 0
  };

  recentActivity: AdminDashboardActivity[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    forkJoin({
      userStats: this.userService.getStatistics().pipe(catchError(() => of(null))),
      logStats: this.systemLogsService.getLogStats().pipe(catchError(() => of(null))),
      logs: this.systemLogsService
        .getLogs({
          PageIndex: 1,
          PageSize: 8,
          SortKey: 'timestamp',
          SortDirection: 'desc'
        })
        .pipe(catchError(() => of(null)))
    }).subscribe(({ userStats, logStats, logs }) => {
      if (userStats) {
        this.totalUsers = userStats.totalUsers;
        this.activeUsers = userStats.activeUsers;
        this.userOverview = {
          registrars: userStats.registrars,
          evaluators: userStats.evaluators,
          administrators: userStats.administrators
        };
      } else {
        this.totalUsers = 0;
        this.activeUsers = 0;
        this.userOverview = { registrars: 0, evaluators: 0, administrators: 0 };
      }

      this.totalLogEntries = logStats?.total ?? 0;
      const rows = logs?.data ?? [];
      this.recentActivity = rows.map(log => this.mapLogToActivity(log));
    });
  }

  private mapLogToActivity(log: SystemLog): AdminDashboardActivity {
    const moduleText = (log.module || 'System').trim();
    const actionText = (log.action || 'Update').trim();
    return {
      action: `${moduleText} — ${actionText}`.trim(),
      user: (log.user || 'Unknown').trim(),
      description: (log.details || '—').trim(),
      date: DateUtil.formatTimestamp(log.timestamp),
      ip: (log.ipAddress || '—').trim()
    };
  }
}
