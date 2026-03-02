import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Curricula, CreateCurriculaRequest, UpdateCurriculaRequest } from '../../../core/models/curricula.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { CurriculaFormComponent } from './curricula-form/curricula-form.component';
import { CourseFormComponent } from './course-form/course-form.component';
import { ListViewComponent } from './list-view/list-view.component';
import { CurriculumTableViewComponent } from './curriculum-table-view/curriculum-table-view.component';
import { CurriculumManagementService } from './curriculum-management.service';
import { TuitionFeesComponent } from './fees-and-charges/tuition-fees/tuition-fees.component';
import { OtherSchoolFeesComponent } from './fees-and-charges/other-school-fees/other-school-fees.component';
import { MiscellaneousFeesComponent } from './fees-and-charges/miscellaneous-fees/miscellaneous-fees.component';
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

@Component({
  selector: 'app-curriculum-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurriculaFormComponent, CourseFormComponent, ConfirmationModalComponent, ListViewComponent, CurriculumTableViewComponent, TuitionFeesComponent, OtherSchoolFeesComponent, MiscellaneousFeesComponent],
  templateUrl: './curriculum-management.component.html',
  styleUrl: './curriculum-management.component.scss'
})
export class CurriculumManagementComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly curriculaService = inject(CurriculumManagementService);
  private readonly courseService = inject(CourseService);
  private readonly lookupService = inject(LookupService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
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
  showDeleteConfirmation = false;
  curriculaToDelete: Curricula | null = null;
  courseToDelete: Course | null = null;
  viewMode: CourseViewMode = CourseViewMode.List;
  selectedProgramFilter: number | null = null;
  selectedCurriculumFilter: string | null = null;
  selectedYearFilter: string = '';
  selectedSemesterFilter: string = '';
  selectedPrerequisiteFilter: string | null = null;
  
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
      this.resetToFirstPage();
      if (this.activeTab === CurriculumTab.Curricula) {
        this.loadCurricula();
      }
    });

    if (this.activeTab === CurriculumTab.Curricula) {
      this.loadCurricula();
    } else if (this.activeTab === CurriculumTab.Courses) {
      this.loadPrograms();
    }
  }

  loadPrograms(): void {
    this.lookupService.getProgramsForDropdown().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (programs: Program[]) => {
        this.programs = programs;
      },
      error: () => {
      }
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

  onPrerequisiteFilterChange(): void {
    this.resetToFirstPage();
    this.loadCourses();
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

  onListViewProgramFilterChange(programId: number | null): void {
    this.selectedProgramFilter = programId;
    this.onProgramFilterChange();
  }

  onListViewPrerequisiteFilterChange(prerequisite: string | null): void {
    this.selectedPrerequisiteFilter = prerequisite;
    this.onPrerequisiteFilterChange();
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

  onTableViewProgramFilterChange(programId: number | null): void {
    console.log('Parent - Table view program filter changed:', programId);
    this.selectedProgramFilter = programId;
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
      this.loadCourses();
    }
  }

  private loadCurriculumVersionsForDropdown(): void {
    console.log('loadCurriculumVersionsForDropdown called, selectedProgramFilter:', this.selectedProgramFilter);
    
    if (!this.selectedProgramFilter) {
      console.log('No program selected, clearing curricula');
      this.curricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    if (this.programs.length === 0) {
      console.log('Programs not loaded, loading programs first...');
      this.lookupService.getProgramsForDropdown().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (programs: Program[]) => {
          console.log('Programs loaded, now loading curriculum versions');
          this.programs = programs;
          this.loadCurriculumVersionsWithProgramCode();
        },
        error: (error) => {
          console.error('Error loading programs:', error);
          this.curricula = [];
          this.isLoadingCurricula = false;
        }
      });
    } else {
      console.log('Programs already loaded, loading curriculum versions directly');
      this.loadCurriculumVersionsWithProgramCode();
    }
  }

  private loadCurriculumVersionsWithProgramCode(): void {
    if (!this.selectedProgramFilter) {
      this.curricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    const selectedProgram = this.programs.find(p => p.programId === this.selectedProgramFilter);
    if (!selectedProgram?.programCode) {
      console.warn('Program not found or missing programCode:', this.selectedProgramFilter);
      this.curricula = [];
      this.isLoadingCurricula = false;
      return;
    }

    this.isLoadingCurricula = true;
    console.log(`Loading curriculum versions for program: ${selectedProgram.programCode}`);
    console.log(`API Endpoint: /Lookup/curriculum-versions?programCode=${selectedProgram.programCode}`);
    
    this.lookupService.getCurriculumVersionsForDropdown(selectedProgram.programCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (curricula: Curricula[]) => {
        console.log(`Loaded ${curricula.length} curriculum versions for program ${selectedProgram.programCode}`);
        this.curricula = curricula || [];
        this.isLoadingCurricula = false;
      },
      error: (error) => {
        console.error('Error loading curriculum versions:', error);
        this.curricula = [];
        this.isLoadingCurricula = false;
        this.notificationService.error('Error', 'Failed to load curriculum versions. Please try again.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(tab: CurriculumTab): void {
    this.activeTab = tab;
    if (tab === CurriculumTab.Curricula) {
      this.loadCurricula();
    } else if (tab === CurriculumTab.Courses) {
      this.loadPrograms();
      if (this.viewMode === CourseViewMode.Table && this.selectedProgramFilter) {
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
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.curriculaService.getCurricula(params).subscribe({
      next: (response: PaginatedResponse<Curricula>) => {
        if (response.success && response.data) {
          this.curricula = response.data;
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        } else {
          this.curricula = [];
          this.resetPagination();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading curricula:', error);
        this.isLoading = false;
        this.curricula = [];
        this.resetPagination();
        this.notificationService.error('Loading Failed', error.userMessage || error.message || 'Failed to load curricula.');
      }
    });
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
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.courseSearchTerm || '',
      programId: this.selectedProgramFilter || undefined,
      curriculumCode: this.selectedCurriculumFilter || undefined,
      yearLevel: this.selectedYearFilter || undefined,
      semester: this.selectedSemesterFilter || undefined
    };

    this.courseService.getCourses(params).subscribe({
      next: (response: PaginatedResponse<Course>) => {
        if (response.success && response.data) {
          let filteredCourses = response.data;
          
          if (this.selectedPrerequisiteFilter) {
            filteredCourses = filteredCourses.filter(course => 
              course.prerequisites === this.selectedPrerequisiteFilter
            );
          }
          
          this.courses = filteredCourses;
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
    this.showCourseForm = true;
  }

  onEditCourse(course: Course): void {
    this.selectedCourse = course;
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
    return this.curricula.find(c => c.curriculumCode === this.selectedCurriculumFilter) || null;
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
    return program?.programCompletionYears || 0;
  }

  getSortedYears(): string[] {
    const yearOrder = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const grouped = this.getCoursesByYearAndSemester();
    return yearOrder.filter(year => grouped[year]);
  }

  getSortedSemesters(): string[] {
    return ['1st Semester', '2nd Semester', 'Summer'];
  }

  getUniquePrerequisites(): string[] {
    const prerequisitesSet = new Set<string>();
    this.courses.forEach(course => {
      if (course.prerequisites && course.prerequisites.trim() !== '' && course.prerequisites !== 'None') {
        prerequisitesSet.add(course.prerequisites);
      }
    });
    return Array.from(prerequisitesSet).sort();
  }
}

