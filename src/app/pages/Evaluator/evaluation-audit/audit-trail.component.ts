import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { EvaluationAuditService } from './evaluation-audit.service';
import { EvaluationAuditViewDialogComponent } from './evaluation-audit-view-dialog/evaluation-audit-view-dialog.component';
import type { EvaluationAuditListItem } from './evaluation-audit.models';
import { NotificationService } from '../../../shared/services/notification.service';
import { DateUtil } from '../../../shared/utils/date.util';

@Component({
  selector: 'app-evaluator-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, EvaluationAuditViewDialogComponent],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.scss'
})
export class EvaluatorAuditTrailComponent implements OnInit, OnDestroy {
  private readonly auditService = inject(EvaluationAuditService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  readonly pageTitle = 'Audit Trail';
  readonly pageSubtitle = 'Review completed subject evaluations, sorted by most recent';

  rows: EvaluationAuditListItem[] = [];
  isLoading = true;
  searchTerm = '';
  selectedAuditId: number | null = null;
  showViewDialog = false;

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.loadRows());

    this.loadRows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value.trim());
  }

  onView(row: EvaluationAuditListItem, event?: Event): void {
    event?.stopPropagation();
    this.selectedAuditId = row.id;
    this.showViewDialog = true;
  }

  onCloseViewDialog(): void {
    this.showViewDialog = false;
    this.selectedAuditId = null;
  }

  formatDate(value: string): string {
    return DateUtil.formatTimestamp(value);
  }

  private loadRows(): void {
    this.isLoading = true;
    this.auditService
      .getAuditRecords({
        PageIndex: 1,
        PageSize: 100,
        SortDirection: 'desc',
        searchTerm: this.searchTerm.trim()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.rows = response.data ?? [];
          this.isLoading = false;
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.rows = [];
          this.isLoading = false;
          this.notificationService.error(
            'Load failed',
            err?.userMessage || err?.message || 'Could not load evaluation audit records.'
          );
        }
      });
  }
}
