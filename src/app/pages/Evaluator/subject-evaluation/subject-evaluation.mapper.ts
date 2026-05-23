import { Course } from '../../../core/models/course.model';
import { Curricula } from '../../../core/models/curricula.model';
import { MiscellaneousFee } from '../../../core/models/miscellaneous-fee.model';
import { OtherSchoolFee } from '../../../core/models/other-school-fee.model';
import { Downpayment } from '../../../core/models/downpayment.model';
import { Student } from '../../../core/models/student.model';
import { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';
import { SyTerm } from '../../../core/models/sy-term.model';
import { TuitionFee } from '../../../core/models/tuition-fee.model';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import {
  isEnrollmentFailed,
  isEnrollmentPassed,
  parseOfficialGradeToNumber
} from '../../Registrar/students/student-enrollments.mapper';
import { buildCurriculumDisplayLabel } from '../../Registrar/students/student-curriculum.mapper';
import { mapCourseFromApi } from '../student-permanent-records/evaluator-migrate-curriculum.mapper';
import type {
  AddSubjectCatalogItem,
  ChargeSlipFeeRow,
  ChargeSlipPaymentRow,
  ChargeSlipPreview,
  ChargeSlipTuitionRow,
  SubjectEvaluationFilterOption,
  SubjectEvaluationFinishedSubjectRow,
  SubjectEvaluationStudentSummary,
  SubjectEvaluationUpcomingTerm,
  SubjectSelectionState,
  SubjectSelectionSuggestedRow,
  SubjectSelectionUnitsSummary
} from './subject-evaluation.models';

const DEFAULT_UNIT_LIMIT = 23;

export const YEAR_LEVEL_FILTER_OPTIONS: readonly SubjectEvaluationFilterOption[] = [
  { value: 'all', label: 'All Year Levels' },
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' }
];

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso?.trim()) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeCode(code: string | null | undefined): string {
  return code?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
}

function passedCourseCodes(enrollments: readonly StudentClassEnrollmentRow[]): Set<string> {
  const passed = new Set<string>();
  for (const row of enrollments) {
    if (isEnrollmentPassed(row)) {
      const key = normalizeCode(row.courseCode);
      if (key) {
        passed.add(key);
      }
    }
  }
  return passed;
}

function prerequisiteMet(prerequisite: string, passed: Set<string>): boolean {
  const raw = prerequisite?.trim() ?? '';
  if (!raw || raw.toLowerCase() === 'none') {
    return true;
  }
  const codes = raw.split(/[,;]/).map((p) => p.trim().toLowerCase().replace(/\s+/g, '')).filter(Boolean);
  return codes.every((code) => passed.has(code));
}

export function parseYearLevelFilterKey(yearLevel: string): string | null {
  const match = yearLevel.match(/Year\s*(\d)/i);
  if (!match) {
    return null;
  }
  const key = match[1];
  return key === '1' || key === '2' || key === '3' || key === '4' ? key : null;
}

export function toYearTermKey(courseYearLevel: string, courseSemester: string): string {
  const yearDigit = courseYearLevel.match(/(\d)/)?.[1] ?? '1';
  const semDigit = /2nd|second/i.test(courseSemester) ? '2' : '1';
  return `${yearDigit}Y${semDigit}`;
}

export function parseStudentCurrentYearTerm(yearLevel: string): string {
  const short = yearLevel.match(/Year\s*(.+)$/i)?.[1]?.trim();
  if (short && /^\dY\d$/i.test(short.replace(/\s/g, ''))) {
    return short.replace(/\s/g, '').toUpperCase();
  }
  const key = parseYearLevelFilterKey(yearLevel);
  return key ? `${key}Y1` : '1Y1';
}

export function mapUpcomingTerm(terms: readonly SyTerm[]): SubjectEvaluationUpcomingTerm | null {
  const active = terms.filter((t) => (t.syStatus ?? '').toLowerCase() === 'active');
  const pool = active.length > 0 ? active : [...terms];
  if (pool.length === 0) {
    return null;
  }

  const sorted = [...pool].sort((a, b) => {
    const da = Date.parse(a.syEnrollmentStart ?? '') || 0;
    const db = Date.parse(b.syEnrollmentStart ?? '') || 0;
    return db - da;
  });

  const term = sorted[0];
  return {
    schoolYearTerm: `${term.syYear} - ${term.sySemester}`,
    enrollmentPeriod: `${formatDateDisplay(term.syEnrollmentStart)} - ${formatDateDisplay(term.syEnrollmentEnd)}`
  };
}

