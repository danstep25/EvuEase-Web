import { Component, OnChanges, OnDestroy, Input, Output, EventEmitter, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  PaymentScheme,
  CreatePaymentSchemeRequest,
  UpdatePaymentSchemeRequest
} from '../../../../../../core/models/payment-scheme.model';
import { SyTerm } from '../../../../../../core/models/sy-term.model';
import { LookupService } from '../../../../../../shared/services/lookup.service';
import { FormDiscardService } from '../../../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../../../shared/utils/form-state.util';
import { Semester } from '../../../enums/semester.enum';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

export interface PaymentSchemeComboKey {
  schoolYear: string;
  semester: string;
}

@Component({
  selector: 'app-payment-scheme-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-scheme-form.component.html',
  styleUrl: './payment-scheme-form.component.scss'
})
export class PaymentSchemeFormComponent implements OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() paymentScheme: PaymentScheme | null = null;
  @Input() isOpen = false;
  @Input() takenCombos: PaymentSchemeComboKey[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreatePaymentSchemeRequest | UpdatePaymentSchemeRequest>();

  form!: FormGroup;
  syTerms: SyTerm[] = [];
  schoolYears: string[] = [];
  semesters = Object.values(Semester);
  isLoadingSyTerms = false;
  errorMessage = '';
  isSubmitting = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] && this.isOpen) || (changes['paymentScheme'] && this.isOpen)) {
      this.errorMessage = '';
      this.isSubmitting = false;
      this.loadSyTerms();
      this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditMode(): boolean {
    return !!this.paymentScheme;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Payment Scheme' : 'Add Payment Scheme';
  }

  get installments(): FormArray {
    return this.form.get('installments') as FormArray;
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string): void {
    this.errorMessage = message;
  }

  onClose(): void {
    void attemptFormClose({
      form: this.form,
      discardService: this.formDiscard,
      close: () => this.close.emit()
    });
  }

  onSubmit(): void {
    if (!validateFormForSubmit(this.form)) {
      return;
    }

    const v = this.form.getRawValue();
    const installments = (v.installments as Array<{ paymentName: string; dueDate: string }>).map(row => ({
      paymentName: (row.paymentName || '').trim(),
      dueDate: row.dueDate
    }));

    const base: CreatePaymentSchemeRequest = {
      schoolYear: (v.schoolYear || '').trim(),
      semester: (v.semester || '').trim(),
      description: (v.description || '').trim() || undefined,
      installments
    };

    if (this.paymentScheme) {
      const update: UpdatePaymentSchemeRequest = { ...base, id: this.paymentScheme.id };
      this.save.emit(update);
      return;
    }

    this.save.emit(base);
  }

  addInstallment(): void {
    const index = this.installments.length;
    this.installments.push(this.createInstallmentGroup(index, this.defaultPaymentName(index), ''));
  }

  removeInstallment(index: number): void {
    if (this.installments.length <= 1) {
      return;
    }
    this.installments.removeAt(index);
    this.syncInstallmentNames();
  }

  installmentLabel(index: number): string {
    const ctrl = this.installments.at(index)?.get('paymentName');
    return (ctrl?.value || this.defaultPaymentName(index)).trim();
  }

  private loadSyTerms(): void {
    if (this.syTerms.length > 0) {
      return;
    }
    this.isLoadingSyTerms = true;
    this.lookupService
      .getSyTermsForDropdown()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: terms => {
          this.syTerms = terms;
          this.schoolYears = [...new Set(terms.map(t => (t.syYear || '').trim()).filter(y => y.length > 0))];
          this.isLoadingSyTerms = false;
          if (this.form) {
            this.form.updateValueAndValidity();
          }
        },
        error: () => {
          this.isLoadingSyTerms = false;
        }
      });
  }

  private buildForm(): void {
    const scheme = this.paymentScheme;
    const rows = scheme?.installments?.length
      ? scheme.installments
      : [{ paymentName: this.defaultPaymentName(0), dueDate: '', installmentOrder: 1 }];

    const defaultSemester = scheme?.semester || Semester.First;

    this.form = this.fb.group({
      schoolYear: [scheme?.schoolYear || null, [Validators.required, this.duplicateComboValidator()]],
      semester: [defaultSemester, [Validators.required, this.duplicateComboValidator()]],
      description: [scheme?.description || ''],
      installments: this.fb.array(
        rows.map((row, index) =>
          this.createInstallmentGroup(index, row.paymentName, row.dueDate ? row.dueDate.slice(0, 10) : '')
        )
      )
    });

    this.form
      .get('schoolYear')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('semester')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('schoolYear')?.updateValueAndValidity({ emitEvent: false });
      });

    this.form
      .get('semester')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('schoolYear')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('semester')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  private createInstallmentGroup(index: number, paymentName: string, dueDate: string): FormGroup {
    return this.fb.group({
      paymentName: [paymentName || this.defaultPaymentName(index), [Validators.required]],
      dueDate: [dueDate || null, [Validators.required]]
    });
  }

  private syncInstallmentNames(): void {
    this.installments.controls.forEach((ctrl, index) => {
      ctrl.get('paymentName')?.setValue(this.defaultPaymentName(index));
    });
  }

  private defaultPaymentName(index: number): string {
    const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    const label = labels[index] ?? `${index + 1}th`;
    return index === 0 ? `${label} Payment (Enrollment)` : `${label} Payment`;
  }

  private duplicateComboValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!this.form) {
        return null;
      }
      const schoolYear = (this.form.get('schoolYear')?.value || '').trim().toLowerCase();
      const semester = (this.form.get('semester')?.value || '').trim().toLowerCase();
      if (!schoolYear || !semester) {
        return null;
      }
      const isDuplicate = this.takenCombos.some(
        c => c.schoolYear.trim().toLowerCase() === schoolYear && c.semester.trim().toLowerCase() === semester
      );
      return isDuplicate ? { duplicateCombo: true } : null;
    };
  }
}
