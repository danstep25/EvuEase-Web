import { Course } from '../../../core/models/course.model';
import {
  AcademicRecordCourseRow,
  AcademicRecordCurriculumTermBlock,
  AcademicRecordSemesterBlock,
  CurriculumTermLayoutPair,
  SemesterLayoutPair
} from '../../../core/models/academic-records.model';
import { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';
import {
  buildCurriculumTermLabel,
  filterCurriculumStructureCourses,
  normalizeCurriculumSemester,
  normalizeCurriculumYearLevel
} from '../../../shared/utils/curriculum-course-term.util';
import {
  buildRetakeByEnrollmentId,
  compareAcademicTermChronological,
  formatAcademicTermBanner,
  parseOfficialGradeToNumber
} from './student-enrollments.mapper';

interface CurriculumTermKey {
  yearLevel: string;
  semester: string;
  sortYear: number;
  sortSemester: number;
  label: string;
  rawKey: string;
}

function yearLevelSortKey(label: string): number {
  const trimmed = label.trim();
  const digit = trimmed.match(/(\d)/)?.[1];
  if (digit) {
    return Number(digit);
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('first')) return 1;
  if (lower.includes('second')) return 2;
  if (lower.includes('third')) return 3;
  if (lower.includes('fourth')) return 4;
  if (lower.includes('fifth')) return 5;
  return 99;
}

function semesterSortKey(semester: string): number {
  const s = semester.toLowerCase();
  if (/\b1\s*st\b|\bfirst\b/i.test(s)) return 1;
  if (/\b2\s*nd\b|\bsecond\b/i.test(s)) return 2;
  if (/\b3\s*rd\b|\bthird\b/i.test(s)) return 3;
  return 99;
}

function semesterSlotKind(semester: string): 'first' | 'second' | 'other' {
  const sort = semesterSortKey(semester);
  if (sort === 1) return 'first';
  if (sort === 2) return 'second';
  return 'other';
}

function buildCurriculumTermKey(course: Course): CurriculumTermKey {
  const yearLevel = normalizeCurriculumYearLevel(course.courseYearLevel);
  const semester = normalizeCurriculumSemester(course.courseSemester);
  return {
    yearLevel,
    semester,
    sortYear: yearLevelSortKey(yearLevel),
    sortSemester: semesterSortKey(semester),
    label: buildCurriculumTermLabel(course.courseYearLevel, course.courseSemester),
    rawKey: `${yearLevel}|${semester}`
  };
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

function enrollmentToCourseRow(
  enrollment: StudentClassEnrollmentRow,
  retakeMap: Map<number, boolean>
): AcademicRecordCourseRow {
  const pending = !enrollment.officialGrade?.trim();
  const isRetake = retakeMap.get(enrollment.enrollmentId) ?? false;
  const { text, kind } = transcriptRemarks(enrollment.remarks, enrollment.officialGrade);
  return {
    enrollmentId: enrollment.enrollmentId,
    courseCode: enrollment.courseCode,
    subjectDescription: enrollment.courseTitle,
    units: enrollment.units,
    grade: parseOfficialGradeToNumber(enrollment.officialGrade),
    remarks: text,
    remarkKind: kind,
    remarksSub: isRetake ? '(RETAKE)' : null,
    isRetake,
    coursePending: pending,
    gradePending: pending
  };
}

function notTakenCourseRow(course: Course): AcademicRecordCourseRow {
  return {
    enrollmentId: 0,
    courseCode: course.courseCode,
    subjectDescription: course.courseTitle,
    units: course.courseTotalUnits,
    grade: null,
    remarks: 'NOT TAKEN',
    remarkKind: 'not-taken',
    remarksSub: null,
    isRetake: false,
    isNotTaken: true
  };
}

function latestEnrollmentByCourseCode(
  enrollments: StudentClassEnrollmentRow[]
): Map<string, StudentClassEnrollmentRow> {
  const sorted = [...enrollments].sort((a, b) =>
    compareAcademicTermChronological(a.academicTerm, b.academicTerm)
  );
  const map = new Map<string, StudentClassEnrollmentRow>();
  for (const row of sorted) {
    const key = row.courseCode?.trim().toLowerCase() ?? '';
    if (!key) {
      continue;
    }
    map.set(key, row);
  }
  return map;
}

export function mergeCurriculumWithEnrollments(
  courses: Course[],
  enrollments: StudentClassEnrollmentRow[]
): { blocks: AcademicRecordSemesterBlock[]; extraEnrollments: AcademicRecordSemesterBlock[] } {
  const structureCourses = filterCurriculumStructureCourses(courses);
  if (structureCourses.length === 0) {
    return { blocks: [], extraEnrollments: [] };
  }

  const retakeMap = buildRetakeByEnrollmentId(enrollments);
  const enrollmentByCode = latestEnrollmentByCourseCode(enrollments);
  const curriculumCodes = new Set<string>();

  const termMap = new Map<string, { key: CurriculumTermKey; courses: Course[] }>();
  for (const course of structureCourses) {
    const key = buildCurriculumTermKey(course);
    const code = course.courseCode?.trim().toLowerCase() ?? '';
    if (code) {
      curriculumCodes.add(code);
    }
    const existing = termMap.get(key.rawKey);
    if (existing) {
      existing.courses.push(course);
    } else {
      termMap.set(key.rawKey, { key, courses: [course] });
    }
  }

  const sortedTerms = [...termMap.values()].sort((a, b) => {
    const yearCmp = a.key.sortYear - b.key.sortYear;
    if (yearCmp !== 0) {
      return yearCmp;
    }
    return a.key.sortSemester - b.key.sortSemester;
  });

  const blocks: AcademicRecordSemesterBlock[] = sortedTerms.map(({ key, courses: termCourses }) => {
    const rows = [...termCourses]
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode, undefined, { sensitivity: 'base' }))
      .map((course) => {
        const enrollment = enrollmentByCode.get(course.courseCode.trim().toLowerCase());
        return enrollment ? enrollmentToCourseRow(enrollment, retakeMap) : notTakenCourseRow(course);
      });

    return {
      label: key.label,
      rawAcademicTerm: key.rawKey,
      courses: rows
    };
  });

  const extraRows: StudentClassEnrollmentRow[] = [];
  for (const enrollment of enrollments) {
    const code = enrollment.courseCode?.trim().toLowerCase() ?? '';
    if (code && !curriculumCodes.has(code)) {
      extraRows.push(enrollment);
    }
  }

  const extraEnrollments: AcademicRecordSemesterBlock[] = [];
  if (extraRows.length > 0) {
    const termOrder: string[] = [];
    const map = new Map<string, StudentClassEnrollmentRow[]>();
    for (const row of extraRows) {
      const label = row.academicTerm?.trim() || 'Unknown term';
      if (!map.has(label)) {
        map.set(label, []);
        termOrder.push(label);
      }
      map.get(label)!.push(row);
    }

    for (const label of termOrder) {
      const rows = map.get(label)!;
      extraEnrollments.push({
        label: `${formatAcademicTermBanner(label)} (Outside curriculum)`,
        rawAcademicTerm: label,
        courses: rows.map((row) => enrollmentToCourseRow(row, retakeMap))
      });
    }
  }

  return { blocks, extraEnrollments };
}

