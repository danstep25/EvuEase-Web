import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluatorStudentAcademicService } from '../student-permanent-records/evaluator-student-academic.service';
import type { StudentCurriculumHistoryEntry } from '../../../core/models/student-curriculum.model';
import {
  formatCurriculumHistoryDate,
  type CurriculumHistoryViewModel
} from '../../Registrar/students/student-curriculum.mapper';

@Component({
  selector: 'app-evaluator-curriculum-history-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluator-curriculum-history-dialog.component.html',
  styleUrl: './evaluator-curriculum-history-dialog.component.scss'
})
export class EvaluatorCurriculumHistoryDialogComponent implements OnChanges {
  private readonly academicService = inject(EvaluatorStudentAcademicService);

  @Input() isOpen = false;
  @Input() studentId: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();

  viewModel: CurriculumHistoryViewModel | null = null;
  isLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen']?.currentValue === true || changes['studentId']) && this.isOpen && this.studentId) {
      this.loadHistory();
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.viewModel = null;
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  formatHistoryDate(value: string): string {
    return formatCurriculumHistoryDate(value);
  }

  displayDate(entry: StudentCurriculumHistoryEntry): string {
    return entry.createdAt ? formatCurriculumHistoryDate(entry.createdAt) : '—';
  }

  displayAcademicYear(entry: StudentCurriculumHistoryEntry): string {
    const year = entry.effectiveSchoolYear?.trim();
    return year || '—';
  }

  trackEntry(_index: number, entry: StudentCurriculumHistoryEntry): string {
    return `${entry.curriculumCode}-${entry.createdAt}`;
  }

  private loadHistory(): void {
    if (!this.studentId) {
      return;
    }
    this.isLoading = true;
    this.academicService.loadCurriculumHistory(this.studentId).subscribe({
      next: (vm) => {
        this.viewModel = vm;
        this.isLoading = false;
      },
      error: () => {
        this.viewModel = null;
        this.isLoading = false;
      }
    });
  }
}
