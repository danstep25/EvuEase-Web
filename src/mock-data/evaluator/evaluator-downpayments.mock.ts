export interface EvaluatorDownpaymentRow {
  id: string;
  programCode: string;
  programTitle: string;
  batch: string;
  downpaymentPercent: number;
  effectiveSchoolYear: string;
  lastUpdated: string;
}

export const EVALUATOR_DOWNPAYMENTS_MOCK: EvaluatorDownpaymentRow[] = [
  {
    id: 'dp-1',
    programCode: 'BSIT',
    programTitle: 'Bachelor of Science in Information Technology',
    batch: '2025',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    lastUpdated: '2026-05-17'
  },
  {
    id: 'dp-2',
    programCode: 'BSCS',
    programTitle: 'Bachelor of Science in Computer Science',
    batch: '2025',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    lastUpdated: '2026-05-17'
  },
  {
    id: 'dp-3',
    programCode: 'ACT',
    programTitle: 'Associate in Computer Technology',
    batch: '2025',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    lastUpdated: '2026-05-17'
  },
  {
    id: 'dp-4',
    programCode: 'BSBA',
    programTitle: 'Bachelor of Science in Business Administration',
    batch: '2025',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    lastUpdated: '2026-05-17'
  },
  {
    id: 'dp-5',
    programCode: 'BSHM',
    programTitle: 'Bachelor of Science in Hospitality Management',
    batch: '2025',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    lastUpdated: '2026-05-17'
  }
];