/**
 * A student is a candidate for graduation when every required curriculum course
 * (electives are already filtered out of the merged blocks) has been passed.
 * Any course that is still not-taken, failed, incomplete, pending, or otherwise
 * unverified means the requirements are not yet met.
 */
export function isCandidateForGraduation(
  blocks: readonly AcademicRecordSemesterBlock[]
): boolean {
  const rows = blocks.flatMap((block) => block.courses);
  if (rows.length === 0) {
    return false;
  }
  return rows.every((row) => row.remarkKind === 'passed');
}

export function buildCurriculumSemesterLayoutRows(blocks: AcademicRecordSemesterBlock[]): {
  pairs: SemesterLayoutPair[];
  fullWidthBlocks: AcademicRecordSemesterBlock[];
} {
  const bucket = new Map<string, { first?: AcademicRecordSemesterBlock; second?: AcademicRecordSemesterBlock }>();
  const fullWidth: AcademicRecordSemesterBlock[] = [];

  for (const block of blocks) {
    const parts = block.rawAcademicTerm.split('|');
    const yearLevel = parts[0]?.trim() || block.label;
    const semester = parts[1]?.trim() || '';
    const slot = semesterSlotKind(semester);

    if (slot === 'first' || slot === 'second') {
      if (!bucket.has(yearLevel)) {
        bucket.set(yearLevel, {});
      }
      const entry = bucket.get(yearLevel)!;
      if (slot === 'first') {
        entry.first = block;
      } else {
        entry.second = block;
      }
    } else {
      fullWidth.push(block);
    }
  }

  const sortedYears = [...bucket.keys()].sort(
    (a, b) => yearLevelSortKey(a) - yearLevelSortKey(b)
  );

  const pairs: SemesterLayoutPair[] = sortedYears.map((yearLevel) => ({
    schoolYearKey: yearLevel,
    left: bucket.get(yearLevel)?.first ?? null,
    right: bucket.get(yearLevel)?.second ?? null
  }));

  fullWidth.sort((a, b) => {
    const yearA = yearLevelSortKey(a.rawAcademicTerm.split('|')[0] ?? '');
    const yearB = yearLevelSortKey(b.rawAcademicTerm.split('|')[0] ?? '');
    if (yearA !== yearB) {
      return yearA - yearB;
    }
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });

  return { pairs, fullWidthBlocks: fullWidth };
}

