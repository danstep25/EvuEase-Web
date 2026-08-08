export type EvaluatorCurriculumTab = 'curricula' | 'courses' | 'fees';
export type EvaluatorCourseViewMode = 'list' | 'table';
export type EvaluatorCurriculumStatus = 'active' | 'inactive';

export type EvaluatorFeeSubTab =
  | 'tuition-fees'
  | 'other-school-fees'
  | 'miscellaneous-fees'
  | 'downpayment'
  | 'payment-scheme';

export interface EvaluatorCourseFilterOption {
  value: string;
  label: string;
}

export type EvaluatorCourseSemesterLabel = '1st Semester' | '2nd Semester';

export interface EvaluatorCurriculumRow {
  id: string;
  curriculumId: string;
  version: string;
  program: string;
  schoolYear: string;
  effectiveDate: string;
  status: EvaluatorCurriculumStatus;
}

export interface EvaluatorCurriculumProgramCard {
  readonly programCode: string;
  readonly versionCount: number;
  readonly activeCount: number;
}

export interface EvaluatorCourseProgramCard {
  readonly programCode: string;
  readonly courseCount: number;
  readonly versionCount: number;
}

export interface EvaluatorTableViewCurriculumOption extends EvaluatorCurriculumRow {
  versionSuffix: string;
}

export interface EvaluatorCourseDetailRow {
  id: string;
  curriculum: string;
  program: string;
  courseCode: string;
  courseTitle: string;
  component: string;
  units: number;
  prerequisite: string;
  yearSem: string;
  courseYearLevel?: string;
  courseSemester?: string;
  description: string;
}

export interface EvaluatorTuitionFeeRow {
  id: string;
  syId: string;
  batch: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  component: string;
  units: number;
  cash: number;
  lowMonthlyPayment: number;
}

export interface EvaluatorOtherSchoolFeeRow {
  id: string;
  syId: string;
  batch: string;
  semester: string;
  schoolFee: string;
  cash: number;
  lowMonthlyPayment: number;
}

export interface EvaluatorMiscellaneousFeeRow {
  id: string;
  syId: string;
  batch: string;
  semester: string;
  miscellaneousFee: string;
  cash: number;
  lowMonthlyPayment: number;
}

export interface EvaluatorDownpaymentRow {
  id: string;
  programCode: string;
  programTitle: string;
  batch: string;
  downpaymentPercent: number;
  effectiveSchoolYear: string;
  lastUpdated: string;
}

export interface EvaluatorDownpaymentHistoryRow {
  id: string;
  programCode: string;
  downpaymentPercent: number;
  effectiveSchoolYear: string;
  updatedBy: string;
  dateModified: string;
}

export interface EvaluatorProgramTableMeta {
  programTitle: string;
  completionYears: number;
  totalUnits: number | null;
}
