import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import { EvaluatorAcademicRecordsViewComponent } from '../evaluator-academic-records-view/evaluator-academic-records-view.component';
import { SubjectEvaluationAddSubjectDialogComponent } from '../subject-evaluation-add-subject-dialog/subject-evaluation-add-subject-dialog.component';
import { SubjectEvaluationConfirmAddSubjectDialogComponent } from '../subject-evaluation-confirm-add-subject-dialog/subject-evaluation-confirm-add-subject-dialog.component';
import { SubjectEvaluationChargeSlipPreviewComponent } from '../subject-evaluation-charge-slip-preview/subject-evaluation-charge-slip-preview.component';
import { StudentPermanentRecordsService } from '../student-permanent-records/student-permanent-records.service';
import { SubjectEvaluationService } from './subject-evaluation.service';
import {
  buildUnitsSummary,
  computeSuggestedUnitsSelected,
  getCurrentTermSuggestedCourses,
  pickDefaultSelectionIds,
  subjectSelectionExceedsLimit
} from './subject-evaluation.mapper';
import type {
  ChargeSlipPreview,
  SubjectEvaluationFilterOption,
  SubjectEvaluationFinishedSubjectRow,
  SubjectEvaluationStudentSummary,
  SubjectEvaluationUpcomingTerm,
  SubjectSelectionSuggestedRow,
  SubjectSelectionViewMode
} from './subject-evaluation.models';
import type { AddSubjectCatalogItem } from './subject-evaluation.models';

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
export class SubjectEvaluationComponent implements OnInit {
  private readonly subjectEvaluationService = inject(SubjectEvaluationService);
  private readonly studentRecordsService = inject(StudentPermanentRecordsService);

  readonly workflowTitle = 'Subject Evaluation';
  readonly academicRecordsTitle = 'Student Permanent Records';
  readonly workflowSubtitle = 'Assign student load for the upcoming term';
  readonly academicRecordsSubtitle = 'View student academic history and grades';

  readonly steps: readonly { step: SubjectEvaluationStep; label: string }[] = [
    { step: 1, label: 'Student Info' },
    { step: 2, label: 'Finished Subjects' },
    { step: 3, label: 'Subject Selection' },
    { step: 4, label: 'Charge Slip Preview' }
  ];

  isLoadingInitial = true;
  isLoadingStudent = false;
  isLoadingChargeSlip = false;

  upcomingTerm: SubjectEvaluationUpcomingTerm | null = null;
  programFilterOptions: readonly SubjectEvaluationFilterOption[] = [{ value: 'all', label: 'All Programs' }];
  yearLevelFilterOptions: readonly SubjectEvaluationFilterOption[] = [{ value: 'all', label: 'All Year Levels' }];

  showFullAcademicRecords = false;
  currentStep: SubjectEvaluationStep = 1;

  programFilter = 'all';
  yearLevelFilter = 'all';
  selectedStudentId: string | null = null;

  selectedStudentSummary: SubjectEvaluationStudentSummary | null = null;
  finishedSubjects: readonly SubjectEvaluationFinishedSubjectRow[] = [];
  subjectSelectionState = {
    limits: { regularUnitsForNextTerm: 0, unitLimit: 23 },
    currentYearTerm: '1Y1',
    allTermCourses: [] as readonly SubjectSelectionSuggestedRow[]
  };

  subjectSelectionViewMode: SubjectSelectionViewMode = 'all';
  showAddSubjectDialog = false;
  showConfirmAddSubjectDialog = false;
  confirmAddSubjectCourseCode = '';
  suggestedSelectedIds = new Set<string>();
  suggestedManuallyUncheckedIds = new Set<string>();
  chargeSlipPreview: ChargeSlipPreview | null = null;

  academicRecordsStudentOptions: SearchableSelectOption[] = [];

  private confirmAddSubjectPendingRow: SubjectSelectionSuggestedRow | null = null;
  private suggestedSelectionStudentId: string | null = null;
  private extraSuggestedRows: SubjectSelectionSuggestedRow[] = [];

  ngOnInit(): void {
    this.subjectEvaluationService.loadInitialData().subscribe({
      next: (data) => {
        this.upcomingTerm = data.upcomingTerm;
        this.programFilterOptions = data.programFilterOptions;
        this.yearLevelFilterOptions = data.yearLevelFilterOptions;
        this.isLoadingInitial = false;
      },
      error: () => {
        this.isLoadingInitial = false;
      }
    });

    this.studentRecordsService.getStudentOptions().subscribe({
      next: (options) => {
        this.academicRecordsStudentOptions = options;
      }
    });
  }

  get studentOptions(): SearchableSelectOption[] {
    return this.subjectEvaluationService.getStudentOptions(this.programFilter, this.yearLevelFilter);
  }

