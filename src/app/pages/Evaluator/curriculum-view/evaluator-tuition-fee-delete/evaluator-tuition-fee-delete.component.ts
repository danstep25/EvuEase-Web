import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { EvaluatorTuitionFeeRow } from '../../../../../mock-data/evaluator/evaluator-tuition-fees.mock';

@Component({
  selector: 'app-evaluator-tuition-fee-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-tuition-fee-delete.component.html',
  styleUrl: './evaluator-tuition-fee-delete.component.scss'
})
export class EvaluatorTuitionFeeDeleteComponent {
  @Input() isOpen = false;
  @Input() tuitionFee: EvaluatorTuitionFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly confirm = new EventEmitter<void>();

  get tuitionFeeLabel(): string {
    if (!this.tuitionFee) {
      return '';
    }
    return `${this.tuitionFee.courseCode} - ${this.tuitionFee.courseTitle}`;
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
