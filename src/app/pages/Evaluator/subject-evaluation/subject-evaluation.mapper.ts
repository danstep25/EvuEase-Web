import { Course } from '../../../core/models/course.model';
import { Curricula } from '../../../core/models/curricula.model';
import { MiscellaneousFee } from '../../../core/models/miscellaneous-fee.model';
import { OtherSchoolFee } from '../../../core/models/other-school-fee.model';
import { Downpayment } from '../../../core/models/downpayment.model';
import { PaymentScheme } from '../../../core/models/payment-scheme.model';
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
import {
  ElectiveOptionChoice,
  isElectiveOptionCourse,
  isElectiveSlotCourse,
  mapCourseToElectiveOption
} from '../../../shared/utils/elective-subject.util';
import { studentYearTermToCurriculumTermLabel } from '../../../shared/utils/student-year-level.util';
import {
  normalizeCurriculumSemester,
  normalizeCurriculumYearLevel
} from '../../../shared/utils/curriculum-course-term.util';
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
  SubjectSelectionUnitsSummary,
  SubjectSelectionYearTermGroup
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

const YEAR_LEVEL_FILTER_KEY_BY_LABEL: Readonly<Record<string, string>> = {
  '1': '1',
  '1st': '1',
  '1st year': '1',
  'first': '1',
  'first year': '1',
  'year 1': '1',
  '2': '2',
  '2nd': '2',
  '2nd year': '2',
  'second': '2',
  'second year': '2',
  'year 2': '2',
  '3': '3',
  '3rd': '3',
  '3rd year': '3',
  'third': '3',
  'third year': '3',
  'year 3': '3',
  '4': '4',
  '4th': '4',
  '4th year': '4',
  'fourth': '4',
  'fourth year': '4',
  'year 4': '4',
  '5': '5',
  '5th': '5',
  '5th year': '5',
  'fifth': '5',
  'fifth year': '5',
  'year 5': '5'
};

function isYearLevelFilterKey(value: string): value is '1' | '2' | '3' | '4' | '5' {
  return value === '1' || value === '2' || value === '3' || value === '4' || value === '5';
}

function normalizeYearLevelFilterKey(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized || normalized === 'all') {
    return null;
  }
  return parseYearLevelFilterKey(normalized) ?? (isYearLevelFilterKey(normalized) ? normalized : null);
}

export function parseYearLevelFilterKey(yearLevel: string | null | undefined): string | null {
  const normalized = yearLevel?.trim().toLowerCase() ?? '';
  if (!normalized) {
    return null;
  }

  const fromLabel = YEAR_LEVEL_FILTER_KEY_BY_LABEL[normalized];
  if (fromLabel) {
    return fromLabel;
  }

  const compact = normalized.replace(/\s/g, '');
  if (/^\dY\d$/i.test(compact)) {
    const digit = compact.charAt(0);
    if (isYearLevelFilterKey(digit)) {
      return digit;
    }
  }

  const yearTermMatch = normalized.match(/year\s*(\d)\s*y/i);
  if (yearTermMatch?.[1] && isYearLevelFilterKey(yearTermMatch[1])) {
    return yearTermMatch[1];
  }

  const yearOnlyMatch = normalized.match(/year\s*(\d)(?:\s|$|y)/i);
  if (yearOnlyMatch?.[1] && isYearLevelFilterKey(yearOnlyMatch[1])) {
    return yearOnlyMatch[1];
  }

  const ordinalMatch = normalized.match(/^(\d)(?:st|nd|rd|th)(?:\s+year)?$/i);
  if (ordinalMatch?.[1] && isYearLevelFilterKey(ordinalMatch[1])) {
    return ordinalMatch[1];
  }

  return null;
}

export function yearLevelMatchesFilter(
  studentYearLevel: string | null | undefined,
  yearLevelFilter: string
): boolean {
  const filterKey = normalizeYearLevelFilterKey(yearLevelFilter);
  if (!filterKey) {
    return true;
  }
  return parseYearLevelFilterKey(studentYearLevel) === filterKey;
}

