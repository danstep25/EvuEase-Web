import {
  StudentAcademicSummary,
  StudentClassEnrollmentRow,
  StudentEnrollmentOverview
} from '../../../core/models/student-enrollments.model';
import {
  AcademicRecordCourseRow,
  AcademicRecordSemesterBlock,
  CourseEnrollmentHistoryRow,
  SemesterLayoutPair
} from '../../../core/models/academic-records.model';

function num(o: Record<string, unknown>, camel: string, pascal: string): number {
  const v = o[camel] ?? o[pascal];
  return v != null && v !== '' ? Number(v) : 0;
}

function numOrNull(o: Record<string, unknown>, camel: string, pascal: string): number | null {
  const v = o[camel] ?? o[pascal];
  if (v == null || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(o: Record<string, unknown>, camel: string, pascal: string): string {
  const v = o[camel] ?? o[pascal];
  return v != null ? String(v) : '';
}

function strNull(o: Record<string, unknown>, camel: string, pascal: string): string | null {
  const v = o[camel] ?? o[pascal];
  if (v == null || v === '') {
    return null;
  }
  return String(v);
}

export function mapStudentEnrollmentOverview(raw: unknown): StudentEnrollmentOverview {
  const o = raw as Record<string, unknown>;
  const enrollmentsRaw = (o['enrollments'] ?? o['Enrollments']) as unknown[] | undefined;
  const summaryRaw = (o['summary'] ?? o['Summary']) as Record<string, unknown> | undefined;

  const enrollments: StudentClassEnrollmentRow[] = Array.isArray(enrollmentsRaw)
    ? enrollmentsRaw.map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return {
          enrollmentId: num(r, 'enrollmentId', 'EnrollmentId'),
          facultyClassId: num(r, 'facultyClassId', 'FacultyClassId'),
          courseCode: str(r, 'courseCode', 'CourseCode'),
          courseTitle: str(r, 'courseTitle', 'CourseTitle'),
          classNumber: str(r, 'classNumber', 'ClassNumber'),
          section: str(r, 'section', 'Section'),
          component: str(r, 'component', 'Component'),
          academicTerm: str(r, 'academicTerm', 'AcademicTerm'),
          programCode: str(r, 'programCode', 'ProgramCode'),
          yearLevel: str(r, 'yearLevel', 'YearLevel'),
          units: num(r, 'units', 'Units'),
          officialGrade: strNull(r, 'officialGrade', 'OfficialGrade'),
          remarks: strNull(r, 'remarks', 'Remarks')
        };
      })
    : [];

  const s = summaryRaw ?? {};
  const summary: StudentAcademicSummary = {
    totalUnitsCompleted: num(s, 'totalUnitsCompleted', 'TotalUnitsCompleted'),
    cumulativeGpa: numOrNull(s, 'cumulativeGpa', 'CumulativeGpa'),
    failedSubjects: num(s, 'failedSubjects', 'FailedSubjects'),
    retakenSubjects: num(s, 'retakenSubjects', 'RetakenSubjects')
  };

  return { enrollments, summary };
}


export function splitAcademicTermLabel(term: string): { schoolYear: string; semester: string } {
  const t = term?.trim() ?? '';
  if (!t) {
    return { schoolYear: '—', semester: '—' };
  }
  const parts = t.split(/[—–\-]\s*/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { schoolYear: parts[0], semester: parts.slice(1).join(' · ') };
  }
  return { schoolYear: t, semester: '—' };
}


export function parseSchoolYearAndSemester(raw: string): { schoolYear: string; semester: string } {
  const t = raw?.trim() ?? '';
  if (!t) {
    return { schoolYear: '', semester: '' };
  }
  const bySlash = t.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
  if (bySlash.length >= 2) {
    return { schoolYear: bySlash[0], semester: bySlash.slice(1).join(' / ') };
  }
  return splitAcademicTermLabel(t);
}

function semesterSlotKind(semester: string): 'first' | 'second' | 'other' {
  const s = semester.toLowerCase();
  if (/\b1\s*st\b|\bfirst\b/i.test(s)) {
    return 'first';
  }
  if (/\b2\s*nd\b|\bsecond\b/i.test(s)) {
    return 'second';
  }
  return 'other';
}

