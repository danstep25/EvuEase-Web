import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  getMigrateCurriculumContext,
  getNewCurriculumOptions,
  type MigrateCurriculumOption,
  type MigrateCurriculumStudentContext
} from '../../../../mock-data/evaluator/student-migrate-curriculum.mock';

@Component({
  selector: 'app-evaluator-migrate-curriculum-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluator-migrate-curriculum-dialog.component.html',
  styleUrl: './evaluator-migrate-curriculum-dialog.component.scss'
})
export class EvaluatorMigrateCurriculumDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() studentId: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();

  newCurriculumCode = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true || changes['studentId']) {
      this.newCurriculumCode = '';
    }
  }

  get context(): MigrateCurriculumStudentContext | null {
    return this.isOpen ? getMigrateCurriculumContext(this.studentId) : null;
  }

  get newCurriculumOptions(): readonly MigrateCurriculumOption[] {
    return getNewCurriculumOptions(this.studentId);
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.newCurriculumCode = '';
    this.closed.emit();
  }

  onCancel(): void {
    this.onClose();
  }

  trackOption(_index: number, option: MigrateCurriculumOption): string {
    return option.value;
  }
}
