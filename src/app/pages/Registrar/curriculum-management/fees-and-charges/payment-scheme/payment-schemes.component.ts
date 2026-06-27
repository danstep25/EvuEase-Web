import { Component, OnDestroy, OnInit, ViewChild, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  PaymentScheme,
  CreatePaymentSchemeRequest,
  UpdatePaymentSchemeRequest
} from '../../../../../core/models/payment-scheme.model';
import { PaymentSchemeService } from './payment-scheme.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { SORT_DEFAULTS } from '../../../../../shared/constants/sort.constant';
import {
  PaymentSchemeFormComponent,
  PaymentSchemeComboKey
} from './payment-scheme-form/payment-scheme-form.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../../../shared/components/confirmation-modal/confirmation-modal.component';
import { Semester } from '../../enums/semester.enum';
import { LookupService } from '../../../../../shared/services/lookup.service';

interface CalendarCell {
  date: Date | null;
  inMonth: boolean;
}

@Component({
  selector: 'app-payment-schemes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentSchemeFormComponent, ConfirmationModalComponent],
  templateUrl: './payment-schemes.component.html',
  styleUrl: './payment-schemes.component.scss'
})
export class PaymentSchemesComponent implements OnInit, OnDestroy {
  @Input() readOnly = false;

  private readonly service = inject(PaymentSchemeService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly lookupService = inject(LookupService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(PaymentSchemeFormComponent) formModal!: PaymentSchemeFormComponent;

  filterForm!: FormGroup;
  rows: PaymentScheme[] = [];
  filteredRows: PaymentScheme[] = [];
  isLoading = false;
  showForm = false;
  selected: PaymentScheme | null = null;
  takenCombos: PaymentSchemeComboKey[] = [];
  expandedId: string | null = null;
  calendarMonth = new Date().getMonth();
  calendarYear = new Date().getFullYear();
  schoolYearOptions: string[] = [];
  semesterOptions = ['', ...Object.values(Semester)];
  showDeleteConfirmation = false;
  schemeToDelete: PaymentScheme | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete payment scheme',
    message: 'Are you sure you want to delete this payment scheme?\nThis action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  };

  private readonly installmentColors = ['#1e3a8a', '#ca8a04', '#059669', '#7c3aed', '#dc2626', '#0891b2'];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      schoolYear: [''],
      semester: ['']
    });

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.applyFilters());
    this.loadSchoolYears();
    this.loadRows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRows(): void {
    this.isLoading = true;
    this.service
      .getPaymentSchemes({
        PageIndex: 1,
        PageSize: 500,
        SortDirection: SORT_DEFAULTS.DIRECTION,
        SortKey: '',
        searchTerm: ''
      })
      .subscribe({
        next: response => {
          this.rows = response.success && response.data ? response.data : [];
          this.applyFilters();
          this.refreshTakenCombos();
          this.isLoading = false;
        },
        error: (error: { userMessage?: string; message?: string }) => {
          this.isLoading = false;
          this.rows = [];
          this.filteredRows = [];
          this.notificationService.error(
            'Loading failed',
            error.userMessage || error.message || 'Could not load payment schemes.'
          );
        }
      });
  }

  onAdd(): void {
    this.selected = null;
    this.refreshTakenCombos();
    this.showForm = true;
  }

  onEdit(row: PaymentScheme): void {
    this.selected = row;
    this.refreshTakenCombos();
    this.showForm = true;
  }

  onDelete(row: PaymentScheme): void {
    this.schemeToDelete = row;
    this.deleteConfirmationConfig = {
      title: 'Delete payment scheme',
      message: `Delete the payment scheme for ${row.schoolYear} — ${row.semester}?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete(): void {
    if (!this.schemeToDelete) {
      return;
    }
    const id = this.schemeToDelete.id;
    this.service.deletePaymentScheme(id).subscribe({
      next: () => {
        this.notificationService.success('Deleted', 'Payment scheme removed.');
        this.showDeleteConfirmation = false;
        this.schemeToDelete = null;
        if (this.expandedId === id) {
          this.expandedId = null;
        }
        this.loadRows();
      },
      error: (error: { userMessage?: string; message?: string }) => {
        this.notificationService.error(
          'Delete failed',
          error.userMessage || error.message || 'Could not delete payment scheme.'
        );
      }
    });
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.schemeToDelete = null;
  }

  onCloseForm(): void {
    this.showForm = false;
    this.selected = null;
    this.takenCombos = [];
  }

  onSave(payload: CreatePaymentSchemeRequest | UpdatePaymentSchemeRequest): void {
    this.formModal?.setSubmitting(true);
    if ('id' in payload && payload.id) {
      this.service.updatePaymentScheme(payload as UpdatePaymentSchemeRequest).subscribe({
        next: () => {
          this.formModal?.setSubmitting(false);
          this.notificationService.success('Updated', 'Payment scheme saved.');
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
      return;
    }

    this.service.createPaymentScheme(payload as CreatePaymentSchemeRequest).subscribe({
      next: () => {
        this.formModal?.setSubmitting(false);
        this.notificationService.success('Created', 'Payment scheme added.');
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

  toggleExpand(row: PaymentScheme): void {
    if (this.expandedId === row.id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = row.id;
    const firstDate = row.installments[0]?.dueDate;
    if (firstDate) {
      const d = new Date(firstDate);
      if (!Number.isNaN(d.getTime())) {
        this.calendarMonth = d.getMonth();
        this.calendarYear = d.getFullYear();
      }
    }
  }

  isExpanded(row: PaymentScheme): boolean {
    return this.expandedId === row.id;
  }

  schemeDescription(row: PaymentScheme): string {
    if (row.description?.trim()) {
      return row.description.trim();
    }
    const count = row.installmentCount || row.installments?.length || 0;
    return `Payment split into ${count} installment${count === 1 ? '' : 's'}`;
  }

  installmentColor(index: number): string {
    return this.installmentColors[index % this.installmentColors.length];
  }

  formatDueDate(iso: string): string {
    if (!iso) {
      return '—';
    }
    const normalized = iso.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    try {
      const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
      return this.dateKey(d);
    } catch {
      return iso;
    }
  }

  calendarTitle(): string {
    const d = new Date(this.calendarYear, this.calendarMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  calendarCells(): CalendarCell[] {
    const first = new Date(this.calendarYear, this.calendarMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const cells: CalendarCell[] = [];

    for (let i = 0; i < startDay; i++) {
      cells.push({ date: null, inMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(this.calendarYear, this.calendarMonth, day), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, inMonth: false });
    }

    return cells;
  }

  installmentForDate(cell: CalendarCell): PaymentScheme['installments'][number] | null {
    if (!cell.date) {
      return null;
    }
    const row = this.rows.find(r => r.id === this.expandedId);
    if (!row) {
      return null;
    }
    const key = this.dateKey(cell.date);
    return row.installments.find(i => (i.dueDate || '').slice(0, 10) === key) ?? null;
  }

  installmentIndexForDate(cell: CalendarCell): number {
    if (!cell.date) {
      return 0;
    }
    const row = this.rows.find(r => r.id === this.expandedId);
    if (!row) {
      return 0;
    }
    const key = this.dateKey(cell.date);
    const index = row.installments.findIndex(i => (i.dueDate || '').slice(0, 10) === key);
    return index >= 0 ? index : 0;
  }

  prevMonth(): void {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear -= 1;
      return;
    }
    this.calendarMonth -= 1;
  }

  nextMonth(): void {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear += 1;
      return;
    }
    this.calendarMonth += 1;
  }

  private loadSchoolYears(): void {
    this.lookupService
      .getSyTermsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe(terms => {
        const years = terms.map(t => (t.syYear || '').trim()).filter(y => y.length > 0);
        this.schoolYearOptions = ['', ...new Set(years)];
      });
  }

  private applyFilters(): void {
    const schoolYear = (this.filterForm.get('schoolYear')?.value || '').trim();
    const semester = (this.filterForm.get('semester')?.value || '').trim();
    this.filteredRows = this.rows.filter(row => {
      const syMatch = !schoolYear || row.schoolYear === schoolYear;
      const semMatch = !semester || row.semester === semester;
      return syMatch && semMatch;
    });
  }

  private refreshTakenCombos(): void {
    const combos = this.rows.map(r => ({
      schoolYear: (r.schoolYear || '').trim(),
      semester: (r.semester || '').trim()
    }));
    if (!this.selected) {
      this.takenCombos = combos;
      return;
    }
    const editingSy = (this.selected.schoolYear || '').trim().toLowerCase();
    const editingSem = (this.selected.semester || '').trim().toLowerCase();
    this.takenCombos = combos.filter(
      c => !(c.schoolYear.toLowerCase() === editingSy && c.semester.toLowerCase() === editingSem)
    );
  }

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
