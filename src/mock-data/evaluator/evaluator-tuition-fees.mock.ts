export type EvaluatorFeeSubTab =
  | 'tuition-fees'
  | 'other-school-fees'
  | 'miscellaneous-fees'
  | 'downpayment';

export interface EvaluatorTuitionSchoolYearOption {
  value: string;
  label: string;
}

export const EVALUATOR_TUITION_SCHOOL_YEAR_OPTIONS: EvaluatorTuitionSchoolYearOption[] = [
  { value: 'SY2526', label: 'SY2526 - 2025-2026 (1st Semester)' }
];

export const EVALUATOR_TUITION_BATCH_OPTIONS = ['2025', '2024'] as const;

export const EVALUATOR_TUITION_SEMESTER_OPTIONS = ['1st', '2nd', 'Summer'] as const;

export const EVALUATOR_TUITION_COMPONENT_OPTIONS = ['Lecture', 'Laboratory', 'Lec/Lab'] as const;

export const EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS = {
  syId: 'SY2526',
  batch: '2025',
  semester: '1st',
  courseCode: 'IT101',
  courseTitle: 'Introduction to Computing',
  component: 'Lec/Lab',
  units: 3,
  cash: 3485,
  lowMonthlyPayment: 3785
} as const;

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

export const EVALUATOR_TUITION_FEES_MOCK: EvaluatorTuitionFeeRow[] = [
  {
    id: 'tf-1',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    courseCode: 'IT101',
    courseTitle: 'Introduction to Computing',
    component: 'Lec/Lab',
    units: 3,
    cash: 3485,
    lowMonthlyPayment: 3785
  },
  {
    id: 'tf-2',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    courseCode: 'IT102',
    courseTitle: 'Computer Programming 1',
    component: 'Lec/Lab',
    units: 3,
    cash: 3485,
    lowMonthlyPayment: 3785
  },
  {
    id: 'tf-3',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    courseCode: 'MATH101',
    courseTitle: 'College Algebra',
    component: 'Lecture',
    units: 3,
    cash: 2885,
    lowMonthlyPayment: 3100
  },
  {
    id: 'tf-4',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    courseCode: 'ENG101',
    courseTitle: 'Purposive Communication',
    component: 'Lecture',
    units: 3,
    cash: 2885,
    lowMonthlyPayment: 3100
  },
  {
    id: 'tf-5',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    courseCode: 'NSTP101',
    courseTitle: 'National Service Training Program 1',
    component: 'Lecture',
    units: 3,
    cash: 2885,
    lowMonthlyPayment: 3100
  },
  {
    id: 'tf-6',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    courseCode: 'PE101',
    courseTitle: 'Physical Education 1',
    component: 'Lecture',
    units: 2,
    cash: 1925,
    lowMonthlyPayment: 2066
  }
];

