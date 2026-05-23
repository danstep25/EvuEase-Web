import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SearchableSelectComponent,
  SearchableSelectOption
} from '../../../shared/components/searchable-select/searchable-select.component';
import { EvaluatorAcademicRecordsViewComponent } from '../evaluator-academic-records-view/evaluator-academic-records-view.component';
import { SubjectEvaluationAddSubjectDialogComponent } from '../subject-evaluation-add-subject-dialog/subject-evaluation-add-subject-dialog.component';
import { SubjectEvaluationConfirmAddSubjectDialogComponent } from '../subject-evaluation-confirm-add-subject-dialog/subject-evaluation-confirm-add-subject-dialog.component';
import { SubjectEvaluationChargeSlipPreviewComponent } from '../subject-evaluation-charge-slip-preview/subject-evaluation-charge-slip-preview.component';
import {
  getChargeSlipPreview,
  type ChargeSlipPreview
} from '../../../../mock-data/evaluator/subject-evaluation-charge-slip.mock';
import { getAcademicRecordsStudentOptions } from '../../../../mock-data/evaluator/student-academic-records.mock';
import {
  getSubjectEvaluationFinishedSubjects,
  type SubjectEvaluationFinishedSubjectRow
} from '../../../../mock-data/evaluator/subject-evaluation-finished-subjects.mock';
import {
  buildUnitsSummary,
  computeSuggestedUnitsSelected,
  getCurrentTermSuggestedCourses,
  getDefaultSuggestedSelectionIds,
  getSubjectSelectionState,
  subjectSelectionExceedsLimit,
  type SubjectSelectionSuggestedRow,
  type SubjectSelectionViewMode
} from '../../../../mock-data/evaluator/subject-evaluation-subject-selection.mock';
import {
  SUBJECT_EVALUATION_PROGRAM_FILTER_OPTIONS,
  SUBJECT_EVALUATION_STUDENTS_MOCK,
  SUBJECT_EVALUATION_UPCOMING_TERM,
  SUBJECT_EVALUATION_YEAR_LEVEL_FILTER_OPTIONS,
  filterSubjectEvaluationStudents,
  findSubjectEvaluationStudent,
  getSubjectEvaluationSelectorStudents,
  toSubjectEvaluationStudentOption,
  toSubjectEvaluationStudentSummary,
  type SubjectEvaluationProgramFilter,
  type SubjectEvaluationStudentSummary,
  type SubjectEvaluationYearLevelFilter
} from '../../../../mock-data/evaluator/subject-evaluation.mock';

type SubjectEvaluationStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-subject-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchableSelectComponent,
    EvaluatorAcademicRecordsViewComponent,
    SubjectEvaluationAddSubjectDialogComponent,
    SubjectEvaluationConfirmAddSubjectDialogComponent,
    SubjectEvaluationChargeSlipPreviewComponent
  ],
  templateUrl: './subject-evaluation.component.html',
  styleUrl: './subject-evaluation.component.scss'
})
export class SubjectEvaluationComponent {
  readonly workflowTitle = 'Subject Evaluation';
  readonly academicRecordsTitle = 'Student Permanent Records';
  readonly workflowSubtitle = 'Assign student load for the upcoming term';
  readonly academicRecordsSubtitle = 'View student academic history and grades';

  showFullAcademicRecords = false;

  readonly upcomingTerm = SUBJECT_EVALUATION_UPCOMING_TERM;
  readonly programFilterOptions = SUBJECT_EVALUATION_PROGRAM_FILTER_OPTIONS;
  readonly yearLevelFilterOptions = SUBJECT_EVALUATION_YEAR_LEVEL_FILTER_OPTIONS;

  readonly steps: readonly { step: SubjectEvaluationStep; label: string }[] = [
    { step: 1, label: 'Student Info' },
    { step: 2, label: 'Finished Subjects' },
    { step: 3, label: 'Subject Selection' },
    { step: 4, label: 'Charge Slip Preview' }
  ];

  currentStep: SubjectEvaluationStep = 1;

  programFilter: SubjectEvaluationProgramFilter = 'all';
  yearLevelFilter: SubjectEvaluationYearLevelFilter = 'all';
  selectedStudentId: string | null = null;
  subjectSelectionViewMode: SubjectSelectionViewMode = 'all';
  showAddSubjectDialog = false;
  showConfirmAddSubjectDialog = false;
  confirmAddSubjectCourseCode = '';
  suggestedSelectedIds = new Set<string>();
  suggestedManuallyUncheckedIds = new Set<string>();
  private confirmAddSubjectPendingRow: SubjectSelectionSuggestedRow | null = null;
  private suggestedSelectionStudentId: string | null = null;