  get hasFinishedSubjects(): boolean {
    return this.finishedSubjects.length > 0;
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

  get showStudentSummaryOnWorkflow(): boolean {
    return !this.showFullAcademicRecords && this.currentStep >= 2 && this.selectedStudentSummary != null;
  }

  get allSuggestedCourses(): readonly SubjectSelectionSuggestedRow[] {
    const base = this.subjectSelectionState.allTermCourses;
    const extra = this.extraSuggestedRows.filter(
      (e) => !base.some((b) => b.id === e.id)
    );
    return [...base, ...extra];
  }

  get subjectSelectionUnitsSummary() {
    const { regularUnitsForNextTerm, unitLimit } = this.subjectSelectionState.limits;
    return buildUnitsSummary(
      regularUnitsForNextTerm,
      computeSuggestedUnitsSelected(this.allSuggestedCourses, this.suggestedSelectedIds),
      unitLimit
    );
  }

  get subjectSelectionExceedsLimit(): boolean {
    return subjectSelectionExceedsLimit(this.subjectSelectionUnitsSummary);
  }

  get suggestedSubjectsForView(): readonly SubjectSelectionSuggestedRow[] {
    const pool = this.subjectSelectionViewMode === 'current'
      ? getCurrentTermSuggestedCourses({
          ...this.subjectSelectionState,
          allTermCourses: this.allSuggestedCourses
        })
      : this.allSuggestedCourses;
    return pool;
  }

  get hasSuggestedSubjectsForView(): boolean {
    return this.suggestedSubjectsForView.length > 0;
  }

  get canProceedFromStep3(): boolean {
    return !this.subjectSelectionExceedsLimit && this.suggestedSelectedIds.size > 0;
  }

  get upcomingTermLabel(): string {
    return this.upcomingTerm?.schoolYearTerm ?? '—';
  }

  isPrerequisiteItalic(prerequisite: string): boolean {
    return prerequisite.trim().toLowerCase() !== 'none';
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
    this.programFilter = value;
    this.syncSelectedStudent();
  }

  onYearLevelFilterChange(value: string): void {
    this.yearLevelFilter = String(value);
    this.syncSelectedStudent();
  }

  onSelectedStudentChange(studentId: string | null): void {
    this.selectedStudentId = studentId;
    this.selectedStudentSummary = null;
    this.finishedSubjects = [];
    this.chargeSlipPreview = null;
    this.resetSuggestedSelections();
    this.extraSuggestedRows = [];

    if (!studentId) {
      return;
    }

    this.isLoadingStudent = true;
    this.subjectEvaluationService.loadStudentWorkflow(studentId).subscribe({
      next: (workflow) => {
        this.isLoadingStudent = false;
        if (!workflow) {
          return;
        }
        this.selectedStudentSummary = workflow.summary;
        this.finishedSubjects = workflow.finishedSubjects;
        this.subjectSelectionState = workflow.subjectSelection;
      },
      error: () => {
        this.isLoadingStudent = false;
      }
    });
  }

  onCancel(): void {
    this.programFilter = 'all';
    this.yearLevelFilter = 'all';
    this.selectedStudentId = null;
    this.selectedStudentSummary = null;
    this.finishedSubjects = [];
    this.chargeSlipPreview = null;
    this.currentStep = 1;
    this.showFullAcademicRecords = false;
    this.subjectSelectionViewMode = 'all';
    this.showAddSubjectDialog = false;
    this.closeConfirmAddSubjectDialog();
    this.resetSuggestedSelections();
    this.extraSuggestedRows = [];
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
      this.chargeSlipPreview = null;
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
      this.loadChargeSlipAndAdvance();
    }
  }

  onPrintChargeSlip(): void {
    if (!this.chargeSlipPreview) {
      return;
    }

    const root = document.documentElement;
    root.classList.add('se-print-charge-slip');
    document.body.classList.add('se-print-charge-slip');

    const cleanup = (): void => {
      root.classList.remove('se-print-charge-slip');
      document.body.classList.remove('se-print-charge-slip');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
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

  onOpenAddSubjectDialog(): void {
    this.showAddSubjectDialog = true;
  }

  onCloseAddSubjectDialog(): void {
    this.showAddSubjectDialog = false;
  }

  onSubjectAddedFromDialog(item: AddSubjectCatalogItem): void {
    const yearTerm = this.subjectSelectionState.currentYearTerm;
    const row: SubjectSelectionSuggestedRow = {
      id: `${item.courseCode}-${yearTerm}-added`,
      courseCode: item.courseCode,
      subjectDescription: item.subjectDescription,
      prerequisite: item.prerequisite,
      units: item.units,
      component: 'Lecture',
      yearTerm
    };
    if (!this.allSuggestedCourses.some((c) => c.courseCode === row.courseCode)) {
      this.extraSuggestedRows = [...this.extraSuggestedRows, row];
    }
    this.selectSuggestedSubject(row.id);
    this.showAddSubjectDialog = false;
  }

  get excludeCourseCodesForAddDialog(): string[] {
    return this.allSuggestedCourses.map((c) => c.courseCode);
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

  private loadChargeSlipAndAdvance(): void {
    if (!this.selectedStudentId) {
      return;
    }
    this.isLoadingChargeSlip = true;
    const selectedIds = [...this.suggestedSelectedIds];
    this.subjectEvaluationService
      .loadChargeSlipPreview(
        this.selectedStudentId,
        this.allSuggestedCourses,
        selectedIds,
        this.subjectSelectionState.currentYearTerm
      )
      .subscribe({
        next: (preview) => {
          this.chargeSlipPreview = preview;
          this.isLoadingChargeSlip = false;
          this.currentStep = 4;
        },
        error: () => {
          this.chargeSlipPreview = null;
          this.isLoadingChargeSlip = false;
        }
      });
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
    this.suggestedSelectedIds = new Set(pickDefaultSelectionIds(this.subjectSelectionState));
  }

  private resetSuggestedSelections(): void {
    this.suggestedSelectedIds = new Set();
    this.suggestedManuallyUncheckedIds = new Set();
    this.suggestedSelectionStudentId = null;
    this.closeConfirmAddSubjectDialog();
  }

  private syncSelectedStudent(): void {
    if (!this.selectedStudentId) {
      return;
    }
    const stillVisible = this.studentOptions.some((o) => o.id === this.selectedStudentId);
    if (!stillVisible) {
      this.onSelectedStudentChange(null);
    }
  }
}

