import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Curricula } from '../../../core/models/curricula.model';
import { Course } from '../../../core/models/course.model';
import { Program } from '../../../core/models/program.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { NotificationService } from '../../../shared/services/notification.service';
import { CurriculumManagementService } from '../../Registrar/curriculum-management/curriculum-management.service';
import { CourseService } from '../../Registrar/curriculum-management/course.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { ListViewComponent } from '../../Registrar/curriculum-management/list-view/list-view.component';
import { CurriculumTableViewComponent } from '../../Registrar/curriculum-management/curriculum-table-view/curriculum-table-view.component';
import { CourseViewMode } from '../../Registrar/curriculum-management/enums/course-view-mode.enum';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { FeeTab } from '../../Registrar/curriculum-management/fees-and-charges/enums/fee-tab.enum';
import { TuitionFeesComponent } from '../../Registrar/curriculum-management/fees-and-charges/tuition-fees/tuition-fees.component';
import { OtherSchoolFeesComponent } from '../../Registrar/curriculum-management/fees-and-charges/other-school-fees/other-school-fees.component';
import { MiscellaneousFeesComponent } from '../../Registrar/curriculum-management/fees-and-charges/miscellaneous-fees/miscellaneous-fees.component';
import { DownpaymentsComponent } from '../../Registrar/curriculum-management/fees-and-charges/downpayment/downpayments.component';

type EvaluatorCurriculumTab = 'curricula' | 'courses' | 'fees';

