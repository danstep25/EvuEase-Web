import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DateUtil } from '../../../shared/utils/date.util';
import { Program } from '../../../core/models/program.model';
import { Curricula } from '../../../core/models/curricula.model';
import { Course } from '../../../core/models/course.model';
import { CurriculumManagementService } from '../../Registrar/curriculum-management/curriculum-management.service';
import { CourseService } from '../../Registrar/curriculum-management/course.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { ProgramService } from '../../Admin/program-management/program.service';
import { TuitionFeesService } from '../../Registrar/curriculum-management/fees-and-charges/tuition-fees/tuition-fees.service';
import { OtherSchoolFeesService } from '../../Registrar/curriculum-management/fees-and-charges/other-school-fees/other-school-fees.service';
import { MiscellaneousFeesService } from '../../Registrar/curriculum-management/fees-and-charges/miscellaneous-fees/miscellaneous-fees.service';
import {
  CreateDownpaymentRequest,
  Downpayment,
  UpdateDownpaymentRequest
} from '../../../core/models/downpayment.model';
import { DownpaymentService } from '../../Registrar/curriculum-management/fees-and-charges/downpayment/downpayment.service';
import { DownpaymentFormComponent } from '../../Registrar/curriculum-management/fees-and-charges/downpayment/downpayment-form/downpayment-form.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { DEFAULT_PAGINATION } from '../../../shared/constants/pagination.constant';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { resolveCurriculumCompletionYears } from '../../../shared/utils/curriculum-completion.util';
import { CurriculumStatus } from '../../Registrar/curriculum-management/enums/curriculum-status.enum';
import { UpdateCurriculaRequest } from '../../../core/models/curricula.model';
import { EvaluatorDownpaymentViewComponent } from './evaluator-downpayment-view/evaluator-downpayment-view.component';
import { EvaluatorMiscellaneousFeeAddComponent } from './evaluator-miscellaneous-fee-add/evaluator-miscellaneous-fee-add.component';
import { EvaluatorMiscellaneousFeeDeleteComponent } from './evaluator-miscellaneous-fee-delete/evaluator-miscellaneous-fee-delete.component';
import { EvaluatorMiscellaneousFeeEditComponent } from './evaluator-miscellaneous-fee-edit/evaluator-miscellaneous-fee-edit.component';
import { EvaluatorOtherSchoolFeeAddComponent } from './evaluator-other-school-fee-add/evaluator-other-school-fee-add.component';
import { EvaluatorOtherSchoolFeeDeleteComponent } from './evaluator-other-school-fee-delete/evaluator-other-school-fee-delete.component';
import { EvaluatorOtherSchoolFeeEditComponent } from './evaluator-other-school-fee-edit/evaluator-other-school-fee-edit.component';
import { EvaluatorTuitionFeeAddComponent } from './evaluator-tuition-fee-add/evaluator-tuition-fee-add.component';
import { EvaluatorTuitionFeeEditComponent } from './evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component';
import { EvaluatorTuitionFeeDeleteComponent } from './evaluator-tuition-fee-delete/evaluator-tuition-fee-delete.component';
import {
  EVALUATOR_TABLE_VIEW_YEAR_ORDER,
  buildProgramCards,
  buildCourseProgramCards,
  curriculaForProgram,
  formatTableViewCurriculumDropdownLabel,
  formatTableViewCurriculumVersionDisplay,
  getEvaluatorTableViewYearHeading,
  groupEvaluatorCoursesByYearSemester
} from './evaluator-curriculum-view.utils';
import {
  mapCourseToEvaluatorRow,
  mapCurriculaToRow,
  mapCurriculaToTableViewOption,
  mapDownpaymentRow,
  mapMiscellaneousFeeRow,
  mapOtherSchoolFeeRow,
  mapProgramTableMeta,
  mapTuitionFeeRow
} from './evaluator-curriculum-view.mapper';
import type {
  EvaluatorCourseDetailRow,
  EvaluatorCourseFilterOption,
  EvaluatorCourseProgramCard,
  EvaluatorCourseSemesterLabel,
  EvaluatorCurriculumProgramCard,
  EvaluatorCurriculumRow,
  EvaluatorDownpaymentRow,
  EvaluatorFeeSubTab,
  EvaluatorMiscellaneousFeeRow,
  EvaluatorOtherSchoolFeeRow,
  EvaluatorProgramTableMeta,
  EvaluatorTableViewCurriculumOption,
  EvaluatorTuitionFeeRow
} from './evaluator-curriculum-view.models';

type EvaluatorCurriculumTab = 'curricula' | 'courses' | 'fees';
type EvaluatorCourseViewMode = 'list' | 'table';

const BULK_LIST_PARAMS = {
  PageIndex: 1,
  PageSize: 500,
  SortDirection: SORT_DEFAULTS.DIRECTION,
  SortKey: ''
} as const;

