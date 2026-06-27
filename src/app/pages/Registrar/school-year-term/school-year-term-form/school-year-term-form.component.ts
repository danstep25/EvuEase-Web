import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SyTerm, CreateSyTermRequest, UpdateSyTermRequest } from '../../../../core/models/sy-term.model';
import { FormDiscardService } from '../../../../shared/services/form-discard.service';
import { attemptFormClose, validateFormForSubmit } from '../../../../shared/utils/form-state.util';

@Component({
  selector: 'app-school-year-term-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './school-year-term-form.component.html',
  styleUrl: './school-year-term-form.component.scss'
})
export class SchoolYearTermFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly formDiscard = inject(FormDiscardService);
  private readonly destroy$ = new Subject<void>();

  @Input() syTerm: SyTerm | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateSyTermRequest | UpdateSyTermRequest>();

  syTermForm!: FormGroup;
  isSubmitting = false;
  submitted = false;
  errorMessage: string | null = null;

  get isEditMode(): boolean {
    return !!this.syTerm;
  }

  get title(): string {
    return this.isEditMode ? 'Edit School Year' : 'Add New School Year';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update School Year' : 'Add School Year';
  }

  generateSyCode(syYear: string): string {
    if (!syYear || !syYear.includes('-')) {
      return '';
    }
    const parts = syYear.split('-');
    if (parts.length === 2) {
      const startYear = parts[0].trim().slice(-2);
      const endYear = parts[1].trim().slice(-2);
      return `SY${startYear}${endYear}`;
    }
    return '';
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.syTermForm = this.fb.group({
      syCode: [{ value: this.syTerm?.syCode || '', disabled: !this.isEditMode }, [Validators.required, Validators.maxLength(255)]],
      syYear: [this.syTerm?.syYear || '', [Validators.required, Validators.maxLength(255)]],
      sySemester: [this.syTerm?.sySemester || '', [Validators.required, Validators.maxLength(255)]],
      syStartDate: [this.syTerm?.syStartDate || '', [Validators.required]],
      syEndDate: [this.syTerm?.syEndDate || '', [Validators.required]],
      syEnrollmentStart: [this.syTerm?.syEnrollmentStart || '', [Validators.required]],
      syEnrollmentEnd: [this.syTerm?.syEnrollmentEnd || '', [Validators.required]],
      syStatus: [this.syTerm?.syStatus || 'Inactive', [Validators.required]]
    });
    this.syTermForm.markAsPristine();
    this.errorMessage = null;

    if (!this.isEditMode) {
      this.syTermForm.get('syYear')?.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(syYear => {
        const generatedCode = this.generateSyCode(syYear);
        if (generatedCode) {
          this.syTermForm.patchValue({ syCode: generatedCode }, { emitEvent: false });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    void attemptFormClose({
      form: this.syTermForm,
      discardService: this.formDiscard,
      close: () => this.finishClose()
    });
  }

  private finishClose(): void {
    if (this.syTermForm) {
      this.syTermForm.reset({
        syCode: '',
        syYear: '',
        sySemester: '',
        syStartDate: '',
        syEndDate: '',
        syEnrollmentStart: '',
        syEnrollmentEnd: '',
        syStatus: 'Inactive'
      });
      if (this.syTermForm.get('syCode')?.disabled) {
        this.syTermForm.get('syCode')?.enable();
      }
      this.syTermForm.markAsPristine();
    }
    this.submitted = false;
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    const result = validateFormForSubmit(this.syTermForm, { isEditMode: this.isEditMode });
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      this.errorMessage = result.errorMessage;
      return;
    }
    this.errorMessage = null;

    this.isSubmitting = true;

    const formValue = this.syTermForm.getRawValue();

    if (this.isEditMode) {
      if (!this.syTerm) {
        this.errorMessage = 'School Year Term information is missing';
        this.isSubmitting = false;
        return;
      }
      const updateSyTermData: UpdateSyTermRequest = {
        syId: this.syTerm.syId,
        syCode: formValue.syCode,
        syYear: formValue.syYear,
        sySemester: formValue.sySemester,
        syStartDate: formValue.syStartDate,
        syEndDate: formValue.syEndDate,
        syEnrollmentStart: formValue.syEnrollmentStart,
        syEnrollmentEnd: formValue.syEnrollmentEnd,
        syStatus: formValue.syStatus
      };
      this.save.emit(updateSyTermData);
    } else {
      const createSyTermData: CreateSyTermRequest = {
        syCode: formValue.syCode,
        syYear: formValue.syYear,
        sySemester: formValue.sySemester,
        syStartDate: formValue.syStartDate,
        syEndDate: formValue.syEndDate,
        syEnrollmentStart: formValue.syEnrollmentStart,
        syEnrollmentEnd: formValue.syEnrollmentEnd,
        syStatus: formValue.syStatus
      };
      this.save.emit(createSyTermData);
    }
  }

  get formControls() {
    return {
      syCode: this.syTermForm.get('syCode'),
      syYear: this.syTermForm.get('syYear'),
      sySemester: this.syTermForm.get('sySemester'),
      syStartDate: this.syTermForm.get('syStartDate'),
      syEndDate: this.syTermForm.get('syEndDate'),
      syEnrollmentStart: this.syTermForm.get('syEnrollmentStart'),
      syEnrollmentEnd: this.syTermForm.get('syEnrollmentEnd'),
      syStatus: this.syTermForm.get('syStatus')
    };
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string | null): void {
    this.errorMessage = message;
  }
}

