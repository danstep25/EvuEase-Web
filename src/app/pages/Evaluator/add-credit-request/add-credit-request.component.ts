import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CanComponentDeactivate } from '../../../core/models/can-deactivate.model';
import {
  CreateCreditRequestLineRequest,
  CreditRequest
} from '../../../core/models/credit-request.model';
import { FormDiscardService } from '../../../shared/services/form-discard.service';
import { UnsavedChangesWarningDirective } from '../../../shared/directives/unsaved-changes-warning.directive';
import { attemptFormClose, validateFormForSubmit } from '../../../shared/utils/form-state.util';
import { unitFieldValidators } from '../../../shared/validators/app-validators';
import { normalizeUnitValue } from '../../../shared/utils/unit-value.util';
import {
  SearchableSelectComponent,
  SearchableSelectOption
} from '../../../shared/components/searchable-select/searchable-select.component';
import { LookupService } from '../../../shared/services/lookup.service';
import { StudentsService } from '../../Registrar/students/students.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { printCreditRequestForm } from '../../../shared/utils/print-credit-request.util';
import { CreditRequestService } from '../credit-request/credit-request.service';
import { CreditRequestPrintFormComponent } from '../credit-request/credit-request-print-form.component';
import { CourseService } from '../../Registrar/curriculum-management/course.service';
import { SyTerm } from '../../../core/models/sy-term.model';

type AddCreditRequestStep = 1 | 2 | 3;

export interface EquivalentCourseOption {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly totalUnits: number;
}

export interface CourseMappingRowWarning {
  codeMismatch: boolean;
  unitsMismatch: boolean;
  appliedCode: string;
  equivalentCode: string;
  appliedTotal: number;
  equivalentTotal: number;
}

