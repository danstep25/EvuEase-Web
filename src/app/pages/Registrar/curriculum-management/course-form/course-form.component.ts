import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../../../../core/models/course.model';
import { Curricula } from '../../../../core/models/curricula.model';
import { Program } from '../../../../core/models/program.model';
import { LookupService } from '../../../../shared/services/lookup.service';
import { YearLevel } from '../enums/year-level.enum';
import { Semester } from '../enums/semester.enum';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss'
})
export class CourseFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lookupService = inject(LookupService);
  private readonly destroy$ = new Subject<void>();

  @Input() course: Course | null = null;
  
  @Input() createPrefill: Partial<CreateCourseRequest> | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateCourseRequest | UpdateCourseRequest>();

  courseForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  curricula: Curricula[] = [];
  programs: Program[] = [];
  isLoadingCurricula = false;
  isLoadingPrograms = false;

  yearLevels = Object.values(YearLevel);
  semesters = Object.values(Semester);
  componentOptions = ['Lecture', 'Lab'];
  selectedComponents: string[] = [];
  prerequisiteOptions: string[] = [];
  isLoadingPrerequisites = false;
  
  YearLevel = YearLevel;
  Semester = Semester;

  get isEditMode(): boolean {
    return !!this.course;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Course' : 'Add New Course';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update Course' : 'Add Course';
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadPrograms();
    this.loadPrerequisites();
    if (this.course?.programId) {
      this.lookupService.getProgramsForDropdown().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (programs: Program[]) => {
          this.programs = programs;
          if (this.course?.programId) {
            this.loadCurriculumVersions(this.course.programId);
          }
        }
      });
    }
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
      const programId = this.course?.programId || this.courseForm?.get('programId')?.value;
      if (programId && programId > 0) {
        if (this.programs.length > 0) {
          setTimeout(() => {
            this.loadCurriculumVersions(programId);
          }, 0);
        } else {
          this.loadPrograms();
          this.lookupService.getProgramsForDropdown().pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: (programs: Program[]) => {
              this.programs = programs;
              setTimeout(() => {
                this.loadCurriculumVersions(programId);
              }, 0);
            }
          });
        }
      } else {
        this.curricula = [];
      }
      
      if (this.course?.curriculumCode && this.courseForm) {
        const curriculumControl = this.courseForm.get('curriculumCode');
        if (curriculumControl && !curriculumControl.value) {
          curriculumControl.setValue(this.course.curriculumCode, { emitEvent: false });
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurriculumVersions(programId: number): void {
    if (!programId || programId <= 0 || isNaN(programId)) {
      this.curricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    const selectedProgram = this.programs.find(p => p.programId === programId);
    if (!selectedProgram || !selectedProgram.programCode) {
      if (this.programs.length === 0) {
        this.lookupService.getProgramsForDropdown().pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (programs: Program[]) => {
            this.programs = programs;
            const foundProgram = programs.find(p => p.programId === programId);
            if (foundProgram?.programCode) {
              this.loadCurriculumVersionsByProgramCode(foundProgram.programCode);
            } else {
              console.warn(`Program with ID ${programId} not found`);
              this.curricula = [];
              this.isLoadingCurricula = false;
            }
          },
          error: (error) => {
            console.error('Error loading programs for curriculum versions:', error);
            this.curricula = [];
            this.isLoadingCurricula = false;
          }
        });
      } else {
        console.warn(`Program with ID ${programId} not found in programs array`);
        this.curricula = [];
        this.isLoadingCurricula = false;
      }
      return;
    }

    console.log(`Loading curriculum versions for program: ${selectedProgram.programCode}`);
    this.loadCurriculumVersionsByProgramCode(selectedProgram.programCode);
  }

  private loadCurriculumVersionsByProgramCode(programCode: string): void {
    if (!programCode || programCode.trim() === '') {
      this.curricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    this.isLoadingCurricula = true;
    console.log(`Calling API: curriculum-versions?programCode=${programCode}`);
    this.lookupService.getCurriculumVersionsForDropdown(programCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (curricula: Curricula[]) => {
        console.log(`Received ${curricula.length} curriculum versions:`, curricula);
        curricula.forEach(c => {
          console.log(`Curriculum: code=${c.curriculumCode}, version=${c.version}`);
          if (c.curriculumCode && !c.curriculumCode.includes('-') && c.version) {
            console.warn(`Warning: curriculumCode appears to be version only. Expected format: "${programCode}-${c.curriculumCode}"`);
          }
        });
        this.curricula = curricula || [];
        this.isLoadingCurricula = false;
        
        if (this.course?.curriculumCode && this.courseForm) {
          const curriculumControl = this.courseForm.get('curriculumCode');
          const matchingCurriculum = this.curricula.find(c => c.curriculumCode === this.course?.curriculumCode);
          
          if (matchingCurriculum) {
            curriculumControl?.setValue(this.course.curriculumCode, { emitEvent: false });
          } else {
            const currentValue = curriculumControl?.value;
            if (!currentValue || !this.curricula.find(c => c.curriculumCode === currentValue)) {
              curriculumControl?.setValue(null, { emitEvent: false });
            }
          }
        }
      },
      error: (error) => {
        console.error('Error loading curriculum versions:', error);
        this.curricula = [];
        this.isLoadingCurricula = false;
      }
    });
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

  private loadPrerequisites(): void {
    this.isLoadingPrerequisites = true;
    this.lookupService.getCoursesForDropdown().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (courses: string[]) => {
        this.prerequisiteOptions = courses;
        this.isLoadingPrerequisites = false;
      },
      error: () => {
        this.isLoadingPrerequisites = false;
      }
    });
  }

  private initializeForm(): void {
    const c = this.course;
    const pf = !c && this.createPrefill ? this.createPrefill : null;

    const totalUnits = c?.courseTotalUnits ?? pf?.courseTotalUnits ?? 0;

    let initialCurriculumCode = null;
    if (c?.curriculumCode) {
      initialCurriculumCode = c.curriculumCode;
    } else if (pf?.curriculumCode) {
      initialCurriculumCode = pf.curriculumCode;
    }

    let initialComponents: string[] = [];
    if (c?.courseComponent) {
      initialComponents = c.courseComponent.split(',').map(x => x.trim()).filter(x => x);
    } else if (pf?.courseComponent?.trim()) {
      initialComponents = pf.courseComponent.split(',').map(x => x.trim()).filter(x => x);
    }
    this.selectedComponents = [...initialComponents];

    let initialPrerequisite = null;
    if (c?.prerequisites) {
      const prereq = c.prerequisites.trim();
      initialPrerequisite = prereq || null;
    } else if (pf?.prerequisites?.trim()) {
      initialPrerequisite = pf.prerequisites.trim() || null;
    }

    const initialProgramId = c?.programId ?? pf?.programId ?? null;
    const initialCourseCode = c?.courseCode ?? pf?.courseCode ?? '';
    const initialTitle = c?.courseTitle ?? pf?.courseTitle ?? '';
    const initialYear = c?.courseYearLevel ?? pf?.courseYearLevel ?? YearLevel.Year1;
    const initialSem = c?.courseSemester ?? pf?.courseSemester ?? Semester.First;
    const initialDesc = c?.description ?? pf?.description ?? '';

    this.courseForm = this.fb.group({
      curriculumCode: [initialCurriculumCode, [Validators.required]],
      programId: [initialProgramId && initialProgramId > 0 ? initialProgramId : null, [Validators.required]],
      courseCode: [initialCourseCode, [Validators.required, Validators.maxLength(20)]],
      courseTitle: [initialTitle, [Validators.required, Validators.maxLength(50)]],
      courseComponent: [initialComponents, [this.validateComponentRequired.bind(this), this.validateNoDuplicates.bind(this)]],
      courseTotalUnits: [totalUnits, [Validators.required, Validators.min(0)]],
      courseYearLevel: [initialYear, [Validators.required]],
      courseSemester: [initialSem, [Validators.required]],
      prerequisites: [initialPrerequisite],
      description: [initialDesc]
    });

    const programIdControl = this.courseForm.get('programId');
    if (programIdControl) {
      programIdControl.valueChanges.pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe((programIdValue: number | string | null) => {
        const programId = programIdValue ? (typeof programIdValue === 'string' ? parseInt(programIdValue, 10) : programIdValue) : null;
        
        console.log('Program ID changed:', programId, 'Programs loaded:', this.programs.length);
        
        if (programId && programId > 0 && !isNaN(programId)) {
          const currentCurriculumCode = this.courseForm.get('curriculumCode')?.value;
          const isInitialLoad = this.course?.curriculumCode && currentCurriculumCode === this.course.curriculumCode;
          
          if (!isInitialLoad) {
            this.courseForm.patchValue({ curriculumCode: null }, { emitEvent: false });
          }
          
          if (this.programs.length === 0) {
            this.isLoadingPrograms = true;
            this.lookupService.getProgramsForDropdown().pipe(
              takeUntil(this.destroy$)
            ).subscribe({
              next: (programs: Program[]) => {
                this.programs = programs;
                this.isLoadingPrograms = false;
                this.loadCurriculumVersions(programId);
              },
              error: (error) => {
                console.error('Error loading programs:', error);
                this.isLoadingPrograms = false;
                this.curricula = [];
              }
            });
          } else {
            this.loadCurriculumVersions(programId);
          }
        } else {
          this.curricula = [];
          this.courseForm.patchValue({ curriculumCode: null }, { emitEvent: false });
        }
      });
    }

    const programIdForCurriculumLoad = this.courseForm.get('programId')?.value;
    if (programIdForCurriculumLoad && programIdForCurriculumLoad > 0 && this.programs.length > 0) {
      setTimeout(() => {
        this.loadCurriculumVersions(programIdForCurriculumLoad);
      }, 0);
    }

    this.errorMessage = null;
  }

  onClose(): void {
    this.selectedComponents = [];
    this.courseForm.reset({
      curriculumCode: null,
      programId: null,
      courseCode: '',
      courseTitle: '',
      courseComponent: [],
      courseTotalUnits: 0,
      courseYearLevel: YearLevel.Year1,
      courseSemester: Semester.First,
      prerequisites: null,
      description: ''
    });
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.markFormGroupTouched(this.courseForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.courseForm.value;
    
    const programId = formValue.programId ? (typeof formValue.programId === 'string' ? parseInt(formValue.programId, 10) : formValue.programId) : null;
    
    if (!programId || isNaN(programId)) {
      this.errorMessage = 'Please select a valid program';
      this.isSubmitting = false;
      return;
    }
    
    if (this.programs.length === 0) {
      this.errorMessage = 'Programs are not loaded. Please wait and try again.';
      this.isSubmitting = false;
      return;
    }
    
    const selectedProgram = this.programs.find(p => p.programId === programId);
    if (!selectedProgram || !selectedProgram.programCode) {
      this.errorMessage = 'Please select a valid program';
      this.isSubmitting = false;
      return;
    }

    const selectedCurriculum = this.curricula.find(c => c.curriculumCode === formValue.curriculumCode);
    if (!selectedCurriculum) {
      this.errorMessage = 'Please select a valid curriculum version';
      this.isSubmitting = false;
      return;
    }

    const fullCurriculumCode = selectedCurriculum.curriculumCode;

    if (this.isEditMode) {
      if (!this.course) {
        this.errorMessage = 'Course information is missing';
        this.isSubmitting = false;
        return;
      }
      const updateCourseData: UpdateCourseRequest = {
        courseCode: formValue.courseCode,
        curriculumCode: fullCurriculumCode,
        programId: programId,
        courseTitle: formValue.courseTitle,
        courseTotalUnits: formValue.courseTotalUnits,
        courseYearLevel: formValue.courseYearLevel,
        courseSemester: formValue.courseSemester,
        courseComponent: Array.isArray(formValue.courseComponent) 
          ? formValue.courseComponent.join(', ') 
          : formValue.courseComponent || '',
        prerequisites: formValue.prerequisites || null,
        description: formValue.description || ''
      };
      this.save.emit(updateCourseData);
    } else {
      const createCourseData: CreateCourseRequest = {
        courseCode: formValue.courseCode,
        curriculumCode: fullCurriculumCode,
        programId: programId,
        courseTitle: formValue.courseTitle,
        courseTotalUnits: formValue.courseTotalUnits,
        courseYearLevel: formValue.courseYearLevel,
        courseSemester: formValue.courseSemester,
        courseComponent: Array.isArray(formValue.courseComponent) 
          ? formValue.courseComponent.join(', ') 
          : formValue.courseComponent || '',
        prerequisites: formValue.prerequisites || null,
        description: formValue.description || ''
      };
      this.save.emit(createCourseData);
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
      curriculumCode: this.courseForm.get('curriculumCode'),
      programId: this.courseForm.get('programId'),
      courseCode: this.courseForm.get('courseCode'),
      courseTitle: this.courseForm.get('courseTitle'),
      courseComponent: this.courseForm.get('courseComponent'),
      courseTotalUnits: this.courseForm.get('courseTotalUnits'),
      courseYearLevel: this.courseForm.get('courseYearLevel'),
      courseSemester: this.courseForm.get('courseSemester'),
      prerequisites: this.courseForm.get('prerequisites'),
      description: this.courseForm.get('description')
    };
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string | null): void {
    this.errorMessage = message;
  }

  onComponentSelect(component: string): void {
    if (!component || component.trim() === '') {
      return;
    }

    const trimmedComponent = component.trim();
    const currentComponents = this.courseForm.get('courseComponent')?.value || [];
    
    if (currentComponents.includes(trimmedComponent)) {
      this.courseForm.get('courseComponent')?.setErrors({ duplicate: true });
      this.courseForm.get('courseComponent')?.markAsTouched();
      return;
    }

    const updatedComponents = [...currentComponents, trimmedComponent];
    this.selectedComponents = [...updatedComponents];
    this.courseForm.patchValue({ courseComponent: updatedComponents });
    
    const control = this.courseForm.get('courseComponent');
    if (control) {
      control.updateValueAndValidity();
      control.markAsTouched();
    }
  }

  removeComponent(component: string): void {
    const currentComponents = this.courseForm.get('courseComponent')?.value || [];
    const updatedComponents = currentComponents.filter((c: string) => c !== component);
    this.selectedComponents = [...updatedComponents];
    this.courseForm.patchValue({ courseComponent: updatedComponents });
    
    const control = this.courseForm.get('courseComponent');
    if (control) {
      control.updateValueAndValidity();
      control.markAsTouched();
    }
  }

  validateComponentRequired(control: any): { [key: string]: any } | null {
    if (!control.value || !Array.isArray(control.value) || control.value.length === 0) {
      return { required: true };
    }
    return null;
  }

  validateNoDuplicates(control: any): { [key: string]: any } | null {
    if (!control.value || !Array.isArray(control.value)) {
      return null;
    }
    
    const components = control.value as string[];
    const uniqueComponents = new Set(components);
    
    if (components.length !== uniqueComponents.size) {
      return { duplicate: true };
    }
    
    return null;
  }

}

