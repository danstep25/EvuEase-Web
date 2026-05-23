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
import { LookupService } from '../../../../shared/services/lookup.service';
import { OtherSchoolFeesService } from '../../../Registrar/curriculum-management/fees-and-charges/other-school-fees/other-school-fees.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import {
  TUITION_FEE_SEMESTER_OPTIONS,
  buildCreateOtherSchoolFeeRequest,
  buildTuitionFeeBatchYears,
  mapSyTermsToTuitionFeeOptions,
  type TuitionFeeSelectOption
} from '../utils/tuition-fee-form.util';

@Component({
  selector: 'app-evaluator-other-school-fee-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-other-school-fee-add.component.html',
  styleUrls: ['../evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component.scss']
})
export class EvaluatorOtherSchoolFeeAddComponent implements OnChanges, OnDestroy {
  private readonly lookupService = inject(LookupService);
  private readonly otherSchoolFeesService = inject(OtherSchoolFeesService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @Input() isOpen = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  schoolYearOptions: TuitionFeeSelectOption[] = [];
  readonly batchOptions = buildTuitionFeeBatchYears();
  readonly semesterOptions = TUITION_FEE_SEMESTER_OPTIONS;
  isSubmitting = false;

  readonly addForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl(String(new Date().getFullYear()), {
      nonNullable: true,
      validators: [Validators.required]
    }),
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
    if (changes['isOpen'] && this.isOpen) {
      this.loadSyTerms();
      this.resetFormDefaults();
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
    if (this.addForm.invalid || this.isSubmitting) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = buildCreateOtherSchoolFeeRequest(this.addForm.getRawValue());

    this.otherSchoolFeesService.createOtherSchoolFee(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('School Fee Created', 'Other school fee has been added successfully.');
        this.saved.emit();
        this.onClose();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(
          'Create Failed',
          error.userMessage || error.message || 'Failed to create school fee.'
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
          const current = this.addForm.get('syId')?.value;
          if (!current && this.schoolYearOptions.length > 0) {
            this.addForm.patchValue({ syId: this.schoolYearOptions[0].value });
          }
        },
        error: () => {
          this.schoolYearOptions = [];
        }
      });
  }

  private resetFormDefaults(): void {
    const defaultSyId = this.schoolYearOptions[0]?.value ?? '';
    const defaultSemester = this.semesterOptions[0] ?? '';
    this.addForm.reset({
      syId: defaultSyId,
      batch: String(new Date().getFullYear()),
      semester: defaultSemester,
      schoolFee: '',
      cash: 0,
      lowMonthlyPayment: 0
    });
  }
}
