import { Component, OnChanges, OnDestroy, Input, Output, EventEmitter, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  Downpayment,
  CreateDownpaymentRequest,
  UpdateDownpaymentRequest
} from '../../../../../../core/models/downpayment.model';
import { Program } from '../../../../../../core/models/program.model';
import { LookupService } from '../../../../../../shared/services/lookup.service';
import { FormDiscardService } from '../../../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../../../shared/utils/form-state.util';
import { feePercentFieldValidators } from '../../../../../../shared/validators/app-validators';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-downpayment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './downpayment-form.component.html',
  styleUrl: './downpayment-form.component.scss'
})
export class DownpaymentFormComponent implements OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() downpayment: Downpayment | null = null;
  @Input() isOpen = false;
  @Input() takenDownpaymentProgramCodes: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateDownpaymentRequest | UpdateDownpaymentRequest>();

  form: FormGroup | null = null;
  isSubmitting = false;
  submitted = false;
  errorMessage: string | null = null;

  batchYears: number[] = [];
  programs: Program[] = [];
  isLoadingPrograms = false;

  get isEditMode(): boolean {
    return !!this.downpayment;
  }

  get title(): string {
    return this.isEditMode ? 'Edit downpayment' : 'Add new downpayment';
  }

  get submitLabel(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Saving…' : 'Adding…';
    }
    return this.isEditMode ? 'Save changes' : 'Add downpayment';
  }

  constructor() {
    const y = new Date().getFullYear();
    for (let i = y - 5; i <= y + 5; i++) {
      this.batchYears.push(i);
    }
  }

  ngOnChanges(): void {
    if (!this.isOpen) {
      return;
    }
    this.errorMessage = null;
    this.form = null;
    this.isLoadingPrograms = true;
    this.lookupService
      .getProgramsForDropdown()
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe({
        next: rows => {
          const list = rows ?? [];
          this.programs = list.slice().sort((a, b) => a.programCode.localeCompare(b.programCode, undefined, { sensitivity: 'base' }));
          this.ensureFallbackProgramOption();
          this.isLoadingPrograms = false;
          this.buildForm();
        },
        error: () => {
          this.programs = [];
          this.isLoadingPrograms = false;
          this.buildForm();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private ensureFallbackProgramOption(): void {
    const d = this.downpayment;
    const code = d?.programCode?.trim();
    if (!code) {
      return;
    }
    const exists = this.programs.some(p => (p.programCode || '').trim().toLowerCase() === code.toLowerCase());
    if (!exists) {
      this.programs = [
        ...this.programs,
        {
          programId: 0,
          programCode: d!.programCode,
          programTitle: d!.programTitle || '',
          programCompletionYears: 0,
          programStatus: ''
        }
      ];
    }
  }

  private duplicateProgramCodeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = String(control.value ?? '').trim().toLowerCase();
      if (!v) {
        return null;
      }
      const taken = this.takenDownpaymentProgramCodes ?? [];
      return taken.some(c => String(c).trim().toLowerCase() === v) ? { duplicateProgramCode: true } : null;
    };
  }

  private buildForm(): void {
    const d = this.downpayment;
    const initialCode = d?.programCode?.trim() ?? '';
    const initialTitle = d?.programTitle?.trim() ?? '';
    this.form = this.fb.group({
      programCode: [initialCode, [Validators.required, Validators.maxLength(32), this.duplicateProgramCodeValidator()]],
      programTitle: [initialTitle, [Validators.required, Validators.maxLength(200)]],
      batch: [d?.batch ?? String(new Date().getFullYear()), [Validators.required, Validators.maxLength(32)]],
      downpaymentPercent: [d?.downpaymentPercent ?? 0, feePercentFieldValidators()],
      effectiveSchoolYear: [d?.effectiveSchoolYear ?? '', [Validators.required, Validators.maxLength(64)]]
    });
    this.syncProgramTitleFromCode();
    this.form.markAsPristine();
  }

  onProgramCodePicked(): void {
    this.syncProgramTitleFromCode();
    this.form?.get('programCode')?.updateValueAndValidity();
    this.form?.get('programCode')?.markAsTouched();
  }

  private syncProgramTitleFromCode(): void {
    if (!this.form) {
      return;
    }
    const code = String(this.form.get('programCode')?.value ?? '').trim();
    const titleCtrl = this.form.get('programTitle');
    if (!titleCtrl) {
      return;
    }
    if (!code) {
      titleCtrl.patchValue('', { emitEvent: false });
      return;
    }
    const p = this.programs.find(x => (x.programCode || '').trim().toLowerCase() === code.toLowerCase());
    titleCtrl.patchValue(p?.programTitle?.trim() ?? '', { emitEvent: false });
  }

  onClose(): void {
    if (!this.form) {
      this.finishClose();
      return;
    }
    void attemptFormClose({
      form: this.form,
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
    if (!this.form) {
      return;
    }
    const result = validateFormForSubmit(this.form, { isEditMode: this.isEditMode });
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;
    this.isSubmitting = true;
    const v = this.form.getRawValue();
    const base: CreateDownpaymentRequest = {
      programCode: String(v.programCode).trim(),
      programTitle: String(v.programTitle).trim(),
      batch: String(v.batch).trim(),
      downpaymentPercent: Number(v.downpaymentPercent),
      effectiveSchoolYear: String(v.effectiveSchoolYear).trim()
    };
    if (this.downpayment) {
      const update: UpdateDownpaymentRequest = { ...base, id: this.downpayment.id };
      this.save.emit(update);
    } else {
      this.save.emit(base);
    }
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(msg: string | null): void {
    this.errorMessage = msg;
  }
}
