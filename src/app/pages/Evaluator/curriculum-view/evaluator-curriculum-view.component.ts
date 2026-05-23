import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateUtil } from '../../../shared/utils/date.util';
import {
  EVALUATOR_BSIT_MATRIX_COURSES_MOCK,
  getEvaluatorTableViewCurriculumOptions,
  EVALUATOR_BSIT_TABLE_VIEW_SUMMARY,
  formatTableViewCurriculumDropdownLabel,
  formatTableViewCurriculumVersionDisplay,
  type EvaluatorTableViewCurriculumOption
} from '../../../../mock-data/evaluator/evaluator-bsit-table-view.mock';
import {
  EVALUATOR_COURSES_DETAIL_MOCK,
  EVALUATOR_COURSE_PREREQ_FILTER,
  EVALUATOR_COURSE_PREREQ_FILTER_OPTIONS,
  EVALUATOR_COURSE_PROGRAM_CODES,
  EVALUATOR_COURSE_PROGRAM_FILTER_OPTIONS,
  EVALUATOR_CURRICULA_MOCK,
  EVALUATOR_CURRICULUM_PROGRAM_CARDS,
  EVALUATOR_PROGRAM_TABLE_META,
  getEvaluatorCurriculaForProgram,
  type EvaluatorCurriculumProgramCard,
  EVALUATOR_TABLE_VIEW_YEAR_ORDER,
  evaluatorCourseHasPrerequisite,
  getEvaluatorTableViewYearHeading,
  groupEvaluatorCoursesByYearSemester,
  type EvaluatorCourseDetailRow,
  type EvaluatorCourseProgramCode,
  type EvaluatorCourseSemesterLabel,
  type EvaluatorCurriculumRow
} from '../../../../mock-data/evaluator/evaluator-curriculum.mock';
import {
  EVALUATOR_DOWNPAYMENTS_MOCK,
  type EvaluatorDownpaymentRow
} from '../../../../mock-data/evaluator/evaluator-downpayments.mock';
import {
  EVALUATOR_MISCELLANEOUS_FEES_MOCK,
  type EvaluatorMiscellaneousFeeRow
} from '../../../../mock-data/evaluator/evaluator-miscellaneous-fees.mock';
import {
  EVALUATOR_OTHER_SCHOOL_FEES_MOCK,
  type EvaluatorOtherSchoolFeeRow
} from '../../../../mock-data/evaluator/evaluator-other-school-fees.mock';
import {
  EVALUATOR_TUITION_FEES_MOCK,
  type EvaluatorFeeSubTab,
  type EvaluatorTuitionFeeRow
} from '../../../../mock-data/evaluator/evaluator-tuition-fees.mock';
import { EvaluatorMiscellaneousFeeAddComponent } from './evaluator-miscellaneous-fee-add/evaluator-miscellaneous-fee-add.component';
import { EvaluatorMiscellaneousFeeDeleteComponent } from './evaluator-miscellaneous-fee-delete/evaluator-miscellaneous-fee-delete.component';
import { EvaluatorMiscellaneousFeeEditComponent } from './evaluator-miscellaneous-fee-edit/evaluator-miscellaneous-fee-edit.component';
import { EvaluatorOtherSchoolFeeAddComponent } from './evaluator-other-school-fee-add/evaluator-other-school-fee-add.component';
import { EvaluatorOtherSchoolFeeDeleteComponent } from './evaluator-other-school-fee-delete/evaluator-other-school-fee-delete.component';
import { EvaluatorOtherSchoolFeeEditComponent } from './evaluator-other-school-fee-edit/evaluator-other-school-fee-edit.component';
import { EvaluatorTuitionFeeAddComponent } from './evaluator-tuition-fee-add/evaluator-tuition-fee-add.component';
import { EvaluatorTuitionFeeEditComponent } from './evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component';
import { EvaluatorTuitionFeeDeleteComponent } from './evaluator-tuition-fee-delete/evaluator-tuition-fee-delete.component';
import { EvaluatorDownpaymentViewComponent } from './evaluator-downpayment-view/evaluator-downpayment-view.component';

