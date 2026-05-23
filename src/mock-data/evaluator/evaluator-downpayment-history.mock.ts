export interface EvaluatorDownpaymentHistoryRow {
  id: string;
  programCode: string;
  downpaymentPercent: number;
  effectiveSchoolYear: string;
  updatedBy: string;
  dateModified: string;
}

export const EVALUATOR_DOWNPAYMENT_HISTORY_MOCK: EvaluatorDownpaymentHistoryRow[] = [
  {
    id: 'dph-bsit-1',
    programCode: 'BSIT',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    updatedBy: 'Registrar Admin',
    dateModified: '2026-05-17T10:30:00'
  },
  {
    id: 'dph-bsit-2',
    programCode: 'BSIT',
    downpaymentPercent: 45,
    effectiveSchoolYear: 'SY2023-2024',
    updatedBy: 'Jane Smith',
    dateModified: '2025-06-15T14:20:00'
  },
  {
    id: 'dph-bsit-3',
    programCode: 'BSIT',
    downpaymentPercent: 40,
    effectiveSchoolYear: 'SY2022-2023',
    updatedBy: 'John Doe',
    dateModified: '2024-05-10T09:15:00'
  },
  {
    id: 'dph-bscs-1',
    programCode: 'BSCS',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    updatedBy: 'Registrar Admin',
    dateModified: '2026-05-17T10:30:00'
  },
  {
    id: 'dph-bscs-2',
    programCode: 'BSCS',
    downpaymentPercent: 45,
    effectiveSchoolYear: 'SY2023-2024',
    updatedBy: 'Jane Smith',
    dateModified: '2025-06-15T14:20:00'
  },
  {
    id: 'dph-act-1',
    programCode: 'ACT',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    updatedBy: 'Registrar Admin',
    dateModified: '2026-05-17T10:30:00'
  },
  {
    id: 'dph-bsba-1',
    programCode: 'BSBA',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    updatedBy: 'Registrar Admin',
    dateModified: '2026-05-17T10:30:00'
  },
  {
    id: 'dph-bshm-1',
    programCode: 'BSHM',
    downpaymentPercent: 50,
    effectiveSchoolYear: 'SY2024-2025',
    updatedBy: 'Registrar Admin',
    dateModified: '2026-05-17T10:30:00'
  }
];

export function getEvaluatorDownpaymentHistoryByProgram(programCode: string): EvaluatorDownpaymentHistoryRow[] {
  const code = programCode.trim().toUpperCase();
  return EVALUATOR_DOWNPAYMENT_HISTORY_MOCK.filter((row) => row.programCode.toUpperCase() === code);
}
