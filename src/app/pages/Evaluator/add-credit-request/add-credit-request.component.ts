import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  SearchableSelectComponent,
  SearchableSelectOption
} from '../../../shared/components/searchable-select/searchable-select.component';
import {
  CREDIT_REQUEST_PREVIEW_DECLARATION_TEXT,
  CREDIT_REQUEST_PREVIEW_ELIGIBILITY_TEXT,
  CREDIT_REQUEST_PREVIEW_MIN_TABLE_ROWS,
  CREDIT_REQUEST_PREVIEW_NON_STI_RULES,
  CREDIT_REQUEST_PREVIEW_STI_PROGRAM_RULES
} from '../../../../mock-data/evaluator/add-credit-request-preview.mock';
import {
  EVALUATOR_CREDIT_REQUEST_GRADE_STEP,
  EVALUATOR_CREDIT_REQUEST_MAX_UNIT,
  EVALUATOR_CREDIT_REQUEST_MIN_UNIT,
  EVALUATOR_EQUIVALENT_STI_COURSES,
  findEquivalentStiCourse,
  type EquivalentStiCourseOption
} from '../../../../mock-data/evaluator/add-credit-request.mock';

type AddCreditRequestStep = 1 | 2 | 3;

export interface CreditRequestPreviewTableRow {
  appliedCode: string;
  appliedTitle: string;
  lecDisplay: string;
  labDisplay: string;
  gradeDisplay: string;
  equivalentCode: string;
  equivalentTitle: string;
  equivalentLecDisplay: string;
  equivalentLabDisplay: string;
  unitsDisplay: string;
  hasEquivalent: boolean;
  isFilled: boolean;
}