  get studentOptions(): SearchableSelectOption[] {
    return filterSubjectEvaluationStudents(
      getSubjectEvaluationSelectorStudents(),
      this.programFilter,
      this.yearLevelFilter
    ).map((student) => toSubjectEvaluationStudentOption(student));
  }

  get selectedStudentSummary(): SubjectEvaluationStudentSummary | null {
    const student = findSubjectEvaluationStudent(this.selectedStudentId);
    return student ? toSubjectEvaluationStudentSummary(student) : null;
  }

  get finishedSubjectsForStudent(): readonly SubjectEvaluationFinishedSubjectRow[] {
    return getSubjectEvaluationFinishedSubjects(this.selectedStudentId);
  }

  get hasFinishedSubjects(): boolean {
    return this.finishedSubjectsForStudent.length > 0;
  }

  isPrerequisiteItalic(prerequisite: string): boolean {
    return prerequisite.trim().toLowerCase() !== 'none';
  }

  get canProceedFromStep1(): boolean {
    return this.selectedStudentId != null && this.studentOptions.some((o) => o.id === this.selectedStudentId);
  }

  get pageTitle(): string {
    return this.showFullAcademicRecords ? this.academicRecordsTitle : this.workflowTitle;
  }

  get pageSubtitle(): string {
    return this.showFullAcademicRecords ? this.academicRecordsSubtitle : this.workflowSubtitle;
  }

  get academicRecordsStudentOptions(): SearchableSelectOption[] {
    return getAcademicRecordsStudentOptions();
  }

  get showStudentSummaryOnWorkflow(): boolean {
    return !this.showFullAcademicRecords && this.currentStep >= 2 && this.selectedStudentSummary != null;
  }

  get subjectSelectionState() {
    return getSubjectSelectionState(this.selectedStudentId);
  }

  get subjectSelectionUnitsSummary() {
    const { regularUnitsForNextTerm, unitLimit } = this.subjectSelectionState.limits;
    return buildUnitsSummary(
      regularUnitsForNextTerm,
      computeSuggestedUnitsSelected(
        this.subjectSelectionState.allTermCourses,
        this.suggestedSelectedIds
      ),
      unitLimit
    );
  }

  get subjectSelectionExceedsLimit(): boolean {
    return subjectSelectionExceedsLimit(this.subjectSelectionUnitsSummary);
  }

  get suggestedSubjectsForView(): readonly SubjectSelectionSuggestedRow[] {
    return this.subjectSelectionViewMode === 'current'
      ? getCurrentTermSuggestedCourses(this.subjectSelectionState)
      : this.subjectSelectionState.allTermCourses;
  }

  get hasSuggestedSubjectsForView(): boolean {
    return this.suggestedSubjectsForView.length > 0;
  }

  get canProceedFromStep3(): boolean {
    return !this.subjectSelectionExceedsLimit;
  }

  get chargeSlipPreview(): ChargeSlipPreview | null {
    return getChargeSlipPreview(this.selectedStudentId);
  }

