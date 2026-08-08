export interface EvaluatorOtherSchoolSchoolYearOption {
  value: string;
  label: string;
}

export const EVALUATOR_OTHER_SCHOOL_SCHOOL_YEAR_OPTIONS: EvaluatorOtherSchoolSchoolYearOption[] = [
  { value: 'SY2526', label: 'SY2526 - 2025-2026 (1st Semester)' },
  { value: 'SY2425-2', label: 'SY2425-2 - 2024-2025 (2nd Semester)' },
  { value: 'SY2425-1', label: 'SY2425-1 - 2024-2025 (1st Semester)' },
  { value: 'SY2324-2', label: 'SY2324-2 - 2023-2024 (2nd Semester)' },
  { value: 'SY2324-1', label: 'SY2324-1 - 2023-2024 (1st Semester)' },
  { value: 'SY2223-2', label: 'SY2223-2 - 2022-2023 (2nd Semester)' },
  { value: 'SY2223-1', label: 'SY2223-1 - 2022-2023 (1st Semester)' }
];

export const EVALUATOR_OTHER_SCHOOL_FEE_ADD_FORM_DEFAULTS = {
  syId: 'SY2526',
  batch: '2025',
  semester: '1st',
  schoolFee: 'ID Fee',
  cash: 150,
  lowMonthlyPayment: 150
} as const;

export interface EvaluatorOtherSchoolFeeRow {
  id: string;
  syId: string;
  batch: string;
  semester: string;
  schoolFee: string;
  cash: number;
  lowMonthlyPayment: number;
}

export const EVALUATOR_OTHER_SCHOOL_FEES_MOCK: EvaluatorOtherSchoolFeeRow[] = [
  {
    id: 'osf-1',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'ID Fee',
    cash: 150,
    lowMonthlyPayment: 150
  },
  {
    id: 'osf-2',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Library Fee',
    cash: 500,
    lowMonthlyPayment: 500
  },
  {
    id: 'osf-3',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Laboratory Fee',
    cash: 1200,
    lowMonthlyPayment: 1200
  },
  {
    id: 'osf-4',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Registration Fee',
    cash: 350,
    lowMonthlyPayment: 350
  },
  {
    id: 'osf-5',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Medical/Dental Fee',
    cash: 300,
    lowMonthlyPayment: 300
  },
  {
    id: 'osf-6',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Athletic Fee',
    cash: 200,
    lowMonthlyPayment: 200
  },
  {
    id: 'osf-7',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Cultural Fee',
    cash: 150,
    lowMonthlyPayment: 150
  },
  {
    id: 'osf-8',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    schoolFee: 'Guidance Fee',
    cash: 100,
    lowMonthlyPayment: 100
  }
];

