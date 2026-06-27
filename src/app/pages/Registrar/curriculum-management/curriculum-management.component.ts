import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Curricula, CreateCurriculaRequest, UpdateCurriculaRequest } from '../../../core/models/curricula.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, takeUntil } from 'rxjs';
import {
  buildProgramCards,
  curriculaForProgram
} from '../../Evaluator/curriculum-view/evaluator-curriculum-view.utils';
import { mapCurriculaToRow } from '../../Evaluator/curriculum-view/evaluator-curriculum-view.mapper';
import type {
  EvaluatorCurriculumProgramCard,
  EvaluatorCurriculumRow
} from '../../Evaluator/curriculum-view/evaluator-curriculum-view.models';
import { CurriculaFormComponent } from './curricula-form/curricula-form.component';
import { CourseFormComponent } from './course-form/course-form.component';
import { ListViewComponent } from './list-view/list-view.component';
import { CurriculumTableViewComponent } from './curriculum-table-view/curriculum-table-view.component';
import { CurriculumManagementService } from './curriculum-management.service';
import { ProgramService } from '../../Admin/program-management/program.service';
import { TuitionFeesComponent } from './fees-and-charges/tuition-fees/tuition-fees.component';
import { OtherSchoolFeesComponent } from './fees-and-charges/other-school-fees/other-school-fees.component';
import { MiscellaneousFeesComponent } from './fees-and-charges/miscellaneous-fees/miscellaneous-fees.component';
import { DownpaymentsComponent } from './fees-and-charges/downpayment/downpayments.component';
import { PaymentSchemesComponent } from './fees-and-charges/payment-scheme/payment-schemes.component';
import { CourseBatchUploadModalComponent } from './course-batch-upload-modal.component';
import { CourseService } from './course.service';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../../../core/models/course.model';
import { Program } from '../../../core/models/program.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { CurriculumTab } from './enums/curriculum-tab.enum';
import { CourseViewMode } from './enums/course-view-mode.enum';
import { YearLevel } from './enums/year-level.enum';
import { Semester } from './enums/semester.enum';
import { CurriculumStatus } from './enums/curriculum-status.enum';
import { FeeTab } from './fees-and-charges/enums/fee-tab.enum';
import {
  ClassListPdfCoursePrefillItem,
  ClassListPdfCoursePrefillPayload
} from '../../../shared/models/class-list-pdf-course-prefill.model';
import { CLASS_LIST_PDF_COURSE_PREFILL_STORAGE_KEY } from '../../../shared/constants/class-list-pdf-prefill.constant';
import { resolveCurriculumCompletionYears } from '../../../shared/utils/curriculum-completion.util';

const BULK_LIST_PARAMS = {
  PageIndex: 1,
  PageSize: 500,
  SortDirection: SORT_DEFAULTS.DIRECTION,
  SortKey: ''
} as const;