@Component({
  selector: 'app-evaluator-curriculum-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EvaluatorMiscellaneousFeeAddComponent,
    EvaluatorMiscellaneousFeeDeleteComponent,
    EvaluatorMiscellaneousFeeEditComponent,
    EvaluatorOtherSchoolFeeAddComponent,
    EvaluatorOtherSchoolFeeDeleteComponent,
    EvaluatorOtherSchoolFeeEditComponent,
    EvaluatorTuitionFeeAddComponent,
    EvaluatorTuitionFeeEditComponent,
    EvaluatorTuitionFeeDeleteComponent,
    EvaluatorDownpaymentViewComponent,
    DownpaymentFormComponent
  ],
  templateUrl: './evaluator-curriculum-view.component.html',
  styleUrls: [
    './evaluator-curriculum-view.component.scss',
    './evaluator-curriculum-matrix.scss',
    './evaluator-curriculum-fees.scss'
  ]
})
export class EvaluatorCurriculumViewComponent implements OnInit, OnDestroy {
  private readonly curriculaService = inject(CurriculumManagementService);
  private readonly courseService = inject(CourseService);
  private readonly lookupService = inject(LookupService);
  private readonly programService = inject(ProgramService);
  private readonly tuitionFeesService = inject(TuitionFeesService);
  private readonly otherSchoolFeesService = inject(OtherSchoolFeesService);
  private readonly miscellaneousFeesService = inject(MiscellaneousFeesService);
  private readonly downpaymentService = inject(DownpaymentService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'Curriculum View';
  readonly pageSubtitle = 'View curricula, courses, and fee structures (Read-only)';

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly tuitionFeeSearchControl = new FormControl('', { nonNullable: true });
  readonly schoolFeeSearchControl = new FormControl('', { nonNullable: true });
  readonly miscellaneousFeeSearchControl = new FormControl('', { nonNullable: true });
  readonly downpaymentSearchControl = new FormControl('', { nonNullable: true });
  readonly courseSearchControl = new FormControl('', { nonNullable: true });
  readonly courseFilterProgram = new FormControl('', { nonNullable: true });
  readonly courseFilterCurriculum = new FormControl('', { nonNullable: true });
  readonly courseFilterYear = new FormControl('', { nonNullable: true });
  readonly courseFilterSemester = new FormControl('', { nonNullable: true });
  readonly tableViewProgram = new FormControl('', { nonNullable: true });
  readonly tableViewCurriculum = new FormControl('', { nonNullable: true });

  readonly tableViewSemesters: EvaluatorCourseSemesterLabel[] = ['1st Semester', '2nd Semester'];

  readonly yearFilterOptions: EvaluatorCourseFilterOption[] = [
    { value: '', label: 'All Years' },
    { value: 'Year 1', label: 'Year 1' },
    { value: 'Year 2', label: 'Year 2' },
    { value: 'Year 3', label: 'Year 3' },
    { value: 'Year 4', label: 'Year 4' }
  ];

  readonly semesterFilterOptions: EvaluatorCourseFilterOption[] = [
    { value: '', label: 'All Semesters' },
    { value: '1st', label: '1st Semester' },
    { value: '2nd', label: '2nd Semester' }
  ];

  allCurricula: EvaluatorCurriculumRow[] = [];
  private allCurriculaRaw: Curricula[] = [];
  curriculumProgramCards: EvaluatorCurriculumProgramCard[] = [];
  courseProgramCards: EvaluatorCourseProgramCard[] = [];
  private coursesForCardCounts: Course[] = [];
  programs: Program[] = [];
  programTableMeta: Record<string, EvaluatorProgramTableMeta> = {};
  programFilterOptions: EvaluatorCourseFilterOption[] = [{ value: '', label: 'All Programs' }];
  tableViewProgramSelectOptions: { value: string; label: string }[] = [];
  tableViewCurriculumOptionsList: EvaluatorTableViewCurriculumOption[] = [];

  selectedCurriculumProgram: string | null = null;
  selectedCourseProgram: string | null = null;
  programCurriculumVersions: EvaluatorCurriculumRow[] = [];

  allTuitionFees: EvaluatorTuitionFeeRow[] = [];
  allOtherSchoolFees: EvaluatorOtherSchoolFeeRow[] = [];
  allMiscellaneousFees: EvaluatorMiscellaneousFeeRow[] = [];
  allDownpayments: EvaluatorDownpaymentRow[] = [];
  allCourses: EvaluatorCourseDetailRow[] = [];
  tableViewCourses: EvaluatorCourseDetailRow[] = [];
  courseFilterCurricula: Curricula[] = [];

  courseListCurrentPage = DEFAULT_PAGINATION.pageIndex;
  courseListPageSize = DEFAULT_PAGINATION.pageSize;
  courseListTotalRecords = 0;
  courseListTotalPages = 0;

  isLoadingCurricula = false;
  isLoadingCourseProgramCards = false;
  isLoadingCourseFilterCurricula = false;
  isLoadingCourses = false;
  isLoadingTableViewCourses = false;
  isLoadingFees = false;

  activeTab: EvaluatorCurriculumTab = 'curricula';
  activeFeeTab: EvaluatorFeeSubTab = 'tuition-fees';
  courseViewMode: EvaluatorCourseViewMode = 'list';
  showAddTuitionFee = false;
  showEditTuitionFee = false;
  editingTuitionFee: EvaluatorTuitionFeeRow | null = null;
  showDeleteTuitionFee = false;
  deletingTuitionFee: EvaluatorTuitionFeeRow | null = null;
  showAddOtherSchoolFee = false;
  showEditOtherSchoolFee = false;
  editingOtherSchoolFee: EvaluatorOtherSchoolFeeRow | null = null;
  showDeleteOtherSchoolFee = false;
  deletingOtherSchoolFee: EvaluatorOtherSchoolFeeRow | null = null;
  showAddMiscellaneousFee = false;
  showEditMiscellaneousFee = false;
  editingMiscellaneousFee: EvaluatorMiscellaneousFeeRow | null = null;
  showDeleteMiscellaneousFee = false;
  deletingMiscellaneousFee: EvaluatorMiscellaneousFeeRow | null = null;
  showViewDownpayment = false;
  viewingDownpayment: EvaluatorDownpaymentRow | null = null;
  showDownpaymentForm = false;
  editingDownpayment: Downpayment | null = null;
  takenDownpaymentProgramCodes: string[] = [];

  @ViewChild(DownpaymentFormComponent) downpaymentFormModal?: DownpaymentFormComponent;
  togglingCurriculumId: string | null = null;

  ngOnInit(): void {
    this.loadPrograms();
    this.loadCurricula();

    this.tableViewProgram.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.tableViewCurriculum.setValue('');
      this.loadTableViewCurriculumOptions();
    });