@Component({
  selector: 'app-add-credit-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UnsavedChangesWarningDirective, SearchableSelectComponent, CreditRequestPrintFormComponent],
  templateUrl: './add-credit-request.component.html',
  styleUrl: './add-credit-request.component.scss'
})
export class AddCreditRequestComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly lookupService = inject(LookupService);
  private readonly studentsService = inject(StudentsService);
  private readonly creditRequestService = inject(CreditRequestService);
  private readonly courseService = inject(CourseService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();
  private nextRowId = 1;

  submitted = false;
  isSaving = false;
  isLoadingLookups = true;
  isLookingUpStudent = false;
  errorMessage: string | null = null;

  readonly pageTitle = 'Add Credit Request';
  readonly pageSubtitle = 'Map equivalent subject for a transferee student';
  readonly minUnitValue = 0;
  readonly maxUnitValue = 6;
  readonly gradeStep = 0.01;

  currentStep: AddCreditRequestStep = 1;
  programOptions: SearchableSelectOption[] = [];
  termOptions: SearchableSelectOption[] = [];
  equivalentCourses: EquivalentCourseOption[] = [];
  private syTerms: SyTerm[] = [];

  readonly studentForm = this.fb.nonNullable.group({
    studentNumber: ['', Validators.required],
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    programId: [null as string | null, Validators.required],
    syId: [null as string | null, Validators.required]
  });

  readonly courseForm = this.fb.group({
    rows: this.fb.array([this.createCourseRow()])
  });

  ngOnInit(): void {
    this.lookupService
      .getProgramsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programs) => {
          this.programOptions = programs.map((program) => ({
            id: String(program.programId),
            primary: program.programCode,
            secondary: program.programTitle
          }));
        },
        error: () => {
          this.notificationService.error('Load failed', 'Could not load programs.');
        }
      });

    this.lookupService
      .getSyTermsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (terms) => {
          this.syTerms = terms ?? [];
          this.termOptions = this.syTerms.map((term) => ({
            id: String(term.syId),
            primary: this.formatTermLabel(term),
            secondary: term.syCode ?? ''
          }));
          this.isLoadingLookups = false;
        },
        error: () => {
          this.isLoadingLookups = false;
          this.notificationService.error('Load failed', 'Could not load school year terms.');
        }
      });

    this.lookupService
      .getCoursesLookupForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.equivalentCourses = courses.map((course) => {
            const code = course.value?.trim() ?? '';
            const display = course.displayText?.trim() ?? code;
            const title = display.includes(' - ') ? display.split(' - ').slice(1).join(' - ').trim() : display;
            return {
              id: code,
              code,
              title,
              totalUnits: 0
            };
          });
        },
        error: () => {
          this.notificationService.error('Load failed', 'Could not load STI courses.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  trackRowControl(row: AbstractControl): string {
    return String(row.get('rowId')?.value ?? '');
  }

  canRemoveCourseRow(): boolean {
    return this.courseRows.length > 1;
  }

  canDeactivate(): Promise<boolean> {
    if (!this.hasUnsavedChanges()) {
      return Promise.resolve(true);
    }
    return this.formDiscard.confirmDiscard();
  }

  hasUnsavedChanges(): boolean {
    return this.studentForm.dirty || this.courseForm.dirty;
  }

  onCancel(): void {
    const form = this.studentForm.dirty ? this.studentForm : this.courseForm;
    void attemptFormClose({
      form,
      discardService: this.formDiscard,
      close: () => void this.router.navigate(['/evaluator', 'credit-subjects'])
    });
  }

  onStudentNumberBlur(): void {
    const studentNumber = this.studentForm.controls.studentNumber.value.trim();
    if (!studentNumber) {
      return;
    }

    this.isLookingUpStudent = true;
    this.studentsService
      .getStudents({ searchTerm: studentNumber, PageIndex: 1, PageSize: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLookingUpStudent = false;
          const match = (response.data ?? []).find(
            (student) => student.studentNumber?.trim() === studentNumber
          );
          if (!match) {
            return;
          }

          const programOption = this.programOptions.find(
            (option) => option.primary.toUpperCase() === match.programCode?.toUpperCase()
          );

          this.studentForm.patchValue({
            firstName: match.firstName ?? '',
            middleName: match.middleName ?? '',
            lastName: match.lastName ?? '',
            programId: programOption?.id ?? this.studentForm.controls.programId.value
          });
        },
        error: () => {
          this.isLookingUpStudent = false;
        }
      });
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
      if (!this.hasValidCourseLines()) {
        this.errorMessage = 'Add at least one course with applied or equivalent subject details.';
        return;
      }
      this.errorMessage = null;
      this.hydrateEquivalentCourseDetails();
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
    const next = normalizeUnitValue(
      Math.min(this.maxUnitValue, Math.max(this.minUnitValue, current + delta))
    );
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
    const courseCode = (row.get('equivalentCourseId')?.value as string) || '';
    if (!courseCode) {
      row.patchValue({
        equivalentCode: '',
        equivalentUnits: '',
        equivalentLecUnits: 0,
        equivalentLabUnits: 0
      });
      return;
    }

    const match = this.findEquivalentCourse(courseCode);
    row.patchValue({
      equivalentCode: match?.code ?? courseCode,
      equivalentUnits: '',
      equivalentLecUnits: 0,
      equivalentLabUnits: 0
    });

    this.loadEquivalentCourseDetails(rowIndex, courseCode);
  }

  getAppliedTotalUnits(rowIndex: number): string {
    const row = this.courseRows.at(rowIndex).value;
    const lec = Number(row['lecUnits'] ?? 0);
    const lab = Number(row['labUnits'] ?? 0);
    const total = (Number.isFinite(lec) ? lec : 0) + (Number.isFinite(lab) ? lab : 0);
    return String(total);
  }

  getEquivalentUnitsDisplay(rowIndex: number): string {
    const row = this.courseRows.at(rowIndex);
    const units = row.get('equivalentUnits')?.value;
    if (units !== '' && units != null) {
      return String(units);
    }
    return '—';
  }

  getCourseMappingWarnings(rowIndex: number): CourseMappingRowWarning | null {
    const row = this.courseRows.at(rowIndex);
    const equivalentCourseId = String(row.get('equivalentCourseId')?.value ?? '').trim();
    if (!equivalentCourseId) {
      return null;
    }

    const appliedCode = String(row.get('appliedCode')?.value ?? '').trim();
    const equivalentCode = String(row.get('equivalentCode')?.value ?? '').trim() || equivalentCourseId;
    const appliedTotal = this.parseAppliedTotalUnits(rowIndex);
    const equivalentTotal = this.parseEquivalentTotalUnits(rowIndex);
    const equivalentUnitsKnown =
      row.get('equivalentUnits')?.value !== '' && row.get('equivalentUnits')?.value != null;

    const codeMismatch =
      appliedCode.length > 0 &&
      appliedCode.localeCompare(equivalentCode, undefined, { sensitivity: 'accent' }) !== 0;
    const unitsMismatch = equivalentUnitsKnown && !this.unitsAreEqual(appliedTotal, equivalentTotal);

    if (!codeMismatch && !unitsMismatch) {
      return null;
    }

    return {
      codeMismatch,
      unitsMismatch,
      appliedCode,
      equivalentCode,
      appliedTotal,
      equivalentTotal
    };
  }

  getPreviewCreditRequest(): CreditRequest {
    const programId = Number(this.studentForm.controls.programId.value ?? 0);
    const syId = Number(this.studentForm.controls.syId.value ?? 0);
    const program = this.programOptions.find((option) => option.id === String(programId));
    const syTerm = this.syTerms.find((term) => term.syId === syId);
    const firstName = this.studentForm.controls.firstName.value.trim();
    const lastName = this.studentForm.controls.lastName.value.trim();
    const middleName = this.studentForm.controls.middleName.value.trim();

    return {
      id: 0,
      creditRequestNo: '',
      studentNumber: this.studentForm.controls.studentNumber.value.trim(),
      firstName,
      middleName: middleName || null,
      lastName,
      studentName: `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}`,
      programId: Number.isFinite(programId) ? programId : 0,
      programCode: program?.primary ?? '',
      programTitle: program?.secondary ?? '',
      syId: Number.isFinite(syId) ? syId : 0,
      syCode: syTerm?.syCode ?? '',
      syYear: syTerm?.syYear ?? '',
      sySemester: syTerm?.sySemester ?? '',
      requestStatus: 'Pending',
      lines: this.courseRows.controls.map((group, index) => {
        const value = group.value;
        const equivalent = this.findEquivalentCourse((value['equivalentCourseId'] as string) || null);
        const equivalentUnits = Number(value['equivalentUnits'] ?? 0);
        return {
          id: index + 1,
          sortOrder: index + 1,
          appliedCourseCode: String(value['appliedCode'] ?? '').trim(),
          appliedCourseTitle: String(value['appliedTitle'] ?? '').trim(),
          appliedLecUnits: Number(value['lecUnits'] ?? 0),
          appliedLabUnits: Number(value['labUnits'] ?? 0),
          grade: String(value['grade'] ?? '').trim(),
          equivalentCourseCode: equivalent?.code ?? String(value['equivalentCourseId'] ?? '').trim(),
          equivalentCourseTitle: equivalent?.title ?? '',
          equivalentLecUnits: Number(value['equivalentLecUnits'] ?? 0) || null,
          equivalentLabUnits: Number(value['equivalentLabUnits'] ?? 0) || null,
          equivalentTotalUnits:
            Number.isFinite(equivalentUnits) && equivalentUnits > 0 ? equivalentUnits : null
        };
      })
    };
  }

  onSaveAndPrint(): void {
    if (this.isSaving) {
      return;
    }

    const studentResult = validateFormForSubmit(this.studentForm);
    this.submitted = studentResult.submitted;
    if (!studentResult.canSubmit) {
      this.errorMessage = studentResult.errorMessage;
      return;
    }

    if (!this.hasValidCourseLines()) {
      this.errorMessage = 'Add at least one course with applied or equivalent subject details.';
      return;
    }

    const programId = Number(this.studentForm.controls.programId.value);
    const syId = Number(this.studentForm.controls.syId.value);
    if (!Number.isFinite(programId) || programId <= 0 || !Number.isFinite(syId) || syId <= 0) {
      this.errorMessage = 'Program and school year & term are required.';
      return;
    }

    this.errorMessage = null;
    this.isSaving = true;

    const payload = {
      studentNumber: this.studentForm.controls.studentNumber.value.trim(),
      firstName: this.studentForm.controls.firstName.value.trim(),
      middleName: this.studentForm.controls.middleName.value.trim() || undefined,
      lastName: this.studentForm.controls.lastName.value.trim(),
      programId,
      syId,
      lines: this.buildLinePayload()
    };

    this.creditRequestService
      .createCreditRequest(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.studentForm.markAsPristine();
          this.courseForm.markAsPristine();
          this.notificationService.success('Submitted', 'Credit request was saved successfully.');
          printCreditRequestForm(() => {
            void this.router.navigate(['/evaluator', 'credit-subjects']);
          });
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isSaving = false;
          this.errorMessage = err?.userMessage || err?.message || 'Could not save the credit request.';
          this.notificationService.error('Save failed', this.errorMessage);
        }
      });
  }

  private buildLinePayload(): CreateCreditRequestLineRequest[] {
    return this.courseRows.controls
      .map((group) => {
        const value = group.value;
        return {
          appliedCourseCode: String(value['appliedCode'] ?? '').trim(),
          appliedCourseTitle: String(value['appliedTitle'] ?? '').trim(),
          appliedLecUnits: Number(value['lecUnits'] ?? 0),
          appliedLabUnits: Number(value['labUnits'] ?? 0),
          grade: String(value['grade'] ?? '').trim(),
          equivalentCourseCode: String(value['equivalentCourseId'] ?? value['equivalentCode'] ?? '').trim()
        };
      })
      .filter((line) => {
        const hasApplied = !!line.appliedCourseCode || !!line.appliedCourseTitle;
        const hasEquivalent = !!line.equivalentCourseCode;
        const hasUnits = line.appliedLecUnits > 0 || line.appliedLabUnits > 0;
        return hasApplied || hasEquivalent || hasUnits;
      });
  }

  private hasValidCourseLines(): boolean {
    return this.buildLinePayload().length > 0;
  }

  private findEquivalentCourse(courseCode: string | null): EquivalentCourseOption | null {
    if (!courseCode) {
      return null;
    }
    return this.equivalentCourses.find((course) => course.code === courseCode) ?? null;
  }

  private formatTermLabel(term: SyTerm): string {
    const semester = term.sySemester?.replace(/\s*semester\s*/i, '').trim() ?? '';
    const year = term.syYear?.trim() ?? '';
    if (semester && year) {
      return `${semester} ${year}`;
    }
    return term.syCode?.trim() ?? '';
  }

  private parseAppliedTotalUnits(rowIndex: number): number {
    const row = this.courseRows.at(rowIndex).value;
    const lec = Number(row['lecUnits'] ?? 0);
    const lab = Number(row['labUnits'] ?? 0);
    return normalizeUnitValue((Number.isFinite(lec) ? lec : 0) + (Number.isFinite(lab) ? lab : 0));
  }

  private parseEquivalentTotalUnits(rowIndex: number): number {
    const units = this.courseRows.at(rowIndex).get('equivalentUnits')?.value;
    const parsed = Number(units);
    return Number.isFinite(parsed) ? normalizeUnitValue(parsed) : 0;
  }

  private unitsAreEqual(left: number, right: number): boolean {
    return Math.abs(left - right) < 0.005;
  }

  private hydrateEquivalentCourseDetails(): void {
    this.courseRows.controls.forEach((group, index) => {
      const courseCode = (group.get('equivalentCourseId')?.value as string) || '';
      if (!courseCode) {
        return;
      }
      const lec = Number(group.get('equivalentLecUnits')?.value ?? 0);
      const lab = Number(group.get('equivalentLabUnits')?.value ?? 0);
      if (lec > 0 || lab > 0) {
        return;
      }
      this.loadEquivalentCourseDetails(index, courseCode);
    });
  }

  private loadEquivalentCourseDetails(rowIndex: number, courseCode: string): void {
    const row = this.courseRows.at(rowIndex);
    this.courseService
      .getCourseById(courseCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          if ((row.get('equivalentCourseId')?.value as string) !== courseCode) {
            return;
          }
          const lec = Number(course.courseLecUnits ?? 0);
          const lab = Number(course.courseLabUnits ?? 0);
          const total = Number(course.courseTotalUnits ?? lec + lab);
          row.patchValue({
            equivalentUnits: String(Number.isFinite(total) ? total : 0),
            equivalentLecUnits: Number.isFinite(lec) ? lec : 0,
            equivalentLabUnits: Number.isFinite(lab) ? lab : 0
          });
        },
        error: () => {
          if ((row.get('equivalentCourseId')?.value as string) === courseCode) {
            row.patchValue({
              equivalentUnits: '',
              equivalentLecUnits: 0,
              equivalentLabUnits: 0
            });
          }
        }
      });
  }

  private createCourseRow(): FormGroup {
    return this.fb.nonNullable.group({
      rowId: [`row-${this.nextRowId++}`],
      appliedCode: [''],
      appliedTitle: [''],
      lecUnits: [0, unitFieldValidators({ required: false })],
      labUnits: [0, unitFieldValidators({ required: false })],
      grade: ['1.00'],
      equivalentCourseId: [''],
      equivalentCode: [''],
      equivalentUnits: [''],
      equivalentLecUnits: [0],
      equivalentLabUnits: [0]
    });
  }
}
