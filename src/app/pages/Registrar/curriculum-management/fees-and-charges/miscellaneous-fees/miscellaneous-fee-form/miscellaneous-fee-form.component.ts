import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MiscellaneousFee, CreateMiscellaneousFeeRequest, UpdateMiscellaneousFeeRequest } from '../../../../../../core/models/miscellaneous-fee.model';
import { SyTerm } from '../../../../../../core/models/sy-term.model';
import { LookupService } from '../../../../../../shared/services/lookup.service';
import { FormDiscardService } from '../../../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../../../shared/utils/form-state.util';
import { feeAmountFieldValidators } from '../../../../../../shared/validators/app-validators';
import { Semester } from '../../../enums/semester.enum';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-miscellaneous-fee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './miscellaneous-fee-form.component.html',
  styleUrl: './miscellaneous-fee-form.component.scss'
})
export class MiscellaneousFeeFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() miscellaneousFee: MiscellaneousFee | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateMiscellaneousFeeRequest | UpdateMiscellaneousFeeRequest>();

  miscellaneousFeeForm!: FormGroup;
  isSubmitting = false;
  submitted = false;
  errorMessage: string | null = null;
  syTerms: SyTerm[] = [];
  isLoadingSyTerms = false;

  semesters = Object.values(Semester);
  batchYears: number[] = [];

  Semester = Semester;

  get isEditMode(): boolean {
    return !!this.miscellaneousFee;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Miscellaneous Fee' : 'Add New Miscellaneous Fee';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update Miscellaneous Fee' : 'Add Miscellaneous Fee';
  }

  get formControls() {
    return {
      syId: this.miscellaneousFeeForm.get('syId'),
      batch: this.miscellaneousFeeForm.get('batch'),
      semester: this.miscellaneousFeeForm.get('semester'),
      miscellaneousFee: this.miscellaneousFeeForm.get('miscellaneousFee'),
      cash: this.miscellaneousFeeForm.get('cash'),
      lowMonthlyPayment: this.miscellaneousFeeForm.get('lowMonthlyPayment')
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
    const initialSyId = this.miscellaneousFee?.syId || null;
    this.miscellaneousFeeForm = this.fb.group({
      syId: [initialSyId, [Validators.required]],
      batch: [this.miscellaneousFee?.batch || currentYear.toString(), [Validators.required]],
      semester: [this.miscellaneousFee?.semester || null, [Validators.required]],
      miscellaneousFee: [this.miscellaneousFee?.miscellaneousFee || '', [Validators.required, Validators.maxLength(255)]],
      cash: [this.miscellaneousFee?.cash ?? 0.0, feeAmountFieldValidators()],
      lowMonthlyPayment: [this.miscellaneousFee?.lowMonthlyPayment ?? 0.0, feeAmountFieldValidators()]
    });
    this.miscellaneousFeeForm.markAsPristine();
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
      form: this.miscellaneousFeeForm,
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
    const result = validateFormForSubmit(this.miscellaneousFeeForm, { isEditMode: this.isEditMode });
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;

    this.isSubmitting = true;

    const formValue = this.miscellaneousFeeForm.value;
    const miscellaneousFeeData: CreateMiscellaneousFeeRequest | UpdateMiscellaneousFeeRequest = {
      syId: formValue.syId || null,
      batch: formValue.batch?.toString(),
      semester: formValue.semester,
      miscellaneousFee: formValue.miscellaneousFee?.trim(),
      cash: Number(formValue.cash),
      lowMonthlyPayment: Number(formValue.lowMonthlyPayment)
    };

    if (this.isEditMode && this.miscellaneousFee) {
      (miscellaneousFeeData as UpdateMiscellaneousFeeRequest).id = this.miscellaneousFee.id;
    }

    this.save.emit(miscellaneousFeeData);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string): void {
    this.errorMessage = message;
  }
}



