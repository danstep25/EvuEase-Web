export interface CreditRequestListRow {
  readonly creditRequestNo: string;
  readonly studentNumber: string;
  readonly studentName: string;
  readonly programCode: string;
  readonly programName: string;
  readonly status: 'pending';
}

export const MOCK_CREDIT_REQUEST_ROWS: readonly CreditRequestListRow[] = [
  {
    creditRequestNo: 'CR-000001',
    studentNumber: '010000145959',
    studentName: 'Reyes, Pedro C.',
    programCode: 'BSIT',
    programName: 'Bachelor of Science in Information Technology',
    status: 'pending'
  }
];
