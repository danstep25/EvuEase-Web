import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  FacultyCenterService,
  ClassRosterDto,
  ClassRosterStudentDto,
  RosterPdfStudentNotInRegistryDto,
  ClassRosterPdfImportSummaryDto,
  ClassListPdfPreviewDto,
  GradeRosterClassLookupDto
} from './faculty-center.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LookupService, LookupResponse } from '../../../shared/services/lookup.service';
import { CourseService } from '../curriculum-management/course.service';
import { SyTerm } from '../../../core/models/sy-term.model';
import { Program } from '../../../core/models/program.model';
import { YearLevel } from '../curriculum-management/enums/year-level.enum';
import { trimmedRequired } from '../../../shared/validators/app-validators';
import { controlFirstMessage, shouldShowControlError } from '../../../shared/utils/form-field-error.util';
import {
  ConfirmationModalComponent,
  ConfirmationModalConfig
} from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { GradeRosterStudentGradesComponent } from './grade-roster-student-grades.component';
import { UpdateStudentGradeModalComponent } from './update-student-grade-modal.component';
import { ClassRosterAddStudentModalComponent } from './class-roster-add-student-modal.component';
import { ClassListPdfCoursePrefillItem, ClassListPdfCoursePrefillPayload } from '../../../shared/models/class-list-pdf-course-prefill.model';
import { CLASS_LIST_PDF_COURSE_PREFILL_STORAGE_KEY } from '../../../shared/constants/class-list-pdf-prefill.constant';

export enum FacultyMainTab {
  ClassAssignment = 'class-assignment',
  ClassRoster = 'class-roster',
  GradeRoster = 'grade-roster'
}

export enum FacultyGradingSubTab {
  GradingScale = 'grading-scale',
  GradeScale = 'grade-scale'
}

export enum FacultyGradeRosterSubTab {
  GradeManagement = 'grade-management',
  CreditRequests = 'credit-requests'
}

export interface GradeScaleRow {
  id: number;
  mark: number;
  grade: number;
}

export interface ClassRosterRow {
  id: string;
  courseCode: string;
  classNumber: string;
  section: string;
  courseTitle: string;
  component: string;
  academicTerm: string;
  enrolled: number;
  programCode: string;
  yearLevel: string;
}

