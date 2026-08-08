import {
  getDemoStudentConfig,
  SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS
} from './subject-evaluation-demo-students.mock';
import { findSubjectEvaluationStudent } from './subject-evaluation.mock';
import {
  SUGGESTED_NEW_SUBJECTS_MOCK,
  type SubjectSelectionSuggestedRow
} from './subject-evaluation-subject-selection.mock';

export interface ChargeSlipTuitionRow {
  readonly rowNumber: number;
  readonly subjectDescription: string;
  readonly units: number;
  readonly component: string;
  readonly curriculumVersion: string;
  readonly levelTerm: string;
  readonly cash: string;
  readonly lowMonthlyPayment: string;
}

export interface ChargeSlipFeeRow {
  readonly label: string;
  readonly cash: string;
  readonly lowMonthlyPayment: string;
}

export interface ChargeSlipPaymentRow {
  readonly label: string;
  readonly cash: string;
  readonly lowMonthlyPayment: string;
}

export interface ChargeSlipPreview {
  readonly studentName: string;
  readonly studentId: string;
  readonly program: string;
  readonly curriculumVersion: string;
  readonly levelTerm: string;
  readonly tuitionRows: readonly ChargeSlipTuitionRow[];
  readonly totalTuitionUnits: number;
  readonly totalTuitionCash: string;
  readonly totalTuitionLowMonthly: string;
  readonly otherSchoolFees: readonly ChargeSlipFeeRow[];
  readonly totalOsfCash: string;
  readonly totalOsfLowMonthly: string;
  readonly miscellaneousFees: readonly ChargeSlipFeeRow[];
  readonly totalMfCash: string;
  readonly totalMfLowMonthly: string;
  readonly grossAssessmentCash: string;
  readonly grossAssessmentLowMonthly: string;
  readonly paymentScheme: readonly ChargeSlipPaymentRow[];
  readonly paymentTotalCash: string;
  readonly paymentTotalLowMonthly: string;
}

const SHARED_OTHER_SCHOOL_FEES: readonly ChargeSlipFeeRow[] = [
  { label: 'ID Fee', cash: '150.00', lowMonthlyPayment: '150.00' },
  { label: 'Library Fee', cash: '500.00', lowMonthlyPayment: '500.00' },
  { label: 'Laboratory Fee', cash: '1,200.00', lowMonthlyPayment: '1,200.00' },
  { label: 'Registration Fee', cash: '350.00', lowMonthlyPayment: '350.00' },
  { label: 'Medical/Dental Fee', cash: '300.00', lowMonthlyPayment: '300.00' },
  { label: 'Athletic Fee', cash: '200.00', lowMonthlyPayment: '200.00' },
  { label: 'Cultural Fee', cash: '150.00', lowMonthlyPayment: '150.00' },
  { label: 'Guidance Fee', cash: '100.00', lowMonthlyPayment: '100.00' }
];

const SHARED_MISCELLANEOUS_FEES: readonly ChargeSlipFeeRow[] = [
  { label: 'Connectivity Fee', cash: '800.00', lowMonthlyPayment: '800.00' },
  { label: 'Student Handbook', cash: '200.00', lowMonthlyPayment: '200.00' },
  { label: 'Insurance', cash: '300.00', lowMonthlyPayment: '300.00' },
  { label: 'Building Fund', cash: '500.00', lowMonthlyPayment: '500.00' },
  { label: 'Energy Fee', cash: '250.00', lowMonthlyPayment: '250.00' },
  { label: 'Development Fee', cash: '400.00', lowMonthlyPayment: '400.00' }
];

const SHARED_PAYMENT_SCHEME: readonly ChargeSlipPaymentRow[] = [
  { label: 'Upon Enrollment/Required DP', cash: '', lowMonthlyPayment: '1,840.32' },
  { label: 'September 13, 2024', cash: '', lowMonthlyPayment: '977.67' },
  { label: 'October 18, 2024', cash: '', lowMonthlyPayment: '977.67' },
  { label: 'November 18, 2024', cash: '', lowMonthlyPayment: '977.67' },
  { label: 'December 14, 2024', cash: '', lowMonthlyPayment: '977.67' }
];

const SHARED_FEE_TOTALS = {
  totalOsfCash: '2,950.00',
  totalOsfLowMonthly: '3,141.75',
  totalMfCash: '2,450.00',
  totalMfLowMonthly: '2,609.25',
  grossAssessmentCash: '5,400.00',
  grossAssessmentLowMonthly: '5,751.00',
  paymentTotalCash: '5,400.00',
  paymentTotalLowMonthly: '5,751.00',
  totalTuitionCash: '0.00',
  totalTuitionLowMonthly: '0.00'
} as const;

function buildTuitionRows(
  selectionIds: readonly string[],
  curriculumVersion: string
): ChargeSlipTuitionRow[] {
  const byId = new Map<string, SubjectSelectionSuggestedRow>(
    SUGGESTED_NEW_SUBJECTS_MOCK.map((row) => [row.id, row])
  );

  const tuitionRows: ChargeSlipTuitionRow[] = [];
  selectionIds.forEach((id, index) => {
    const row = byId.get(id);
    if (!row) {
      return;
    }
    tuitionRows.push({
      rowNumber: index + 1,
      subjectDescription: row.subjectDescription,
      units: row.units,
      component: row.component,
      curriculumVersion,
      levelTerm: row.yearTerm,
      cash: '0.00',
      lowMonthlyPayment: '0.00'
    });
  });
  return tuitionRows;
}

function buildChargeSlipPreviewForStudent(studentId: string): ChargeSlipPreview | null {
  const config = getDemoStudentConfig(studentId);
  const student = findSubjectEvaluationStudent(studentId);
  if (!config || !student) {
    return null;
  }

  const tuitionRows = buildTuitionRows(config.defaultSelectionIds, config.chargeSlipCurriculumVersion);
  const totalTuitionUnits = tuitionRows.reduce((sum, row) => sum + row.units, 0);

  return {
    studentName: `${student.lastName}, ${student.firstName}`,
    studentId: student.studentNumber,
    program: student.programCode,
    curriculumVersion: config.chargeSlipCurriculumVersion,
    levelTerm: config.currentYearTerm,
    tuitionRows,
    totalTuitionUnits,
    ...SHARED_FEE_TOTALS,
    otherSchoolFees: SHARED_OTHER_SCHOOL_FEES,
    miscellaneousFees: SHARED_MISCELLANEOUS_FEES,
    paymentScheme: SHARED_PAYMENT_SCHEME
  };
}

const CHARGE_SLIP_BY_STUDENT: Readonly<Record<string, ChargeSlipPreview>> = Object.fromEntries(
  SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS.flatMap((id) => {
    const preview = buildChargeSlipPreviewForStudent(id);
    return preview ? [[id, preview] as const] : [];
  })
);

export function getChargeSlipPreview(studentId: string | null): ChargeSlipPreview | null {
  if (!studentId) {
    return null;
  }
  return CHARGE_SLIP_BY_STUDENT[studentId] ?? buildChargeSlipPreviewForStudent(studentId);
}