    this.tableViewCurriculum.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadTableViewCourses();
    });

    this.courseSearchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab !== 'courses' || !this.selectedCourseProgram) {
          return;
        }
        if (this.hasCourseCurriculumVersionSelected) {
          this.resetCourseListPagination();
          this.reloadCourseDetailView();
        }
      });

    this.courseFilterProgram.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.selectedCourseProgram) {
        return;
      }
      this.courseFilterCurriculum.setValue('', { emitEvent: false });
      this.loadCourseFilterCurricula();
    });
    this.courseFilterCurriculum.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      const code = (value ?? '').trim();
      this.tableViewProgram.setValue(this.selectedCourseProgram ?? '', { emitEvent: false });
      this.tableViewCurriculum.setValue(code, { emitEvent: false });
      this.allCourses = [];
      this.tableViewCourses = [];
      this.resetCourseListPagination();
      if (!code || !this.selectedCourseProgram) {
        return;
      }
      this.reloadCourseDetailView();
    });
    this.courseFilterYear.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.hasCourseCurriculumVersionSelected) {
        this.resetCourseListPagination();
        this.reloadCourseDetailView();
      }
    });
    this.courseFilterSemester.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.hasCourseCurriculumVersionSelected) {
        this.resetCourseListPagination();
        this.reloadCourseDetailView();
      }
    });

    this.tuitionFeeSearchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab === 'fees' && this.activeFeeTab === 'tuition-fees') {
          this.loadFees();
        }
      });

    this.schoolFeeSearchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab === 'fees' && this.activeFeeTab === 'other-school-fees') {
          this.loadFees();
        }
      });

    this.miscellaneousFeeSearchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab === 'fees' && this.activeFeeTab === 'miscellaneous-fees') {
          this.loadFees();
        }
      });

    this.downpaymentSearchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab === 'fees' && this.activeFeeTab === 'downpayment') {
          this.loadFees();
        }
      });
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
    if (tab !== 'curricula') {
      this.selectedCurriculumProgram = null;
      this.programCurriculumVersions = [];
    }
    if (tab !== 'courses') {
      this.selectedCourseProgram = null;
    }
    if (tab === 'courses') {
      if (this.programs.length === 0) {
        this.loadPrograms();
      }
      this.loadCourseProgramCards();
    } else if (tab === 'fees') {
      this.loadFees();
    }
  }

  selectFeeTab(tab: EvaluatorFeeSubTab): void {
    if (this.activeFeeTab === tab) {
      return;
    }
    this.activeFeeTab = tab;
    this.loadFees();
  }

  openProgramCurricula(programCode: string): void {
    this.selectedCurriculumProgram = programCode;
    this.programCurriculumVersions = curriculaForProgram(this.allCurricula, programCode);
  }

  openCourseProgram(programCode: string): void {
    this.selectedCourseProgram = programCode;
    this.courseFilterProgram.setValue(programCode, { emitEvent: false });
    this.courseFilterCurriculum.setValue('', { emitEvent: false });
    this.courseFilterYear.setValue('', { emitEvent: false });
    this.courseFilterSemester.setValue('', { emitEvent: false });
    this.tableViewProgram.setValue(programCode, { emitEvent: false });
    this.tableViewCurriculum.setValue('', { emitEvent: false });
    this.allCourses = [];
    this.tableViewCourses = [];
    this.resetCourseListPagination();
    this.loadCourseFilterCurricula();
  }

  backToCourseProgramCards(): void {
    this.selectedCourseProgram = null;
    this.courseFilterCurriculum.setValue('', { emitEvent: false });
    this.allCourses = [];
    this.tableViewCourses = [];
    this.resetCourseListPagination();
  }

  backToProgramCards(): void {
    this.selectedCurriculumProgram = null;
    this.programCurriculumVersions = [];
  }

  toggleCurriculumVersionStatus(row: EvaluatorCurriculumRow): void {
    const raw = this.allCurriculaRaw.find((item) => String(item.id) === row.id);
    if (!raw || this.togglingCurriculumId === row.id) {
      return;
    }

    const nextStatus =
      raw.curriculumStatus === CurriculumStatus.Active
        ? CurriculumStatus.Inactive
        : CurriculumStatus.Active;

    const curriculumCode =
      raw.curriculumCode?.trim() || row.curriculumId?.trim() || `${raw.programCode}-${raw.version}`;

    const updateData: UpdateCurriculaRequest = {
      id: raw.id,
      curriculumCode,
      version: raw.version,
      programId: raw.programId,
      programCode: raw.programCode,
      syId: raw.syId,
      effectiveDate: raw.effectiveDate,
      curriculumStatus: nextStatus
    };

    this.togglingCurriculumId = row.id;
    this.curriculaService.updateCurricula(String(raw.id), updateData).subscribe({
      next: () => {
        this.togglingCurriculumId = null;
        this.notificationService.success(
          'Curriculum Updated',
          `Curriculum "${raw.curriculumCode}" is now ${nextStatus}.`
        );
        this.loadCurricula();
      },
      error: (error) => {
        this.togglingCurriculumId = null;
        this.notificationService.error(
          'Update Failed',
          error.userMessage || error.message || 'Failed to update curriculum status.'
        );
      }
    });
  }

  openAddTuitionFee(): void {
    this.showAddTuitionFee = true;
  }

  closeAddTuitionFee(): void {
    this.showAddTuitionFee = false;
  }

  onTuitionFeeSaved(): void {
    this.loadFees();
  }

  openEditTuitionFee(row: EvaluatorTuitionFeeRow): void {
    this.editingTuitionFee = row;
    this.showEditTuitionFee = true;
  }

  closeEditTuitionFee(): void {
    this.showEditTuitionFee = false;
    this.editingTuitionFee = null;
  }

  openDeleteTuitionFee(row: EvaluatorTuitionFeeRow): void {
    this.deletingTuitionFee = row;
    this.showDeleteTuitionFee = true;
  }

  closeDeleteTuitionFee(): void {
    this.showDeleteTuitionFee = false;
    this.deletingTuitionFee = null;
  }

  confirmDeleteTuitionFee(): void {
    const row = this.deletingTuitionFee;
    if (!row) {
      this.closeDeleteTuitionFee();
      return;
    }
    this.tuitionFeesService.deleteTuitionFee(row.id).subscribe({
      next: () => {
        this.notificationService.success('Tuition Fee Deleted', `Tuition fee for "${row.courseCode}" was deleted.`);
        this.closeDeleteTuitionFee();
        this.loadFees();
      },
      error: (error) => {
        this.notificationService.error(
          'Delete Failed',
          error.userMessage || error.message || 'Failed to delete tuition fee.'
        );
      }
    });
  }

  openAddOtherSchoolFee(): void {
    this.showAddOtherSchoolFee = true;
  }

  closeAddOtherSchoolFee(): void {
    this.showAddOtherSchoolFee = false;
  }

  onOtherSchoolFeeSaved(): void {
    this.loadFees();
  }

  openEditOtherSchoolFee(row: EvaluatorOtherSchoolFeeRow): void {
    this.editingOtherSchoolFee = row;
    this.showEditOtherSchoolFee = true;
  }

  closeEditOtherSchoolFee(): void {
    this.showEditOtherSchoolFee = false;
    this.editingOtherSchoolFee = null;
  }

  openDeleteOtherSchoolFee(row: EvaluatorOtherSchoolFeeRow): void {
    this.deletingOtherSchoolFee = row;
    this.showDeleteOtherSchoolFee = true;
  }

  closeDeleteOtherSchoolFee(): void {
    this.showDeleteOtherSchoolFee = false;
    this.deletingOtherSchoolFee = null;
  }

  confirmDeleteOtherSchoolFee(): void {
    const row = this.deletingOtherSchoolFee;
    if (!row) {
      this.closeDeleteOtherSchoolFee();
      return;
    }
    this.otherSchoolFeesService.deleteOtherSchoolFee(row.id).subscribe({
      next: () => {
        this.notificationService.success('School Fee Deleted', `School fee "${row.schoolFee}" was deleted.`);
        this.closeDeleteOtherSchoolFee();
        this.loadFees();
      },
      error: (error) => {
        this.notificationService.error(
          'Delete Failed',
          error.userMessage || error.message || 'Failed to delete school fee.'
        );
      }
    });
  }

  openAddMiscellaneousFee(): void {
    this.showAddMiscellaneousFee = true;
  }

  closeAddMiscellaneousFee(): void {
    this.showAddMiscellaneousFee = false;
  }

  onMiscellaneousFeeSaved(): void {
    this.loadFees();
  }

  openEditMiscellaneousFee(row: EvaluatorMiscellaneousFeeRow): void {
    this.editingMiscellaneousFee = row;
    this.showEditMiscellaneousFee = true;
  }

  closeEditMiscellaneousFee(): void {
    this.showEditMiscellaneousFee = false;
    this.editingMiscellaneousFee = null;
  }

  openDeleteMiscellaneousFee(row: EvaluatorMiscellaneousFeeRow): void {
    this.deletingMiscellaneousFee = row;
    this.showDeleteMiscellaneousFee = true;
  }

  closeDeleteMiscellaneousFee(): void {
    this.showDeleteMiscellaneousFee = false;
    this.deletingMiscellaneousFee = null;
  }

  confirmDeleteMiscellaneousFee(): void {
    const row = this.deletingMiscellaneousFee;
    if (!row) {
      this.closeDeleteMiscellaneousFee();
      return;
    }
    this.miscellaneousFeesService.deleteMiscellaneousFee(row.id).subscribe({
      next: () => {
        this.notificationService.success(
          'Miscellaneous Fee Deleted',
          `Miscellaneous fee "${row.miscellaneousFee}" was deleted.`
        );
        this.closeDeleteMiscellaneousFee();
        this.loadFees();
      },
      error: (error) => {
        this.notificationService.error(
          'Delete Failed',
          error.userMessage || error.message || 'Failed to delete miscellaneous fee.'
        );
      }
    });
  }

  get selectedProgramVersionCount(): number {
    return this.programCurriculumVersions.length;
  }

  get selectedProgramActiveCount(): number {
    return this.programCurriculumVersions.filter((row) => row.status === 'active').length;
  }

  formatCurriculumEffectiveDate(value: string): string {
    return value;
  }

  get filteredTuitionFees(): EvaluatorTuitionFeeRow[] {
    return this.allTuitionFees;
  }

  get filteredOtherSchoolFees(): EvaluatorOtherSchoolFeeRow[] {
    return this.allOtherSchoolFees;
  }

  get filteredMiscellaneousFees(): EvaluatorMiscellaneousFeeRow[] {
    return this.allMiscellaneousFees;
  }

  get filteredDownpayments(): EvaluatorDownpaymentRow[] {
    return this.allDownpayments;
  }

  formatFeeCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  openAddDownpayment(): void {
    this.editingDownpayment = null;
    this.refreshTakenDownpaymentProgramCodes();
    this.showDownpaymentForm = true;
  }

  closeDownpaymentForm(): void {
    this.showDownpaymentForm = false;
    this.editingDownpayment = null;
    this.takenDownpaymentProgramCodes = [];
  }

  onDownpaymentSave(payload: CreateDownpaymentRequest | UpdateDownpaymentRequest): void {
    this.downpaymentFormModal?.setSubmitting(true);

    if ('id' in payload && payload.id) {
      this.downpaymentService.updateDownpayment(payload as UpdateDownpaymentRequest).subscribe({
        next: () => {
          this.downpaymentFormModal?.setSubmitting(false);
          this.notificationService.success('Downpayment Updated', 'Downpayment rule has been saved.');
          this.closeDownpaymentForm();
          this.loadFees();
        },
        error: (error) => {
          this.downpaymentFormModal?.setSubmitting(false);
          const msg = error.userMessage || error.message || 'Failed to update downpayment.';
          this.downpaymentFormModal?.setError(msg);
          this.notificationService.error('Update Failed', msg);
        }
      });
      return;
    }

    this.downpaymentService.createDownpayment(payload as CreateDownpaymentRequest).subscribe({
      next: () => {
        this.downpaymentFormModal?.setSubmitting(false);
        this.notificationService.success('Downpayment Created', 'Downpayment rule has been added.');
        this.closeDownpaymentForm();
        this.loadFees();
      },
      error: (error) => {
        this.downpaymentFormModal?.setSubmitting(false);
        const msg = error.userMessage || error.message || 'Failed to create downpayment.';
        this.downpaymentFormModal?.setError(msg);
        this.notificationService.error('Create Failed', msg);
      }
    });
  }

  private refreshTakenDownpaymentProgramCodes(): void {
    const codes = this.allDownpayments.map((r) => r.programCode.trim()).filter((c) => c.length > 0);
    if (!this.editingDownpayment) {
      this.takenDownpaymentProgramCodes = codes;
      return;
    }
    const editing = this.editingDownpayment.programCode.trim().toLowerCase();
    this.takenDownpaymentProgramCodes = codes.filter((c) => c.toLowerCase() !== editing);
  }

  openViewDownpayment(row: EvaluatorDownpaymentRow): void {
    this.viewingDownpayment = row;
    this.showViewDownpayment = true;
  }

  closeViewDownpayment(): void {
    this.showViewDownpayment = false;
    this.viewingDownpayment = null;
  }

  setCourseViewMode(mode: EvaluatorCourseViewMode): void {
    this.courseViewMode = mode;
    if (!this.selectedCourseProgram || !this.hasCourseCurriculumVersionSelected) {
      return;
    }
    if (mode === 'list') {
      this.resetCourseListPagination();
    }
    this.reloadCourseDetailView();
  }

  get hasCourseCurriculumVersionSelected(): boolean {
    return !!(this.courseFilterCurriculum.value ?? '').trim();
  }

  getCourseListDisplayRange(): string {
    return PaginationUtil.getDisplayRange(
      this.courseListCurrentPage,
      this.courseListPageSize,
      this.courseListTotalRecords
    );
  }

  onCourseListPreviousPage(): void {
    if (this.courseListCurrentPage > DEFAULT_PAGINATION.pageIndex) {
      this.courseListCurrentPage--;
      this.loadCourses();
    }
  }

  onCourseListNextPage(): void {
    if (this.courseListCurrentPage < this.courseListTotalPages) {
      this.courseListCurrentPage++;
      this.loadCourses();
    }
  }

  private resetCourseListPagination(): void {
    this.courseListCurrentPage = DEFAULT_PAGINATION.pageIndex;
    this.courseListTotalRecords = 0;
    this.courseListTotalPages = 0;
  }

  courseProgramSummary(): string {
    const card = this.courseProgramCards.find((row) => row.programCode === this.selectedCourseProgram);
    if (!card) {
      return '';
    }
    return `${this.courseCountLabel(card.courseCount)} • ${this.courseVersionCountLabel(card.versionCount)}`;
  }

  private reloadCourseDetailView(): void {
    if (this.courseViewMode === 'list') {
      this.loadCourses();
    } else {
      this.loadTableViewCourses();
    }
  }

  get filteredCourseProgramCards(): EvaluatorCourseProgramCard[] {
    const q = (this.courseSearchControl.value ?? '').trim().toLowerCase();
    if (!q) {
      return this.courseProgramCards;
    }
    return this.courseProgramCards.filter((card) => {
      if (card.programCode.toLowerCase().includes(q)) {
        return true;
      }
      return this.coursesForCardCounts.some((course) => {
        if (course.programCode?.trim() !== card.programCode) {
          return false;
        }
        const code = course.courseCode?.toLowerCase() ?? '';
        const title = course.courseTitle?.toLowerCase() ?? '';
        return code.includes(q) || title.includes(q);
      });
    });
  }

  get filteredProgramCards(): EvaluatorCurriculumProgramCard[] {
    const q = (this.searchControl.value ?? '').trim().toLowerCase();
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
    const q = (this.searchControl.value ?? '').trim().toLowerCase();
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

  programVersionCountLabel(count: number): string {
    return `${count} version${count === 1 ? '' : 's'}`;
  }

  programActiveCountLabel(count: number): string {
    return `${count} active`;
  }

  courseCountLabel(count: number): string {
    return `${count} course${count === 1 ? '' : 's'}`;
  }

  courseVersionCountLabel(count: number): string {
    return `${count} curriculum version${count === 1 ? '' : 's'}`;
  }

  get filteredCourses(): EvaluatorCourseDetailRow[] {
    return this.allCourses;
  }

  get tableViewCurriculumOptions(): EvaluatorTableViewCurriculumOption[] {
    return this.tableViewCurriculumOptionsList;
  }

  get tableViewSelectedCurriculum(): EvaluatorTableViewCurriculumOption | null {
    const selectedValue = (this.tableViewCurriculum.value ?? '').trim();
    if (!selectedValue) {
      return null;
    }
    return (
      this.tableViewCurriculumOptionsList.find(
        (row) =>
          row.curriculumId === selectedValue ||
          row.id === selectedValue ||
          row.version === selectedValue
      ) ?? null
    );
  }

  get hasTableViewCurriculumSelected(): boolean {
    return !!(this.tableViewCurriculum.value ?? '').trim();
  }

  get tableViewResolvedProgramCode(): string {
    const fromProgram = (this.tableViewProgram.value ?? '').trim();
    if (fromProgram) {
      return fromProgram;
    }
    const selected = this.tableViewSelectedCurriculum;
    if (selected?.program) {
      return selected.program;
    }
    return this.resolveTableViewProgramCode((this.tableViewCurriculum.value ?? '').trim());
  }

  tableViewCurriculumDropdownLabel(option: EvaluatorTableViewCurriculumOption): string {
    return formatTableViewCurriculumDropdownLabel(option);
  }

  tableViewCurriculumVersionDisplay(): string {
    const selected = this.tableViewSelectedCurriculum;
    if (selected) {
      return formatTableViewCurriculumVersionDisplay(selected);
    }
    const raw = (this.tableViewCurriculum.value ?? '').trim();
    if (!raw) {
      return '';
    }
    const program = this.tableViewResolvedProgramCode;
    const version = raw.includes('-') ? raw.split('-').slice(-1)[0] : raw;
    return program ? `${raw} - ${version}` : raw;
  }

  getTableViewSortedYears(): string[] {
    const grouped = groupEvaluatorCoursesByYearSemester(this.tableViewCourses);
    return EVALUATOR_TABLE_VIEW_YEAR_ORDER.filter((year) => grouped[year]);
  }

  getTableViewYearHeading(year: string): string {
    return getEvaluatorTableViewYearHeading(year);
  }

  getTableViewSemesterCourses(year: string, semester: EvaluatorCourseSemesterLabel): EvaluatorCourseDetailRow[] {
    const grouped = groupEvaluatorCoursesByYearSemester(this.tableViewCourses);
    return grouped[year]?.[semester] ?? [];
  }

  getTableViewSemesterUnits(courses: EvaluatorCourseDetailRow[]): number {
    return courses.reduce((total, course) => total + course.units, 0);
  }

  tableViewPrerequisiteDisplay(prerequisite: string | undefined): string {
    const normalized = (prerequisite ?? '').trim().toLowerCase();
    if (!normalized || normalized === 'none' || normalized === 'n/a') {
      return 'None';
    }
    return prerequisite!.trim();
  }

  getTableViewTotalCourses(): number {
    return this.tableViewCourses.length;
  }

  getTableViewSummaryTotalUnits(): number {
    return this.tableViewCourses.reduce((total, course) => total + course.units, 0);
  }

  getTableViewHeaderTotalUnits(): number {
    const prog = this.tableViewResolvedProgramCode;
    const fromProgram = this.programTableMeta[prog]?.totalUnits;
    if (fromProgram != null && fromProgram > 0) {
      return fromProgram;
    }
    return this.getTableViewSummaryTotalUnits();
  }

  getTableViewFooterTotalUnits(): number {
    return this.getTableViewSummaryTotalUnits();
  }

  getTableViewCompletionYears(): number {
    const prog = this.tableViewResolvedProgramCode;
    return resolveCurriculumCompletionYears({
      programCompletionYears: this.programTableMeta[prog]?.completionYears,
      courses: this.tableViewCourses
    });
  }

  getTableViewProgramTitle(): string {
    const prog = this.tableViewResolvedProgramCode || (this.tableViewProgram.value ?? '').trim();
    const title = this.programTableMeta[prog]?.programTitle?.trim();
    return title || prog;
  }

  formatDate(value: string): string {
    return DateUtil.formatDate(value);
  }

  formatDownpaymentLastUpdated(value: string): string {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return value;
    }
  }

  formatDownpaymentPercent(value: number): string {
    return `${value}%`;
  }

  isActiveStatus(row: EvaluatorCurriculumRow): boolean {
    return row.status === 'active';
  }

  statusLabel(row: EvaluatorCurriculumRow): string {
    return row.status === 'active' ? 'Active' : 'Inactive';
  }

  searchPlaceholder(): string {
    return 'Search curricula by program or curriculum ID...';
  }

  courseSearchPlaceholder(): string {
    return 'Search courses by code, title, or program...';
  }

  courseFilterCurriculumLabel(curriculum: Curricula): string {
    if (curriculum.version?.trim()) {
      const code = curriculum.programCode || curriculum.curriculumCode;
      return `${curriculum.version} (${code})`;
    }
    return curriculum.curriculumCode;
  }

  get hasCourseProgramSelected(): boolean {
    return !!(this.courseFilterProgram.value ?? '').trim();
  }

  private loadCourseProgramCards(): void {
    this.isLoadingCourseProgramCards = true;
    this.courseService
      .getCourses({
        ...BULK_LIST_PARAMS,
        searchTerm: ''
      })
      .pipe(
        catchError((error) => {
          this.notificationService.error(
            'Loading Failed',
            error.userMessage || error.message || 'Failed to load courses.'
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.coursesForCardCounts = response?.data ?? [];
        this.courseProgramCards = buildCourseProgramCards(this.allCurriculaRaw, this.coursesForCardCounts);
        this.isLoadingCourseProgramCards = false;
      });
  }

  private rebuildCourseProgramCards(): void {
    if (this.coursesForCardCounts.length === 0) {
      return;
    }
    this.courseProgramCards = buildCourseProgramCards(this.allCurriculaRaw, this.coursesForCardCounts);
  }

  private loadCourseFilterCurricula(): void {
    const programCode = (this.courseFilterProgram.value ?? '').trim();
    if (!programCode) {
      this.courseFilterCurricula = [];
      this.isLoadingCourseFilterCurricula = false;
      return;
    }

    const program = this.programs.find((item) => item.programCode === programCode);
    if (!program?.programId) {
      this.courseFilterCurricula = this.buildCourseFilterCurriculaFallback(programCode);
      this.isLoadingCourseFilterCurricula = false;
      return;
    }

    this.isLoadingCourseFilterCurricula = true;
    this.lookupService
      .getCurriculaForDropdown(program.programId)
      .pipe(
        catchError(() => of([] as Curricula[])),
        takeUntil(this.destroy$)
      )
      .subscribe((curricula) => {
        const mapped = (curricula ?? []).map((row) => ({
          ...row,
          programId: row.programId || program.programId,
          programCode: row.programCode || program.programCode
        }));

        this.courseFilterCurricula =
          mapped.length > 0
            ? mapped
            : this.buildCourseFilterCurriculaFallback(program.programCode, program.programId);
        this.tableViewCurriculumOptionsList = this.courseFilterCurricula.map(mapCurriculaToTableViewOption);
        this.isLoadingCourseFilterCurricula = false;
      });
  }

  private buildCourseFilterCurriculaFallback(programCode: string, programId?: number): Curricula[] {
    const code = programCode.trim().toUpperCase();
    return this.allCurriculaRaw.filter((row) => {
      if (programId && row.programId === programId) {
        return true;
      }
      return row.programCode?.trim().toUpperCase() === code;
    });
  }

  private augmentCourseFilterCurriculaFromCourses(): void {
    const programCode = (this.courseFilterProgram.value ?? '').trim();
    if (!programCode) {
      return;
    }

    const program = this.programs.find((item) => item.programCode === programCode);
    const existing = new Set(this.courseFilterCurricula.map((row) => row.curriculumCode));
    const additions: Curricula[] = [];

    for (const course of this.allCourses) {
      const code = course.curriculum?.trim();
      if (!code || existing.has(code)) {
        continue;
      }
      if (program?.programCode && course.program && course.program !== program.programCode) {
        continue;
      }

      existing.add(code);
      additions.push({
        id: 0,
        curriculumCode: code,
        version: '',
        programId: program?.programId ?? 0,
        programCode: course.program || program?.programCode || '',
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

  private loadPrograms(): void {
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
        const programs = response?.data ?? [];
        this.programs = programs;
        this.programTableMeta = programs.reduce<Record<string, EvaluatorProgramTableMeta>>((acc, program) => {
          acc[program.programCode] = mapProgramTableMeta(program);
          return acc;
        }, {});
        this.programFilterOptions = [
          { value: '', label: 'All Programs' },
          ...programs.map((program) => ({ value: program.programCode, label: program.programCode }))
        ];
        this.tableViewProgramSelectOptions = programs.map((program) => ({
          value: program.programCode,
          label: `${program.programCode} - ${program.programTitle}`
        }));
      });
  }

  private loadCurricula(): void {
    this.isLoadingCurricula = true;
    this.curriculaService
      .getCurricula({ ...BULK_LIST_PARAMS, searchTerm: '' })
      .pipe(
        catchError((error) => {
          this.notificationService.error(
            'Loading Failed',
            error.userMessage || error.message || 'Failed to load curricula.'
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        const raw = response?.data ?? [];
        this.allCurriculaRaw = raw;
        const rows = raw.map(mapCurriculaToRow);
        this.allCurricula = rows;
        this.curriculumProgramCards = buildProgramCards(raw);
        if (this.selectedCurriculumProgram) {
          this.programCurriculumVersions = curriculaForProgram(rows, this.selectedCurriculumProgram);
        }
        this.rebuildCourseProgramCards();
        this.isLoadingCurricula = false;
      });
  }

  private loadCourses(): void {
    if (this.activeTab !== 'courses' || this.courseViewMode !== 'list' || !this.selectedCourseProgram) {
      return;
    }

    const curriculumCode = (this.courseFilterCurriculum.value ?? '').trim();
    if (!curriculumCode) {
      return;
    }

    const program = this.programs.find((item) => item.programCode === this.selectedCourseProgram);

    this.isLoadingCourses = true;
    this.courseService
      .getCourses({
        PageIndex: this.courseListCurrentPage,
        PageSize: this.courseListPageSize,
        SortDirection: SORT_DEFAULTS.DIRECTION,
        SortKey: '',
        searchTerm: (this.courseSearchControl.value ?? '').trim(),
        programId: program?.programId,
        curriculumCode,
        yearLevel: (this.courseFilterYear.value ?? '').trim() || undefined,
        semester: this.mapSemesterFilter(this.courseFilterSemester.value)
      })
      .pipe(
        catchError((error) => {
          this.notificationService.error(
            'Loading Failed',
            error.userMessage || error.message || 'Failed to load courses.'
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.allCourses = (response?.data ?? []).map(mapCourseToEvaluatorRow);
        if (response?.pagination) {
          this.courseListTotalRecords = response.pagination.total;
          this.courseListTotalPages = response.pagination.totalPages;
          this.courseListCurrentPage = response.pagination.page;
        } else {
          this.resetCourseListPagination();
        }
        this.augmentCourseFilterCurriculaFromCourses();
        this.isLoadingCourses = false;
      });
  }

  private loadTableViewCurriculumOptions(): void {
    const programCode = (this.tableViewProgram.value ?? '').trim();
    if (!programCode) {
      this.tableViewCurriculumOptionsList = [];
      return;
    }

    const program = this.programs.find((item) => item.programCode === programCode);
    if (!program?.programId) {
      this.tableViewCurriculumOptionsList = [];
      return;
    }

    this.lookupService
      .getCurriculaForDropdown(program.programId)
      .pipe(
        catchError(() => of([] as Curricula[])),
        takeUntil(this.destroy$)
      )
      .subscribe((curricula) => {
        const rows =
          curricula.length > 0
            ? curricula
            : this.allCurriculaRaw.filter(
                (row) =>
                  row.programId === program.programId ||
                  row.programCode?.trim().toUpperCase() === programCode.toUpperCase()
              );

        this.tableViewCurriculumOptionsList = rows.map(mapCurriculaToTableViewOption);
        const current = (this.tableViewCurriculum.value ?? '').trim();
        if (current && !this.tableViewSelectedCurriculum) {
          const match = this.tableViewCurriculumOptionsList.find(
            (row) => row.curriculumId === current || row.id === current
          );
          if (match?.curriculumId) {
            this.tableViewCurriculum.setValue(match.curriculumId, { emitEvent: true });
          }
        }
      });
  }

  private loadTableViewCourses(): void {
    const curriculumCode = (this.courseFilterCurriculum.value ?? '').trim();
    const programCode = this.selectedCourseProgram ?? '';
    const program = this.programs.find((item) => item.programCode === programCode);

    if (!curriculumCode || !program) {
      this.tableViewCourses = [];
      return;
    }

    this.isLoadingTableViewCourses = true;
    this.courseService
      .getCourses({
        ...BULK_LIST_PARAMS,
        programId: program.programId,
        curriculumCode,
        searchTerm: ''
      })
      .pipe(
        catchError((error) => {
          this.notificationService.error(
            'Loading Failed',
            error.userMessage || error.message || 'Failed to load curriculum courses.'
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.tableViewCourses = (response?.data ?? []).map(mapCourseToEvaluatorRow);
        this.isLoadingTableViewCourses = false;
      });
  }

  private loadFees(): void {
    if (this.activeTab !== 'fees') {
      return;
    }

    this.isLoadingFees = true;

    if (this.activeFeeTab === 'tuition-fees') {
      this.tuitionFeesService
        .getTuitionFees({
          ...BULK_LIST_PARAMS,
          searchTerm: (this.tuitionFeeSearchControl.value ?? '').trim()
        })
        .pipe(
          catchError((error) => {
            this.notifyFeeLoadError(error);
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((response) => {
          this.allTuitionFees = (response?.data ?? []).map(mapTuitionFeeRow);
          this.isLoadingFees = false;
        });
      return;
    }

    if (this.activeFeeTab === 'other-school-fees') {
      this.otherSchoolFeesService
        .getOtherSchoolFees({
          ...BULK_LIST_PARAMS,
          searchTerm: (this.schoolFeeSearchControl.value ?? '').trim()
        })
        .pipe(
          catchError((error) => {
            this.notifyFeeLoadError(error);
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((response) => {
          this.allOtherSchoolFees = (response?.data ?? []).map(mapOtherSchoolFeeRow);
          this.isLoadingFees = false;
        });
      return;
    }

    if (this.activeFeeTab === 'miscellaneous-fees') {
      this.miscellaneousFeesService
        .getMiscellaneousFees({
          ...BULK_LIST_PARAMS,
          searchTerm: (this.miscellaneousFeeSearchControl.value ?? '').trim()
        })
        .pipe(
          catchError((error) => {
            this.notifyFeeLoadError(error);
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((response) => {
          this.allMiscellaneousFees = (response?.data ?? []).map(mapMiscellaneousFeeRow);
          this.isLoadingFees = false;
        });
      return;
    }

    this.downpaymentService
      .getDownpayments({
        ...BULK_LIST_PARAMS,
        searchTerm: (this.downpaymentSearchControl.value ?? '').trim()
      })
      .pipe(
        catchError((error) => {
          this.notifyFeeLoadError(error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.allDownpayments = (response?.data ?? []).map(mapDownpaymentRow);
        this.isLoadingFees = false;
      });
  }

  private notifyFeeLoadError(error: { userMessage?: string; message?: string }): void {
    this.notificationService.error(
      'Loading Failed',
      error.userMessage || error.message || 'Failed to load fee data.'
    );
  }

  private filterFeeRows<T>(
    rows: T[],
    searchValue: string,
    toHaystack: (row: T) => string[]
  ): T[] {
    const q = (searchValue ?? '').trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) => toHaystack(row).join(' ').toLowerCase().includes(q));
  }

  private mapSemesterFilter(value: string): string | undefined {
    const sem = (value ?? '').trim();
    if (sem === '1st') {
      return '1st Semester';
    }
    if (sem === '2nd') {
      return '2nd Semester';
    }
    return undefined;
  }

  private resolveTableViewProgramCode(curriculumId: string): string {
    const fromSelect = (this.tableViewProgram.value ?? '').trim();
    if (fromSelect) {
      return fromSelect;
    }
    const match = curriculumId.match(/^([A-Z]+)-/);
    return match?.[1] ?? '';
  }
}