export function buildProgramFilterOptions(programCodes: readonly string[]): readonly SubjectEvaluationFilterOption[] {
  const unique = [...new Set(programCodes.map((c) => c.trim()).filter(Boolean))].sort();
  return [{ value: 'all', label: 'All Programs' }, ...unique.map((code) => ({ value: code, label: code }))];
}

export function toStudentOption(student: Student): SearchableSelectOption {
  const given = [student.firstName, student.middleName].filter(Boolean).join(' ').trim();
  return {
    id: String(student.id),
    primary: `${student.studentNumber} - ${student.lastName}, ${given || student.firstName}`,
    secondary: `${student.programCode} - ${student.yearLevel}`
  };
}

export function filterStudents(
  students: readonly Student[],
  programFilter: string,
  yearLevelFilter: string
): readonly Student[] {
  return students.filter((s) => {
    if (programFilter !== 'all' && s.programCode.toLowerCase() !== programFilter.toLowerCase()) {
      return false;
    }
    if (yearLevelFilter !== 'all') {
      const key = parseYearLevelFilterKey(s.yearLevel);
      if (key !== yearLevelFilter) {
        return false;
      }
    }
    return true;
  });
}

export function buildStudentSummary(student: Student, curricula: Curricula | null): SubjectEvaluationStudentSummary {
  const given = [student.firstName, student.middleName].filter(Boolean).join(' ').trim();
  const curriculumCode = student.curriculumCode?.trim();
  return {
    studentName: `${student.lastName}, ${given || student.firstName}`,
    programYearLevel: `${student.programCode} - ${student.yearLevel}`,
    curriculum: buildCurriculumDisplayLabel(curriculumCode, curricula)
  };
}

export function mapFinishedSubjects(
  enrollments: readonly StudentClassEnrollmentRow[]
): readonly SubjectEvaluationFinishedSubjectRow[] {
  return enrollments
    .filter((e) => isEnrollmentPassed(e) || isEnrollmentFailed(e))
    .map((e) => {
      const gradeNum = parseOfficialGradeToNumber(e.officialGrade);
      const remarks: 'Passed' | 'Failed' = isEnrollmentFailed(e) ? 'Failed' : 'Passed';
      return {
        courseCode: e.courseCode,
        subjectDescription: e.courseTitle || e.courseCode,
        prerequisite: '—',
        units: e.units ?? 0,
        grade: gradeNum != null ? gradeNum.toFixed(2) : (e.officialGrade?.trim() || '—'),
        remarks
      };
    });
}

function mapCourseToSuggestedRow(course: Course): SubjectSelectionSuggestedRow {
  const yearTerm = toYearTermKey(course.courseYearLevel ?? '', course.courseSemester ?? '');
  return {
    id: `${course.courseCode}-${yearTerm}`,
    courseCode: course.courseCode,
    subjectDescription: course.courseTitle,
    prerequisite: course.prerequisites?.trim() || 'None',
    units: course.courseTotalUnits ?? 0,
    component: course.courseComponent?.trim() || 'Lecture',
    yearTerm
  };
}

export function buildSubjectSelectionState(
  student: Student,
  courses: readonly Course[],
  enrollments: readonly StudentClassEnrollmentRow[]
): SubjectSelectionState {
  const passed = passedCourseCodes(enrollments);
  const currentYearTerm = parseStudentCurrentYearTerm(student.yearLevel);

  const eligible = courses
    .map(mapCourseToSuggestedRow)
    .filter((row) => {
      const codeKey = normalizeCode(row.courseCode);
      if (passed.has(codeKey)) {
        return false;
      }
      return prerequisiteMet(row.prerequisite, passed);
    });

  const currentTermCourses = eligible.filter((r) => r.yearTerm === currentYearTerm);
  const regularUnitsForNextTerm = currentTermCourses.reduce((sum, r) => sum + r.units, 0);
  const unitLimit = Math.max(regularUnitsForNextTerm, DEFAULT_UNIT_LIMIT);

  return {
    limits: { regularUnitsForNextTerm, unitLimit },
    currentYearTerm,
    allTermCourses: eligible
  };
}

