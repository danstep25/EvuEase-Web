import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getCurriculumHistoryViewModel,
  type CurriculumHistoryEntry,
  type CurriculumHistoryViewModel
} from '../../../../mock-data/evaluator/student-curriculum-history.mock';

@Component({
  selector: 'app-evaluator-curriculum-history-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-curriculum-history-dialog.component.html',
  styleUrl: './evaluator-curriculum-history-dialog.component.scss'
})
export class EvaluatorCurriculumHistoryDialogComponent {
  @Input() isOpen = false;
  @Input() studentId: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();

  get viewModel(): CurriculumHistoryViewModel | null {
    return this.isOpen ? getCurriculumHistoryViewModel(this.studentId) : null;
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  trackEntry(_index: number, entry: CurriculumHistoryEntry): string {
    return `${entry.curriculumCode}-${entry.dateLabel}`;
  }
}
