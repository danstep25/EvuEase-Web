import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type EvaluatorDownpaymentRow } from '../../../../../mock-data/evaluator/evaluator-downpayments.mock';
import {
  getEvaluatorDownpaymentHistoryByProgram,
  type EvaluatorDownpaymentHistoryRow
} from '../../../../../mock-data/evaluator/evaluator-downpayment-history.mock';

@Component({
  selector: 'app-evaluator-downpayment-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-downpayment-view.component.html',
  styleUrl: './evaluator-downpayment-view.component.scss'
})
export class EvaluatorDownpaymentViewComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() downpayment: EvaluatorDownpaymentRow | null = null;
  @Output() readonly close = new EventEmitter<void>();

  historyRows: EvaluatorDownpaymentHistoryRow[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] || changes['downpayment']) && this.isOpen && this.downpayment) {
      this.historyRows = getEvaluatorDownpaymentHistoryByProgram(this.downpayment.programCode);
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.historyRows = [];
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

  formatHistoryDate(iso: string): string {
    try {
      const d = new Date(iso);
      const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${datePart} at ${timePart}`;
    } catch {
      return iso;
    }
  }
}
