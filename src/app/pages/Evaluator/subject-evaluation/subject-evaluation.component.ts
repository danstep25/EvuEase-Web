import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import { EvaluatorAcademicRecordsViewComponent } from '../evaluator-academic-records-view/evaluator-academic-records-view.component';
import { SubjectEvaluationAddSubjectDialogComponent } from '../subject-evaluation-add-subject-dialog/subject-evaluation-add-subject-dialog.component';
import { SubjectEvaluationConfirmAddSubjectDialogComponent } from '../subject-evaluation-confirm-add-subject-dialog/subject-evaluation-confirm-add-subject-dialog.component';
import { SubjectEvaluationChargeSlipPreviewComponent } from '../subject-evaluation-charge-slip-preview/subject-evaluation-charge-slip-preview.component';
import { StudentPermanentRecordsService } from '../student-permanent-records/student-permanent-records.service';
import { SubjectEvaluationService } from './subject-evaluation.service';
import {
  allSelectedElectiveSlotsHaveChoices,
  buildUnitsSummary,
  computeSuggestedUnitsSelected,
  getCurrentTermSuggestedCourses,
  groupSuggestedSubjectsByYearTerm,
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
  SubjectSelectionViewMode,
  SubjectSelectionYearTermGroup
} from './subject-evaluation.models';
import type { AddSubjectCatalogItem } from './subject-evaluation.models';

type SubjectEvaluationStep = 1 | 2 | 3 | 4;

interface SubjectEvaluationStudentQuery {
  readonly term: string;
  readonly programFilter: string;
  readonly yearLevelFilter: string;
}

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
export class SubjectEvaluationComponent implements OnInit, OnDestroy {
  private readonly subjectEvaluationService = inject(SubjectEvaluationService);
  private readonly studentRecordsService = inject(StudentPermanentRecordsService);
  private readonly destroy$ = new Subject<void>();
  private readonly studentQuery$ = new Subject<SubjectEvaluationStudentQuery>();

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
  studentOptions: SearchableSelectOption[] = [];
  studentSearchTerm = '';

  selectedStudentSummary: SubjectEvaluationStudentSummary | null = null;
  finishedSubjects: readonly SubjectEvaluationFinishedSubjectRow[] = [];
  subjectSelectionState = {
    limits: { regularUnitsForNextTerm: 0, unitLimit: 23 },
    currentYearTerm: '1Y1',
    allTermCourses: [] as readonly SubjectSelectionSuggestedRow[],
    eligibleCourses: [] as readonly SubjectSelectionSuggestedRow[]
  };

  subjectSelectionViewMode: SubjectSelectionViewMode = 'current';
  showAddSubjectDialog = false;
  showConfirmAddSubjectDialog = false;
  confirmAddSubjectCourseCode = '';
  suggestedSelectedIds = new Set<string>();
  suggestedManuallyUncheckedIds = new Set<string>();
  electiveSelections = new Map<string, string>();
  chargeSlipPreview: ChargeSlipPreview | null = null;

  academicRecordsStudentOptions: SearchableSelectOption[] = [];

  private confirmAddSubjectPendingRow: SubjectSelectionSuggestedRow | null = null;
  private suggestedSelectionStudentId: string | null = null;
  private extraSuggestedRows: SubjectSelectionSuggestedRow[] = [];

  ngOnInit(): void {
    this.studentQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (previous, current) =>
            previous.term === current.term &&
            previous.programFilter === current.programFilter &&
            previous.yearLevelFilter === current.yearLevelFilter
        ),
        switchMap((query) =>
          this.subjectEvaluationService.searchStudentOptions(
            query.term,
            query.programFilter,
            query.yearLevelFilter
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.studentOptions = options;
      });