@Component({
  selector: 'app-faculty-center',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ConfirmationModalComponent,
    GradeRosterStudentGradesComponent,
    UpdateStudentGradeModalComponent,
    ClassRosterAddStudentModalComponent
  ],
  templateUrl: './faculty-center.component.html',
  styleUrl: './faculty-center.component.scss'
})
export class FacultyCenterComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly facultyCenterService = inject(FacultyCenterService);
  private readonly notificationService = inject(NotificationService);
  private readonly lookupService = inject(LookupService);
  private readonly courseService = inject(CourseService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly FacultyMainTab = FacultyMainTab;
  readonly FacultyGradingSubTab = FacultyGradingSubTab;
  readonly FacultyGradeRosterSubTab = FacultyGradeRosterSubTab;

  pageTitle = 'Faculty Center';
  pageSubtitle = 'Manage class assignments, rosters, and grade encoding';

  activeMainTab: FacultyMainTab = FacultyMainTab.ClassAssignment;
  gradingSubTab: FacultyGradingSubTab = FacultyGradingSubTab.GradingScale;
  gradeRosterSubTab: FacultyGradeRosterSubTab = FacultyGradeRosterSubTab.GradeManagement;

  
  gradeRosterSelectedSyId: number | null = null;
  gradeRosterClassSearchQuery = '';
  gradeRosterClassComboOpen = false;
  
  selectedGradeRosterLookup: GradeRosterClassLookupDto | null = null;
  gradeRosterLookupRows: GradeRosterClassLookupDto[] = [];
  isLoadingGradeRosterLookup = false;
  private readonly gradeRosterLookupSearch$ = new Subject<void>();

  
  gradeRosterGradesViewActive = false;
  gradeRosterStudentRows: ClassRosterStudentDto[] = [];
  isLoadingGradeRosterStudents = false;

  gradeEditModalOpen = false;
  gradeEditStudent: ClassRosterStudentDto | null = null;
  isSavingGrade = false;

  submitted = false;
  isSaving = false;
  isLoadingTerms = false;
  isLoadingScheme = false;

  syTerms: SyTerm[] = [];

  termForm: FormGroup;

  gradeScaleRows: GradeScaleRow[] = [];

  classRosterSearch = '';
  classRosterRows: ClassRosterRow[] = [];
  isLoadingClasses = false;
  classCreatePanelOpen = false;
  classCreateSubmitted = false;
  isSavingClass = false;
  classCreateForm: FormGroup;

  coursesLookup: LookupResponse[] = [];
  isLoadingCourses = false;
  programsForClass: Program[] = [];
  isLoadingPrograms = false;
  courseSearchQuery = '';
  courseComboOpen = false;
  readonly yearLevelOptions = Object.values(YearLevel);

  showDeleteConfirmation = false;
  classToDelete: ClassRosterRow | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete Class',
    message: 'Are you sure you want to delete this class?\nThis action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-amber-600 hover:bg-amber-700'
  };

  showClassRosterDetailModal = false;
  classRosterDetailRow: ClassRosterRow | null = null;
  classRosterDetailStudents: ClassRosterStudentDto[] = [];
  isLoadingClassRosterDetailStudents = false;

  isImportingClassRosterPdf = false;

  
  lastPdfImportSummary: ClassRosterPdfImportSummaryDto | null = null;

  
  pdfNotInRegistryPanelDismissed = false;

  
  pdfImportByPagePanelDismissed = false;

  showAddStudentModal = false;

  showRemoveStudentConfirmation = false;
  studentToRemoveFromClass: ClassRosterStudentDto | null = null;
  removeStudentConfirmationConfig: ConfirmationModalConfig = {
    title: 'Remove student',
    message: '',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
  };

  
  showMissingCourseModuleModal = false;
  missingCourseModuleModalConfig: ConfirmationModalConfig = {
    title: 'Course Module required',
    message: '',
    confirmText: 'Go to Course Module',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700'
  };
  pendingMissingCoursePrefills: ClassListPdfCoursePrefillItem[] = [];

  editingGradeScaleId: number | null = null;
  editGradeDraft: { mark: number | null; grade: number | null } | null = null;
  private nextGradeScaleId = 1;

  constructor() {
    this.termForm = this.fb.group({
      academicTerm: ['', Validators.required],
      gradingSchemeCode: ['', [trimmedRequired, Validators.maxLength(32)]],
      gradingSchemeDescription: ['', [trimmedRequired, Validators.maxLength(200)]],
      gradingBasisCode: ['', [trimmedRequired, Validators.maxLength(32)]],
      gradingBasisDescription: ['', [trimmedRequired, Validators.maxLength(200)]]
    });
    this.classCreateForm = this.fb.group({
      courseCode: ['', Validators.required],
      classNumber: ['', Validators.required],
      programCode: ['', Validators.required],
      yearLevel: ['', Validators.required],
      section: ['', [Validators.required, Validators.maxLength(64)]],
      courseTitle: ['', Validators.required],
      component: ['', Validators.required],
      academicTerm: ['', Validators.required],
      enrolled: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.gradeRosterLookupSearch$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.executeGradeRosterLookup());

    this.loadCoursesLookup();
    this.loadProgramsForClass();
    this.isLoadingTerms = true;
    this.lookupService
      .getSyTermsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: terms => {
          this.syTerms = terms ?? [];
          this.isLoadingTerms = false;
          if (this.gradeRosterSelectedSyId == null && this.syTerms[0]) {
            this.gradeRosterSelectedSyId = this.syTerms[0].syId;
          }
          if (this.classCreatePanelOpen && this.classCreateForm.get('academicTerm')?.value === '') {
            const t = this.syTerms[0];
            if (t) {
              this.classCreateForm.patchValue({ academicTerm: this.academicTermDisplayLabel(t) });
            }
          }
          const first = this.syTerms[0]?.syCode ?? '';
          this.termForm.patchValue({ academicTerm: first }, { emitEvent: false });
          if (first) {
            this.loadGradingSchemeForTerm(first);
          }
          this.termForm
            .get('academicTerm')!
            .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe(key => {
              if (key) {
                this.loadGradingSchemeForTerm(key);
              }
            });
        },
        error: () => {
          this.isLoadingTerms = false;
          this.notificationService.error('Load failed', 'Could not load school year terms.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadGradingSchemeForTerm(academicTermKey: string): void {
    this.isLoadingScheme = true;
    this.facultyCenterService
      .getGradingSchemeBasis(academicTermKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.isLoadingScheme = false;
          if (!data) {
            this.resetSchemeAndGradeScaleForm();
            return;
          }
          this.termForm.patchValue(
            {
              gradingSchemeCode: data.gradingSchemeCode ?? '',
              gradingSchemeDescription: data.gradingSchemeDescription ?? '',
              gradingBasisCode: data.gradingBasisCode ?? '',
              gradingBasisDescription: data.gradingBasisDescription ?? ''
            },
            { emitEvent: false }
          );
          this.gradeScaleRows = (data.gradeScaleRows ?? []).map(r => ({
            id: Number(r.id),
            mark: Number(r.mark),
            grade: Number(r.grade)
          }));
          this.nextGradeScaleId =
            this.gradeScaleRows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoadingScheme = false;
          const msg =
            err?.userMessage ||
            err?.message ||
            'Could not load grading scheme and basis for this term.';
          this.notificationService.error('Load failed', msg);
        }
      });
  }

  private resetSchemeAndGradeScaleForm(): void {
    this.termForm.patchValue(
      {
        gradingSchemeCode: '',
        gradingSchemeDescription: '',
        gradingBasisCode: '',
        gradingBasisDescription: ''
      },
      { emitEvent: false }
    );
    this.gradeScaleRows = [];
    this.nextGradeScaleId = 1;
    this.editingGradeScaleId = null;
    this.editGradeDraft = null;
  }

  formatMark(value: number): string {
    return value.toFixed(2);
  }

  formatGrade(value: number): string {
    return value.toFixed(2);
  }

  onAddGradeScale(): void {
    if (this.editingGradeScaleId != null) {
      this.cancelEditGradeScale();
    }
    const newRow: GradeScaleRow = {
      id: this.nextGradeScaleId++,
      mark: 0,
      grade: 0
    };
    this.gradeScaleRows = [...this.gradeScaleRows, newRow];
    this.startEditGradeScale(newRow);
  }

  startEditGradeScale(row: GradeScaleRow): void {
    this.editingGradeScaleId = row.id;
    this.editGradeDraft = { mark: row.mark, grade: row.grade };
  }

  cancelEditGradeScale(): void {
    const id = this.editingGradeScaleId;
    if (id != null) {
      const row = this.gradeScaleRows.find(r => r.id === id);
      if (row && row.mark === 0 && row.grade === 0) {
        this.gradeScaleRows = this.gradeScaleRows.filter(r => r.id !== id);
      }
    }
    this.editingGradeScaleId = null;
    this.editGradeDraft = null;
  }

  saveEditGradeScale(): void {
    if (this.editingGradeScaleId == null || !this.editGradeDraft) {
      return;
    }
    const mark = this.editGradeDraft.mark;
    const grade = this.editGradeDraft.grade;
    if (mark == null || grade == null || Number.isNaN(mark) || Number.isNaN(grade)) {
      this.notificationService.warning('Invalid values', 'Enter valid numbers for mark and grade.');
      return;
    }
    const idx = this.gradeScaleRows.findIndex(r => r.id === this.editingGradeScaleId);
    if (idx >= 0) {
      const updated = [...this.gradeScaleRows];
      updated[idx] = {
        ...updated[idx],
        mark: Math.round(mark * 100) / 100,
        grade: Math.round(grade * 100) / 100
      };
      this.gradeScaleRows = updated;
    }
    this.editingGradeScaleId = null;
    this.editGradeDraft = null;
  }

  onDeleteGradeScale(row: GradeScaleRow): void {
    if (!confirm(`Remove mark ${this.formatMark(row.mark)} / grade ${this.formatGrade(row.grade)}?`)) {
      return;
    }
    this.gradeScaleRows = this.gradeScaleRows.filter(r => r.id !== row.id);
    if (this.editingGradeScaleId === row.id) {
      this.editingGradeScaleId = null;
      this.editGradeDraft = null;
    }
  }

  get filteredClassRosterRows(): ClassRosterRow[] {
    const q = this.classRosterSearch.trim().toLowerCase();
    if (!q) {
      return this.classRosterRows;
    }
    return this.classRosterRows.filter(row =>
      [
        row.courseCode,
        row.classNumber,
        row.section,
        row.courseTitle,
        row.component,
        row.academicTerm,
        row.programCode,
        row.yearLevel
      ].some(field => (field || '').toLowerCase().includes(q))
    );
  }

  academicTermDisplayLabel(t: SyTerm): string {
    const y = t.syYear?.trim() ?? '';
    const s = t.sySemester?.trim() ?? '';
    if (y && s) {
      return `${y} / ${s}`;
    }
    return t.syCode?.trim() ?? '';
  }

  get filteredCoursesForClassCombo(): LookupResponse[] {
    const q = this.courseSearchQuery.trim().toLowerCase();
    const list = this.coursesLookup;
    if (!q) {
      return list.slice(0, 100);
    }
    return list
      .filter(c => {
        const v = (c.value || '').toLowerCase();
        const d = (c.displayText || c.value || '').toLowerCase();
        return v.includes(q) || d.includes(q);
      })
      .slice(0, 100);
  }

  onCourseSearchQueryChange(value: string): void {
    const v = value ?? '';
    this.courseSearchQuery = v;
    this.courseComboOpen = true;
    const currentCode = (this.classCreateForm.get('courseCode')?.value ?? '').toString().trim();
    if (!currentCode) {
      return;
    }
    const match = this.coursesLookup.find(x => x.value === currentCode);
    const label = (match?.displayText || match?.value || '').toString();
    if (v !== label) {
      this.classCreateForm.patchValue(
        {
          courseCode: '',
          courseTitle: '',
          component: '',
          programCode: '',
          yearLevel: ''
        },
        { emitEvent: false }
      );
    }
  }

  onCourseComboFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (host && next && host.contains(next)) {
      return;
    }
    window.setTimeout(() => {
      this.courseComboOpen = false;
    }, 0);
  }

  onCourseInputFocus(): void {
    this.courseComboOpen = true;
  }

  selectCourseFromLookup(c: LookupResponse, event?: Event): void {
    event?.preventDefault();
    const code = (c.value ?? '').toString().trim();
    if (!code) {
      return;
    }
    this.classCreateForm.patchValue({ courseCode: code }, { emitEvent: false });
    this.courseSearchQuery = (c.displayText || c.value || '').toString();
    this.courseComboOpen = false;
    this.courseService
      .getCourseById(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: payload => {
          const d = this.parseCourseDetail(payload);
          const programCode = this.resolveProgramCodeForClass(d.programCode, d.programId);
          const yearLevel = this.matchYearLevelToOption(d.courseYearLevel);
          this.classCreateForm.patchValue(
            {
              courseTitle: d.courseTitle,
              component: this.primaryCourseComponent(d.courseComponent),
              programCode,
              yearLevel
            },
            { emitEvent: false }
          );
        },
        error: () => {}
      });
  }

  private parseCourseDetail(payload: unknown): {
    courseTitle: string;
    courseComponent: string | undefined;
    courseYearLevel: string;
    programCode: string;
    programId: number;
  } {
    const p = payload as Record<string, unknown>;
    const str = (camel: string, pascal: string) => {
      const v = p[camel] ?? p[pascal];
      return typeof v === 'string' ? v : '';
    };
    const num = (camel: string, pascal: string) => {
      const v = p[camel] ?? p[pascal];
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const comp = str('courseComponent', 'CourseComponent');
    return {
      courseTitle: str('courseTitle', 'CourseTitle'),
      courseComponent: comp || undefined,
      courseYearLevel: str('courseYearLevel', 'CourseYearLevel'),
      programCode: str('programCode', 'ProgramCode'),
      programId: num('programId', 'ProgramId')
    };
  }

  private resolveProgramCodeForClass(programCodeFromApi: string, programId: number): string {
    const fromApi = programCodeFromApi.trim();
    if (fromApi && this.programsForClass.some(pr => pr.programCode === fromApi)) {
      return fromApi;
    }
    if (programId) {
      const pr = this.programsForClass.find(x => x.programId === programId);
      if (pr?.programCode) {
        return pr.programCode;
      }
    }
    return fromApi;
  }

  private matchYearLevelToOption(raw: string | undefined | null): string {
    if (raw == null || !String(raw).trim()) {
      return '';
    }
    let t = String(raw).trim();
    const direct = this.yearLevelOptions.find(
      o => o === t || o.toLowerCase() === t.toLowerCase()
    );
    if (direct) {
      return direct;
    }
    t = t.replace(/^Year\s*(\d)$/i, 'Year $1');
    return (
      this.yearLevelOptions.find(o => o.toLowerCase() === t.toLowerCase()) ?? ''
    );
  }

  private loadProgramsForClass(): void {
    this.isLoadingPrograms = true;
    this.lookupService
      .getProgramsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          this.programsForClass = rows ?? [];
          this.isLoadingPrograms = false;
        },
        error: () => {
          this.programsForClass = [];
          this.isLoadingPrograms = false;
        }
      });
  }

  private loadCoursesLookup(): void {
    this.isLoadingCourses = true;
    this.lookupService
      .getCoursesLookupForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          this.coursesLookup = rows ?? [];
          this.isLoadingCourses = false;
        },
        error: () => {
          this.coursesLookup = [];
          this.isLoadingCourses = false;
        }
      });
  }

  private primaryCourseComponent(raw: string | undefined): string {
    if (!raw?.trim()) {
      return '';
    }
    return raw.split(',')[0]?.trim() ?? '';
  }

  private loadClassRoster(): void {
    this.isLoadingClasses = true;
    this.facultyCenterService
      .getClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          this.isLoadingClasses = false;
          this.classRosterRows = rows.map(d => this.mapFacultyClassToRow(d));
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoadingClasses = false;
          this.classRosterRows = [];
          const msg =
            err?.userMessage || err?.message || 'Could not load the class roster.';
          this.notificationService.error('Load failed', msg);
        }
      });
  }

  private mapFacultyClassToRow(d: ClassRosterDto): ClassRosterRow {
    return {
      id: String(d.id),
      courseCode: d.courseCode,
      classNumber: d.classNumber,
      section: d.section,
      courseTitle: d.courseTitle,
      component: d.component,
      academicTerm: d.academicTerm,
      enrolled: d.enrolled,
      programCode: d.programCode ?? '',
      yearLevel: d.yearLevel ?? ''
    };
  }

  onCreateClass(): void {
    this.classCreatePanelOpen = !this.classCreatePanelOpen;
    if (this.classCreatePanelOpen) {
      this.classCreateSubmitted = false;
      this.courseSearchQuery = '';
      this.courseComboOpen = false;
      this.classCreateForm.reset({ enrolled: 0 });
      const t = this.syTerms[0];
      if (t) {
        this.classCreateForm.patchValue({ academicTerm: this.academicTermDisplayLabel(t) });
      }
    }
  }

  onCancelClassCreate(): void {
    this.classCreatePanelOpen = false;
    this.classCreateSubmitted = false;
    this.courseSearchQuery = '';
    this.courseComboOpen = false;
  }

  onSubmitClassCreate(): void {
    this.classCreateSubmitted = true;
    if (this.classCreateForm.invalid || this.isSavingClass) {
      this.classCreateForm.markAllAsTouched();
      return;
    }
    const v = this.classCreateForm.getRawValue();
    this.isSavingClass = true;
    this.facultyCenterService
      .createClass({
        courseCode: (v.courseCode as string).trim(),
        classNumber: (v.classNumber as string).trim(),
        section: (v.section as string).trim(),
        courseTitle: (v.courseTitle as string).trim(),
        component: (v.component as string).trim(),
        academicTerm: (v.academicTerm as string).trim(),
        enrolled: Number(v.enrolled) || 0,
        programCode: (v.programCode as string).trim(),
        yearLevel: (v.yearLevel as string).trim()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingClass = false;
          this.classCreateSubmitted = false;
          this.classCreatePanelOpen = false;
          this.courseSearchQuery = '';
          this.classCreateForm.reset({ enrolled: 0 });
          this.notificationService.success('Created', 'The class was added.');
          this.loadClassRoster();
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isSavingClass = false;
          const msg = err?.userMessage || err?.message || 'Could not create the class.';
          this.notificationService.error('Create failed', msg);
        }
      });
  }

  showClassCreateError(controlName: string): boolean {
    return shouldShowControlError(this.classCreateForm.get(controlName), this.classCreateSubmitted);
  }

  classCreateFieldMessage(controlName: string): string {
    return controlFirstMessage(this.classCreateForm.get(controlName), this.classCreateSubmitted);
  }

  onViewClass(row: ClassRosterRow): void {
    this.classRosterDetailRow = row;
    this.showClassRosterDetailModal = true;
    this.classRosterDetailStudents = [];
    this.loadClassRosterStudents(row);
  }

  closeClassRosterDetailModal(): void {
    this.showClassRosterDetailModal = false;
    this.showAddStudentModal = false;
    this.classRosterDetailRow = null;
    this.classRosterDetailStudents = [];
    this.isLoadingClassRosterDetailStudents = false;
  }

  
  get classRosterDetailClassId(): number {
    const n = Number(this.classRosterDetailRow?.id);
    return Number.isNaN(n) ? 0 : n;
  }

  get enrolledStudentNumbersForAddModal(): string[] {
    return this.classRosterDetailStudents.map(s => s.studentId);
  }

  private loadClassRosterStudents(row: ClassRosterRow): void {
    const id = Number(row.id);
    if (Number.isNaN(id)) {
      return;
    }
    this.isLoadingClassRosterDetailStudents = true;
    this.facultyCenterService
      .getClassStudents(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: students => {
          this.isLoadingClassRosterDetailStudents = false;
          this.classRosterDetailStudents = students;
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoadingClassRosterDetailStudents = false;
          this.classRosterDetailStudents = [];
          const msg =
            err?.userMessage || err?.message || 'Could not load students for this class.';
          this.notificationService.error('Load failed', msg);
        }
      });
  }

  formatClassNumberForTitle(classNumber: string): string {
    const t = classNumber?.trim() ?? '';
    if (/^\d+$/.test(t)) {
      return t.padStart(3, '0');
    }
    return t || '—';
  }

  
  get rosterPdfNotFoundFlattened(): Array<RosterPdfStudentNotInRegistryDto & { sourcePage: number }> {
    const pages = this.lastPdfImportSummary?.pages ?? [];
    const out: Array<RosterPdfStudentNotInRegistryDto & { sourcePage: number }> = [];
    for (const p of pages) {
      if (p.skippedReason) {
        continue;
      }
      for (const r of p.notFoundInRegistry ?? []) {
        out.push({ ...r, sourcePage: p.pageNumber });
      }
    }
    return out;
  }

  buildRosterPdfNotFoundCsv(): string {
    const rows = this.rosterPdfNotFoundFlattened;
    const esc = (v: string) => {
      const s = v ?? '';
      if (/[",\r\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const header = 'PDF page,Student number,Name (from PDF),Program (from PDF),Year level (from PDF)';
    const body = rows.map(r =>
      [
        String(r.sourcePage),
        esc(r.studentNumber),
        esc(r.pdfDisplayName),
        esc(r.pdfProgramCode),
        esc(r.pdfYearLevel)
      ].join(',')
    );
    return [header, ...body].join('\r\n');
  }

  async copyRosterPdfNotFoundCsv(): Promise<void> {
    if (!this.rosterPdfNotFoundFlattened.length) {
      return;
    }
    const text = this.buildRosterPdfNotFoundCsv();
    try {
      await navigator.clipboard.writeText(text);
      this.notificationService.success('Copied', 'List copied as CSV (paste into Excel or a ticket).');
    } catch {
      this.notificationService.error('Copy failed', 'Your browser blocked clipboard access.');
    }
  }

  downloadRosterPdfNotFoundCsv(): void {
    if (!this.rosterPdfNotFoundFlattened.length) {
      return;
    }
    const blob = new Blob([`\ufeff${this.buildRosterPdfNotFoundCsv()}`], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_roster_pdf_not_in_registry.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerMainClassRosterPdfUpload(): void {
    const input = document.getElementById('mainClassRosterPdfInput') as HTMLInputElement | null;
    input?.click();
  }

  onMainClassRosterPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.notificationService.error('Invalid file', 'Please choose a PDF file.');
      return;
    }
    this.isImportingClassRosterPdf = true;
    this.lastPdfImportSummary = null;
    this.pdfNotInRegistryPanelDismissed = false;
    this.pdfImportByPagePanelDismissed = false;
    this.facultyCenterService
      .previewClassListPdf(file)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(preview => {
          const missing = this.collectMissingCoursePrefillsFromPreview(preview);
          if (missing.length > 0) {
            this.pendingMissingCoursePrefills = missing;
            this.missingCourseModuleModalConfig = {
              ...this.missingCourseModuleModalConfig,
              message: this.buildMissingCourseModuleModalMessage(missing)
            };
            this.showMissingCourseModuleModal = true;
            return EMPTY;
          }
          return this.facultyCenterService.importClassRosterPdf(file);
        }),
        finalize(() => {
          this.isImportingClassRosterPdf = false;
        })
      )
      .subscribe({
        next: summary => {
          if (!summary) {
            return;
          }
          this.lastPdfImportSummary = summary;
          this.loadClassRoster();
          const pages = summary.pages ?? [];
          const imported = pages.filter(p => !p.skippedReason);
          const skipped = pages.filter(p => p.skippedReason);
          const totalStudents = imported.reduce((a, p) => a + (p.importedCount ?? 0), 0);
          const created = imported.filter(p => p.classCreatedFromPdf).length;
          const missing = this.rosterPdfNotFoundFlattened.length;
          const parts = [
            `${imported.length} section(s) updated`,
            `${totalStudents} student seat(s) imported`,
            created > 0 ? `${created} new class(es) created from the PDF` : null,
            skipped.length > 0 ? `${skipped.length} page(s) skipped` : null,
            missing > 0 ? `${missing} not in student registry (see below)` : null
          ].filter(Boolean);
          this.notificationService.success('PDF import finished', parts.join('. ') + '.');
          if (pages.some(p => (p.warnings?.length ?? 0) > 0)) {
            console.warn('Class roster PDF import warnings:', pages.map(p => p.warnings));
          }
        },
        error: (err: { userMessage?: string; message?: string }) => {
          const msg = err?.userMessage || err?.message || 'Could not process the PDF.';
          this.notificationService.error('PDF check failed', msg);
        }
      });
  }

  private collectMissingCoursePrefillsFromPreview(preview: ClassListPdfPreviewDto): ClassListPdfCoursePrefillItem[] {
    const map = new Map<string, ClassListPdfCoursePrefillItem>();
    const term = preview.academicTerm ?? '';
    for (const p of preview.pages ?? []) {
      if (p.skippedReason) {
        continue;
      }
      if (p.courseExistsInModule) {
        continue;
      }
      if (!p.courseCode?.trim()) {
        continue;
      }
      const code = p.courseCode.trim();
      if (map.has(code)) {
        continue;
      }
      map.set(code, {
        courseCode: code,
        courseTitle: (p.courseTitle ?? '').trim(),
        courseTotalUnits: p.totalUnits ?? 0,
        programCode: (p.programCode ?? '').trim(),
        yearLevelRaw: (p.yearLevel ?? '').trim(),
        academicTerm: (p.academicTerm ?? term).trim()
      });
    }
    return [...map.values()];
  }

  private buildMissingCourseModuleModalMessage(items: ClassListPdfCoursePrefillItem[]): string {
    const lines = items.map(i => `${i.courseCode} — ${i.courseTitle || '(no title)'}`);
    return (
      'These course codes from the PDF are not in the Course Module yet:\n\n' +
      lines.join('\n') +
      '\n\nAdd them under Curriculum Management → Courses first, then import the class list again.\n\nOpen Course Module now with the first course prefilled from the PDF?'
    );
  }

  onConfirmMissingCourseModule(): void {
    this.showMissingCourseModuleModal = false;
    const payload: ClassListPdfCoursePrefillPayload = {
      prefills: this.pendingMissingCoursePrefills,
      academicTerm: this.pendingMissingCoursePrefills[0]?.academicTerm
    };
    this.pendingMissingCoursePrefills = [];
    sessionStorage.setItem(CLASS_LIST_PDF_COURSE_PREFILL_STORAGE_KEY, JSON.stringify(payload));
    void this.router.navigate(['/registrar/curriculum-management'], { queryParams: { fromClassListPdf: '1' } });
  }

  onCancelMissingCourseModule(): void {
    this.showMissingCourseModuleModal = false;
    this.pendingMissingCoursePrefills = [];
  }

  dismissPdfNotInRegistryPanel(): void {
    this.pdfNotInRegistryPanelDismissed = true;
  }

  dismissPdfImportByPagePanel(): void {
    this.pdfImportByPagePanelDismissed = true;
  }

  onAddStudentToClass(): void {
    this.showAddStudentModal = true;
  }

  onAddStudentModalClose(): void {
    this.showAddStudentModal = false;
  }

  onStudentAddedFromRegistry(row: ClassRosterStudentDto): void {
    this.classRosterDetailStudents = [...this.classRosterDetailStudents, row].sort((a, b) =>
      a.studentId.localeCompare(b.studentId, undefined, { numeric: true })
    );
    const n = this.classRosterDetailStudents.length;
    if (this.classRosterDetailRow) {
      this.classRosterDetailRow = { ...this.classRosterDetailRow, enrolled: n };
    }
    const id = this.classRosterDetailRow?.id;
    if (id != null) {
      const listRow = this.classRosterRows.find(r => r.id === id);
      if (listRow) {
        listRow.enrolled = n;
      }
    }
    this.showAddStudentModal = false;
    this.notificationService.success('Student added', `${row.displayName} is now enrolled in this class.`);
  }

  onRemoveStudentFromClass(student: ClassRosterStudentDto): void {
    this.studentToRemoveFromClass = student;
    this.removeStudentConfirmationConfig = {
      ...this.removeStudentConfirmationConfig,
      title: 'Remove student',
      message: `Remove ${student.displayName} from this class?\nThis does not delete the student record.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700'
    };
    this.showRemoveStudentConfirmation = true;
  }

  onConfirmRemoveStudentFromClass(): void {
    this.showRemoveStudentConfirmation = false;
    const s = this.studentToRemoveFromClass;
    this.studentToRemoveFromClass = null;
    if (!s || !this.classRosterDetailRow) {
      return;
    }
    const classId = Number(this.classRosterDetailRow.id);
    if (Number.isNaN(classId)) {
      return;
    }
    this.facultyCenterService
      .removeStudentFromClass(classId, s.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.classRosterDetailStudents = this.classRosterDetailStudents.filter(x => x.id !== s.id);
          const n = this.classRosterDetailStudents.length;
          this.classRosterDetailRow = { ...this.classRosterDetailRow!, enrolled: n };
          const id = this.classRosterDetailRow.id;
          const listRow = this.classRosterRows.find(r => r.id === id);
          if (listRow) {
            listRow.enrolled = n;
          }
          this.notificationService.success('Removed', `${s.displayName} was removed from this class.`);
        },
        error: (err: { userMessage?: string; message?: string }) => {
          const msg = err?.userMessage || err?.message || 'Could not remove this student.';
          this.notificationService.error('Remove failed', msg);
        }
      });
  }

  onCancelRemoveStudentFromClass(): void {
    this.showRemoveStudentConfirmation = false;
    this.studentToRemoveFromClass = null;
  }

  onDeleteClass(row: ClassRosterRow): void {
    this.classToDelete = row;
    this.deleteConfirmationConfig = {
      title: 'Delete Class',
      message: `Are you sure you want to delete class ${row.classNumber} (${row.courseCode})?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-amber-600 hover:bg-amber-700'
    };
    this.showDeleteConfirmation = true;
  }

  onConfirmDeleteClass(): void {
    const row = this.classToDelete;
    if (!row) {
      return;
    }
    const id = Number(row.id);
    if (Number.isNaN(id)) {
      this.showDeleteConfirmation = false;
      this.classToDelete = null;
      return;
    }
    this.facultyCenterService
      .deleteClass(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const deletedId = this.classToDelete?.id;
          this.notificationService.success('Removed', 'The class was removed.');
          this.showDeleteConfirmation = false;
          this.classToDelete = null;
          if (
            this.showClassRosterDetailModal &&
            this.classRosterDetailRow &&
            deletedId === this.classRosterDetailRow.id
          ) {
            this.closeClassRosterDetailModal();
          }
          this.loadClassRoster();
        },
        error: (err: { userMessage?: string; message?: string }) => {
          const msg = err?.userMessage || err?.message || 'Could not delete the class.';
          this.notificationService.error('Delete failed', msg);
          this.showDeleteConfirmation = false;
          this.classToDelete = null;
        }
      });
  }

  onCancelDeleteClass(): void {
    this.showDeleteConfirmation = false;
    this.classToDelete = null;
  }

  setMainTab(tab: FacultyMainTab): void {
    this.activeMainTab = tab;
    if (tab === FacultyMainTab.ClassRoster) {
      this.loadClassRoster();
    }
    if (tab === FacultyMainTab.GradeRoster) {
      this.executeGradeRosterLookup();
    }
  }

  setGradeRosterSubTab(tab: FacultyGradeRosterSubTab): void {
    this.gradeRosterSubTab = tab;
    if (tab !== FacultyGradeRosterSubTab.GradeManagement) {
      this.resetGradeRosterGradesView();
    }
  }

  private resetGradeRosterGradesView(): void {
    this.gradeRosterGradesViewActive = false;
    this.gradeRosterStudentRows = [];
    this.isLoadingGradeRosterStudents = false;
    this.gradeEditModalOpen = false;
    this.gradeEditStudent = null;
    this.isSavingGrade = false;
  }

  get gradeRosterGradingSchemeKey(): string {
    const t = this.syTerms.find(x => x.syId === this.gradeRosterSelectedSyId);
    return t?.syCode?.trim() ?? '';
  }

  gradeRosterSelectedTermLabel(): string {
    const t = this.syTerms.find(x => x.syId === this.gradeRosterSelectedSyId);
    return t ? this.academicTermDisplayLabel(t) : '';
  }

  private executeGradeRosterLookup(): void {
    const term = this.gradeRosterSelectedTermLabel();
    if (!term) {
      this.gradeRosterLookupRows = [];
      this.isLoadingGradeRosterLookup = false;
      return;
    }
    this.isLoadingGradeRosterLookup = true;
    const search = this.gradeRosterClassSearchQuery.trim() || undefined;
    this.facultyCenterService
      .getGradeRosterClassLookup(term, search)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          this.isLoadingGradeRosterLookup = false;
          this.gradeRosterLookupRows = rows;
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoadingGradeRosterLookup = false;
          this.gradeRosterLookupRows = [];
          const msg =
            err?.userMessage || err?.message || 'Could not load classes for this term.';
          this.notificationService.error('Load failed', msg);
        }
      });
  }

  onGradeRosterTermSelectChange(): void {
    this.resetGradeRosterGradesView();
    this.selectedGradeRosterLookup = null;
    this.gradeRosterClassSearchQuery = '';
    this.gradeRosterClassComboOpen = false;
    this.executeGradeRosterLookup();
  }

  onGradeRosterClassSearchQueryChange(value: string): void {
    const v = value ?? '';
    this.gradeRosterClassSearchQuery = v;
    this.gradeRosterClassComboOpen = true;
    const sel = this.selectedGradeRosterLookup;
    if (sel && v.trim() !== sel.displayText.trim()) {
      this.selectedGradeRosterLookup = null;
      this.resetGradeRosterGradesView();
    } else if (sel && v.trim() === sel.displayText.trim()) {
      return;
    }
    this.gradeRosterLookupSearch$.next();
  }

  onGradeRosterClassComboFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (host && next && host.contains(next)) {
      return;
    }
    window.setTimeout(() => {
      this.gradeRosterClassComboOpen = false;
    }, 0);
  }

  onGradeRosterClassInputFocus(): void {
    this.gradeRosterClassComboOpen = true;
  }

  selectGradeRosterClass(row: GradeRosterClassLookupDto, event?: Event): void {
    event?.preventDefault();
    this.resetGradeRosterGradesView();
    this.selectedGradeRosterLookup = row;
    this.gradeRosterClassSearchQuery = row.displayText;
    this.gradeRosterClassComboOpen = false;
  }

  get canViewGradeRosterGrades(): boolean {
    return this.gradeRosterSelectedSyId != null && this.selectedGradeRosterLookup != null;
  }

  onViewGradeRosterGrades(): void {
    if (!this.canViewGradeRosterGrades || !this.selectedGradeRosterLookup) {
      return;
    }
    this.gradeRosterGradesViewActive = true;
    this.isLoadingGradeRosterStudents = true;
    this.gradeRosterStudentRows = [];
    const classId = this.selectedGradeRosterLookup.id;
    this.facultyCenterService
      .getClassStudents(classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          this.isLoadingGradeRosterStudents = false;
          this.gradeRosterStudentRows = rows;
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoadingGradeRosterStudents = false;
          this.gradeRosterGradesViewActive = false;
          const msg =
            err?.userMessage || err?.message || 'Could not load students for this class.';
          this.notificationService.error('Load failed', msg);
        }
      });
  }

  onGradeRosterUploadGrades(): void {
    this.notificationService.info(
      'Upload Grades',
      'Bulk grade upload from a file will be available when import is connected.'
    );
  }

  onGradeRosterEditStudent(row: ClassRosterStudentDto): void {
    this.gradeEditStudent = row;
    this.gradeEditModalOpen = true;
  }

  closeGradeEditModal(): void {
    if (this.isSavingGrade) {
      return;
    }
    this.gradeEditModalOpen = false;
    this.gradeEditStudent = null;
  }

  onGradeEditSave(
    payload:
      | { rawMark: number; academicTermKey: string }
      | { officialGrade: string; remarks?: string | null }
  ): void {
    if (!this.gradeEditStudent) {
      return;
    }
    this.isSavingGrade = true;
    this.facultyCenterService
      .updateEnrollmentGrade(this.gradeEditStudent.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.isSavingGrade = false;
          const idx = this.gradeRosterStudentRows.findIndex(r => r.id === updated.id);
          if (idx >= 0) {
            const copy = [...this.gradeRosterStudentRows];
            copy[idx] = updated;
            this.gradeRosterStudentRows = copy;
          }
          this.notificationService.success('Grade updated', 'The student grade was saved.');
          this.closeGradeEditModal();
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isSavingGrade = false;
          const msg = err?.userMessage || err?.message || 'Could not update the grade.';
          this.notificationService.error('Update failed', msg);
        }
      });
  }

  showGradeRosterHelp(): void {
    this.notificationService.info(
      'Grade Roster',
      'Choose a term and class, then use View Grades to manage or encode grades. Credit requests can be submitted from the Credit Requests tab when enabled.'
    );
  }

  setGradingSubTab(tab: FacultyGradingSubTab): void {
    this.gradingSubTab = tab;
  }

  showFieldError(controlName: string): boolean {
    return shouldShowControlError(this.termForm.get(controlName), this.submitted);
  }

  fieldMessage(controlName: string): string {
    return controlFirstMessage(this.termForm.get(controlName), this.submitted);
  }

  onSaveSchemeAndBasis(): void {
    this.submitted = true;
    if (this.termForm.invalid || this.isSaving || this.isLoadingScheme || this.isLoadingTerms) {
      this.termForm.markAllAsTouched();
      return;
    }

    const raw = this.termForm.getRawValue();
    this.isSaving = true;
    this.facultyCenterService
      .saveGradingSchemeBasis({
        academicTermKey: raw.academicTerm,
        gradingSchemeCode: raw.gradingSchemeCode?.trim() ?? '',
        gradingSchemeDescription: raw.gradingSchemeDescription?.trim() ?? '',
        gradingBasisCode: raw.gradingBasisCode?.trim() ?? '',
        gradingBasisDescription: raw.gradingBasisDescription?.trim() ?? '',
        gradeScaleRows: this.gradeScaleRows.map(r => ({
          mark: r.mark,
          grade: r.grade
        }))
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.submitted = false;
          this.notificationService.success(
            'Saved',
            'Grading scheme, basis, and grade scale were saved successfully.'
          );
          const term = raw.academicTerm?.trim();
          if (term) {
            this.loadGradingSchemeForTerm(term);
          }
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isSaving = false;
          const msg =
            err?.userMessage ||
            err?.message ||
            'Could not save grading scheme and basis. Confirm the API endpoint is available.';
          this.notificationService.error('Save failed', msg);
        }
      });
  }
}
