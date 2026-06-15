import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuitionFee, CreateTuitionFeeRequest, UpdateTuitionFeeRequest } from '../../../../../../core/models/tuition-fee.model';
import { SyTerm } from '../../../../../../core/models/sy-term.model';
import { Course } from '../../../../../../core/models/course.model';
import { LookupService } from '../../../../../../shared/services/lookup.service';
import { FormDiscardService } from '../../../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../../../shared/utils/form-state.util';
import { unitFieldValidators } from '../../../../../../shared/validators/app-validators';
import { normalizeUnitValue } from '../../../../../../shared/utils/unit-value.util';
import { CourseService } from '../../../course.service';
import { Semester } from '../../../enums/semester.enum';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-tuition-fee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tuition-fee-form.component.html',
  styleUrl: './tuition-fee-form.component.scss'
})
export class TuitionFeeFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly courseService = inject(CourseService);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() tuitionFee: TuitionFee | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTuitionFeeRequest | UpdateTuitionFeeRequest>();

  tuitionFeeForm!: FormGroup;
  isSubmitting = false;
  submitted = false;
  errorMessage: string | null = null;
  syTerms: SyTerm[] = [];
  isLoadingSyTerms = false;
  courses: { value: string; displayText?: string }[] = [];
  isLoadingCourses = false;

  semesters = Object.values(Semester);
  componentOptions = ['Lecture', 'Lab', 'Lec/Lab'];
  
  batchYears: number[] = [];
  
  Semester = Semester;

  get isEditMode(): boolean {
    return !!this.tuitionFee;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Tuition Fee' : 'Add New Tuition Fee';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update Tuition Fee' : 'Add Tuition Fee';
  }

  get formControls() {
    return {
      syId: this.tuitionFeeForm.get('syId'),
      batch: this.tuitionFeeForm.get('batch'),
      semester: this.tuitionFeeForm.get('semester'),
      courseCode: this.tuitionFeeForm.get('courseCode'),
      courseTitle: this.tuitionFeeForm.get('courseTitle'),
      component: this.tuitionFeeForm.get('component'),
      units: this.tuitionFeeForm.get('units'),
      cash: this.tuitionFeeForm.get('cash'),
      lowMonthlyPayment: this.tuitionFeeForm.get('lowMonthlyPayment')
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
      const semester = this.tuitionFeeForm.get('semester')?.value;
      if (semester) {
        this.loadCoursesBySemester(semester);
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
    const initialSyId = this.tuitionFee?.syId || null;
    this.tuitionFeeForm = this.fb.group({
      syId: [initialSyId, [Validators.required]],
      batch: [this.tuitionFee?.batch || currentYear.toString(), [Validators.required]],
      semester: [this.tuitionFee?.semester || null, [Validators.required]],
      courseCode: [this.tuitionFee?.courseCode || null, [Validators.required]],
      courseTitle: [this.tuitionFee?.courseTitle || '', [Validators.required, Validators.maxLength(255)]],
      component: [this.tuitionFee?.component || null, [Validators.required]],
      units: [this.tuitionFee?.units || null, unitFieldValidators({ min: 0.5, max: 10 })],
      cash: [this.tuitionFee?.cash ?? 0.00, [Validators.required, Validators.min(0)]],
      lowMonthlyPayment: [this.tuitionFee?.lowMonthlyPayment ?? 0.00, [Validators.required, Validators.min(0)]]
    });

    this.setupFormValueChanges();
    this.tuitionFeeForm.markAsPristine();
    this.errorMessage = null;
  }

  private setupFormValueChanges(): void {
    this.tuitionFeeForm.get('semester')?.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(semester => {
      if (semester) {
        this.loadCoursesBySemester(semester);
        this.tuitionFeeForm.patchValue({ 
          courseCode: null,
          courseTitle: '',
          component: null,
          units: null
        }, { emitEvent: false });
      } else {
        this.courses = [];
        this.tuitionFeeForm.patchValue({ courseCode: null }, { emitEvent: false });
      }
    });

    this.tuitionFeeForm.get('courseCode')?.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(courseCode => {
      if (courseCode) {
        this.loadCourseDetails(courseCode);
      } else {
        this.tuitionFeeForm.patchValue({
          courseTitle: '',
          component: null,
          units: null
        }, { emitEvent: false });
      }
    });
  }

  private loadCoursesBySemester(semester: string): void {
    if (!semester || semester.trim() === '') {
      this.courses = [];
      return;
    }

    this.isLoadingCourses = true;
    this.lookupService.getCoursesBySemesterForDropdown(semester).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (courses) => {
        this.courses = courses || [];
        this.isLoadingCourses = false;
      },
      error: () => {
        this.courses = [];
        this.isLoadingCourses = false;
      }
    });
  }

  private loadCourseDetails(courseCode: string): void {
    if (!courseCode || courseCode.trim() === '') {
      return;
    }

    this.courseService.getCourseById(courseCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (course: Course) => {
        let component = null;
        if (course.courseComponent) {
          const components = course.courseComponent.split(',').map(c => c.trim());
          if (components.length > 1) {
            component = 'Lec/Lab';
          } else if (components.length === 1) {
            component = components[0];
          }
          if (component && !this.componentOptions.includes(component)) {
            const matched = this.componentOptions.find(opt => 
              components.some(c => c.toLowerCase().includes(opt.toLowerCase()) || opt.toLowerCase().includes(c.toLowerCase()))
            );
            component = matched || components[0] || null;
          }
        }

        this.tuitionFeeForm.patchValue({
          courseTitle: course.courseTitle || '',
          component: component,
          units: course.courseTotalUnits || null
        }, { emitEvent: false });
      },
      error: (error) => {
        console.error('Error loading course details:', error);
      }
    });
  }

  private loadSyTerms(): void {
    this.isLoadingSyTerms = true;
    this.lookupService.getSyTermsForDropdown().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
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
      form: this.tuitionFeeForm,
      discardService: this.formDiscard,
      close: () => this.finishClose()
    });
  }

  private finishClose(): void {
    this.courses = [];
    this.submitted = false;
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    const result = validateFormForSubmit(this.tuitionFeeForm, { isEditMode: this.isEditMode });
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;

    this.isSubmitting = true;

    const formValue = this.tuitionFeeForm.value;
    const tuitionFeeData: CreateTuitionFeeRequest | UpdateTuitionFeeRequest = {
      syId: formValue.syId || null,
      batch: formValue.batch?.toString(),
      semester: formValue.semester,
      courseCode: formValue.courseCode?.trim(),
      courseTitle: formValue.courseTitle?.trim(),
      component: formValue.component,
      units: normalizeUnitValue(formValue.units),
      cash: Number(formValue.cash),
      lowMonthlyPayment: Number(formValue.lowMonthlyPayment)
    };

    if (this.isEditMode && this.tuitionFee) {
      (tuitionFeeData as UpdateTuitionFeeRequest).id = this.tuitionFee.id;
    }

    this.save.emit(tuitionFeeData);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string): void {
    this.errorMessage = message;
  }
}

