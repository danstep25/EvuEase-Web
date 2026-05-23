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
import { UpdateMiscellaneousFeeRequest } from '../../../../core/models/miscellaneous-fee.model';
import { LookupService } from '../../../../shared/services/lookup.service';
import { MiscellaneousFeesService } from '../../../Registrar/curriculum-management/fees-and-charges/miscellaneous-fees/miscellaneous-fees.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import type { EvaluatorMiscellaneousFeeRow } from '../evaluator-curriculum-view.models';
import {
  TUITION_FEE_SEMESTER_OPTIONS,
  buildCreateMiscellaneousFeeRequest,
  buildTuitionFeeBatchYears,
  mapSyTermsToTuitionFeeOptions,
  type TuitionFeeSelectOption
} from '../utils/tuition-fee-form.util';

@Component({
  selector: 'app-evaluator-miscellaneous-fee-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-miscellaneous-fee-edit.component.html',
  styleUrls: ['../evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component.scss']
})
export class EvaluatorMiscellaneousFeeEditComponent implements OnChanges, OnDestroy {
  private readonly lookupService = inject(LookupService);
  private readonly miscellaneousFeesService = inject(MiscellaneousFeesService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @Input() isOpen = false;
  @Input() miscellaneousFee: EvaluatorMiscellaneousFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  schoolYearOptions: TuitionFeeSelectOption[] = [];
  readonly batchOptions = buildTuitionFeeBatchYears();
  readonly semesterOptions = TUITION_FEE_SEMESTER_OPTIONS;
  isSubmitting = false;

  readonly editForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    semester: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    miscellaneousFee: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)]
    }),
    cash: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    lowMonthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['miscellaneousFee'] || changes['isOpen']) && this.isOpen && this.miscellaneousFee) {
      this.loadSyTerms();
      this.patchFormFromRow(this.miscellaneousFee);
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
    this.close.emit();
  }

  onSubmit(): void {
    if (this.editForm.invalid || this.isSubmitting || !this.miscellaneousFee) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const base = buildCreateMiscellaneousFeeRequest(this.editForm.getRawValue());
    const payload: UpdateMiscellaneousFeeRequest = {
      ...base,
      id: this.miscellaneousFee.id
    };

    this.miscellaneousFeesService.updateMiscellaneousFee(this.miscellaneousFee.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success(
          'Miscellaneous Fee Updated',
          'Miscellaneous fee has been updated successfully.'
        );
        this.saved.emit();
        this.onClose();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(
          'Update Failed',
          error.userMessage || error.message || 'Failed to update miscellaneous fee.'
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

  private patchFormFromRow(row: EvaluatorMiscellaneousFeeRow): void {
    this.editForm.patchValue({
      syId: row.syId,
      batch: row.batch,
      semester: row.semester,
      miscellaneousFee: row.miscellaneousFee,
      cash: row.cash,
      lowMonthlyPayment: row.lowMonthlyPayment
    });
  }
}
