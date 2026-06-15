import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateOtherSchoolFeeRequest, OtherSchoolFee, UpdateOtherSchoolFeeRequest } from '../../../../../../core/models/other-school-fee.model';
import { SyTerm } from '../../../../../../core/models/sy-term.model';
import { LookupService } from '../../../../../../shared/services/lookup.service';
import { FormDiscardService } from '../../../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../../../shared/utils/form-state.util';
import { Semester } from '../../../enums/semester.enum';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-other-school-fee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './other-school-fee-form.component.html',
  styleUrl: './other-school-fee-form.component.scss'
})
export class OtherSchoolFeeFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() otherSchoolFee: OtherSchoolFee | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateOtherSchoolFeeRequest | UpdateOtherSchoolFeeRequest>();

  otherSchoolFeeForm!: FormGroup;
  isSubmitting = false;
  submitted = false;
  errorMessage: string | null = null;
  syTerms: SyTerm[] = [];
  isLoadingSyTerms = false;

  semesters = Object.values(Semester);
  batchYears: number[] = [];

  Semester = Semester;

  get isEditMode(): boolean {
    return !!this.otherSchoolFee;
  }

  get title(): string {
    return this.isEditMode ? 'Edit School Fee' : 'Add New School Fee';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update School Fee' : 'Add School Fee';
  }

  get formControls() {
    return {
      syId: this.otherSchoolFeeForm.get('syId'),
      batch: this.otherSchoolFeeForm.get('batch'),
      semester: this.otherSchoolFeeForm.get('semester'),
      schoolFee: this.otherSchoolFeeForm.get('schoolFee'),
      cash: this.otherSchoolFeeForm.get('cash'),
      lowMonthlyPayment: this.otherSchoolFeeForm.get('lowMonthlyPayment')
    };
  }

  ngOnInit(): void {
    this.initializeBatchYears();
    this.initializeForm();
    this.loadSyTerms();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
      if (this.syTerms.length === 0) {
        this.loadSyTerms();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeBatchYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.batchYears.push(i);
    }
  }

  private initializeForm(): void {
    const currentYear = new Date().getFullYear();
    const initialSyId = this.otherSchoolFee?.syId || null;
    this.otherSchoolFeeForm = this.fb.group({
      syId: [initialSyId, [Validators.required]],
      batch: [this.otherSchoolFee?.batch || currentYear.toString(), [Validators.required]],
      semester: [this.otherSchoolFee?.semester || null, [Validators.required]],
      schoolFee: [this.otherSchoolFee?.schoolFee || '', [Validators.required, Validators.maxLength(255)]],
      cash: [this.otherSchoolFee?.cash ?? 0.0, [Validators.required, Validators.min(0)]],
      lowMonthlyPayment: [this.otherSchoolFee?.lowMonthlyPayment ?? 0.0, [Validators.required, Validators.min(0)]]
    });
    this.otherSchoolFeeForm.markAsPristine();
    this.errorMessage = null;
  }

  private loadSyTerms(): void {
    this.isLoadingSyTerms = true;
    this.lookupService
      .getSyTermsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (syTerms: SyTerm[]) => {
          this.syTerms = syTerms;
          this.isLoadingSyTerms = false;
        },
        error: () => {
          this.isLoadingSyTerms = false;
        }
      });
  }

  onClose(): void {
    void attemptFormClose({
      form: this.otherSchoolFeeForm,
      discardService: this.formDiscard,
      close: () => this.finishClose()
    });
  }

  private finishClose(): void {
    this.submitted = false;
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    const result = validateFormForSubmit(this.otherSchoolFeeForm, { isEditMode: this.isEditMode });
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;

    this.isSubmitting = true;

    const formValue = this.otherSchoolFeeForm.value;
    const otherSchoolFeeData: CreateOtherSchoolFeeRequest | UpdateOtherSchoolFeeRequest = {
      syId: formValue.syId || null,
      batch: formValue.batch?.toString(),
      semester: formValue.semester,
      schoolFee: formValue.schoolFee?.trim(),
      cash: Number(formValue.cash),
      lowMonthlyPayment: Number(formValue.lowMonthlyPayment)
    };

    if (this.isEditMode && this.otherSchoolFee) {
      (otherSchoolFeeData as UpdateOtherSchoolFeeRequest).id = this.otherSchoolFee.id;
    }

    this.save.emit(otherSchoolFeeData);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string): void {
    this.errorMessage = message;
  }
}



