import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subject-evaluation-confirm-add-subject-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subject-evaluation-confirm-add-subject-dialog.component.html',
  styleUrl: './subject-evaluation-confirm-add-subject-dialog.component.scss'
})
export class SubjectEvaluationConfirmAddSubjectDialogComponent {
  @Input() isOpen = false;
  @Input() courseCode = '';
  @Output() readonly confirmed = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }
}