@Component({
  selector: 'app-curriculum-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurriculaFormComponent, CourseFormComponent, ConfirmationModalComponent, ListViewComponent, CurriculumTableViewComponent, TuitionFeesComponent, OtherSchoolFeesComponent, MiscellaneousFeesComponent, DownpaymentsComponent, PaymentSchemesComponent, CourseBatchUploadModalComponent],
  templateUrl: './curriculum-management.component.html',
  styleUrls: [
    './curriculum-management.component.scss',
    '../../Evaluator/curriculum-view/evaluator-curriculum-view.component.scss',
    '../../Evaluator/curriculum-view/evaluator-curriculum-fees.scss'
  ]
})
export class CurriculumManagementComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly curriculaService = inject(CurriculumManagementService);
  private readonly courseService = inject(CourseService);
  private readonly programService = inject(ProgramService);
  private readonly lookupService = inject(LookupService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'Curriculum Management';
  pageSubtitle = 'Manage curricula, courses, and fee structures.';

  @ViewChild(CurriculaFormComponent) curriculaFormComponent!: CurriculaFormComponent;
  @ViewChild(CourseFormComponent) courseFormComponent!: CourseFormComponent;
  @ViewChild(ListViewComponent) listViewComponent!: ListViewComponent;

  activeTab: CurriculumTab = CurriculumTab.Curricula;
  activeFeeTab: FeeTab = FeeTab.TuitionFees;
  searchForm!: FormGroup;
  curricula: Curricula[] = [];
  courseFilterCurricula: Curricula[] = [];
  allCurriculaRaw: Curricula[] = [];
  allCurricula: EvaluatorCurriculumRow[] = [];
  curriculumProgramCards: EvaluatorCurriculumProgramCard[] = [];
  selectedCurriculumProgram: string | null = null;
  programCurriculumVersions: EvaluatorCurriculumRow[] = [];
  courses: Course[] = [];
  programs: Program[] = [];
  isLoading = false;
  isLoadingCourses = false;
  isLoadingCurricula = false;
  searchTerm = '';
  courseSearchTerm = '';
  showCurriculaForm = false;
  selectedCurricula: Curricula | null = null;
  showCourseForm = false;
  selectedCourse: Course | null = null;
  showCourseBatchUploadModal = false;
  tableViewReloadToken = 0;
  
  courseCreatePrefill: Partial<CreateCourseRequest> | null = null;
  showDeleteConfirmation = false;
  curriculaToDelete: Curricula | null = null;
  courseToDelete: Course | null = null;
  viewMode: CourseViewMode = CourseViewMode.List;
  selectedProgramFilter: number | null = null;
  selectedCurriculumFilter: string | null = null;
  selectedYearFilter: string = '';
  selectedSemesterFilter: string = '';
  
  CurriculumTab = CurriculumTab;
  CourseViewMode = CourseViewMode;
  YearLevel = YearLevel;
  Semester = Semester;
  CurriculumStatus = CurriculumStatus;
  FeeTab = FeeTab;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete Curriculum',
    message: 'Are you sure you want to delete this curriculum?\nThis action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  };

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.searchForm.get('search')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm || '';
      if (this.activeTab !== CurriculumTab.Curricula) {
        this.resetToFirstPage();
      }
    });

    if (this.activeTab === CurriculumTab.Curricula) {
      this.loadCurricula();
    } else if (this.activeTab === CurriculumTab.Courses) {
      this.loadPrograms();
    }

    this.processClassListPdfPrefillFromQuery();
  }

  loadPrograms(): void {
    this.programService
      .getPrograms({
        PageIndex: 1,
        PageSize: 500,
        SortDirection: SORT_DEFAULTS.DIRECTION,
        SortKey: '',
        searchTerm: ''
      })
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.programs = response?.success && response.data ? response.data : [];
      });
  }


  onProgramFilterChange(): void {
    console.log('onProgramFilterChange called, selectedProgramFilter:', this.selectedProgramFilter);
    this.selectedCurriculumFilter = null;
    this.loadCurriculumVersionsForDropdown();
    
    if (this.viewMode === CourseViewMode.Table) {
      this.courses = [];
    } else {
      this.resetToFirstPage();
      this.loadCourses();
    }
  }

  onCurriculumFilterChange(): void {
    if (this.viewMode === CourseViewMode.Table) {
      if (this.selectedProgramFilter && this.selectedCurriculumFilter) {
        this.loadCourses();
      } else {
        this.courses = [];
      }
    } else {
      this.resetToFirstPage();
      this.loadCourses();
    }
  }

  onYearFilterChange(): void {
    this.resetToFirstPage();
    this.loadCourses();
  }

  onSemesterFilterChange(): void {
    this.resetToFirstPage();
    this.loadCourses();
  }

  onListViewSearchTermChange(searchTerm: string): void {
    this.courseSearchTerm = searchTerm;
    this.resetToFirstPage();
    this.loadCourses();
  }

  onListViewProgramFilterChange(programId: number | string | null): void {
    this.selectedProgramFilter = this.normalizeProgramFilter(programId);
    this.onProgramFilterChange();
  }

  onListViewCurriculumFilterChange(curriculumCode: string | null): void {
    this.selectedCurriculumFilter = curriculumCode;
    this.onCurriculumFilterChange();
  }

  onListViewYearFilterChange(year: string): void {
    this.selectedYearFilter = year;
    this.onYearFilterChange();
  }

  onListViewSemesterFilterChange(semester: string): void {
    this.selectedSemesterFilter = semester;
    this.onSemesterFilterChange();
  }

  onListViewPageChange(event: { page: number; reset: boolean }): void {
    if (event.reset) {
      this.resetToFirstPage();
    } else {
      this.currentPage = event.page;
    }
    this.loadCourses();
  }

  onTableViewProgramFilterChange(programId: number | string | null): void {
    this.selectedProgramFilter = this.normalizeProgramFilter(programId);
    this.onProgramFilterChange();
  }

  onTableViewCurriculumFilterChange(curriculumCode: string | null): void {
    this.selectedCurriculumFilter = curriculumCode;
    this.onCurriculumFilterChange();
  }

  onViewModeChange(mode: CourseViewMode): void {
    this.viewMode = mode;
    
    if (mode === CourseViewMode.Table) {
      if (this.selectedProgramFilter) {
        this.loadCurriculumVersionsForDropdown();
      }
      if (this.selectedProgramFilter && this.selectedCurriculumFilter) {
        this.loadCourses();
      } else {
        this.courses = [];
      }
    } else {
      if (this.selectedProgramFilter) {
        this.loadCurriculumVersionsForDropdown();
      }
      this.loadCourses();
    }
  }

  private loadCurriculumVersionsForDropdown(): void {
    if (!this.selectedProgramFilter) {
      this.courseFilterCurricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    const programId = this.normalizeProgramFilter(this.selectedProgramFilter);
    if (!programId) {
      this.courseFilterCurricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    const selectedProgram = this.programs.find((p) => p.programId === programId);
    if (!selectedProgram?.programCode) {
      this.courseFilterCurricula = this.buildCourseFilterCurriculaFallback(programId);
      this.isLoadingCurricula = false;
      return;
    }

    this.isLoadingCurricula = true;

    this.lookupService
      .getCurriculaForDropdown(programId)
      .pipe(
        catchError((error) => {
          console.error('Error loading curriculum filter options:', error);
          return of([] as Curricula[]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((curricula) => {
        const mapped = (curricula ?? []).map((row) => ({
          ...row,
          programId: row.programId || programId,
          programCode: row.programCode || selectedProgram.programCode
        }));

        this.courseFilterCurricula =
          mapped.length > 0 ? mapped : this.buildCourseFilterCurriculaFallback(programId, selectedProgram.programCode);
        this.isLoadingCurricula = false;
      });
  }

  private normalizeProgramFilter(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '' || value === 'null') {
      return null;
    }
    const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private buildCourseFilterCurriculaFallback(programId: number, programCode?: string): Curricula[] {
    const code = programCode?.trim().toUpperCase();
    return this.allCurriculaRaw.filter((row) => {
      if (row.programId === programId) {
        return true;
      }
      if (code && row.programCode?.trim().toUpperCase() === code) {
        return true;
      }
      return false;
    });
  }

  private augmentCourseFilterCurriculaFromCourses(): void {
    const programId = this.normalizeProgramFilter(this.selectedProgramFilter);
    if (!programId) {
      return;
    }

    const program = this.programs.find((p) => p.programId === programId);
    const existing = new Set(this.courseFilterCurricula.map((row) => row.curriculumCode));
    const additions: Curricula[] = [];

    for (const course of this.courses) {
      const code = course.curriculumCode?.trim();
      if (!code || existing.has(code)) {
        continue;
      }
      if (program?.programCode && course.programCode && course.programCode !== program.programCode) {
        continue;
      }

      existing.add(code);
      additions.push({
        id: 0,
        curriculumCode: code,
        version: '',
        programId,
        programCode: course.programCode || program?.programCode || '',
        programTitle: program?.programTitle || '',
        syId: 0,
        syYear: '',
        effectiveDate: '',
        curriculumStatus: '',
        createdAt: null,
        updatedAt: null
      });
    }

    if (additions.length > 0) {
      this.courseFilterCurricula = [...this.courseFilterCurricula, ...additions];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  
  private processClassListPdfPrefillFromQuery(): void {
    if (this.route.snapshot.queryParamMap.get('fromClassListPdf') !== '1') {
      return;
    }
    const raw = sessionStorage.getItem(CLASS_LIST_PDF_COURSE_PREFILL_STORAGE_KEY);
    sessionStorage.removeItem(CLASS_LIST_PDF_COURSE_PREFILL_STORAGE_KEY);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { fromClassListPdf: null }, replaceUrl: true });
    if (!raw) {
      return;
    }
    let payload: ClassListPdfCoursePrefillPayload;
    try {
      payload = JSON.parse(raw) as ClassListPdfCoursePrefillPayload;
    } catch {
      return;
    }
    const first = payload.prefills?.[0];
    if (!first) {
      return;
    }
    if ((payload.prefills?.length ?? 0) > 1) {
      this.notificationService.warning(
        'Multiple courses from PDF',
        `${payload.prefills!.length} course codes need to be added. The form is prefilled for the first; add the others the same way.`
      );
    }
    this.activeTab = CurriculumTab.Courses;
    this.lookupService.getProgramsForDropdown().pipe(takeUntil(this.destroy$)).subscribe({
      next: programs => {
        this.programs = programs;
        const prog = programs.find(p => p.programCode?.toUpperCase() === first.programCode?.toUpperCase());
        if (!prog) {
          this.notificationService.warning(
            'Program not found',
            `No program "${first.programCode}" matches the PDF. Select program and curriculum, then finish the course.`
          );
        }
        this.selectedCourse = null;
        this.courseCreatePrefill = this.buildCreatePrefillFromClassListItem(first, prog?.programId ?? null);
        this.showCourseForm = true;
        this.loadCourses();
      }
    });
  }

  private buildCreatePrefillFromClassListItem(
    item: ClassListPdfCoursePrefillItem,
    programId: number | null
  ): Partial<CreateCourseRequest> {
    return {
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      courseTotalUnits: item.courseTotalUnits,
      programId: programId && programId > 0 ? programId : undefined,
      courseYearLevel: this.mapPdfYearLevelRawToYearLevel(item.yearLevelRaw),
      courseSemester: this.mapPdfAcademicTermToSemester(item.academicTerm),
      courseComponent: 'Lecture',
      description: ''
    };
  }

  
  private mapPdfYearLevelRawToYearLevel(raw: string): YearLevel {
    const m = /^(\d)/.exec(raw?.trim() ?? '');
    const n = m ? parseInt(m[1], 10) : 1;
    const clamped = Math.min(5, Math.max(1, n));
    const levels = [YearLevel.Year1, YearLevel.Year2, YearLevel.Year3, YearLevel.Year4, YearLevel.Year5];
    return levels[clamped - 1];
  }

  private mapPdfAcademicTermToSemester(term: string): Semester {
    const t = term.toLowerCase();
    if (/\b2\s*nd\b|\bsecond\b/i.test(t)) {
      return Semester.Second;
    }
    if (/\bsummer\b/i.test(t)) {
      return Semester.Summer;
    }
    return Semester.First;
  }

  onTabChange(tab: CurriculumTab): void {
    this.activeTab = tab;
    if (tab === CurriculumTab.Curricula) {
      this.loadCurricula();
    } else {
      this.selectedCurriculumProgram = null;
      this.programCurriculumVersions = [];
    }
    if (tab === CurriculumTab.Courses) {
      this.loadPrograms();
      if (this.allCurriculaRaw.length === 0) {
        this.loadCurricula();
      }
      if (this.selectedProgramFilter) {
        this.loadCurriculumVersionsForDropdown();
      }
      this.loadCourses();
    }
  }

  onFeeTabChange(tab: FeeTab): void {
    this.activeFeeTab = tab;
  }

  loadCurricula(): void {
    this.isLoading = true;
    this.curriculaService
      .getCurricula({ ...BULK_LIST_PARAMS, searchTerm: '' })
      .pipe(
        catchError((error) => {
          console.error('Error loading curricula:', error);
          this.notificationService.error(
            'Loading Failed',
            error.userMessage || error.message || 'Failed to load curricula.'
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response: PaginatedResponse<Curricula> | null) => {
        const raw = response?.success && response.data ? response.data : [];
        this.allCurriculaRaw = raw;
        this.curricula = raw;
        const rows = raw.map(mapCurriculaToRow);
        this.allCurricula = rows;
        this.curriculumProgramCards = buildProgramCards(raw);
        if (this.selectedCurriculumProgram) {
          this.programCurriculumVersions = curriculaForProgram(rows, this.selectedCurriculumProgram);
        }
        if (this.selectedProgramFilter) {
          this.loadCurriculumVersionsForDropdown();
        }
        this.isLoading = false;
      });
  }

  openProgramCurricula(programCode: string): void {
    this.selectedCurriculumProgram = programCode;
    this.programCurriculumVersions = curriculaForProgram(this.allCurricula, programCode);
  }

  backToProgramCards(): void {
    this.selectedCurriculumProgram = null;
    this.programCurriculumVersions = [];
  }

  get filteredProgramCards(): EvaluatorCurriculumProgramCard[] {
    const q = (this.searchTerm ?? '').trim().toLowerCase();
    if (!q) {
      return [...this.curriculumProgramCards];
    }
    return this.curriculumProgramCards.filter((card) => {
      if (card.programCode.toLowerCase().includes(q)) {
        return true;
      }
      return curriculaForProgram(this.allCurricula, card.programCode).some(
        (row) =>
          row.curriculumId.toLowerCase().includes(q) ||
          row.version.toLowerCase().includes(q) ||
          row.schoolYear.toLowerCase().includes(q)
      );
    });
  }

  get filteredCurriculaVersions(): EvaluatorCurriculumRow[] {
    const q = (this.searchTerm ?? '').trim().toLowerCase();
    if (!q) {
      return this.programCurriculumVersions;
    }
    return this.programCurriculumVersions.filter(
      (row) =>
        row.curriculumId.toLowerCase().includes(q) ||
        row.version.toLowerCase().includes(q) ||
        row.program.toLowerCase().includes(q) ||
        row.schoolYear.toLowerCase().includes(q) ||
        row.effectiveDate.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
    );
  }

  get selectedProgramVersionCount(): number {
    return this.programCurriculumVersions.length;
  }

  get selectedProgramActiveCount(): number {
    return this.programCurriculumVersions.filter((row) => row.status === 'active').length;
  }

  programVersionCountLabel(count: number): string {
    return `${count} version${count === 1 ? '' : 's'}`;
  }

  programActiveCountLabel(count: number): string {
    return `${count} active`;
  }

  isActiveCurriculumRow(row: EvaluatorCurriculumRow): boolean {
    return row.status === 'active';
  }

  curriculumRowStatusLabel(row: EvaluatorCurriculumRow): string {
    return row.status === 'active' ? CurriculumStatus.Active : CurriculumStatus.Inactive;
  }

  private findCurriculaByRow(row: EvaluatorCurriculumRow): Curricula | undefined {
    return this.allCurriculaRaw.find((item) => String(item.id) === row.id);
  }

  onEditCurriculaFromRow(row: EvaluatorCurriculumRow): void {
    const curricula = this.findCurriculaByRow(row);
    if (curricula) {
      this.onEditCurricula(curricula);
    }
  }

  onDeleteCurriculaFromRow(row: EvaluatorCurriculumRow): void {
    const curricula = this.findCurriculaByRow(row);
    if (curricula) {
      this.onDeleteCurricula(curricula);
    }
  }

  getStatusText(curricula: Curricula): string {
    return curricula.curriculumStatus === CurriculumStatus.Active ? CurriculumStatus.Active : CurriculumStatus.Inactive;
  }

  getStatusBadgeClass = BadgeUtil.getStatusBadgeClass;

  onAddCurricula(): void {
    this.selectedCurricula = null;
    this.showCurriculaForm = true;
  }

  onEditCurricula(curricula: Curricula): void {
    this.selectedCurricula = curricula;
    this.showCurriculaForm = true;
  }

  onDeleteCurricula(curricula: Curricula): void {
    this.curriculaToDelete = curricula;
    this.deleteConfirmationConfig = {
      title: 'Delete Curriculum',
      message: `Are you sure you want to delete the curriculum "${curricula.curriculumCode}"?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }


  onCloseCurriculaForm(): void {
    this.showCurriculaForm = false;
    this.selectedCurricula = null;
  }

  onSaveCurricula(curriculaData: CreateCurriculaRequest | UpdateCurriculaRequest): void {
    if (this.curriculaFormComponent) {
      this.curriculaFormComponent.setSubmitting(true);
    }

    if (this.selectedCurricula) {
      const updateData: UpdateCurriculaRequest = {
        ...curriculaData as UpdateCurriculaRequest,
        id: this.selectedCurricula.id
      };
      this.curriculaService.updateCurricula(this.selectedCurricula.id.toString(), updateData).subscribe({
        next: () => {
          if (this.curriculaFormComponent) {
            this.curriculaFormComponent.setSubmitting(false);
          }
          const curriculumCode = this.selectedCurricula?.curriculumCode || `${curriculaData.programCode}-${curriculaData.version}`;
          this.notificationService.success(
            'Curriculum Updated',
            `Curriculum "${curriculumCode}" has been successfully updated.`
          );
          this.onCloseCurriculaForm();
          this.loadCurricula();
        },
        error: (error) => {
          if (this.curriculaFormComponent) {
            this.curriculaFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to update curriculum. Please try again.';
            this.curriculaFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
          console.error('Error updating curriculum:', error);
        }
      });
    } else {
      this.curriculaService.createCurricula(curriculaData as CreateCurriculaRequest).subscribe({
        next: () => {
          if (this.curriculaFormComponent) {
            this.curriculaFormComponent.setSubmitting(false);
          }
          const curriculumCode = `${curriculaData.programCode}-${curriculaData.version}`;
          this.notificationService.success(
            'Curriculum Created',
            `Curriculum "${curriculumCode}" has been successfully created.`
          );
          this.onCloseCurriculaForm();
          this.loadCurricula();
        },
        error: (error) => {
          if (this.curriculaFormComponent) {
            this.curriculaFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to create curriculum. Please try again.';
            this.curriculaFormComponent.setError(errorMsg);
            this.notificationService.error('Create Failed', errorMsg);
          }
          console.error('Error creating curriculum:', error);
        }
      });
    }
  }

  formatDate = DateUtil.formatDate;

  loadCourses(): void {
    this.isLoadingCourses = true;
    const programId = this.normalizeProgramFilter(this.selectedProgramFilter);
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.courseSearchTerm || '',
      programId: programId || undefined,
      curriculumCode: this.selectedCurriculumFilter || undefined,
      yearLevel: this.selectedYearFilter || undefined,
      semester: this.selectedSemesterFilter || undefined
    };

    this.courseService.getCourses(params).subscribe({
      next: (response: PaginatedResponse<Course>) => {
        if (response.success && response.data) {
          this.courses = response.data;
          this.augmentCourseFilterCurriculaFromCourses();
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        } else {
          this.courses = [];
          this.resetPagination();
        }
        this.isLoadingCourses = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoadingCourses = false;
        this.courses = [];
        this.resetPagination();
        this.notificationService.error('Loading Failed', error.userMessage || error.message || 'Failed to load courses.');
      }
    });
  }

  onAddCourse(): void {
    this.selectedCourse = null;
    this.courseCreatePrefill = null;
    this.showCourseForm = true;
  }

  onBatchUploadCourses(): void {
    if (this.programs.length === 0) {
      this.loadPrograms();
    }
    this.showCourseBatchUploadModal = true;
  }

  onCloseCourseBatchUploadModal(): void {
    this.showCourseBatchUploadModal = false;
  }

  onCourseBatchImported(count: number): void {
    this.showCourseBatchUploadModal = false;
    this.tableViewReloadToken++;
    this.loadCourses();
    this.notificationService.success(
      'Courses imported',
      `${count} course${count === 1 ? '' : 's'} were added to the curriculum.`
    );
  }

  onEditCourse(course: Course): void {
    this.selectedCourse = course;
    this.courseCreatePrefill = null;
    this.showCourseForm = true;
  }

  onDeleteCourse(course: Course): void {
    this.courseToDelete = course;
    this.deleteConfirmationConfig = {
      title: 'Delete Course',
      message: `Are you sure you want to delete the course "${course.courseCode}"?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onCloseCourseForm(): void {
    this.showCourseForm = false;
    this.selectedCourse = null;
    this.courseCreatePrefill = null;
  }

  onSaveCourse(courseData: CreateCourseRequest | UpdateCourseRequest): void {
    if (this.courseFormComponent) {
      this.courseFormComponent.setSubmitting(true);
    }

    if (this.selectedCourse) {
      const updateData: UpdateCourseRequest = {
        ...courseData as UpdateCourseRequest
      };
      this.courseService.updateCourse(this.selectedCourse.courseCode, updateData).subscribe({
        next: () => {
          if (this.courseFormComponent) {
            this.courseFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'Course Updated',
            `Course "${courseData.courseCode}" has been successfully updated.`
          );
          this.onCloseCourseForm();
          this.loadCourses();
        },
        error: (error) => {
          if (this.courseFormComponent) {
            this.courseFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to update course. Please try again.';
            this.courseFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
          console.error('Error updating course:', error);
        }
      });
    } else {
      this.courseService.createCourse(courseData as CreateCourseRequest).subscribe({
        next: () => {
          if (this.courseFormComponent) {
            this.courseFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'Course Created',
            `Course "${courseData.courseCode}" has been successfully created.`
          );
          this.onCloseCourseForm();
          this.loadCourses();
        },
        error: (error) => {
          if (this.courseFormComponent) {
            this.courseFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to create course. Please try again.';
            this.courseFormComponent.setError(errorMsg);
            this.notificationService.error('Create Failed', errorMsg);
          }
          console.error('Error creating course:', error);
        }
      });
    }
  }

  onConfirmDelete(): void {
    if (this.courseToDelete) {
      const course = this.courseToDelete;
      this.courseService.deleteCourse(course.courseCode).subscribe({
        next: () => {
          this.notificationService.success(
            'Course Deleted',
            `Course "${course.courseCode}" has been successfully deleted.`
          );
          this.showDeleteConfirmation = false;
          this.courseToDelete = null;
          this.loadCourses();
        },
        error: (error) => {
          console.error('Error deleting course:', error);
          this.notificationService.error('Delete Failed', error.userMessage || error.message || 'Failed to delete course. Please try again.');
          this.showDeleteConfirmation = false;
          this.courseToDelete = null;
        }
      });
    } else if (this.curriculaToDelete) {
      const curricula = this.curriculaToDelete;
      this.curriculaService.deleteCurricula(curricula.id.toString()).subscribe({
        next: () => {
          this.notificationService.success(
            'Curriculum Deleted',
            `Curriculum "${curricula.curriculumCode}" has been successfully deleted.`
          );
          this.showDeleteConfirmation = false;
          this.curriculaToDelete = null;
          this.loadCurricula();
        },
        error: (error) => {
          console.error('Error deleting curriculum:', error);
          this.notificationService.error('Delete Failed', error.userMessage || error.message || 'Failed to delete curriculum. Please try again.');
          this.showDeleteConfirmation = false;
          this.curriculaToDelete = null;
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.curriculaToDelete = null;
    this.courseToDelete = null;
  }

  protected loadData(): void {
    if (this.activeTab === CurriculumTab.Curricula) {
      this.loadCurricula();
    } else if (this.activeTab === CurriculumTab.Courses) {
      this.loadCourses();
    }
  }

  getSelectedProgram(): Program | null {
    if (!this.selectedProgramFilter) return null;
    return this.programs.find(p => p.programId === this.selectedProgramFilter) || null;
  }

  getSelectedCurriculum(): Curricula | null {
    if (!this.selectedCurriculumFilter) return null;
    return (
      this.courseFilterCurricula.find((c) => c.curriculumCode === this.selectedCurriculumFilter) ??
      this.allCurriculaRaw.find((c) => c.curriculumCode === this.selectedCurriculumFilter) ??
      null
    );
  }

  getCoursesByYearAndSemester(): { [year: string]: { [semester: string]: Course[] } } {
    const grouped: { [year: string]: { [semester: string]: Course[] } } = {};
    
    this.courses.forEach(course => {
      const year = course.courseYearLevel;
      const semester = course.courseSemester;
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][semester]) {
        grouped[year][semester] = [];
      }
      grouped[year][semester].push(course);
    });
    
    return grouped;
  }

  getYearDisplayName(year: string): string {
    const yearMap: { [key: string]: string } = {
      'Year 1': 'FIRST YEAR',
      'Year 2': 'SECOND YEAR',
      'Year 3': 'THIRD YEAR',
      'Year 4': 'FOURTH YEAR',
      'Year 5': 'FIFTH YEAR'
    };
    return yearMap[year] || year.toUpperCase();
  }

  getSemesterDisplayName(semester: string): string {
    if (semester === '1st Semester') return '1st Semester';
    if (semester === '2nd Semester') return '2nd Semester';
    if (semester === 'Summer') return 'Summer';
    return semester;
  }

  getTotalUnitsForSemester(courses: Course[]): number {
    return courses.reduce((total, course) => total + (course.courseTotalUnits || 0), 0);
  }

  getTotalCourses(): number {
    return this.courses.length;
  }

  getTotalUnits(): number {
    return this.courses.reduce((total, course) => total + (course.courseTotalUnits || 0), 0);
  }

  getYearsToComplete(): number {
    const program = this.getSelectedProgram();
    return resolveCurriculumCompletionYears({
      programCompletionYears: program?.programCompletionYears,
      courses: this.courses
    });
  }

  getSortedYears(): string[] {
    const yearOrder = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const grouped = this.getCoursesByYearAndSemester();
    return yearOrder.filter(year => grouped[year]);
  }

  getSortedSemesters(): string[] {
    return ['1st Semester', '2nd Semester', 'Summer'];
  }
}

