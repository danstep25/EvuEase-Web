import { CreditRequest } from '../../../core/models/credit-request.model';
import { CREDIT_REQUEST_PREVIEW_MIN_TABLE_ROWS } from '../../../../mock-data/evaluator/add-credit-request-preview.mock';

export interface CreditRequestPreviewTableRow {
  appliedCode: string;
  appliedTitle: string;
  lecDisplay: string;
  labDisplay: string;
  gradeDisplay: string;
  equivalentCode: string;
  equivalentTitle: string;
  equivalentLecDisplay: string;
  equivalentLabDisplay: string;
  unitsDisplay: string;
  hasEquivalent: boolean;
  isFilled: boolean;
}

export function formatCreditRequestTermLabel(request: CreditRequest): string {
  const semester = request.sySemester?.replace(/\s*semester\s*/i, '').trim() ?? '';
  const year = request.syYear?.trim() ?? '';
  if (semester && year) {
    return `${semester} ${year}`;
  }
  return request.syCode?.trim() || '—';
}

export function buildCreditRequestPreviewRows(request: CreditRequest): CreditRequestPreviewTableRow[] {
  const lines = request.lines ?? [];
  const filled: CreditRequestPreviewTableRow[] = lines.map((line) => {
    const lec = Number(line.appliedLecUnits ?? 0);
    const lab = Number(line.appliedLabUnits ?? 0);
    const equivalentLec = Number(line.equivalentLecUnits ?? 0);
    const equivalentLab = Number(line.equivalentLabUnits ?? 0);
    const equivalentTotal = Number(line.equivalentTotalUnits ?? 0);

    return {
      appliedCode: trimOrDash(line.appliedCourseCode),
      appliedTitle: trimOrDash(line.appliedCourseTitle),
      lecDisplay: formatPreviewUnitCell(lec),
      labDisplay: formatPreviewUnitCell(lab),
      gradeDisplay: trimOrDash(line.grade),
      equivalentCode: trimOrDash(line.equivalentCourseCode),
      equivalentTitle: trimOrDash(line.equivalentCourseTitle),
      equivalentLecDisplay: formatPreviewUnitCell(equivalentLec),
      equivalentLabDisplay: formatPreviewUnitCell(equivalentLab),
      unitsDisplay: formatPreviewUnitCell(equivalentTotal),
      hasEquivalent: !!String(line.equivalentCourseCode ?? '').trim(),
      isFilled: true
    };
  });

  const emptyCount = Math.max(0, CREDIT_REQUEST_PREVIEW_MIN_TABLE_ROWS - filled.length);
  const emptyRows: CreditRequestPreviewTableRow[] = Array.from({ length: emptyCount }, () => ({
    appliedCode: '',
    appliedTitle: '',
    lecDisplay: '',
    labDisplay: '',
    gradeDisplay: '',
    equivalentCode: '',
    equivalentTitle: '',
    equivalentLecDisplay: '',
    equivalentLabDisplay: '',
    unitsDisplay: '',
    hasEquivalent: false,
    isFilled: false
  }));

  return [...filled, ...emptyRows];
}

function trimOrDash(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  return trimmed || '—';
}

function formatPreviewUnitCell(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return String(value);
}