    this.subjectEvaluationService.loadInitialData().subscribe({
      next: (data) => {
        this.upcomingTerm = data.upcomingTerm;
        this.programFilterOptions = data.programFilterOptions;
        this.yearLevelFilterOptions = data.yearLevelFilterOptions;
        this.isLoadingInitial = false;
        this.refreshStudentOptions();
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStudentSearchChange(term: string): void {
    this.studentSearchTerm = term;
    this.refreshStudentOptions();
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
    if (this.subjectSelectionViewMode === 'current') {
      return getCurrentTermSuggestedCourses(this.subjectSelectionState, this.extraSuggestedRows);
    }
    return this.allSuggestedCourses;
  }

  get suggestedSubjectsByYearTerm(): readonly SubjectSelectionYearTermGroup[] {
    return groupSuggestedSubjectsByYearTerm(this.suggestedSubjectsForView);
  }

  get hasSuggestedSubjectsForView(): boolean {
    return this.suggestedSubjectsForView.length > 0;
  }

  get canProceedFromStep3(): boolean {
    return (
      !this.subjectSelectionExceedsLimit &&
      this.suggestedSelectedIds.size > 0 &&
      allSelectedElectiveSlotsHaveChoices(
        this.allSuggestedCourses,
        this.suggestedSelectedIds,
        this.electiveSelections
      )
    );
  }

  get hasIncompleteElectiveSelections(): boolean {
    return !allSelectedElectiveSlotsHaveChoices(
      this.allSuggestedCourses,
      this.suggestedSelectedIds,
      this.electiveSelections
    );
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
    this.refreshStudentOptions();
  }

  onYearLevelFilterChange(value: string): void {
    this.yearLevelFilter = String(value);
    this.syncSelectedStudent();
    this.refreshStudentOptions();
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
    this.studentSearchTerm = '';
    this.selectedStudentId = null;
    this.selectedStudentSummary = null;
    this.finishedSubjects = [];
    this.chargeSlipPreview = null;
    this.currentStep = 1;
    this.showFullAcademicRecords = false;
    this.subjectSelectionViewMode = 'current';
    this.showAddSubjectDialog = false;
    this.closeConfirmAddSubjectDialog();
    this.resetSuggestedSelections();
    this.extraSuggestedRows = [];
    this.refreshStudentOptions();
  }

  onBack(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      return;
    }
    if (this.currentStep === 3) {
      this.currentStep = 2;
      this.subjectSelectionViewMode = 'current';
      this.showAddSubjectDialog = false;
      this.closeConfirmAddSubjectDialog();
      return;
    }
    if (this.currentStep === 4) {
      this.currentStep = 3;
      this.subjectSelectionViewMode = 'current';
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
      this.subjectSelectionViewMode = 'current';
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

  trackYearTermGroup(_index: number, group: SubjectSelectionYearTermGroup): string {
    return group.yearTerm;
  }

  isSuggestedSubjectSelected(row: SubjectSelectionSuggestedRow): boolean {
    return this.suggestedSelectedIds.has(row.id);
  }

  isElectiveSlotRow(row: SubjectSelectionSuggestedRow): boolean {
    return !!row.isElectiveSlot;
  }

  getElectiveSelection(row: SubjectSelectionSuggestedRow): string {
    return this.electiveSelections.get(row.id) ?? '';
  }

  onElectiveSelectionChange(row: SubjectSelectionSuggestedRow, courseCode: string): void {
    const next = new Map(this.electiveSelections);
    if (courseCode) {
      next.set(row.id, courseCode);
      if (!this.suggestedSelectedIds.has(row.id)) {
        this.selectSuggestedSubject(row.id);
      }
    } else {
      next.delete(row.id);
    }
    this.electiveSelections = next;
  }

  electiveOptionLabel(option: { courseCode: string; subjectDescription: string }): string {
    return `${option.courseCode} — ${option.subjectDescription}`;
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
      if (row.isElectiveSlot && row.eligibleElectives?.length === 1) {
        this.onElectiveSelectionChange(row, row.eligibleElectives[0].courseCode);
      }
      return;
    }

    this.deselectSuggestedSubject(row.id);
    this.suggestedManuallyUncheckedIds.add(row.id);
    if (row.isElectiveSlot) {
      const next = new Map(this.electiveSelections);
      next.delete(row.id);
      this.electiveSelections = next;
    }
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
        this.subjectSelectionState.currentYearTerm,
        this.electiveSelections,
        this.upcomingTerm?.schoolYear ?? '',
        this.upcomingTerm?.semester ?? ''
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
    this.electiveSelections = new Map();
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

  private refreshStudentOptions(): void {
    this.studentQuery$.next({
      term: this.studentSearchTerm,
      programFilter: this.programFilter,
      yearLevelFilter: this.yearLevelFilter
    });
  }
}

