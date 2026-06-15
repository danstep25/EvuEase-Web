import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { FormDiscardService } from '../../../shared/services/form-discard.service';
import { attemptFormClose } from '../../../shared/utils/form-state.util';
import { MigrateStudentCurriculumRequest } from '../../../core/models/student-curriculum.model';
import { EvaluatorStudentAcademicService } from '../student-permanent-records/evaluator-student-academic.service';
import { NotificationService } from '../../../shared/services/notification.service';
import type {
  MigrateCurriculumOption,
  MigrateCurriculumPreview,
  MigrateCurriculumStudentContext,
  MigrateCurriculumStructureTerm,
  MigrateMappingTermBlock
} from '../student-permanent-records/evaluator-student-academic.models';

@Component({
  selector: 'app-evaluator-migrate-curriculum-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluator-migrate-curriculum-dialog.component.html',
  styleUrl: './evaluator-migrate-curriculum-dialog.component.scss'
})
export class EvaluatorMigrateCurriculumDialogComponent implements OnChanges {
  private readonly academicService = inject(EvaluatorStudentAcademicService);
  private readonly notificationService = inject(NotificationService);
  private readonly formDiscard = inject(FormDiscardService);

  private readonly dialogForm = new FormGroup({});

  @Input() isOpen = false;
  @Input() studentId: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly migrated = new EventEmitter<void>();

  newCurriculumCode = '';
  isLoading = false;
  isPreviewLoading = false;
  isSubmitting = false;
  context: MigrateCurriculumStudentContext | null = null;
  newCurriculumOptions: MigrateCurriculumOption[] = [];
  preview: MigrateCurriculumPreview | null = null;

  expandedStructureTerms: Record<string, boolean> = {};
  expandedMappingTerms: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen']?.currentValue === true || changes['studentId']) && this.isOpen && this.studentId) {
      this.resetState();
      this.loadContext();
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.resetState();
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    void attemptFormClose({
      form: this.dialogForm,
      discardService: this.formDiscard,
      close: () => this.finishClose()
    });
  }

  onCancel(): void {
    this.onClose();
  }

  onNewCurriculumChange(): void {
    if (this.newCurriculumCode?.trim()) {
      this.dialogForm.markAsDirty();
    }
    this.loadPreview();
  }

  onAutoSuggestMatches(): void {
    this.loadPreview();
  }

  onConfirm(): void {
    if (!this.studentId || !this.newCurriculumCode?.trim() || this.isSubmitting) {
      return;
    }

    const payload: MigrateStudentCurriculumRequest = {
      curriculumCode: this.newCurriculumCode.trim()
    };

    this.isSubmitting = true;
    this.academicService.migrateCurriculum(this.studentId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Curriculum Migrated', 'Student curriculum has been updated.');
        this.migrated.emit();
        this.finishClose();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(
          'Migration Failed',
          error.userMessage || error.message || 'Failed to migrate curriculum.'
        );
      }
    });
  }

  isStructureTermExpanded(term: MigrateCurriculumStructureTerm): boolean {
    return this.expandedStructureTerms[term.label] ?? true;
  }

  toggleStructureTerm(term: MigrateCurriculumStructureTerm): void {
    this.expandedStructureTerms = {
      ...this.expandedStructureTerms,
      [term.label]: !this.isStructureTermExpanded(term)
    };
  }

  isMappingTermExpanded(term: MigrateMappingTermBlock): boolean {
    return this.expandedMappingTerms[term.label] ?? false;
  }

  toggleMappingTerm(term: MigrateMappingTermBlock): void {
    this.expandedMappingTerms = {
      ...this.expandedMappingTerms,
      [term.label]: !this.isMappingTermExpanded(term)
    };
  }

  structureTermBadge(term: MigrateCurriculumStructureTerm): string {
    if (term.creditedCount > 0 && term.remainingCount === 0) {
      return `${term.creditedCount} Credited`;
    }
    if (term.remainingCount > 0) {
      return `${term.remainingCount} Remaining`;
    }
    return `${term.subjectCount} Subjects`;
  }

  trackOption(_index: number, option: MigrateCurriculumOption): string {
    return option.value;
  }

  trackStructureTerm(_index: number, term: MigrateCurriculumStructureTerm): string {
    return term.label;
  }

  trackMappingTerm(_index: number, term: MigrateMappingTermBlock): string {
    return term.label;
  }

  trackStructureCourse(_index: number, course: { courseCode: string }): string {
    return course.courseCode;
  }

  trackMappingRow(_index: number, row: { newCourseCode: string; oldCourseCode: string }): string {
    return `${row.oldCourseCode}-${row.newCourseCode}`;
  }

  private finishClose(): void {
    this.resetState();
    this.closed.emit();
  }

  private resetState(): void {
    this.newCurriculumCode = '';
    this.context = null;
    this.newCurriculumOptions = [];
    this.preview = null;
    this.expandedStructureTerms = {};
    this.expandedMappingTerms = {};
    this.dialogForm.markAsPristine();
  }

  private loadContext(): void {
    if (!this.studentId) {
      return;
    }
    this.isLoading = true;
    this.academicService.loadMigrateContext(this.studentId).subscribe({
      next: (data) => {
        this.context = data?.context ?? null;
        this.newCurriculumOptions = data?.options ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.context = null;
        this.newCurriculumOptions = [];
        this.isLoading = false;
      }
    });
  }

  private loadPreview(): void {
    const code = this.newCurriculumCode?.trim();
    if (!this.studentId || !code) {
      this.preview = null;
      this.expandedStructureTerms = {};
      this.expandedMappingTerms = {};
      return;
    }

    this.isPreviewLoading = true;
    this.academicService.loadMigratePreview(this.studentId, code).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.isPreviewLoading = false;
        if (preview) {
          this.expandedStructureTerms = Object.fromEntries(
            preview.structureTerms.map((term) => [term.label, true])
          );
          this.expandedMappingTerms =
            preview.mappingTerms.length > 0
              ? { [preview.mappingTerms[0].label]: true }
              : {};
        } else {
          this.expandedStructureTerms = {};
          this.expandedMappingTerms = {};
        }
      },
      error: () => {
        this.preview = null;
        this.isPreviewLoading = false;
      }
    });
  }
}