export function parseOfficialGradeToNumber(officialGrade: string | null | undefined): number | null {
  if (officialGrade == null || String(officialGrade).trim() === '') {
    return null;
  }
  const s = String(officialGrade).trim();
  const u = s.toUpperCase();
  if (u === 'INC' || u === 'INCOMPLETE' || u === 'I' || u === 'DRP' || u === 'UD') {
    return null;
  }
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}


export function formatAcademicTermBanner(term: string): string {
  const t = term?.trim() ?? '';
  if (!t) {
    return '—';
  }
  return t
    .replace(/\s*[—–]\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}


export function compareAcademicTermChronological(a: string, b: string): number {
  return a.trim().localeCompare(b.trim(), undefined, { numeric: true, sensitivity: 'base' });
}

function normalizeSchoolYear(value: string): string {
  return value.trim().replace(/^sy\s+/i, '').trim();
}

function normalizeSemesterLabel(value: string): string {
  return value
    .trim()
    .replace(/\bterm\b/gi, 'Semester')
    .replace(/\s+/g, ' ')
    .trim();
}

function labelsMatch(left: string, right: string): boolean {
  return (
    left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0
  );
}

export function academicTermMatchesConfiguredPeriod(
  academicTerm: string,
  schoolYear: string,
  semester: string
): boolean {
  const parsed = parseSchoolYearAndSemester(academicTerm);
  return (
    labelsMatch(normalizeSchoolYear(parsed.schoolYear), normalizeSchoolYear(schoolYear)) &&
    labelsMatch(normalizeSemesterLabel(parsed.semester), normalizeSemesterLabel(semester))
  );
}

export function formatConfiguredTermLabel(schoolYear: string, semester: string): string {
  const year = normalizeSchoolYear(schoolYear);
  const sem = normalizeSemesterLabel(semester);
  if (!year && !sem) {
    return '—';
  }
  if (!year) {
    return sem;
  }
  if (!sem) {
    return year;
  }
  return `${year} - ${sem}`;
}

function previousSchoolYear(schoolYear: string): string | null {
  const normalized = normalizeSchoolYear(schoolYear);
  const match = normalized.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return null;
  }

  return `${startYear - 1}-${endYear - 1}`;
}

export function resolvePreviousTerm(
  schoolYear: string,
  semester: string
): { schoolYear: string; semester: string } | null {
  const year = normalizeSchoolYear(schoolYear);
  const sem = normalizeSemesterLabel(semester);
  if (!year || !sem) {
    return null;
  }

  const slot = semesterSlotKind(sem);
  if (slot === 'first') {
    const priorYear = previousSchoolYear(year);
    if (!priorYear) {
      return null;
    }
    return { schoolYear: priorYear, semester: '2nd Semester' };
  }

  if (slot === 'second') {
    return { schoolYear: year, semester: '1st Semester' };
  }

  if (sem.toLowerCase().includes('summer')) {
    return { schoolYear: year, semester: '2nd Semester' };
  }

  return null;
}

function nextSchoolYear(schoolYear: string): string | null {
  const normalized = normalizeSchoolYear(schoolYear);
  const match = normalized.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return null;
  }

  return `${startYear + 1}-${endYear + 1}`;
}

export function resolveNextTerm(
  schoolYear: string,
  semester: string
): { schoolYear: string; semester: string } | null {
  const year = normalizeSchoolYear(schoolYear);
  const sem = normalizeSemesterLabel(semester);
  if (!year || !sem) {
    return null;
  }

  const slot = semesterSlotKind(sem);
  if (slot === 'first') {
    return { schoolYear: year, semester: '2nd Semester' };
  }

  if (slot === 'second') {
    const nextYear = nextSchoolYear(year);
    if (!nextYear) {
      return null;
    }
    return { schoolYear: nextYear, semester: '1st Semester' };
  }

  return null;
}

function formatSemesterAsTermLabel(semester: string): string {
  const value = semester.trim();
  if (!value) {
    return '';
  }
  if (/\b1\s*st\b|\bfirst\b/i.test(value)) {
    return '1st term';
  }
  if (/\b2\s*nd\b|\bsecond\b/i.test(value)) {
    return '2nd term';
  }
  if (/\b3\s*rd\b|\bthird\b/i.test(value)) {
    return '3rd term';
  }
  if (/\bsummer\b/i.test(value)) {
    return 'summer term';
  }
  return value.replace(/\bsemester\b/gi, 'term').replace(/\s+/g, ' ').trim();
}