export function toYearTermKey(courseYearLevel: string, courseSemester: string): string {
  const normalizedYear = normalizeCurriculumYearLevel(courseYearLevel);
  const yearMatch = normalizedYear.match(/^Year\s*(\d+)/i);
  const yearDigit =
    yearMatch?.[1] ??
    parseYearLevelFilterKey(courseYearLevel) ??
    courseYearLevel.match(/(\d)/)?.[1] ??
    '1';
  const normalizedSem = normalizeCurriculumSemester(courseSemester);
  const semDigit = /2nd|second/i.test(normalizedSem) ? '2' : '1';
  return `${yearDigit}Y${semDigit}`;
}

export function parseStudentCurrentYearTerm(yearLevel: string): string {
  const compact = yearLevel.trim().replace(/\s/g, '');
  if (/^\dY\d$/i.test(compact)) {
    return compact.toUpperCase();
  }
  const short = yearLevel.match(/Year\s*(.+)$/i)?.[1]?.trim();
  if (short && /^\dY\d$/i.test(short.replace(/\s/g, ''))) {
    return short.replace(/\s/g, '').toUpperCase();
  }
  const key = parseYearLevelFilterKey(yearLevel);
  return key ? `${key}Y1` : '1Y1';
}

function formatStudentFullName(student: Student): string {
  const given = [student.firstName, student.middleName].filter(Boolean).join(' ').trim();
  return `${student.lastName}, ${given || student.firstName}`;
}

function formatStudentProgramYearTerm(programCode: string, yearLevel: string): string {
  return `${programCode.trim().toUpperCase()} - ${parseStudentCurrentYearTerm(yearLevel)}`;
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
    enrollmentPeriod: `${formatDateDisplay(term.syEnrollmentStart)} - ${formatDateDisplay(term.syEnrollmentEnd)}`,
    schoolYear: term.syYear?.trim() ?? '',
    semester: term.sySemester?.trim() ?? ''
  };
}

export function buildProgramFilterOptions(programCodes: readonly string[]): readonly SubjectEvaluationFilterOption[] {
  const unique = [...new Set(programCodes.map((c) => c.trim()).filter(Boolean))].sort();
  return [{ value: 'all', label: 'All Programs' }, ...unique.map((code) => ({ value: code, label: code }))];
}

export function toStudentOption(student: Student): SearchableSelectOption {
  return {
    id: String(student.id),
    primary: `${student.studentNumber} - ${formatStudentFullName(student)}`.toUpperCase(),
    secondary: formatStudentProgramYearTerm(student.programCode, student.yearLevel)
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
    if (yearLevelFilter !== 'all' && !yearLevelMatchesFilter(s.yearLevel, yearLevelFilter)) {
      return false;
    }
    return true;
  });
}

