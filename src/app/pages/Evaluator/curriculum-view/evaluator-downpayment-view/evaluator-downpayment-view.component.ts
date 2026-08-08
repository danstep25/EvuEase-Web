import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { NotificationService } from '../../../../shared/services/notification.service';
import type { EvaluatorDownpaymentHistoryRow, EvaluatorDownpaymentRow } from '../evaluator-curriculum-view.models';
import { mapDownpaymentHistoryRow } from '../evaluator-curriculum-view.mapper';
import { DownpaymentService } from '../../../Registrar/curriculum-management/fees-and-charges/downpayment/downpayment.service';

@Component({
  selector: 'app-evaluator-downpayment-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-downpayment-view.component.html',
  styleUrl: './evaluator-downpayment-view.component.scss'
})
export class EvaluatorDownpaymentViewComponent implements OnChanges {
  private readonly downpaymentService = inject(DownpaymentService);
  private readonly notificationService = inject(NotificationService);

  @Input() isOpen = false;
  @Input() downpayment: EvaluatorDownpaymentRow | null = null;
  @Output() readonly close = new EventEmitter<void>();

  historyRows: EvaluatorDownpaymentHistoryRow[] = [];
  isLoadingHistory = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] || changes['downpayment']) && this.isOpen && this.downpayment) {
      this.loadHistory(this.downpayment.programCode);
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.historyRows = [];
      this.isLoadingHistory = false;
    }
  }

  get programSubtitle(): string {
    if (!this.downpayment) {
      return '';
    }
    return `${this.downpayment.programCode} - ${this.downpayment.programTitle}`;
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  formatPercent(value: number): string {
    return `${value}%`;
  }

  formatHistoryDate(value: string): string {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return value;
    }
  }

  private loadHistory(programCode: string): void {
    this.isLoadingHistory = true;
    this.downpaymentService
      .getHistoryByProgram(programCode)
      .pipe(
        catchError((error) => {
          this.notificationService.error(
            'History Failed',
            error.userMessage || error.message || 'Could not load downpayment history.'
          );
          return of([]);
        })
      )
      .subscribe((rows) => {
        this.historyRows = rows.map(mapDownpaymentHistoryRow);
        this.isLoadingHistory = false;
      });
  }
}
