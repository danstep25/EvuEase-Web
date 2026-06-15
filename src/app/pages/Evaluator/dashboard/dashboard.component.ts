import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProgramService } from '../../Admin/program-management/program.service';
import { StudentsService } from '../../Registrar/students/students.service';
import { SchoolYearTermService } from '../../Registrar/school-year-term/school-year-term.service';
import { SystemLogsService } from '../../Admin/system-logs/system-logs.service';
import { SystemLog } from '../../../shared/models/system-log.model';

interface QuickAction {
  title: string;
  description: string;
  route: string;
  accent: 'green' | 'blue' | 'purple';
}

interface DashboardActivity {
  title: string;
  description: string;
  when: string;
}

@Component({
  selector: 'app-evaluator-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class EvaluatorDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly programService = inject(ProgramService);
  private readonly studentsService = inject(StudentsService);
  private readonly schoolYearTermService = inject(SchoolYearTermService);
  private readonly systemLogsService = inject(SystemLogsService);

  readonly pageTitle = 'Evaluator Dashboard';
  readonly pageSubtitle = 'Manage student evaluations and subject assignments';

  activePrograms = 0;
  activeStudents = 0;
  currentSchoolYear = '—';
  currentSemester = '—';

  readonly quickActions: QuickAction[] = [
    {
      title: 'Subject evaluation',
      description: 'Open subject evaluation workflows',
      route: '/evaluator/subject-evaluation',
      accent: 'green'
    },
    {
      title: 'Student records',
      description: 'View registrar student records',
      route: '/evaluator/student-records',
      accent: 'blue'
    },
    {
      title: 'Credit subjects',
      description: 'Process transferee subject credits',
      route: '/evaluator/credit-subjects',
      accent: 'purple'
    }
  ];

  recentActivity: DashboardActivity[] = [];

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadRecentActivity();
  }

  onOpenQuickAction(route: string): void {
    void this.router.navigateByUrl(route);
  }

  private loadDashboardStats(): void {
    forkJoin({
      programs: this.programService
        .getPrograms({ PageIndex: 1, PageSize: 1, SortKey: 'program_id', SortDirection: 'desc' })
        .pipe(catchError(() => of(null))),
      students: this.studentsService
        .getStudents({ PageIndex: 1, PageSize: 1, SortKey: 'id', SortDirection: 'desc', status: 'Active' })
        .pipe(catchError(() => of(null))),
      currentTerm: this.schoolYearTermService.getCurrentSyTerm().pipe(catchError(() => of(null)))
    }).subscribe(({ programs, students, currentTerm }) => {
      this.activePrograms = programs?.pagination?.total ?? 0;
      this.activeStudents = students?.pagination?.total ?? 0;
      if (currentTerm) {
        this.currentSchoolYear = currentTerm.syYear?.trim() || '—';
        this.currentSemester = currentTerm.sySemester?.trim() || '—';
      } else {
        this.currentSchoolYear = '—';
        this.currentSemester = '—';
      }
    });
  }

  private loadRecentActivity(): void {
    this.systemLogsService
      .getLogs({
        PageIndex: 1,
        PageSize: 5,
        SortKey: 'timestamp',
        SortDirection: 'desc'
      })
      .pipe(catchError(() => of(null)))
      .subscribe(response => {
        const logs = response?.data ?? [];
        this.recentActivity = logs.map(log => this.mapLogToActivity(log));
      });
  }

  private mapLogToActivity(log: SystemLog): DashboardActivity {
    const moduleText = (log.module || 'System').trim();
    const actionText = (log.action || 'Update').trim();
    return {
      title: `${moduleText} ${actionText}`.trim(),
      description: log.details?.trim() || `${log.user || 'Unknown user'} performed ${actionText} on ${moduleText}.`,
      when: this.toRelativeTime(log.timestamp)
    };
  }

  private toRelativeTime(raw: string): string {
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) {
      return '—';
    }

    const diffMs = dt.getTime() - Date.now();
    const absMs = Math.abs(diffMs);
    const minuteMs = 60_000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (absMs < hourMs) {
      return rtf.format(Math.round(diffMs / minuteMs), 'minute');
    }
    if (absMs < dayMs) {
      return rtf.format(Math.round(diffMs / hourMs), 'hour');
    }
    return rtf.format(Math.round(diffMs / dayMs), 'day');
  }
}
