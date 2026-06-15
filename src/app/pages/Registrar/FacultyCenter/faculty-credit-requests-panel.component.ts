import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CreditRequest, CreditRequestListRow } from '../../../core/models/credit-request.model';
import { CreditRequestService } from '../../Evaluator/credit-request/credit-request.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { printCreditRequestForm } from '../../../shared/utils/print-credit-request.util';
import { FacultyCreditRequestDetailModalComponent } from './faculty-credit-request-detail-modal.component';

type CreditRequestStatusFilter = '' | 'Pending' | 'Approved' | 'Rejected';

@Component({
  selector: 'app-faculty-credit-requests-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, FacultyCreditRequestDetailModalComponent],
  templateUrl: './faculty-credit-requests-panel.component.html',
  styleUrl: './faculty-credit-requests-panel.component.scss'
})
export class FacultyCreditRequestsPanelComponent implements OnInit, OnDestroy {
  private readonly creditRequestService = inject(CreditRequestService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  readonly statusFilters: { value: CreditRequestStatusFilter; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  rows: CreditRequestListRow[] = [];
  isLoading = true;
  searchQuery = '';
  statusFilter: CreditRequestStatusFilter = '';

  detailModalOpen = false;
  detailLoading = false;
  detailSaving = false;
  selectedCreditRequest: CreditRequest | null = null;

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

  onSearchChange(): void {
    this.search$.next(this.searchQuery.trim());
  }

  onStatusFilterChange(filter: CreditRequestStatusFilter): void {
    if (this.statusFilter === filter) {
      return;
    }
    this.statusFilter = filter;
    this.loadRows();
  }

  onReview(row: CreditRequestListRow, event?: Event): void {
    event?.stopPropagation();
    this.openDetail(row.id);
  }

  onPrint(row: CreditRequestListRow, event?: Event): void {
    event?.stopPropagation();
    this.creditRequestService
      .getCreditRequestById(String(row.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          this.selectedCreditRequest = request;
          this.detailModalOpen = true;
          window.setTimeout(() => printCreditRequestForm(), 350);
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.notificationService.error(
            'Print failed',
            err?.userMessage || err?.message || 'Could not load the credit request for printing.'
          );
        }
      });
  }

  onDetailClosed(): void {
    this.detailModalOpen = false;
    this.selectedCreditRequest = null;
    this.detailLoading = false;
    this.detailSaving = false;
  }

  onDetailStatusUpdated(request: CreditRequest): void {
    this.selectedCreditRequest = request;
    if (request.requestStatus?.trim().toLowerCase() !== 'pending') {
      this.loadRows();
    }
    const normalized = request.requestStatus?.trim().toLowerCase() ?? '';
    if (normalized === 'approved') {
      this.notificationService.success(
        'Credit request approved',
        `${request.creditRequestNo} was approved and mapped subjects were credited to the student.`
      );
      return;
    }
    if (normalized === 'rejected') {
      this.notificationService.success('Status updated', `${request.creditRequestNo} was rejected.`);
      return;
    }
  }

  private openDetail(id: number): void {
    this.detailModalOpen = true;
    this.detailLoading = true;
    this.selectedCreditRequest = null;

    this.creditRequestService
      .getCreditRequestById(String(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          this.detailLoading = false;
          this.selectedCreditRequest = request;
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.detailLoading = false;
          this.detailModalOpen = false;
          this.notificationService.error(
            'Load failed',
            err?.userMessage || err?.message || 'Could not load the credit request.'
          );
        }
      });
  }

  private loadRows(): void {
    this.isLoading = true;
    this.creditRequestService
      .getCreditRequests({
        PageIndex: 1,
        PageSize: 100,
        SortDirection: 'desc',
        searchTerm: this.searchQuery.trim(),
        requestStatus: this.statusFilter
      })
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
