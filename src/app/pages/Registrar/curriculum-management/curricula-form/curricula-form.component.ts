import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Curricula, CreateCurriculaRequest, UpdateCurriculaRequest } from '../../../../core/models/curricula.model';
import { Program } from '../../../../core/models/program.model';
import { SyTerm } from '../../../../core/models/sy-term.model';
import { LookupService } from '../../../../shared/services/lookup.service';
import { CurriculumStatus } from '../enums/curriculum-status.enum';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-curricula-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './curricula-form.component.html',
  styleUrl: './curricula-form.component.scss'
})
export class CurriculaFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly destroy$ = new Subject<void>();

  @Input() curricula: Curricula | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateCurriculaRequest | UpdateCurriculaRequest>();

  curriculaForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  programs: Program[] = [];
  syTerms: SyTerm[] = [];
  isLoadingPrograms = false;
  isLoadingSyTerms = false;

  get isEditMode(): boolean {
    return !!this.curricula;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Curriculum' : 'Add New Curriculum';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update Curriculum' : 'Add Curriculum';
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadPrograms();
    this.loadSyTerms();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
      if (this.programs.length === 0) {
        this.loadPrograms();
      }
      if (this.syTerms.length === 0) {
        this.loadSyTerms();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPrograms(): void {
    this.isLoadingPrograms = true;
    this.lookupService.getProgramsForDropdown().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (programs: Program[]) => {
        this.programs = programs;
        this.isLoadingPrograms = false;
      },
      error: () => {
        this.isLoadingPrograms = false;
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

  private initializeForm(): void {
    this.curriculaForm = this.fb.group({
      version: [this.curricula?.version || '', [Validators.required, Validators.maxLength(50)]],
      programId: [this.curricula?.programId || null, [Validators.required]],
      syId: [this.curricula?.syId || null, [Validators.required]],
      effectiveDate: [this.curricula?.effectiveDate || '', [Validators.required]],
      curriculumStatus: [this.curricula?.curriculumStatus || CurriculumStatus.Active, [Validators.required]]
    });
    this.errorMessage = null;
  }

  onClose(): void {
    this.curriculaForm.reset({
      version: '',
      programId: null,
      syId: null,
      effectiveDate: '',
      curriculumStatus: CurriculumStatus.Active
    });
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    if (this.curriculaForm.invalid) {
      this.markFormGroupTouched(this.curriculaForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.curriculaForm.value;
    
    if (!formValue.programId) {
      this.errorMessage = 'Please select a valid program';
      this.isSubmitting = false;
      return;
    }
    
    if (this.programs.length === 0) {
      this.errorMessage = 'Programs are still loading. Please wait...';
      this.isSubmitting = false;
      return;
    }
    
    const programIdNum = typeof formValue.programId === 'string' ? parseInt(formValue.programId, 10) : Number(formValue.programId);
    const selectedProgram = this.programs.find(p => p.programId === programIdNum || p.programId.toString() === formValue.programId?.toString());
    
    if (!selectedProgram) {
      this.errorMessage = 'Please select a valid program';
      this.isSubmitting = false;
      return;
    }

    if (this.isEditMode) {
      if (!this.curricula) {
        this.errorMessage = 'Curriculum information is missing';
        this.isSubmitting = false;
        return;
      }
      const updateCurriculaData: UpdateCurriculaRequest = {
        id: this.curricula.id,
        curriculumCode: this.curricula.curriculumCode,
        version: formValue.version,
        programId: selectedProgram.programId,
        programCode: selectedProgram.programCode,
        syId: formValue.syId,
        effectiveDate: formValue.effectiveDate,
        curriculumStatus: formValue.curriculumStatus
      };
      this.save.emit(updateCurriculaData);
    } else {
      const createCurriculaData: CreateCurriculaRequest = {
        version: formValue.version,
        programId: selectedProgram.programId,
        programCode: selectedProgram.programCode,
        syId: formValue.syId,
        effectiveDate: formValue.effectiveDate,
        curriculumStatus: formValue.curriculumStatus
      };
      this.save.emit(createCurriculaData);
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
      version: this.curriculaForm.get('version'),
      programId: this.curriculaForm.get('programId'),
      syId: this.curriculaForm.get('syId'),
      effectiveDate: this.curriculaForm.get('effectiveDate'),
      curriculumStatus: this.curriculaForm.get('curriculumStatus')
    };
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string | null): void {
    this.errorMessage = message;
  }

  CurriculumStatus = CurriculumStatus;
}