@Component({
  selector: 'app-add-credit-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent],
  templateUrl: './add-credit-request.component.html',
  styleUrl: './add-credit-request.component.scss'
})
export class AddCreditRequestComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private nextRowId = 1;

  readonly pageTitle = 'Add Credit Request';
  readonly pageSubtitle = 'Map equivalent subject for a transferee student';

  currentStep: AddCreditRequestStep = 1;

  readonly equivalentCourses: readonly EquivalentStiCourseOption[] = EVALUATOR_EQUIVALENT_STI_COURSES;
  readonly minUnitValue = EVALUATOR_CREDIT_REQUEST_MIN_UNIT;
  readonly maxUnitValue = EVALUATOR_CREDIT_REQUEST_MAX_UNIT;
  readonly gradeStep = EVALUATOR_CREDIT_REQUEST_GRADE_STEP;

  readonly previewEligibilityText = CREDIT_REQUEST_PREVIEW_ELIGIBILITY_TEXT;
  readonly previewStiRules = CREDIT_REQUEST_PREVIEW_STI_PROGRAM_RULES;
  readonly previewNonStiRules = CREDIT_REQUEST_PREVIEW_NON_STI_RULES;
  readonly previewDeclarationText = CREDIT_REQUEST_PREVIEW_DECLARATION_TEXT;

  readonly programOptions: SearchableSelectOption[] = [
    { id: 'bsit', primary: 'BSIT', secondary: 'Bachelor of Science in Information Technology' },
    { id: 'bscs', primary: 'BSCS', secondary: 'Bachelor of Science in Computer Science' },
    { id: 'act', primary: 'ACT', secondary: 'Associate in Computer Technology' },
    { id: 'bsba', primary: 'BSBA', secondary: 'Bachelor of Science in Business Administration' },
    { id: 'bshm', primary: 'BSHM', secondary: 'Bachelor of Science in Hospitality Management' }
  ];

  readonly termOptions: SearchableSelectOption[] = [
    { id: '1-2025-2026', primary: '1st 2025-2026', secondary: '' },
    { id: '2-2024-2025', primary: '2nd 2024-2025', secondary: '' },
    { id: '1-2024-2025', primary: '1st 2024-2025', secondary: '' },
    { id: '2-2023-2024', primary: '2nd 2023-2024', secondary: '' },
    { id: '1-2023-2024', primary: '1st 2023-2024', secondary: '' },
    { id: '2-2022-2023', primary: '2nd 2022-2023', secondary: '' },
    { id: '1-2022-2023', primary: '1st 2022-2023', secondary: '' }
  ];

  readonly studentForm = this.fb.nonNullable.group({
    studentNumber: ['', Validators.required],
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    programId: [null as string | null, Validators.required],
    termId: [null as string | null, Validators.required]
  });

  readonly courseForm = this.fb.group({
    rows: this.fb.array([this.createCourseRow()])
  });

  get courseRows(): FormArray<FormGroup> {
    return this.courseForm.controls.rows as FormArray<FormGroup>;
  }

  isStepActive(step: AddCreditRequestStep): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: AddCreditRequestStep): boolean {
    return this.currentStep > step;
  }

  isRailCompleted(afterStep: 1 | 2): boolean {
    return this.currentStep > afterStep;
  }

  trackRow(index: number): string {
    return String(this.courseRows.at(index).get('rowId')?.value ?? index);
  }

  canRemoveCourseRow(): boolean {
    return this.courseRows.length > 1;
  }

  onCancel(): void {
    void this.router.navigate(['/evaluator', 'credit-subjects']);
  }

  onNext(): void {
    if (this.currentStep === 1) {
      if (this.studentForm.invalid) {
        this.studentForm.markAllAsTouched();
        return;
      }
      this.currentStep = 2;
      return;
    }
    if (this.currentStep === 2) {
      this.currentStep = 3;
    }
  }

  onBack(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    } else if (this.currentStep === 3) {
      this.currentStep = 2;
    }
  }

  addAnotherCourse(): void {
    this.courseRows.push(this.createCourseRow());
  }

  adjustUnits(rowIndex: number, field: 'lecUnits' | 'labUnits', delta: number): void {
    const control = this.courseRows.at(rowIndex).get(field);
    if (!control) {
      return;
    }
    const current = Number(control.value ?? 0);
    const next = Math.min(this.maxUnitValue, Math.max(this.minUnitValue, current + delta));
    control.setValue(next);
  }

  adjustGrade(rowIndex: number, delta: number): void {
    const control = this.courseRows.at(rowIndex).get('grade');
    if (!control) {
      return;
    }
    const parsed = Number.parseFloat(String(control.value ?? ''));
    const current = Number.isFinite(parsed) ? parsed : 0;
    const rounded = Math.round((current + delta) * 100) / 100;
    control.setValue(rounded.toFixed(2));
  }

  removeCourseRow(rowIndex: number): void {
    if (this.courseRows.length <= 1) {
      return;
    }
    this.courseRows.removeAt(rowIndex);
  }

  onEquivalentCourseChange(rowIndex: number): void {
    const row = this.courseRows.at(rowIndex);
    const courseId = (row.get('equivalentCourseId')?.value as string) || '';
    const match = findEquivalentStiCourse(this.equivalentCourses, courseId || null);
    row.patchValue({
      equivalentCode: match?.code ?? '',
      equivalentUnits: match != null ? String(match.totalUnits) : ''
    });
  }

  getAppliedTotalUnits(rowIndex: number): string {
    const row = this.courseRows.at(rowIndex).value;
    const lec = Number(row['lecUnits'] ?? 0);
    const lab = Number(row['labUnits'] ?? 0);
    const total = (Number.isFinite(lec) ? lec : 0) + (Number.isFinite(lab) ? lab : 0);
    return String(total);
  }

  getEquivalentUnitsDisplay(rowIndex: number): string {
    const units = this.courseRows.at(rowIndex).value['equivalentUnits'];
    if (units === '' || units == null) {
      return '—';
    }
    return String(units);
  }

  getPreviewProgramLabel(): string {
    const id = this.studentForm.controls.programId.value;
    return this.programOptions.find((o) => o.id === id)?.primary ?? '—';
  }

  getPreviewTermLabel(): string {
    const id = this.studentForm.controls.termId.value;
    return this.termOptions.find((o) => o.id === id)?.primary ?? '—';
  }

  isPreviewRowHighlighted(index: number): boolean {
    const rows = this.getPreviewTableRows();
    const firstFilledIndex = rows.findIndex((row) => row.isFilled);
    return firstFilledIndex >= 0 && index === firstFilledIndex;
  }

  getPreviewTableRows(): CreditRequestPreviewTableRow[] {
    const filled: CreditRequestPreviewTableRow[] = this.courseRows.controls.map((group, index) => {
      const v = group.value;
      const equivalent = findEquivalentStiCourse(
        this.equivalentCourses,
        (v['equivalentCourseId'] as string) || null
      );
      const lec = Number(v['lecUnits'] ?? 0);
      const lab = Number(v['labUnits'] ?? 0);
      return {
        appliedCode: String(v['appliedCode'] ?? '').trim() || '—',
        appliedTitle: String(v['appliedTitle'] ?? '').trim() || '—',
        lecDisplay: this.formatPreviewUnitCell(lec),
        labDisplay: this.formatPreviewUnitCell(lab),
        gradeDisplay: String(v['grade'] ?? '').trim() || '—',
        equivalentCode: equivalent?.code ?? (String(v['equivalentCode'] ?? '').trim() || '—'),
        equivalentTitle: equivalent?.title ?? '—',
        equivalentLecDisplay: '—',
        equivalentLabDisplay: '—',
        unitsDisplay: this.getEquivalentUnitsDisplay(index),
        hasEquivalent: !!(v['equivalentCourseId'] as string),
        isFilled: true
      };
    });

    const emptyCount = Math.max(0, CREDIT_REQUEST_PREVIEW_MIN_TABLE_ROWS - filled.length);
    const emptyRows: CreditRequestPreviewTableRow[] = Array.from({ length: emptyCount }, () => ({
      appliedCode: '',
      appliedTitle: '',
      lecDisplay: '',
      labDisplay: '',
      gradeDisplay: '',
      equivalentCode: '',
      equivalentTitle: '',
      equivalentLecDisplay: '',
      equivalentLabDisplay: '',
      unitsDisplay: '',
      hasEquivalent: false,
      isFilled: false
    }));

    return [...filled, ...emptyRows];
  }

  onSaveAndPrint(): void {
    window.print();
  }

  private formatPreviewUnitCell(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '—';
    }
    return String(value);
  }

  private createCourseRow(): FormGroup {
    return this.fb.nonNullable.group({
      rowId: [`row-${this.nextRowId++}`],
      appliedCode: [''],
      appliedTitle: [''],
      lecUnits: [0],
      labUnits: [0],
      grade: ['1.00'],
      equivalentCourseId: [''],
      equivalentCode: [''],
      equivalentUnits: ['']
    });
  }
}
