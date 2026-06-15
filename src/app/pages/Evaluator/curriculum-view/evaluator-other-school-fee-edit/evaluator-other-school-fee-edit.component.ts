import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UpdateOtherSchoolFeeRequest } from '../../../../core/models/other-school-fee.model';
import { LookupService } from '../../../../shared/services/lookup.service';
import { OtherSchoolFeesService } from '../../../Registrar/curriculum-management/fees-and-charges/other-school-fees/other-school-fees.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { FormDiscardService } from '../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../shared/utils/form-state.util';
import type { EvaluatorOtherSchoolFeeRow } from '../evaluator-curriculum-view.models';
import {
  TUITION_FEE_SEMESTER_OPTIONS,
  buildCreateOtherSchoolFeeRequest,
  buildTuitionFeeBatchYears,
  mapSyTermsToTuitionFeeOptions,
  type TuitionFeeSelectOption
} from '../utils/tuition-fee-form.util';

@Component({
  selector: 'app-evaluator-other-school-fee-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-other-school-fee-edit.component.html',
  styleUrls: ['../evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component.scss']
})
export class EvaluatorOtherSchoolFeeEditComponent implements OnChanges, OnDestroy {
  private readonly lookupService = inject(LookupService);
  private readonly otherSchoolFeesService = inject(OtherSchoolFeesService);
  private readonly notificationService = inject(NotificationService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() isOpen = false;
  @Input() schoolFee: EvaluatorOtherSchoolFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  schoolYearOptions: TuitionFeeSelectOption[] = [];
  readonly batchOptions = buildTuitionFeeBatchYears();
  readonly semesterOptions = TUITION_FEE_SEMESTER_OPTIONS;
  isSubmitting = false;
  submitted = false;
  errorMessage: string | null = null;

  readonly editForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    semester: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    schoolFee: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)]
    }),
    cash: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    lowMonthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['schoolFee'] || changes['isOpen']) && this.isOpen && this.schoolFee) {
      this.loadSyTerms();
      this.patchFormFromRow(this.schoolFee);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    void attemptFormClose({
      form: this.editForm,
      discardService: this.formDiscard,
      close: () => this.close.emit()
    });
  }

  onSubmit(): void {
    const result = validateFormForSubmit(this.editForm, { isEditMode: true });
    this.submitted = result.submitted;
    if (!result.canSubmit || this.isSubmitting || !this.schoolFee) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;

    this.isSubmitting = true;
    const base = buildCreateOtherSchoolFeeRequest(this.editForm.getRawValue());
    const payload: UpdateOtherSchoolFeeRequest = {
      ...base,
      id: this.schoolFee.id
    };

    this.otherSchoolFeesService.updateOtherSchoolFee(this.schoolFee.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('School Fee Updated', 'Other school fee has been updated successfully.');
        this.saved.emit();
        this.editForm.markAsPristine();
        this.close.emit();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(
          'Update Failed',
          error.userMessage || error.message || 'Failed to update school fee.'
        );
      }
    });
  }

  private loadSyTerms(): void {
    this.lookupService
      .getSyTermsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (terms) => {
          this.schoolYearOptions = mapSyTermsToTuitionFeeOptions(terms);
        },
        error: () => {
          this.schoolYearOptions = [];
        }
      });
  }

  private patchFormFromRow(row: EvaluatorOtherSchoolFeeRow): void {
    this.editForm.patchValue({
      syId: row.syId,
      batch: row.batch,
      semester: row.semester,
      schoolFee: row.schoolFee,
      cash: row.cash,
      lowMonthlyPayment: row.lowMonthlyPayment
    });
    this.editForm.markAsPristine();
    this.submitted = false;
    this.errorMessage = null;
  }
}
