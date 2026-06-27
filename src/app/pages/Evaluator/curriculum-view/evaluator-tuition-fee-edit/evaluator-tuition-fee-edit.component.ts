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
import { feeAmountFieldValidators } from '../../../../shared/validators/app-validators';
import { Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { UpdateTuitionFeeRequest } from '../../../../core/models/tuition-fee.model';
import { LookupService } from '../../../../shared/services/lookup.service';
import { CourseService } from '../../../Registrar/curriculum-management/course.service';
import { TuitionFeesService } from '../../../Registrar/curriculum-management/fees-and-charges/tuition-fees/tuition-fees.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { FormDiscardService } from '../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../shared/utils/form-state.util';
import { unitFieldValidators } from '../../../../shared/validators/app-validators';
import type { EvaluatorTuitionFeeRow } from '../evaluator-curriculum-view.models';
import {
  TUITION_FEE_COMPONENT_OPTIONS,
  TUITION_FEE_SEMESTER_OPTIONS,
  buildCreateTuitionFeeRequest,
  buildTuitionFeeBatchYears,
  mapCourseComponentFromApi,
  mapSyTermsToTuitionFeeOptions,
  type TuitionFeeSelectOption
} from '../utils/tuition-fee-form.util';

@Component({
  selector: 'app-evaluator-tuition-fee-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-tuition-fee-edit.component.html',
  styleUrl: './evaluator-tuition-fee-edit.component.scss'
})
export class EvaluatorTuitionFeeEditComponent implements OnChanges, OnDestroy {
  private readonly lookupService = inject(LookupService);
  private readonly courseService = inject(CourseService);
  private readonly tuitionFeesService = inject(TuitionFeesService);
  private readonly notificationService = inject(NotificationService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() isOpen = false;
  @Input() tuitionFee: EvaluatorTuitionFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  schoolYearOptions: TuitionFeeSelectOption[] = [];
  readonly batchOptions = buildTuitionFeeBatchYears();
  readonly semesterOptions = TUITION_FEE_SEMESTER_OPTIONS;
  readonly componentOptions = TUITION_FEE_COMPONENT_OPTIONS;
  courseOptions: TuitionFeeSelectOption[] = [];
  isSubmitting = false;
  isLoadingCourses = false;
  submitted = false;
  errorMessage: string | null = null;

  readonly editForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    semester: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    component: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    units: new FormControl<number | null>(null, { validators: unitFieldValidators({ min: 0.5 }) }),
    cash: new FormControl<number | null>(0, { validators: feeAmountFieldValidators() }),
    lowMonthlyPayment: new FormControl<number | null>(0, {
      validators: feeAmountFieldValidators()
    })
  });

  constructor() {
    this.editForm
      .get('semester')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((semester) => this.loadCoursesForSemester(semester));

    this.editForm
      .get('courseCode')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((code) => this.loadCourseDetails(code));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['tuitionFee'] || changes['isOpen']) && this.isOpen && this.tuitionFee) {
      this.loadSyTerms();
      this.patchFormFromRow(this.tuitionFee);
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
    if (!result.canSubmit || this.isSubmitting || !this.tuitionFee) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;

    this.isSubmitting = true;
    const base = buildCreateTuitionFeeRequest(this.editForm.getRawValue());
    const payload: UpdateTuitionFeeRequest = {
      ...base,
      id: this.tuitionFee.id
    };

    this.tuitionFeesService.updateTuitionFee(this.tuitionFee.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Tuition Fee Updated', 'Tuition fee has been updated successfully.');
        this.saved.emit();
        this.editForm.markAsPristine();
        this.close.emit();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(
          'Update Failed',
          error.userMessage || error.message || 'Failed to update tuition fee.'
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

  private loadCoursesForSemester(semester: string): void {
    if (!semester?.trim()) {
      this.courseOptions = [];
      return;
    }

    this.isLoadingCourses = true;
    this.lookupService
      .getCoursesBySemesterForDropdown(semester)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courseOptions = (courses ?? []).map((course) => ({
            value: course.value,
            label: course.displayText ? `${course.value} - ${course.displayText}` : course.value
          }));
          this.isLoadingCourses = false;
        },
        error: () => {
          this.courseOptions = [];
          this.isLoadingCourses = false;
        }
      });
  }

  private loadCourseDetails(courseCode: string): void {
    if (!courseCode?.trim()) {
      return;
    }

    this.courseService
      .getCourseById(courseCode.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.editForm.patchValue(
            {
              courseTitle: course.courseTitle ?? '',
              component: mapCourseComponentFromApi(course.courseComponent) ?? '',
              units: course.courseTotalUnits ?? null
            },
            { emitEvent: false }
          );
        },
        error: () => {
          
        }
      });
  }

  private patchFormFromRow(row: EvaluatorTuitionFeeRow): void {
    this.editForm.patchValue({
      syId: row.syId,
      batch: row.batch,
      semester: row.semester,
      courseCode: row.courseCode,
      courseTitle: row.courseTitle,
      component: row.component,
      units: row.units,
      cash: row.cash,
      lowMonthlyPayment: row.lowMonthlyPayment
    });
    if (row.semester) {
      this.loadCoursesForSemester(row.semester);
    }
    this.editForm.markAsPristine();
    this.submitted = false;
    this.errorMessage = null;
  }
}