export function formatSchoolYearTermLabel(schoolYear: string, semester: string): string {
  const year = normalizeSchoolYear(schoolYear);
  const sem = formatSemesterAsTermLabel(semester);
  if (!year && !sem) {
    return '—';
  }
  if (!year) {
    return sem;
  }
  if (!sem) {
    return year;
  }
  return `${year} ${sem}`;
}

export function formatAcademicTermDisplayLabel(rawAcademicTerm: string): string {
  const { schoolYear, semester } = parseSchoolYearAndSemester(rawAcademicTerm);
  return formatSchoolYearTermLabel(schoolYear, semester);
}


export function buildSemesterLayoutRows(blocks: AcademicRecordSemesterBlock[]): {
  pairs: SemesterLayoutPair[];
  fullWidthBlocks: AcademicRecordSemesterBlock[];
} {
  const bucket = new Map<string, { first?: AcademicRecordSemesterBlock; second?: AcademicRecordSemesterBlock }>();
  const fullWidth: AcademicRecordSemesterBlock[] = [];

  for (const b of blocks) {
    const raw = b.rawAcademicTerm?.trim() || '';
    const { schoolYear, semester } = parseSchoolYearAndSemester(raw);
    const slot = semesterSlotKind(semester);
    const yearKey = schoolYear || '—';

    if (slot === 'first' || slot === 'second') {
      if (!bucket.has(yearKey)) {
        bucket.set(yearKey, {});
      }
      const p = bucket.get(yearKey)!;
      if (slot === 'first') {
        p.first = b;
      } else {
        p.second = b;
      }
    } else {
      fullWidth.push(b);
    }
  }

  const sortedYears = [...bucket.keys()].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' })
  );

  const pairs: SemesterLayoutPair[] = sortedYears.map(y => ({
    schoolYearKey: y,
    left: bucket.get(y)?.first ?? null,
    right: bucket.get(y)?.second ?? null
  }));

  fullWidth.sort((a, b) =>
    compareAcademicTermChronological(b.rawAcademicTerm, a.rawAcademicTerm)
  );

  return { pairs, fullWidthBlocks: fullWidth };
}


export function buildRetakeByEnrollmentId(
  enrollments: StudentClassEnrollmentRow[]
): Map<number, boolean> {
  const sorted = [...enrollments].sort((x, y) =>
    compareAcademicTermChronological(x.academicTerm, y.academicTerm)
  );
  const seenCount = new Map<string, number>();
  const result = new Map<number, boolean>();
  for (const e of sorted) {
    const code = e.courseCode?.trim().toLowerCase() ?? '';
    if (!code) {
      result.set(e.enrollmentId, false);
      continue;
    }
    const n = (seenCount.get(code) ?? 0) + 1;
    seenCount.set(code, n);
    result.set(e.enrollmentId, n > 1);
  }
  return result;
}

export function isEnrollmentPassed(row: StudentClassEnrollmentRow): boolean {
  return enrollmentRemarkKind(row.remarks, row.officialGrade) === 'passed';
}

export function isEnrollmentFailed(row: StudentClassEnrollmentRow): boolean {
  return enrollmentRemarkKind(row.remarks, row.officialGrade) === 'failed';
}

function enrollmentRemarkKind(
  apiRemarks: string | null | undefined,
  officialGrade: string | null | undefined
): AcademicRecordCourseRow['remarkKind'] {
  return transcriptRemarks(apiRemarks, officialGrade).kind;
}