@Component({
  selector: 'app-evaluator-curriculum-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ListViewComponent,
    CurriculumTableViewComponent,
    TuitionFeesComponent,
    OtherSchoolFeesComponent,
    MiscellaneousFeesComponent,
    DownpaymentsComponent
  ],
  templateUrl: './evaluator-curriculum-view.component.html',
  styleUrl: './evaluator-curriculum-view.component.scss'
})
export class EvaluatorCurriculumViewComponent implements OnInit, OnDestroy {
  private readonly curriculaService = inject(CurriculumManagementService);
  private readonly courseService = inject(CourseService);
  private readonly lookupService = inject(LookupService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'Curriculum View';
  readonly pageSubtitle = 'View curricula, courses, and fee structures (Read-only)';
  readonly CourseViewMode = CourseViewMode;
  readonly FeeTab = FeeTab;

  activeTab: EvaluatorCurriculumTab = 'curricula';
  activeFeeTab: FeeTab = FeeTab.TuitionFees;
  searchControl = new FormControl('', { nonNullable: true });

  curricula: Curricula[] = [];
  courses: Course[] = [];

  isLoading = false;
  pageIndex = 1;
  readonly pageSize = 50;
  totalRecords = 0;
  totalPages = 1;

  /** Courses tab — aligned with Registrar curriculum list + table view */
  viewMode: CourseViewMode = CourseViewMode.List;
  programs: Program[] = [];
  curriculaForTable: Curricula[] = [];
  selectedProgramFilter: number | null = null;
  selectedCurriculumFilter: string | null = null;
  selectedYearFilter = '';
  selectedSemesterFilter = '';
  selectedPrerequisiteFilter: string | null = null;
  courseSearchTerm = '';
  isLoadingCourses = false;
  isLoadingCurricula = false;
  courseListPageIndex = 1;
  readonly courseListPageSize = 10;
  courseListTotalRecords = 0;
  courseListTotalPages = 1;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab === 'courses' || this.activeTab === 'fees') {
          return;
        }
        this.pageIndex = 1;
        this.reload();
      });

    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(tab: EvaluatorCurriculumTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.pageIndex = 1;
    this.searchControl.setValue('', { emitEvent: false });

    if (tab === 'courses') {
      this.resetCourseFilters();
      this.loadPrograms();
      if (this.viewMode === CourseViewMode.Table && this.selectedProgramFilter) {
        this.loadCurriculumVersionsForDropdown();
      }
      this.loadCourses();
    } else if (tab === 'fees') {
      this.activeFeeTab = FeeTab.TuitionFees;
    } else {
      this.reload();
    }
  }

  onFeeTabChange(tab: FeeTab): void {
    this.activeFeeTab = tab;
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
      this.loadCourses();
    }
  }

  onListViewSearchTermChange(term: string): void {
    this.courseSearchTerm = term;
    this.courseListPageIndex = 1;
    this.loadCourses();
  }

  onListViewProgramFilterChange(value: number | string | null): void {
    const programId = this.normalizeProgramId(value);
    this.selectedProgramFilter = programId;
    this.selectedCurriculumFilter = null;
    if (this.viewMode === CourseViewMode.Table) {
      this.courses = [];
      if (programId) {
        this.loadCurriculumVersionsForDropdown();
      } else {
        this.curriculaForTable = [];
      }
    } else {
      this.courseListPageIndex = 1;
      this.loadCourses();
    }
  }

  onListViewPrerequisiteFilterChange(value: string | null): void {
    this.selectedPrerequisiteFilter = value;
    this.courseListPageIndex = 1;
    this.loadCourses();
  }

  onListViewYearFilterChange(value: string): void {
    this.selectedYearFilter = value;
    this.courseListPageIndex = 1;
    this.loadCourses();
  }

  onListViewSemesterFilterChange(value: string): void {
    this.selectedSemesterFilter = value;
    this.courseListPageIndex = 1;
    this.loadCourses();
  }

  onListViewPageChange(event: { page: number; reset: boolean }): void {
    if (event.reset) {
      this.courseListPageIndex = 1;
    } else {
      this.courseListPageIndex = event.page;
    }
    this.loadCourses();
  }

  onTableViewProgramFilterChange(value: number | string | null): void {
    const programId = this.normalizeProgramId(value);
    this.selectedProgramFilter = programId;
    this.selectedCurriculumFilter = null;
    if (programId) {
      this.loadCurriculumVersionsForDropdown();
    } else {
      this.curriculaForTable = [];
      this.courses = [];
    }
  }

  onTableViewCurriculumFilterChange(curriculumCode: string | null): void {
    this.selectedCurriculumFilter = curriculumCode;
    if (this.viewMode === CourseViewMode.Table) {
      if (this.selectedProgramFilter && curriculumCode) {
        this.loadCourses();
      } else {
        this.courses = [];
      }
    }
  }

  formatDate(value: string | null | undefined): string {
    return DateUtil.formatDate(value ?? undefined);
  }

  isActiveStatus(status: string | null | undefined): boolean {
    const s = (status ?? '').toString().trim().toLowerCase();
    return s === 'active' || s === '1';
  }

  statusLabel(status: string | null | undefined): string {
    const s = (status ?? '').toString().trim();
    if (!s) return '—';
    if (s === '1' || s.toLowerCase() === 'active') return 'Active';
    if (s === '0' || s.toLowerCase() === 'inactive') return 'Inactive';
    return s;
  }

  searchPlaceholder(): string {
    return 'Search curricula...';
  }

  prevPage(): void {
    if (this.pageIndex > 1) {
      this.pageIndex--;
      this.reload();
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages) {
      this.pageIndex++;
      this.reload();
    }
  }

  reload(): void {
    if (this.activeTab === 'courses' || this.activeTab === 'fees') {
      return;
    }

    const term = (this.searchControl.value ?? '').trim();
    this.isLoading = true;

    switch (this.activeTab) {
      case 'curricula':
        this.curriculaService
          .getCurricula({
            PageIndex: this.pageIndex,
            PageSize: this.pageSize,
            searchTerm: term,
            status: 'Active'
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: res => {
              const rows = res.data ?? [];
              this.curricula = rows;
              this.totalRecords = res.pagination?.total ?? rows.length;
              this.totalPages = res.pagination?.totalPages ?? 1;
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
              this.curricula = [];
              this.notificationService.error('Curriculum', 'Unable to load curricula.');
            }
          });
        break;
    }
  }

  private resetCourseFilters(): void {
    this.viewMode = CourseViewMode.List;
    this.courseSearchTerm = '';
    this.selectedProgramFilter = null;
    this.selectedCurriculumFilter = null;
    this.selectedYearFilter = '';
    this.selectedSemesterFilter = '';
    this.selectedPrerequisiteFilter = null;
    this.courseListPageIndex = 1;
    this.curriculaForTable = [];
    this.courses = [];
  }

  private loadPrograms(): void {
    this.lookupService
      .getProgramsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programs: Program[]) => {
          this.programs = programs;
        },
        error: () => {
          this.programs = [];
        }
      });
  }

  private loadCurriculumVersionsForDropdown(): void {
    if (!this.selectedProgramFilter) {
      this.curriculaForTable = [];
      this.isLoadingCurricula = false;
      return;
    }

    const selectedProgram = this.programs.find(p => p.programId === this.selectedProgramFilter);
    if (!selectedProgram?.programCode) {
      this.curriculaForTable = [];
      this.isLoadingCurricula = false;
      return;
    }

    this.isLoadingCurricula = true;
    this.lookupService
      .getCurriculumVersionsForDropdown(selectedProgram.programCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows: Curricula[]) => {
          this.curriculaForTable = rows || [];
          this.isLoadingCurricula = false;
        },
        error: () => {
          this.curriculaForTable = [];
          this.isLoadingCurricula = false;
          this.notificationService.error('Curriculum', 'Failed to load curriculum versions.');
        }
      });
  }

  private loadCourses(): void {
    this.isLoadingCourses = true;

    if (this.viewMode === CourseViewMode.Table) {
      if (!this.selectedProgramFilter || !this.selectedCurriculumFilter) {
        this.courses = [];
        this.courseListTotalRecords = 0;
        this.courseListTotalPages = 1;
        this.isLoadingCourses = false;
        return;
      }
    }

    const params = {
      PageIndex: this.courseListPageIndex,
      PageSize: this.courseListPageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.courseSearchTerm || '',
      programId: this.selectedProgramFilter || undefined,
      curriculumCode: this.selectedCurriculumFilter || undefined,
      yearLevel: this.selectedYearFilter || undefined,
      semester: this.selectedSemesterFilter || undefined
    };

    this.courseService
      .getCourses(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<Course>) => {
          let rows = response.data ?? [];
          if (this.selectedPrerequisiteFilter) {
            rows = rows.filter(c => c.prerequisites === this.selectedPrerequisiteFilter);
          }
          this.courses = rows;
          if (response.pagination) {
            this.courseListTotalRecords = response.pagination.total;
            this.courseListTotalPages = response.pagination.totalPages;
          } else {
            this.courseListTotalRecords = rows.length;
            this.courseListTotalPages = 1;
          }
          this.isLoadingCourses = false;
        },
        error: () => {
          this.isLoadingCourses = false;
          this.courses = [];
          this.courseListTotalRecords = 0;
          this.courseListTotalPages = 1;
          this.notificationService.error('Courses', 'Unable to load courses.');
        }
      });
  }

  private normalizeProgramId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '' || value === 'null') {
      return null;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return value;
  }
}