  isStepActive(step: SubjectEvaluationStep): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: SubjectEvaluationStep): boolean {
    return this.currentStep > step;
  }

  isRailCompleted(afterStep: SubjectEvaluationStep): boolean {
    return afterStep < 4 && this.currentStep > afterStep;
  }

  onProgramFilterChange(value: string): void {
    this.programFilter = value as SubjectEvaluationProgramFilter;
    this.syncSelectedStudent();
  }

  onYearLevelFilterChange(value: string): void {
    this.yearLevelFilter = value as SubjectEvaluationYearLevelFilter;
    this.syncSelectedStudent();
  }

  onCancel(): void {
    this.programFilter = 'all';
    this.yearLevelFilter = 'all';
    this.selectedStudentId = null;
    this.currentStep = 1;
    this.showFullAcademicRecords = false;
    this.subjectSelectionViewMode = 'all';
    this.showAddSubjectDialog = false;
    this.closeConfirmAddSubjectDialog();
    this.resetSuggestedSelections();
  }

  onBack(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      return;
    }
    if (this.currentStep === 3) {
      this.currentStep = 2;
      this.subjectSelectionViewMode = 'all';
      this.showAddSubjectDialog = false;
      this.closeConfirmAddSubjectDialog();
      return;
    }
    if (this.currentStep === 4) {
      this.currentStep = 3;
      this.subjectSelectionViewMode = 'all';
    }
  }

  onNext(): void {
    if (this.currentStep === 1) {
      if (!this.canProceedFromStep1) {
        return;
      }
      this.currentStep = 2;
      return;
    }
    if (this.currentStep === 2) {
      this.ensureSuggestedSelectionsInitialized();
      this.subjectSelectionViewMode = 'all';
      this.currentStep = 3;
      return;
    }
    if (this.currentStep === 3) {
      if (!this.canProceedFromStep3) {
        return;
      }
      this.currentStep = 4;
    }
  }

  onPrintChargeSlip(): void {
    window.print();
  }

  setSubjectSelectionViewMode(mode: SubjectSelectionViewMode): void {
    this.subjectSelectionViewMode = mode;
  }

  isPrerequisiteNone(prerequisite: string): boolean {
    return prerequisite.trim().toLowerCase() === 'none';
  }

  trackSuggestedSubject(_index: number, row: SubjectSelectionSuggestedRow): string {
    return row.id;
  }

  isSuggestedSubjectSelected(row: SubjectSelectionSuggestedRow): boolean {
    return this.suggestedSelectedIds.has(row.id);
  }

  onSuggestedSubjectToggle(row: SubjectSelectionSuggestedRow, checked: boolean): void {
    if (checked) {
      if (this.suggestedManuallyUncheckedIds.has(row.id)) {
        this.confirmAddSubjectPendingRow = row;
        this.confirmAddSubjectCourseCode = row.courseCode;
        this.showConfirmAddSubjectDialog = true;
        return;
      }
      this.selectSuggestedSubject(row.id);
      return;
    }

    this.deselectSuggestedSubject(row.id);
    this.suggestedManuallyUncheckedIds.add(row.id);
  }

  onConfirmAddSubjectDialog(): void {
    if (this.confirmAddSubjectPendingRow) {
      this.selectSuggestedSubject(this.confirmAddSubjectPendingRow.id);
      this.suggestedManuallyUncheckedIds.delete(this.confirmAddSubjectPendingRow.id);
    }
    this.closeConfirmAddSubjectDialog();
  }

  onCancelConfirmAddSubjectDialog(): void {
    this.closeConfirmAddSubjectDialog();
  }

  private selectSuggestedSubject(id: string): void {
    const next = new Set(this.suggestedSelectedIds);
    next.add(id);
    this.suggestedSelectedIds = next;
  }

  private deselectSuggestedSubject(id: string): void {
    const next = new Set(this.suggestedSelectedIds);
    next.delete(id);
    this.suggestedSelectedIds = next;
  }

  private closeConfirmAddSubjectDialog(): void {
    this.showConfirmAddSubjectDialog = false;
    this.confirmAddSubjectCourseCode = '';
    this.confirmAddSubjectPendingRow = null;
  }

  private ensureSuggestedSelectionsInitialized(): void {
    if (this.suggestedSelectionStudentId === this.selectedStudentId) {
      return;
    }
    this.suggestedSelectionStudentId = this.selectedStudentId;
    this.suggestedSelectedIds = new Set(getDefaultSuggestedSelectionIds(this.selectedStudentId));
  }

  private resetSuggestedSelections(): void {
    this.suggestedSelectedIds = new Set();
    this.suggestedManuallyUncheckedIds = new Set();
    this.suggestedSelectionStudentId = null;
    this.closeConfirmAddSubjectDialog();
  }

  onOpenAddSubjectDialog(): void {
    this.showAddSubjectDialog = true;
  }

  onCloseAddSubjectDialog(): void {
    this.showAddSubjectDialog = false;
  }

  onViewFullAcademicRecords(): void {
    if (!this.selectedStudentId) {
      return;
    }
    this.showFullAcademicRecords = true;
  }

  onCloseFullAcademicRecords(): void {
    this.showFullAcademicRecords = false;
  }

  private syncSelectedStudent(): void {
    if (!this.selectedStudentId) {
      return;
    }
    const stillVisible = this.studentOptions.some((o) => o.id === this.selectedStudentId);
    if (!stillVisible) {
      this.selectedStudentId = null;
    }
  }
}