type EvaluatorCurriculumTab = 'curricula' | 'courses' | 'fees';
type EvaluatorCourseViewMode = 'list' | 'table';

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
    EvaluatorDownpaymentViewComponent
  ],
  templateUrl: './evaluator-curriculum-view.component.html',
  styleUrls: [
    './evaluator-curriculum-view.component.scss',
    './evaluator-curriculum-matrix.scss',
    './evaluator-curriculum-fees.scss'
  ]
})
export class EvaluatorCurriculumViewComponent implements OnInit {
  readonly pageTitle = 'Curriculum View';
  readonly pageSubtitle = 'View curricula, courses, and fee structures (Read-only)';

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly allCurricula: EvaluatorCurriculumRow[] = EVALUATOR_CURRICULA_MOCK;
  readonly curriculumProgramCards: readonly EvaluatorCurriculumProgramCard[] =
    EVALUATOR_CURRICULUM_PROGRAM_CARDS;

  selectedCurriculumProgram: string | null = null;
  /** Mutable copy for mock Set Active / Set Inactive toggles on the detail table. */
  programCurriculumVersions: EvaluatorCurriculumRow[] = [];
  readonly allTuitionFees: EvaluatorTuitionFeeRow[] = EVALUATOR_TUITION_FEES_MOCK;
  readonly allOtherSchoolFees: EvaluatorOtherSchoolFeeRow[] = EVALUATOR_OTHER_SCHOOL_FEES_MOCK;
  readonly allMiscellaneousFees: EvaluatorMiscellaneousFeeRow[] = EVALUATOR_MISCELLANEOUS_FEES_MOCK;
  readonly allDownpayments: EvaluatorDownpaymentRow[] = EVALUATOR_DOWNPAYMENTS_MOCK;

  readonly allCourses: EvaluatorCourseDetailRow[] = EVALUATOR_COURSES_DETAIL_MOCK;

  readonly tuitionFeeSearchControl = new FormControl('', { nonNullable: true });
  readonly schoolFeeSearchControl = new FormControl('', { nonNullable: true });
  readonly miscellaneousFeeSearchControl = new FormControl('', { nonNullable: true });
  readonly downpaymentSearchControl = new FormControl('', { nonNullable: true });
  readonly courseSearchControl = new FormControl('', { nonNullable: true });
  readonly courseFilterProgram = new FormControl('', { nonNullable: true });
  readonly courseFilterPrereq = new FormControl('', { nonNullable: true });
  readonly courseFilterYear = new FormControl('', { nonNullable: true });
  readonly courseFilterSemester = new FormControl('', { nonNullable: true });

  readonly tableViewProgram = new FormControl('', { nonNullable: true });
  readonly tableViewCurriculum = new FormControl('', { nonNullable: true });

  readonly programFilterOptions = EVALUATOR_COURSE_PROGRAM_FILTER_OPTIONS;
  readonly prereqFilterOptions = EVALUATOR_COURSE_PREREQ_FILTER_OPTIONS;
  readonly tableViewProgramCodes = EVALUATOR_COURSE_PROGRAM_CODES;
  readonly tableViewSemesters: EvaluatorCourseSemesterLabel[] = ['1st Semester', '2nd Semester'];

  readonly tableViewProgramSelectOptions = EVALUATOR_COURSE_PROGRAM_CODES.map((code) => ({
    value: code,
    label: `${code} - ${EVALUATOR_PROGRAM_TABLE_META[code].programTitle}`
  }));

