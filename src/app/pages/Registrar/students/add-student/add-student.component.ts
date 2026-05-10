import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, of, catchError, finalize, takeUntil } from 'rxjs';
import { Program } from '../../../../core/models/program.model';
import { SyTerm } from '../../../../core/models/sy-term.model';
import { CreateStudentRequest, Student, UpdateStudentRequest } from '../../../../core/models/student.model';
import { LookupService } from '../../../../shared/services/lookup.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { StudentsService } from '../students.service';
import { controlFirstMessage, shouldShowControlError } from '../../../../shared/utils/form-field-error.util';
import {
  birthdateNotInFuture,
  phoneDigitsLength,
  trimmedRequired
} from '../../../../shared/validators/app-validators';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-student.component.html',
  styleUrl: './add-student.component.scss'
})
export class AddStudentComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly lookupService = inject(LookupService);
  private readonly studentsService = inject(StudentsService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  
  editStudentId: string | null = null;
  
  editStudentLoaded = false;

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Student' : 'Add New Student';
  }

  get pageSubtitle(): string {
    return this.isEditMode
      ? 'Update student information and academic details'
      : 'Enter student information and academic details';
  }

  get isEditMode(): boolean {
    return this.editStudentId != null && this.editStudentId !== '';
  }

  readonly admitTypes = [
    { value: 'New Student', label: 'New Student' },
    { value: 'Transferee', label: 'Transferee' }
  ];

  readonly yearLevels = [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
    'Fifth Year'
  ];

  readonly genders = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  readonly academicStatuses = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Dropped', label: 'Dropped' }
  ];

  programs: Program[] = [];
  syTerms: SyTerm[] = [];
  schoolYearOptions: string[] = [];
  termRows: { syId: number; label: string }[] = [];

  isLoadingLookups = true;
  isSubmitting = false;
  errorMessage: string | null = null;
  
  submitted = false;

  form = this.fb.nonNullable.group({
    admitType: ['New Student', Validators.required],
    yearLevel: ['First Year', Validators.required],
    schoolYear: ['', Validators.required],
    syTermId: [null as number | null, Validators.required],
    studentNumber: ['', [trimmedRequired, Validators.maxLength(50)]],
    programCode: ['', Validators.required],
    firstName: ['', [trimmedRequired, Validators.maxLength(100)]],
    lastName: ['', [trimmedRequired, Validators.maxLength(100)]],
    middleName: ['', Validators.maxLength(100)],
    gender: [''],
    birthdate: ['', [birthdateNotInFuture]],
    address: ['', [Validators.maxLength(500)]],
    contactNumber: ['', [phoneDigitsLength(7, 15)]],
    email: ['', [Validators.email, Validators.maxLength(200)]],
    currentYearLevel: ['First Year', Validators.required],
    academicStatus: ['Active', Validators.required],
    isTransferee: [false]
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.editStudentId = params.get('id');
      this.editStudentLoaded = false;
      this.loadLookups();
    });

    this.form
      .get('schoolYear')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(year => {
        this.form.patchValue({ syTermId: null }, { emitEvent: false });
        this.buildTermOptions(year || '');
        this.applyAdmissionValidators();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLookups(): void {
    this.isLoadingLookups = true;
    this.errorMessage = null;

    const programs$ = this.lookupService.getProgramsForDropdown().pipe(catchError(() => of<Program[]>([])));
    const syTerms$ = this.lookupService.getSyTermsForDropdown().pipe(catchError(() => of<SyTerm[]>([])));

    if (this.isEditMode && this.editStudentId) {
      forkJoin({
        programs: programs$,
        syTerms: syTerms$,
        student: this.studentsService.getStudentById(this.editStudentId).pipe(
          catchError(() => {
            this.errorMessage = 'Could not load student.';
            return of<Student | null>(null);
          })
        )
      })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoadingLookups = false;
          })
        )
        .subscribe({
          next: ({ programs, syTerms, student }) => {
            this.programs = programs;
            this.syTerms = this.normalizeSyTerms(syTerms);
            this.refreshSchoolYearOptionsFromSyTerms();

            if (programs.length === 0) {
              this.errorMessage =
                'No programs found. You can still edit; program list may be unavailable.';
            }

            if (!student) {
              return;
            }
            this.patchFormFromStudent(student);
            this.stripAdmissionValidatorsForEdit();
            this.editStudentLoaded = true;
          },
          error: () => {
            this.errorMessage = 'Could not load form data.';
          }
        });
      return;
    }

    forkJoin({
      programs: programs$,
      syTerms: syTerms$
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingLookups = false;
        })
      )
      .subscribe({
        next: ({ programs, syTerms }) => {
          this.programs = programs;
          this.syTerms = this.normalizeSyTerms(syTerms);

          if (programs.length === 0) {
            this.errorMessage = 'No programs found. You can still fill the form; program list may be unavailable.';
          }

          this.refreshSchoolYearOptionsFromSyTerms();

          if (this.schoolYearOptions.length === 0 && this.syTerms.length === 0) {
            this.errorMessage = this.errorMessage
              ? `${this.errorMessage} No school year terms found.`
              : 'No school year terms found.';
          }

          const patch: Partial<{ schoolYear: string; syTermId: number | null }> = {};
          if (this.schoolYearOptions.length > 0) {
            const preferred =
              this.schoolYearOptions.find(y => y.includes('2025')) ??
              this.schoolYearOptions[this.schoolYearOptions.length - 1];
            patch.schoolYear = preferred;
            this.buildTermOptions(preferred);
            const firstTerm = this.termRows[0];
            if (firstTerm) {
              patch.syTermId = firstTerm.syId;
            }
          }
          this.form.patchValue(patch);
          this.applyAdmissionValidators();
        },
        error: () => {
          this.errorMessage = 'Could not load form data.';
        }
      });
  }

  private refreshSchoolYearOptionsFromSyTerms(): void {
    this.schoolYearOptions = [...new Set(this.syTerms.map(t => t.syYear).filter(y => !!y?.trim()))].sort();
  }

  private patchFormFromStudent(s: Student): void {
    const rawBirth = s.birthdate;
    const birthdate =
      typeof rawBirth === 'string' && rawBirth.length >= 10 ? rawBirth.slice(0, 10) : rawBirth || '';
    const gender = s.gender === 'Female' || s.gender === 'Male' ? s.gender : '';
    const isTransferee = (s.type || '').toLowerCase() === 'transferee';

    this.form.patchValue(
      {
        studentNumber: s.studentNumber ?? '',
        programCode: s.programCode ?? '',
        firstName: s.firstName ?? '',
        lastName: s.lastName ?? '',
        middleName: s.middleName ?? '',
        gender,
        birthdate,
        address: (s.address ?? '').trim(),
        contactNumber: (s.contactNumber ?? '').trim(),
        email: (s.email ?? '').trim(),
        currentYearLevel: s.yearLevel || 'First Year',
        academicStatus: s.status || 'Active',
        isTransferee,
        admitType: isTransferee ? 'Transferee' : 'New Student',
        yearLevel: s.yearLevel || 'First Year'
      },
      { emitEvent: false }
    );
  }

  private stripAdmissionValidatorsForEdit(): void {
    (['admitType', 'yearLevel', 'schoolYear', 'syTermId'] as const).forEach(name => {
      const c = this.form.get(name);
      c?.clearValidators();
      c?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private applyAdmissionValidators(): void {
    if (this.isEditMode) {
      return;
    }

    const schoolYearCtrl = this.form.get('schoolYear');
    const syTermCtrl = this.form.get('syTermId');

    if (this.schoolYearOptions.length === 0) {
      schoolYearCtrl?.clearValidators();
    } else {
      schoolYearCtrl?.setValidators([Validators.required]);
    }
    schoolYearCtrl?.updateValueAndValidity({ emitEvent: false });

    if (this.termRows.length === 0) {
      syTermCtrl?.clearValidators();
    } else {
      syTermCtrl?.setValidators([Validators.required]);
    }
    syTermCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeSyTerms(terms: SyTerm[]): SyTerm[] {
    if (!Array.isArray(terms)) {
      return [];
    }
    return terms.map(t => ({
      ...t,
      syYear: (t.syYear ?? '').trim(),
      sySemester: (t.sySemester ?? '').trim()
    }));
  }

  private buildTermOptions(schoolYear: string): void {
    const matches = this.syTerms.filter(t => t.syYear === schoolYear);
    const seen = new Set<number>();
    this.termRows = [];
    for (const t of matches) {
      if (seen.has(t.syId)) {
        continue;
      }
      seen.add(t.syId);
      const label = t.sySemester || t.syCode || `Term #${t.syId}`;
      this.termRows.push({ syId: t.syId, label });
    }
    this.termRows.sort((a, b) => a.label.localeCompare(b.label));
  }

  get formControls() {
    return this.form.controls;
  }

  showFieldError(control: AbstractControl | null): boolean {
    return shouldShowControlError(control, this.submitted);
  }

  fieldError(control: AbstractControl | null): string {
    return controlFirstMessage(control, this.submitted);
  }

  get formActionsDisabled(): boolean {
    return (
      this.isSubmitting ||
      this.isLoadingLookups ||
      (this.isEditMode && !this.editStudentLoaded)
    );
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => {
        const first = document.querySelector<HTMLElement>(
          'form input.ng-invalid:not([disabled]), form select.ng-invalid:not([disabled])'
        );
        first?.focus();
      });
      return;
    }

    const v = this.form.getRawValue();
    const program = this.programs.find(p => p.programCode === v.programCode);
    const programTitle = program?.programTitle?.trim() ? program.programTitle : v.programCode;

    const studentType =
      v.isTransferee || v.admitType === 'Transferee' ? 'Transferee' : 'Regular';

    if (this.isEditMode && this.editStudentId) {
      const updateBody: UpdateStudentRequest = {
        id: Number(this.editStudentId),
        studentNumber: v.studentNumber.trim(),
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        middleName: v.middleName?.trim() || null,
        programCode: v.programCode,
        programTitle,
        yearLevel: v.currentYearLevel,
        studentType,
        enrollmentStatus: v.academicStatus,
        address: v.address.trim() || null,
        contactNumber: v.contactNumber.trim() || null,
        email: v.email.trim() || null,
        gender: v.gender || null,
        birthdate: v.birthdate || null
      };

      this.isSubmitting = true;
      this.studentsService.updateStudent(this.editStudentId, updateBody).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success('Student updated', 'Changes were saved successfully.');
          void this.router.navigate(['/registrar/students']);
        },
        error: err => {
          this.isSubmitting = false;
          const msg =
            err?.error?.error?.message ||
            err?.error?.message ||
            err?.message ||
            'Could not update student. Please try again.';
          this.errorMessage = typeof msg === 'string' ? msg : 'Could not update student.';
        }
      });
      return;
    }

    const body: CreateStudentRequest = {
      studentNumber: v.studentNumber.trim(),
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      middleName: v.middleName?.trim() || null,
      programCode: v.programCode,
      programTitle,
      yearLevel: v.currentYearLevel,
      studentType,
      enrollmentStatus: v.academicStatus,
      address: v.address.trim() || null,
      contactNumber: v.contactNumber.trim() || null,
      email: v.email.trim() || null,
      gender: v.gender || null,
      birthdate: v.birthdate || null
    };

    this.isSubmitting = true;
    this.studentsService.createStudent(body).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Student added', 'The student was created successfully.');
        void this.router.navigate(['/registrar/students']);
      },
      error: err => {
        this.isSubmitting = false;
        const msg =
          err?.error?.error?.message ||
          err?.error?.message ||
          err?.message ||
          'Could not create student. Please try again.';
        this.errorMessage = typeof msg === 'string' ? msg : 'Could not create student.';
      }
    });
  }

  cancel(): void {
    void this.router.navigate(['/registrar/students']);
  }
}
