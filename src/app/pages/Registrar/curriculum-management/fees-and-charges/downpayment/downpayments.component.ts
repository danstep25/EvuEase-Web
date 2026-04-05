import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Downpayment, CreateDownpaymentRequest, UpdateDownpaymentRequest } from '../../../../../core/models/downpayment.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { DownpaymentService } from './downpayment.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { BasePaginationHandler } from '../../../../../shared/handlers/base-pagination.handler';
import { SORT_DEFAULTS } from '../../../../../shared/constants/sort.constant';
import { DownpaymentFormComponent } from './downpayment-form/downpayment-form.component';

@Component({
  selector: 'app-downpayments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DownpaymentFormComponent],
  templateUrl: './downpayments.component.html',
  styleUrl: './downpayments.component.scss'
})
export class DownpaymentsComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly service = inject(DownpaymentService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(DownpaymentFormComponent) formModal!: DownpaymentFormComponent;

  searchForm!: FormGroup;
  rows: Downpayment[] = [];
  isLoading = false;
  searchTerm = '';
  showForm = false;
  selected: Downpayment | null = null;
  takenDownpaymentProgramCodes: string[] = [];
  viewProgram: { programCode: string; programTitle: string } | null = null;
  historyRows: Downpayment[] = [];
  historyLoading = false;
  historyError: string | null = null;

  ngOnInit(): void {
    this.searchForm = this.fb.group({ search: [''] });
    this.searchForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => {
        this.searchTerm = (v || '').trim();
        this.resetToFirstPage();
        this.loadRows();
      });
    this.loadRows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRows(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };
    this.service.getDownpayments(params).subscribe({
      next: (response: PaginatedResponse<Downpayment>) => {
        if (response.success && response.data) {
          this.rows = response.data;
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        } else {
          this.rows = [];
          this.resetPagination();
        }
        this.refreshTakenDownpaymentProgramCodes();
        this.isLoading = false;
      },
      error: (error: { userMessage?: string; message?: string }) => {
        this.isLoading = false;
        this.rows = [];
        this.resetPagination();
        this.refreshTakenDownpaymentProgramCodes();
        this.notificationService.error(
          'Loading failed',
          error.userMessage || error.message || 'Could not load downpayment settings.'
        );
      }
    });
  }

  onAdd(): void {
    this.selected = null;
    this.refreshTakenDownpaymentProgramCodes();
    this.showForm = true;
  }

  onEdit(row: Downpayment): void {
    this.selected = row;
    this.refreshTakenDownpaymentProgramCodes();
    this.showForm = true;
  }

  private refreshTakenDownpaymentProgramCodes(): void {
    const codes = this.rows.map(r => (r.programCode || '').trim()).filter(c => c.length > 0);
    if (!this.selected) {
      this.takenDownpaymentProgramCodes = codes;
      return;
    }
    const editing = (this.selected.programCode || '').trim().toLowerCase();
    this.takenDownpaymentProgramCodes = codes.filter(c => c.toLowerCase() !== editing);
  }

  onView(row: Downpayment): void {
    const code = (row.programCode || '').trim();
    if (!code) {
      this.notificationService.error('View', 'This row has no program code.');
      return;
    }
    this.viewProgram = {
      programCode: code,
      programTitle: (row.programTitle || '').trim() || code
    };
    this.historyRows = [];
    this.historyError = null;
    this.historyLoading = true;
    this.service.getHistoryByProgram(code).subscribe({
      next: list => {
        this.historyRows = list;
        this.historyLoading = false;
      },
      error: (error: { userMessage?: string; message?: string }) => {
        this.historyLoading = false;
        this.historyError = error.userMessage || error.message || 'Could not load change history.';
        this.notificationService.error('History', this.historyError);
      }
    });
  }

  onCloseView(): void {
    this.viewProgram = null;
    this.historyRows = [];
    this.historyError = null;
    this.historyLoading = false;
  }

  onCloseForm(): void {
    this.showForm = false;
    this.selected = null;
    this.takenDownpaymentProgramCodes = [];
  }

  onSave(payload: CreateDownpaymentRequest | UpdateDownpaymentRequest): void {
    if (this.formModal) {
      this.formModal.setSubmitting(true);
    }
    if ('id' in payload && payload.id) {
      this.service.updateDownpayment(payload as UpdateDownpaymentRequest).subscribe({
        next: () => {
          this.formModal?.setSubmitting(false);
          this.notificationService.success('Updated', 'Downpayment rule saved.');
          this.onCloseForm();
          this.loadRows();
        },
        error: (error: { userMessage?: string; message?: string }) => {
          this.formModal?.setSubmitting(false);
          const msg = error.userMessage || error.message || 'Update failed.';
          this.formModal?.setError(msg);
          this.notificationService.error('Update failed', msg);
        }
      });
    } else {
      this.service.createDownpayment(payload as CreateDownpaymentRequest).subscribe({
        next: () => {
          this.formModal?.setSubmitting(false);
          this.notificationService.success('Created', 'Downpayment rule added.');
          this.onCloseForm();
          this.loadRows();
        },
        error: (error: { userMessage?: string; message?: string }) => {
          this.formModal?.setSubmitting(false);
          const msg = error.userMessage || error.message || 'Create failed.';
          this.formModal?.setError(msg);
          this.notificationService.error('Create failed', msg);
        }
      });
    }
  }

  formatPercent(n: number): string {
    const x = Number(n);
    if (!Number.isFinite(x)) {
      return '—';
    }
    return `${x % 1 === 0 ? x.toFixed(0) : x.toFixed(2)}%`;
  }

  formatLastUpdated(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  formatHistoryDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }
    try {
      const d = new Date(iso);
      const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${datePart} at ${timePart}`;
    } catch {
      return iso;
    }
  }

  historyUpdatedBy(row: Downpayment): string {
    const u = row.updatedBy?.trim();
    if (u) {
      return u;
    }
    const c = row.createdBy?.trim();
    if (c) {
      return c;
    }
    return '—';
  }

  protected loadData(): void {
    this.loadRows();
  }
}