export function buildCurriculumTermBlocks(courses: Course[]): AcademicRecordCurriculumTermBlock[] {
  const byTerm = new Map<string, Course[]>();

  for (const course of filterCurriculumStructureCourses(courses)) {
    const label = buildCurriculumTermLabel(course.courseYearLevel, course.courseSemester);
    const list = byTerm.get(label) ?? [];
    list.push(course);
    byTerm.set(label, list);
  }

  return [...byTerm.entries()]
    .sort(([a], [b]) => {
      const yearA = a.split(' - ')[0] ?? '';
      const yearB = b.split(' - ')[0] ?? '';
      const yearCmp = yearLevelSortKey(yearA) - yearLevelSortKey(yearB);
      if (yearCmp !== 0) {
        return yearCmp;
      }
      const semA = a.split(' - ').slice(1).join(' - ');
      const semB = b.split(' - ').slice(1).join(' - ');
      return semesterSortKey(semA) - semesterSortKey(semB);
    })
    .map(([label, termCourses]) => {
      const rows = termCourses.map((course) => ({
        courseCode: course.courseCode,
        subjectDescription: course.courseTitle,
        prerequisite: course.prerequisites?.trim() || 'None',
        units: course.courseTotalUnits
      }));
      return {
        label,
        courses: rows,
        totalUnits: rows.reduce((sum, row) => sum + row.units, 0)
      };
    });
}

export function buildCurriculumTermLayoutPairs(
  terms: AcademicRecordCurriculumTermBlock[]
): CurriculumTermLayoutPair[] {
  const bucket = new Map<string, { first?: AcademicRecordCurriculumTermBlock; second?: AcademicRecordCurriculumTermBlock }>();
  const fullWidth: AcademicRecordCurriculumTermBlock[] = [];

  for (const term of terms) {
    const parts = term.label.split(' - ');
    const yearLevel = parts[0]?.trim() || term.label;
    const semester = parts.slice(1).join(' - ').trim();
    const slot = semesterSlotKind(semester);

    if (slot === 'first' || slot === 'second') {
      if (!bucket.has(yearLevel)) {
        bucket.set(yearLevel, {});
      }
      const entry = bucket.get(yearLevel)!;
      if (slot === 'first') {
        entry.first = term;
      } else {
        entry.second = term;
      }
    } else {
      fullWidth.push(term);
    }
  }

  const sortedYears = [...bucket.keys()].sort(
    (a, b) => yearLevelSortKey(a) - yearLevelSortKey(b)
  );

  const pairs: CurriculumTermLayoutPair[] = sortedYears.map((yearLevel) => ({
    left: bucket.get(yearLevel)?.first ?? null,
    right: bucket.get(yearLevel)?.second ?? null
  }));

  for (const term of fullWidth) {
    pairs.push({ left: term, right: null });
  }

  return pairs;
}
