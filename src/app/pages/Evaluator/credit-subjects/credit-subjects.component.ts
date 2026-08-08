import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditRequest, CreditRequestListRow } from '../../../core/models/credit-request.model';
import { CreditRequestService } from '../credit-request/credit-request.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-credit-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-subjects.component.html',
  styleUrl: './credit-subjects.component.scss'
})
export class CreditSubjectsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly creditRequestService = inject(CreditRequestService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'Credit Subjects (Transferees)';
  readonly pageSubtitle = 'Map equivalent subjects for transferee students';

  rows: CreditRequestListRow[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadRows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAddCreditRequest(): void {
    void this.router.navigate(['/evaluator', 'credit-subjects', 'add']);
  }

  onViewCreditRequest(id: number): void {
    void this.router.navigate(['/evaluator', 'credit-subjects', id]);
  }

  onPrintCreditRequest(id: number, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate(['/evaluator', 'credit-subjects', id], { queryParams: { print: true } });
  }

  onViewCreditRequestFromRow(id: number, event?: Event): void {
    event?.stopPropagation();
    this.onViewCreditRequest(id);
  }

  private loadRows(): void {
    this.isLoading = true;
    this.creditRequestService
      .getCreditRequests({ PageIndex: 1, PageSize: 100, SortDirection: 'desc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.rows = (response.data ?? []).map((row: CreditRequest) => ({
            id: row.id,
            creditRequestNo: row.creditRequestNo,
            studentNumber: row.studentNumber,
            studentName: row.studentName,
            programCode: row.programCode,
            programName: row.programTitle,
            status: this.mapStatus(row.requestStatus)
          }));
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoading = false;
          this.rows = [];
          this.notificationService.error(
            'Load failed',
            err?.userMessage || err?.message || 'Could not load credit requests.'
          );
        }
      });
  }

  private mapStatus(status: string): CreditRequestListRow['status'] {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'approved') {
      return 'approved';
    }
    if (normalized === 'rejected') {
      return 'rejected';
    }
    return 'pending';
  }
}