function transcriptRemarks(
  apiRemarks: string | null | undefined,
  officialGrade: string | null | undefined
): { text: string; kind: AcademicRecordCourseRow['remarkKind'] } {
  const pending = !officialGrade?.trim();
  if (pending) {
    return { text: '—', kind: 'pending' };
  }
  const gInc = officialGrade!.trim().toUpperCase();
  if (gInc === 'INC' || gInc === 'INCOMPLETE' || gInc === 'I') {
    return { text: 'INCOMPLETE', kind: 'incomplete' };
  }
  const r = apiRemarks?.trim() ?? '';
  const lower = r.toLowerCase();
  if (lower === 'passed') {
    return { text: 'PASSED', kind: 'passed' };
  }
  if (lower === 'failed') {
    return { text: 'FAILED', kind: 'failed' };
  }
  if (lower === 'incomplete') {
    return { text: 'INCOMPLETE', kind: 'incomplete' };
  }
  if (r) {
    return { text: r, kind: 'neutral' };
  }
  const g = parseOfficialGradeToNumber(officialGrade);
  if (g == null) {
    return { text: '—', kind: 'neutral' };
  }
  return g <= 3.0 ? { text: 'PASSED', kind: 'passed' } : { text: 'FAILED', kind: 'failed' };
}

function formatEnrollmentGradeDisplay(e: StudentClassEnrollmentRow): string {
  if (!e.officialGrade?.trim()) {
    return '—';
  }
  const g = parseOfficialGradeToNumber(e.officialGrade);
  if (g != null) {
    return g.toFixed(2);
  }
  return e.officialGrade.trim();
}


export function buildCourseEnrollmentHistory(
  enrollments: StudentClassEnrollmentRow[],
  courseCode: string
): CourseEnrollmentHistoryRow[] {
  const key = courseCode.trim().toLowerCase();
  if (!key) {
    return [];
  }
  const filtered = enrollments.filter(
    e => (e.courseCode?.trim().toLowerCase() ?? '') === key
  );
  filtered.sort((a, b) => compareAcademicTermChronological(a.academicTerm, b.academicTerm));
  return filtered.map((e, index) => {
    const { text, kind } = transcriptRemarks(e.remarks, e.officialGrade);
    const remarksSub = index > 0 ? '(RETAKE)' : null;
    return {
      termLabel: formatAcademicTermBanner(e.academicTerm),
      units: e.units,
      gradeDisplay: formatEnrollmentGradeDisplay(e),
      remarksPrimary: text,
      remarksSub,
      remarkKind: kind
    };
  });
}

export function groupEnrollmentsIntoSemesterBlocks(
  enrollments: StudentClassEnrollmentRow[]
): AcademicRecordSemesterBlock[] {
  const retakeMap = buildRetakeByEnrollmentId(enrollments);

  const termOrder: string[] = [];
  const map = new Map<string, StudentClassEnrollmentRow[]>();
  for (const e of enrollments) {
    const label = e.academicTerm?.trim() || 'Unknown term';
    if (!map.has(label)) {
      map.set(label, []);
      termOrder.push(label);
    }
    map.get(label)!.push(e);
  }

  return termOrder.map(label => {
    const rows = map.get(label)!;
    const courses: AcademicRecordCourseRow[] = rows.map(e => {
      const pending = !e.officialGrade?.trim();
      const isRetake = retakeMap.get(e.enrollmentId) ?? false;
      const { text, kind } = transcriptRemarks(e.remarks, e.officialGrade);
      const remarksSub = isRetake ? '(RETAKE)' : null;
      return {
        enrollmentId: e.enrollmentId,
        courseCode: e.courseCode,
        subjectDescription: e.courseTitle,
        units: e.units,
        grade: parseOfficialGradeToNumber(e.officialGrade),
        remarks: text,
        remarkKind: kind,
        remarksSub,
        isRetake,
        coursePending: pending,
        gradePending: pending
      };
    });
    return { label: formatAcademicTermBanner(label), rawAcademicTerm: label, courses };
  });
}

export function selectConfiguredTermSemesterBlock(
  blocks: AcademicRecordSemesterBlock[],
  schoolYear: string,
  semester: string
): AcademicRecordSemesterBlock | null {
  const configuredYear = normalizeSchoolYear(schoolYear);
  const configuredSemester = normalizeSemesterLabel(semester);
  if (!configuredYear || !configuredSemester) {
    return null;
  }

  const match = blocks.find((block) =>
    academicTermMatchesConfiguredPeriod(block.rawAcademicTerm, configuredYear, configuredSemester)
  );
  if (!match) {
    return null;
  }

  return {
    ...match,
    label: formatConfiguredTermLabel(configuredYear, configuredSemester)
  };
}
