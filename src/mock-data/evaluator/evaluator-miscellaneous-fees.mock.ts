/** Default field values for Add Miscellaneous Fee UI (mock only). */
export const EVALUATOR_MISCELLANEOUS_FEE_ADD_FORM_DEFAULTS = {
  syId: '',
  batch: '2025',
  semester: '',
  miscellaneousFee: '',
  cash: 0,
  lowMonthlyPayment: 0
} as const;

export interface EvaluatorMiscellaneousFeeRow {
  id: string;
  syId: string;
  batch: string;
  semester: string;
  miscellaneousFee: string;
  cash: number;
  lowMonthlyPayment: number;
}

export const EVALUATOR_MISCELLANEOUS_FEES_MOCK: EvaluatorMiscellaneousFeeRow[] = [
  {
    id: 'mf-1',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    miscellaneousFee: 'Connectivity Fee',
    cash: 800,
    lowMonthlyPayment: 800
  },
  {
    id: 'mf-2',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    miscellaneousFee: 'Student Handbook',
    cash: 200,
    lowMonthlyPayment: 200
  },
  {
    id: 'mf-3',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    miscellaneousFee: 'Insurance',
    cash: 300,
    lowMonthlyPayment: 300
  },
  {
    id: 'mf-4',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    miscellaneousFee: 'Building Fund',
    cash: 500,
    lowMonthlyPayment: 500
  },
  {
    id: 'mf-5',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    miscellaneousFee: 'Energy Fee',
    cash: 250,
    lowMonthlyPayment: 250
  },
  {
    id: 'mf-6',
    syId: 'SY2526',
    batch: '2025',
    semester: '1st',
    miscellaneousFee: 'Development Fee',
    cash: 400,
    lowMonthlyPayment: 400
  }
];
