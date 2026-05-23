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
import { distinctUntilChanged } from 'rxjs/operators';
import { LookupService } from '../../../../shared/services/lookup.service';
import { CourseService } from '../../../Registrar/curriculum-management/course.service';
import { TuitionFeesService } from '../../../Registrar/curriculum-management/fees-and-charges/tuition-fees/tuition-fees.service';
import { NotificationService } from '../../../../shared/services/notification.service';
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
  selector: 'app-evaluator-tuition-fee-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-tuition-fee-add.component.html',
  styleUrls: ['../evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component.scss']
})
export class EvaluatorTuitionFeeAddComponent implements OnChanges, OnDestroy {
  private readonly lookupService = inject(LookupService);
  private readonly courseService = inject(CourseService);
  private readonly tuitionFeesService = inject(TuitionFeesService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @Input() isOpen = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  schoolYearOptions: TuitionFeeSelectOption[] = [];
  readonly batchOptions = buildTuitionFeeBatchYears();
  readonly semesterOptions = TUITION_FEE_SEMESTER_OPTIONS;
  readonly componentOptions = TUITION_FEE_COMPONENT_OPTIONS;
  courseOptions: TuitionFeeSelectOption[] = [];
  isSubmitting = false;
  isLoadingCourses = false;

  readonly addForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl(String(new Date().getFullYear()), {
      nonNullable: true,
      validators: [Validators.required]
    }),
    semester: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    component: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    units: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.5)] }),
    cash: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    lowMonthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  constructor() {
    this.addForm
      .get('semester')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((semester) => this.loadCoursesForSemester(semester));

    this.addForm
      .get('courseCode')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((code) => this.loadCourseDetails(code));
  }

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
    const payload = buildCreateTuitionFeeRequest(this.addForm.getRawValue());

    this.tuitionFeesService.createTuitionFee(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Tuition Fee Created', 'Tuition fee has been added successfully.');
        this.saved.emit();
        this.onClose();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(
          'Create Failed',
          error.userMessage || error.message || 'Failed to create tuition fee.'
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
          this.addForm.patchValue(
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

  private resetFormDefaults(): void {
    const defaultSy = this.schoolYearOptions[0]?.value ?? '';
    const defaultSemester = TUITION_FEE_SEMESTER_OPTIONS[0] ?? '';
    this.addForm.reset({
      syId: defaultSy,
      batch: String(new Date().getFullYear()),
      semester: defaultSemester,
      courseCode: '',
      courseTitle: '',
      component: '',
      units: null,
      cash: null,
      lowMonthlyPayment: null
    });
    if (defaultSemester) {
      this.loadCoursesForSemester(defaultSemester);
    }
  }
}