  readonly yearFilterOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Years' },
    { value: 'Year 1', label: 'Year 1' },
    { value: 'Year 2', label: 'Year 2' },
    { value: 'Year 3', label: 'Year 3' },
    { value: 'Year 4', label: 'Year 4' }
  ];

  readonly semesterFilterOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Semesters' },
    { value: '1st', label: '1st Semester' },
    { value: '2nd', label: '2nd Semester' }
  ];

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

  ngOnInit(): void {
    this.tableViewProgram.valueChanges.subscribe(() => {
      this.tableViewCurriculum.setValue('');
    });
  }

  selectTab(tab: EvaluatorCurriculumTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    if (tab !== 'curricula') {
      this.selectedCurriculumProgram = null;
    }
  }

  openProgramCurricula(programCode: string): void {
    this.selectedCurriculumProgram = programCode;
    this.programCurriculumVersions = getEvaluatorCurriculaForProgram(programCode).map((row) => ({ ...row }));
  }

  backToProgramCards(): void {
    this.selectedCurriculumProgram = null;
    this.programCurriculumVersions = [];
  }

  toggleCurriculumVersionStatus(row: EvaluatorCurriculumRow): void {
    const index = this.programCurriculumVersions.findIndex((item) => item.id === row.id);
    if (index < 0) {
      return;
    }
    const nextStatus: EvaluatorCurriculumRow['status'] =
      this.programCurriculumVersions[index].status === 'active' ? 'inactive' : 'active';
    this.programCurriculumVersions = this.programCurriculumVersions.map((item, i) =>
      i === index ? { ...item, status: nextStatus } : item
    );
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

  selectFeeTab(tab: EvaluatorFeeSubTab): void {
    if (this.activeFeeTab === tab) {
      return;
    }
    this.activeFeeTab = tab;
  }

  get filteredTuitionFees(): EvaluatorTuitionFeeRow[] {
    const q = (this.tuitionFeeSearchControl.value ?? '').trim().toLowerCase();
    if (!q) {
      return this.allTuitionFees;
    }
    return this.allTuitionFees.filter((row) => {
      const hay = [
        row.syId,
        row.batch,
        row.semester,
        row.courseCode,
        row.courseTitle,
        row.component,
        String(row.units),
        String(row.cash),
        String(row.lowMonthlyPayment)
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  get filteredOtherSchoolFees(): EvaluatorOtherSchoolFeeRow[] {
    const q = (this.schoolFeeSearchControl.value ?? '').trim().toLowerCase();
    if (!q) {
      return this.allOtherSchoolFees;
    }
    return this.allOtherSchoolFees.filter((row) => {
      const hay = [
        row.syId,
        row.batch,
        row.semester,
        row.schoolFee,
        String(row.cash),
        String(row.lowMonthlyPayment)
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  get filteredMiscellaneousFees(): EvaluatorMiscellaneousFeeRow[] {
    const q = (this.miscellaneousFeeSearchControl.value ?? '').trim().toLowerCase();
    if (!q) {
      return this.allMiscellaneousFees;
    }
    return this.allMiscellaneousFees.filter((row) => {
      const hay = [
        row.syId,
        row.batch,
        row.semester,
        row.miscellaneousFee,
        String(row.cash),
        String(row.lowMonthlyPayment)
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  get filteredDownpayments(): EvaluatorDownpaymentRow[] {
    const q = (this.downpaymentSearchControl.value ?? '').trim().toLowerCase();
    if (!q) {
      return this.allDownpayments;
    }
    return this.allDownpayments.filter((row) => {
      const hay = [
        row.programCode,
        row.programTitle,
        row.batch,
        String(row.downpaymentPercent),
        row.effectiveSchoolYear,
        this.formatDownpaymentLastUpdated(row.lastUpdated)
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  formatFeeCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  openAddTuitionFee(): void {
    this.showAddTuitionFee = true;
  }

  closeAddTuitionFee(): void {
    this.showAddTuitionFee = false;
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
    this.closeDeleteTuitionFee();
  }

  openAddOtherSchoolFee(): void {
    this.showAddOtherSchoolFee = true;
  }

  closeAddOtherSchoolFee(): void {
    this.showAddOtherSchoolFee = false;
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
    this.closeDeleteOtherSchoolFee();
  }

  openAddMiscellaneousFee(): void {
    this.showAddMiscellaneousFee = true;
  }

  closeAddMiscellaneousFee(): void {
    this.showAddMiscellaneousFee = false;
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
    this.closeDeleteMiscellaneousFee();
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
      return getEvaluatorCurriculaForProgram(card.programCode).some(
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

  get filteredCourses(): EvaluatorCourseDetailRow[] {
    const q = (this.courseSearchControl.value ?? '').trim().toLowerCase();
    const prog = (this.courseFilterProgram.value ?? '').trim();
    const pre = (this.courseFilterPrereq.value ?? '').trim();
    const year = (this.courseFilterYear.value ?? '').trim();
    const sem = (this.courseFilterSemester.value ?? '').trim();

    return this.allCourses.filter((row) => {
      if (prog && row.program !== prog) {
        return false;
      }
      if (pre === EVALUATOR_COURSE_PREREQ_FILTER.noPre && evaluatorCourseHasPrerequisite(row.prerequisite)) {
        return false;
      }
      if (pre === EVALUATOR_COURSE_PREREQ_FILTER.withPre && !evaluatorCourseHasPrerequisite(row.prerequisite)) {
        return false;
      }
      if (year && !row.yearSem.includes(year)) {
        return false;
      }
      if (sem === '1st' && !row.yearSem.includes('1st')) {
        return false;
      }
      if (sem === '2nd' && !row.yearSem.includes('2nd')) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = [
        row.curriculum,
        row.program,
        row.courseCode,
        row.courseTitle,
        row.component,
        String(row.units),
        row.prerequisite,
        row.yearSem,
        row.description
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  get tableViewCurriculumOptions(): EvaluatorTableViewCurriculumOption[] {
    const prog = (this.tableViewProgram.value ?? '').trim();
    return getEvaluatorTableViewCurriculumOptions(prog);
  }

  get tableViewCourses(): EvaluatorCourseDetailRow[] {
    const curriculumId = (this.tableViewCurriculum.value ?? '').trim();
    if (!curriculumId) {
      return [];
    }
    const prog = this.resolveTableViewProgramCode(curriculumId);
    if (!prog) {
      return [];
    }
    if (prog === 'BSIT' && /^BSIT-\d{2}-01$/.test(curriculumId)) {
      return EVALUATOR_BSIT_MATRIX_COURSES_MOCK.map((row) => ({
        ...row,
        curriculum: curriculumId
      }));
    }
    return this.allCourses.filter((row) => row.program === prog && row.curriculum === curriculumId);
  }

  get tableViewSelectedCurriculum(): EvaluatorTableViewCurriculumOption | null {
    const curriculumId = (this.tableViewCurriculum.value ?? '').trim();
    if (!curriculumId) {
      return null;
    }
    return (
      getEvaluatorTableViewCurriculumOptions('').find((row) => row.curriculumId === curriculumId) ?? null
    );
  }

  get hasTableViewCurriculumSelected(): boolean {
    return !!(this.tableViewCurriculum.value ?? '').trim();
  }

  get tableViewResolvedProgramCode(): string {
    return this.resolveTableViewProgramCode((this.tableViewCurriculum.value ?? '').trim());
  }

  tableViewCurriculumDropdownLabel(option: EvaluatorTableViewCurriculumOption): string {
    return formatTableViewCurriculumDropdownLabel(option);
  }

  tableViewCurriculumVersionDisplay(): string {
    const selected = this.tableViewSelectedCurriculum;
    if (!selected) {
      return '';
    }
    return formatTableViewCurriculumVersionDisplay(selected);
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

  getTableViewTotalCourses(): number {
    const prog = this.resolveTableViewProgramCode((this.tableViewCurriculum.value ?? '').trim());
    if (prog === 'BSIT') {
      return EVALUATOR_BSIT_TABLE_VIEW_SUMMARY.footerTotalCourses;
    }
    return this.tableViewCourses.length;
  }

  getTableViewSummaryTotalUnits(): number {
    const prog = this.resolveTableViewProgramCode((this.tableViewCurriculum.value ?? '').trim());
    if (prog === 'BSIT') {
      return EVALUATOR_BSIT_TABLE_VIEW_SUMMARY.summaryTotalUnits;
    }
    return this.tableViewCourses.reduce((total, course) => total + course.units, 0);
  }

  getTableViewFooterTotalUnits(): number {
    const prog = this.resolveTableViewProgramCode((this.tableViewCurriculum.value ?? '').trim());
    if (prog === 'BSIT') {
      return EVALUATOR_BSIT_TABLE_VIEW_SUMMARY.footerTotalUnits;
    }
    return this.tableViewCourses.reduce((total, course) => total + course.units, 0);
  }

  getTableViewCompletionYears(): number {
    const curriculumId = (this.tableViewCurriculum.value ?? '').trim();
    const prog = this.resolveTableViewProgramCode(curriculumId);
    if (prog === 'BSIT') {
      return EVALUATOR_BSIT_TABLE_VIEW_SUMMARY.completionYears;
    }
    return EVALUATOR_PROGRAM_TABLE_META[prog as EvaluatorCourseProgramCode]?.completionYears ?? 0;
  }

  getTableViewProgramTitle(): string {
    const curriculumId = (this.tableViewCurriculum.value ?? '').trim();
    const prog = (this.resolveTableViewProgramCode(curriculumId) ??
      (this.tableViewProgram.value ?? '').trim()) as EvaluatorCourseProgramCode;
    return EVALUATOR_PROGRAM_TABLE_META[prog]?.programTitle ?? prog;
  }

  private resolveTableViewProgramCode(curriculumId: string): string {
    const fromSelect = (this.tableViewProgram.value ?? '').trim();
    if (fromSelect) {
      return fromSelect;
    }
    const match = curriculumId.match(/^([A-Z]+)-/);
    return match?.[1] ?? '';
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
    return 'Search courses...';
  }

}