export function buildStudentSummary(
  student: Student,
  curricula: Curricula | null,
  effectiveCurriculumCode?: string | null
): SubjectEvaluationStudentSummary {
  const curriculumCode = effectiveCurriculumCode?.trim() || student.curriculumCode?.trim();
  return {
    studentName: formatStudentFullName(student),
    programYearLevel: formatStudentProgramYearTerm(student.programCode, student.yearLevel),
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

function mapCourseToSuggestedRow(
  course: Course,
  electiveOptions: readonly ElectiveOptionChoice[]
): SubjectSelectionSuggestedRow {
  const yearTerm = toYearTermKey(course.courseYearLevel ?? '', course.courseSemester ?? '');
  const isElectiveSlot = !!course.isElectiveSlot || isElectiveSlotCourse(course.courseTitle, course.courseCode);
  return {
    id: `${course.courseCode}-${yearTerm}`,
    courseCode: course.courseCode,
    subjectDescription: course.courseTitle,
    prerequisite: course.prerequisites?.trim() || 'None',
    units: course.courseTotalUnits ?? 0,
    component: course.courseComponent?.trim() || 'Lecture',
    yearTerm,
    isElectiveSlot,
    eligibleElectives: isElectiveSlot ? electiveOptions : undefined
  };
}

export function resolveSelectionRowsForChargeSlip(
  rows: readonly SubjectSelectionSuggestedRow[],
  selectedIds: readonly string[],
  electiveSelections: ReadonlyMap<string, string>
): SubjectSelectionSuggestedRow[] {
  return rows
    .filter((row) => selectedIds.includes(row.id))
    .map((row) => {
      if (!row.isElectiveSlot) {
        return row;
      }

      const chosenCode = electiveSelections.get(row.id);
      const chosen = row.eligibleElectives?.find((option) => option.courseCode === chosenCode);
      if (!chosen) {
        return row;
      }

      return {
        ...row,
        courseCode: chosen.courseCode,
        subjectDescription: chosen.subjectDescription,
        units: chosen.units,
        component: chosen.component,
        prerequisite: chosen.prerequisite
      };
    });
}

export function allSelectedElectiveSlotsHaveChoices(
  rows: readonly SubjectSelectionSuggestedRow[],
  selectedIds: ReadonlySet<string>,
  electiveSelections: ReadonlyMap<string, string>
): boolean {
  for (const row of rows) {
    if (!row.isElectiveSlot || !selectedIds.has(row.id)) {
      continue;
    }
    const choice = electiveSelections.get(row.id)?.trim();
    if (!choice) {
      return false;
    }
    const valid = row.eligibleElectives?.some((option) => option.courseCode === choice);
    if (!valid) {
      return false;
    }
  }
  return true;
}

export function buildSubjectSelectionState(
  student: Student,
  courses: readonly Course[],
  enrollments: readonly StudentClassEnrollmentRow[],
  electiveOptionPool: readonly Course[] = []
): SubjectSelectionState {
  const passed = passedCourseCodes(enrollments);
  const currentYearTerm = parseStudentCurrentYearTerm(student.yearLevel);

  const poolSource = electiveOptionPool.length > 0
    ? electiveOptionPool
    : courses.filter((course) => isElectiveOptionCourse(course));
  const electiveOptions = poolSource.map(mapCourseToElectiveOption);

  const curriculumCourses = courses.filter(
    (course) => !isElectiveOptionCourse(course) && !course.isElectiveOption
  );

  const allTermCourses = curriculumCourses
    .map((course) => mapCourseToSuggestedRow(course, electiveOptions))
    .filter((row) => !passed.has(normalizeCode(row.courseCode)));

  const eligibleCourses = allTermCourses.filter((row) =>
    prerequisiteMet(row.prerequisite, passed)
  );

  const currentTermCourses = eligibleCourses.filter((r) => r.yearTerm === currentYearTerm);
  const regularUnitsForNextTerm = currentTermCourses.reduce((sum, r) => sum + r.units, 0);
  const unitLimit = Math.max(regularUnitsForNextTerm, DEFAULT_UNIT_LIMIT);

  return {
    limits: { regularUnitsForNextTerm, unitLimit },
    currentYearTerm,
    allTermCourses,
    eligibleCourses
  };
}

export function getCurrentTermSuggestedCourses(
  state: SubjectSelectionState,
  extraRows: readonly SubjectSelectionSuggestedRow[] = []
): readonly SubjectSelectionSuggestedRow[] {
  const base = state.eligibleCourses.filter((row) => row.yearTerm === state.currentYearTerm);
  const extra = extraRows.filter(
    (row) => row.yearTerm === state.currentYearTerm && !base.some((existing) => existing.id === row.id)
  );
  return [...base, ...extra];
}

function compareYearTermKeys(a: string, b: string): number {
  const parse = (key: string): { year: number; sem: number } => {
    const match = key.trim().match(/^(\d)Y([12])$/i);
    if (!match) {
      return { year: 99, sem: 99 };
    }
    return { year: Number(match[1]), sem: Number(match[2]) };
  };

  const left = parse(a);
  const right = parse(b);
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  return left.sem - right.sem;
}

export function groupSuggestedSubjectsByYearTerm(
  rows: readonly SubjectSelectionSuggestedRow[]
): readonly SubjectSelectionYearTermGroup[] {
  const byTerm = new Map<string, SubjectSelectionSuggestedRow[]>();

  for (const row of rows) {
    const key = row.yearTerm.trim().toUpperCase() || '1Y1';
    const list = byTerm.get(key) ?? [];
    list.push(row);
    byTerm.set(key, list);
  }

  return [...byTerm.entries()]
    .sort(([left], [right]) => compareYearTermKeys(left, right))
    .map(([yearTerm, termRows]) => ({
      yearTerm,
      label: studentYearTermToCurriculumTermLabel(yearTerm),
      rows: [...termRows].sort((left, right) => left.courseCode.localeCompare(right.courseCode))
    }));
}

export function pickDefaultSelectionIds(
  state: SubjectSelectionState,
  unitLimit = state.limits.unitLimit
): readonly string[] {
  const pool = getCurrentTermSuggestedCourses(state);
  const selected: string[] = [];
  let total = 0;
  for (const row of pool) {
    if (row.isElectiveSlot) {
      continue;
    }
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
      if (!key || passed.has(key) || excluded.has(key)) {
        return false;
      }
      return !c.isElectiveSlot && !isElectiveSlotCourse(c.courseTitle, c.courseCode);
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

function chargeSlipCurriculumVersion(curricula: Curricula | null, curriculumCode: string | null | undefined): string {
  const code = curriculumCode?.trim();
  if (code) {
    return code;
  }
  return curriculumVersionFrom(curricula, curriculumCode);
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

function normalizePaymentSchemeSchoolYear(value: string): string {
  return value.trim().replace(/^sy\s+/i, '').trim();
}

function normalizePaymentSchemeSemester(value: string): string {
  return value
    .trim()
    .replace(/\bterm\b/gi, 'Semester')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findPaymentSchemeForTerm(
  schemes: readonly PaymentScheme[],
  schoolYear: string,
  semester: string
): PaymentScheme | null {
  const year = normalizePaymentSchemeSchoolYear(schoolYear);
  const sem = normalizePaymentSchemeSemester(semester);
  if (!year || !sem) {
    return null;
  }

  return (
    schemes.find(
      (scheme) =>
        normalizePaymentSchemeSchoolYear(scheme.schoolYear).localeCompare(year, undefined, {
          sensitivity: 'base'
        }) === 0 &&
        normalizePaymentSchemeSemester(scheme.semester).localeCompare(sem, undefined, {
          sensitivity: 'base'
        }) === 0
    ) ?? null
  );
}

function formatInstallmentLabel(
  installment: PaymentScheme['installments'][number],
  index: number
): string {
  const paymentName = installment.paymentName?.trim();
  if (paymentName) {
    return paymentName;
  }
  if (installment.dueDate?.trim()) {
    return formatDateDisplay(installment.dueDate);
  }
  return `Installment ${index + 1}`;
}

export function mapPaymentSchemeToChargeSlipRows(
  scheme: PaymentScheme | null,
  grossLow: number,
  downpaymentPercent: number
): ChargeSlipPaymentRow[] {
  const dpAmount = (grossLow * downpaymentPercent) / 100;
  const balance = Math.max(0, grossLow - dpAmount);

  if (!scheme || scheme.installments.length === 0) {
    return [
      {
        label: 'Upon Enrollment/Required DP',
        cash: '',
        lowMonthlyPayment: formatMoney(dpAmount)
      },
      {
        label: 'Remaining balance (estimate)',
        cash: '',
        lowMonthlyPayment: formatMoney(balance)
      }
    ];
  }

  const sorted = [...scheme.installments].sort(
    (left, right) => left.installmentOrder - right.installmentOrder
  );
  const remainingInstallments = Math.max(1, sorted.length - 1);
  const recurringAmount = balance / remainingInstallments;

  return sorted.map((installment, index) => ({
    label: formatInstallmentLabel(installment, index),
    cash: '',
    lowMonthlyPayment: formatMoney(index === 0 ? dpAmount : recurringAmount)
  }));
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
  currentYearTerm: string,
  effectiveCurriculumCode?: string | null,
  electiveSelections: ReadonlyMap<string, string> = new Map(),
  paymentSchemes: readonly PaymentScheme[] = [],
  schoolYear = '',
  semester = ''
): ChargeSlipPreview {
  const selected = resolveSelectionRowsForChargeSlip(selectionRows, selectedIds, electiveSelections);
  const tuitionByCode = new Map(
    tuitionFees.map((t) => [normalizeCode(t.courseCode), t])
  );

  const curriculumVersion = chargeSlipCurriculumVersion(
    curricula,
    effectiveCurriculumCode ?? student.curriculumCode
  );
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
  const dpPercent = dp?.downpaymentPercent ?? 0;
  const matchedScheme = findPaymentSchemeForTerm(paymentSchemes, schoolYear, semester);
  const paymentScheme = mapPaymentSchemeToChargeSlipRows(matchedScheme, grossLow, dpPercent);

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
