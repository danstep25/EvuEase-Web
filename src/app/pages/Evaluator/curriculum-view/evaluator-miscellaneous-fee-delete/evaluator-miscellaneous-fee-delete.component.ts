import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { EvaluatorMiscellaneousFeeRow } from '../evaluator-curriculum-view.models';

@Component({
  selector: 'app-evaluator-miscellaneous-fee-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-miscellaneous-fee-delete.component.html',
  styleUrls: ['../evaluator-tuition-fee-delete/evaluator-tuition-fee-delete.component.scss']
})
export class EvaluatorMiscellaneousFeeDeleteComponent {
  @Input() isOpen = false;
  @Input() miscellaneousFee: EvaluatorMiscellaneousFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly confirm = new EventEmitter<void>();

  get miscellaneousFeeLabel(): string {
    return this.miscellaneousFee?.miscellaneousFee ?? '';
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
