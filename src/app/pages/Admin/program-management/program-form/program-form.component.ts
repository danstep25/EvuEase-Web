import { Component, OnInit, OnChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Program, CreateProgramRequest, UpdateProgramRequest } from '../../../../core/models/program.model';

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './program-form.component.html',
  styleUrl: './program-form.component.scss'
})
export class ProgramFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() program: Program | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateProgramRequest | UpdateProgramRequest>;

  programForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  get isEditMode(): boolean {
    return !!this.program;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Program' : 'Add New Program';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update Program' : 'Add Program';
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
    this.programForm = this.fb.group({
      programCode: [this.program?.programCode || '', [Validators.required, Validators.maxLength(50)]],
      programTitle: [this.program?.programTitle || '', [Validators.required, Validators.maxLength(200)]],
      programCompletionYears: [this.program?.programCompletionYears || 4, [Validators.required, Validators.min(1), Validators.max(10)]],
      programTotalUnits: [this.program?.programTotalUnits ?? 0, [Validators.required, Validators.min(0)]],
      programStatus: [this.program?.programStatus || 'active', [Validators.required]]
    });
    this.errorMessage = null;
  }

  onClose(): void {
    this.programForm.reset({
      programCode: '',
      programTitle: '',
      programCompletionYears: 4,
      programTotalUnits: 0,
      programStatus: 'active'
    });
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    if (this.programForm.invalid) {
      this.markFormGroupTouched(this.programForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.programForm.value;
    
    if (this.isEditMode) {
      if (!this.program) {
        this.errorMessage = 'Program information is missing';
        this.isSubmitting = false;
        return;
      }
      const updateProgramData: UpdateProgramRequest = {
        programId: this.program.programId,
        programCode: formValue.programCode,
        programTitle: formValue.programTitle,
        programCompletionYears: formValue.programCompletionYears,
        programTotalUnits: formValue.programTotalUnits,
        programStatus: formValue.programStatus
      };
      this.save.emit(updateProgramData);
    } else {
      const createProgramData: CreateProgramRequest = {
        programCode: formValue.programCode,
        programTitle: formValue.programTitle,
        programCompletionYears: formValue.programCompletionYears,
        programTotalUnits: formValue.programTotalUnits,
        programStatus: formValue.programStatus
      };
      this.save.emit(createProgramData);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get formControls() {
    return {
      programCode: this.programForm.get('programCode'),
      programTitle: this.programForm.get('programTitle'),
      programCompletionYears: this.programForm.get('programCompletionYears'),
      programTotalUnits: this.programForm.get('programTotalUnits'),
      programStatus: this.programForm.get('programStatus')
    };
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string | null): void {
    this.errorMessage = message;
  }
}