export function getCurrentTermSuggestedCourses(
  state: SubjectSelectionState
): readonly SubjectSelectionSuggestedRow[] {
  return state.allTermCourses.filter((row) => row.yearTerm === state.currentYearTerm);
}

export function pickDefaultSelectionIds(
  state: SubjectSelectionState,
  unitLimit = state.limits.unitLimit
): readonly string[] {
  const pool = getCurrentTermSuggestedCourses(state);
  const selected: string[] = [];
  let total = 0;
  for (const row of pool) {
    if (total + row.units > unitLimit) {
      continue;
    }
    selected.push(row.id);
    total += row.units;
  }
  return selected;
}

export function computeSuggestedUnitsSelected(
  courses: readonly SubjectSelectionSuggestedRow[],
  selectedIds: ReadonlySet<string>
): number {
  return courses.filter((c) => selectedIds.has(c.id)).reduce((sum, c) => sum + c.units, 0);
}

export function buildUnitsSummary(
  regularUnitsForNextTerm: number,
  totalUnitsSelected: number,
  unitLimit: number
): SubjectSelectionUnitsSummary {
  return { regularUnitsForNextTerm, totalUnitsSelected, unitLimit };
}

export function subjectSelectionExceedsLimit(summary: SubjectSelectionUnitsSummary): boolean {
  return summary.totalUnitsSelected > summary.unitLimit;
}

export function buildAddSubjectCatalog(
  courses: readonly Course[],
  enrollments: readonly StudentClassEnrollmentRow[],
  excludeCourseCodes: readonly string[],
  termLabel: string
): readonly AddSubjectCatalogItem[] {
  const passed = passedCourseCodes(enrollments);
  const excluded = new Set(excludeCourseCodes.map((c) => normalizeCode(c)));

  return courses
    .filter((c) => {
      const key = normalizeCode(c.courseCode);
      return key && !passed.has(key) && !excluded.has(key);
    })
    .map((c) => ({
      courseCode: c.courseCode,
      subjectDescription: c.courseTitle,
      prerequisite: c.prerequisites?.trim() || 'None',
      units: c.courseTotalUnits ?? 0,
      termLabel,
      prerequisiteMet: prerequisiteMet(c.prerequisites?.trim() || 'None', passed)
    }));
}

export function filterAddSubjectCatalog(
  catalog: readonly AddSubjectCatalogItem[],
  query: string,
  excludeCourseCodes: readonly string[]
): readonly AddSubjectCatalogItem[] {
  const excluded = new Set(excludeCourseCodes.map((c) => normalizeCode(c)));
  const q = query.trim().toLowerCase();
  return catalog.filter((item) => {
    if (excluded.has(normalizeCode(item.courseCode))) {
      return false;
    }
    if (!q) {
      return true;
    }
    return (
      item.courseCode.toLowerCase().includes(q) ||
      item.subjectDescription.toLowerCase().includes(q)
    );
  });
}

function curriculumVersionFrom(curricula: Curricula | null, curriculumCode: string | null | undefined): string {
  const version = curricula?.version?.trim();
  if (version) {
    return version;
  }
  const code = curriculumCode?.trim() ?? '';
  const parts = code.split('-');
  return parts.length >= 2 ? parts.slice(1).join('-') : code || '—';
}

function mapFeeRows<T extends { cash: number; lowMonthlyPayment: number }>(
  items: readonly T[],
  label: (item: T) => string
): ChargeSlipFeeRow[] {
  return items.map((item) => ({
    label: label(item),
    cash: formatMoney(item.cash),
    lowMonthlyPayment: formatMoney(item.lowMonthlyPayment)
  }));
}

function sumFeeMoney(rows: readonly ChargeSlipFeeRow[]): { cash: number; lowMonthly: number } {
  return rows.reduce(
    (acc, row) => ({
      cash: acc.cash + parseFloat(row.cash.replace(/,/g, '')),
      lowMonthly: acc.lowMonthly + parseFloat(row.lowMonthlyPayment.replace(/,/g, ''))
    }),
    { cash: 0, lowMonthly: 0 }
  );
}

