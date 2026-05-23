import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { EvaluatorOtherSchoolFeeRow } from '../../../../../mock-data/evaluator/evaluator-other-school-fees.mock';

@Component({
  selector: 'app-evaluator-other-school-fee-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-other-school-fee-delete.component.html',
  styleUrls: ['../evaluator-tuition-fee-delete/evaluator-tuition-fee-delete.component.scss']
})
export class EvaluatorOtherSchoolFeeDeleteComponent {
  @Input() isOpen = false;
  @Input() schoolFee: EvaluatorOtherSchoolFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly confirm = new EventEmitter<void>();

  get schoolFeeLabel(): string {
    return this.schoolFee?.schoolFee ?? '';
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