export function buildChargeSlipPreview(
  student: Student,
  curricula: Curricula | null,
  selectionRows: readonly SubjectSelectionSuggestedRow[],
  selectedIds: readonly string[],
  tuitionFees: readonly TuitionFee[],
  otherSchoolFees: readonly OtherSchoolFee[],
  miscellaneousFees: readonly MiscellaneousFee[],
  downpayments: readonly Downpayment[],
  currentYearTerm: string
): ChargeSlipPreview {
  const selected = selectionRows.filter((r) => selectedIds.includes(r.id));
  const tuitionByCode = new Map(
    tuitionFees.map((t) => [normalizeCode(t.courseCode), t])
  );

  const curriculumVersion = curriculumVersionFrom(curricula, student.curriculumCode);
  const tuitionRows: ChargeSlipTuitionRow[] = selected.map((row, index) => {
    const fee = tuitionByCode.get(normalizeCode(row.courseCode));
    const cash = fee?.cash ?? 0;
    const low = fee?.lowMonthlyPayment ?? 0;
    return {
      rowNumber: index + 1,
      subjectDescription: row.subjectDescription,
      units: row.units,
      component: row.component,
      curriculumVersion,
      levelTerm: row.yearTerm,
      cash: formatMoney(cash),
      lowMonthlyPayment: formatMoney(low)
    };
  });

  const totalTuitionCash = tuitionRows.reduce((s, r) => s + parseFloat(r.cash.replace(/,/g, '')), 0);
  const totalTuitionLow = tuitionRows.reduce(
    (s, r) => s + parseFloat(r.lowMonthlyPayment.replace(/,/g, '')),
    0
  );
  const totalTuitionUnits = tuitionRows.reduce((s, r) => s + r.units, 0);

  const osfRows = mapFeeRows(otherSchoolFees, (f) => f.schoolFee?.trim() || 'Other School Fee');
  const mfRows = mapFeeRows(miscellaneousFees, (f) => f.miscellaneousFee?.trim() || 'Miscellaneous Fee');
  const osfTotals = sumFeeMoney(osfRows);
  const mfTotals = sumFeeMoney(mfRows);

  const grossCash = totalTuitionCash + osfTotals.cash + mfTotals.cash;
  const grossLow = totalTuitionLow + osfTotals.lowMonthly + mfTotals.lowMonthly;

  const dp =
    downpayments.find((d) => d.programCode.toLowerCase() === student.programCode.toLowerCase()) ??
    downpayments[0];

  const paymentScheme: ChargeSlipPaymentRow[] = [
    {
      label: 'Upon Enrollment/Required DP',
      cash: '',
      lowMonthlyPayment: dp ? formatMoney((grossLow * dp.downpaymentPercent) / 100) : formatMoney(0)
    },
    {
      label: 'Remaining balance (estimate)',
      cash: '',
      lowMonthlyPayment: formatMoney(Math.max(0, grossLow - (dp ? (grossLow * dp.downpaymentPercent) / 100 : 0)))
    }
  ];

  const given = [student.firstName, student.middleName].filter(Boolean).join(' ').trim();

  return {
    studentName: `${student.lastName}, ${given || student.firstName}`,
    studentId: student.studentNumber,
    program: student.programCode,
    curriculumVersion,
    levelTerm: currentYearTerm,
    tuitionRows,
    totalTuitionUnits,
    totalTuitionCash: formatMoney(totalTuitionCash),
    totalTuitionLowMonthly: formatMoney(totalTuitionLow),
    otherSchoolFees: osfRows,
    totalOsfCash: formatMoney(osfTotals.cash),
    totalOsfLowMonthly: formatMoney(osfTotals.lowMonthly),
    miscellaneousFees: mfRows,
    totalMfCash: formatMoney(mfTotals.cash),
    totalMfLowMonthly: formatMoney(mfTotals.lowMonthly),
    grossAssessmentCash: formatMoney(grossCash),
    grossAssessmentLowMonthly: formatMoney(grossLow),
    paymentScheme,
    paymentTotalCash: formatMoney(grossCash),
    paymentTotalLowMonthly: formatMoney(grossLow)
  };
}
