import { Course } from '../../../core/models/course.model';
import { Curricula } from '../../../core/models/curricula.model';
import { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';
import { buildCurriculumTermBlocks } from './evaluator-student-academic.mapper';
import {
  isEnrollmentFailed,
  isEnrollmentPassed,
  parseOfficialGradeToNumber
} from '../../Registrar/students/student-enrollments.mapper';
import type {
  MigrateCurriculumMappingRow,
  MigrateCurriculumPreview,
  MigrateCurriculumStructureCourse,
  MigrateCurriculumStructureTerm,
  MigrateCurriculumSummary,
  MigrateMappingTermBlock
} from './evaluator-student-academic.models';

interface PassedEnrollmentSnapshot {
  readonly courseCode: string;
  readonly courseTitle: string;
  readonly units: number;
  readonly grade: string;
  readonly remarks: string;
}

function str(raw: Record<string, unknown>, camel: string, pascal: string): string {
  const v = raw[camel] ?? raw[pascal];
  return v != null ? String(v) : '';
}

function num(raw: Record<string, unknown>, camel: string, pascal: string): number {
  const v = raw[camel] ?? raw[pascal];
  return v != null && v !== '' ? Number(v) : 0;
}

export function mapCourseFromApi(raw: unknown): Course {
  const r = raw as Record<string, unknown>;
  return {
    courseCode: str(r, 'courseCode', 'CourseCode'),
    curriculumCode: str(r, 'curriculumCode', 'CurriculumCode'),
    programId: num(r, 'programId', 'ProgramId'),
    programCode: str(r, 'programCode', 'ProgramCode') || undefined,
    programTitle: str(r, 'programTitle', 'ProgramTitle') || undefined,
    courseTitle: str(r, 'courseTitle', 'CourseTitle'),
    courseLecUnits: num(r, 'courseLecUnits', 'CourseLecUnits'),
    courseLabUnits: num(r, 'courseLabUnits', 'CourseLabUnits'),
    courseTotalUnits: num(r, 'courseTotalUnits', 'CourseTotalUnits'),
    courseYearLevel: str(r, 'courseYearLevel', 'CourseYearLevel'),
    courseSemester: str(r, 'courseSemester', 'CourseSemester'),
    courseComponent: str(r, 'courseComponent', 'CourseComponent') || undefined,
    prerequisites: str(r, 'prerequisites', 'Prerequisites') || undefined,
    description: str(r, 'description', 'Description') || undefined,
    courseHasPrerequisites: num(r, 'courseHasPrerequisites', 'CourseHasPrerequisites')
  };
}

function normalizeCode(code: string | null | undefined): string {
  return code?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
}

function buildPassedByCourseCode(
  enrollments: readonly StudentClassEnrollmentRow[]
): Map<string, PassedEnrollmentSnapshot> {
  const map = new Map<string, PassedEnrollmentSnapshot>();

  for (const row of enrollments) {
    if (!isEnrollmentPassed(row)) {
      continue;
    }
    const key = normalizeCode(row.courseCode);
    if (!key) {
      continue;
    }
    const gradeNum = parseOfficialGradeToNumber(row.officialGrade);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        courseCode: row.courseCode.trim(),
        courseTitle: row.courseTitle?.trim() || row.courseCode.trim(),
        units: row.units ?? 0,
        grade: row.officialGrade?.trim() || '—',
        remarks: 'Passed'
      });
      continue;
    }
    const existingGrade = parseOfficialGradeToNumber(existing.grade);
    if (gradeNum != null && (existingGrade == null || gradeNum < existingGrade)) {
      map.set(key, {
        courseCode: row.courseCode.trim(),
        courseTitle: row.courseTitle?.trim() || row.courseCode.trim(),
        units: row.units ?? 0,
        grade: row.officialGrade?.trim() || '—',
        remarks: 'Passed'
      });
    }
  }

  return map;
}

function buildFailedCourseCodes(enrollments: readonly StudentClassEnrollmentRow[]): Set<string> {
  const failed = new Set<string>();
  for (const row of enrollments) {
    if (isEnrollmentFailed(row)) {
      const key = normalizeCode(row.courseCode);
      if (key) {
        failed.add(key);
      }
    }
  }
  return failed;
}

function formatCurriculumVersion(curriculum: Curricula | null, curriculumCode: string): string {
  const version = curriculum?.version?.trim();
  if (version) {
    return version;
  }
  const parts = curriculumCode.split('-');
  return parts.length >= 2 ? parts.slice(1).join('-') : curriculumCode;
}

export function buildMigrateCurriculumOptionLabel(curriculum: Curricula): string {
  const status =
    curriculum.curriculumStatus?.trim() === 'Active' ? 'Active' : 'Inactive';
  const year = curriculum.syYear?.trim() || '—';
  return `${curriculum.curriculumCode} - ${year} (${status})`;
}

export function buildMigrateCurriculumPreview(
  newCurriculumCode: string,
  newCourses: readonly Course[],
  enrollments: readonly StudentClassEnrollmentRow[],
  newCurricula: Curricula | null,
  oldCurricula: Curricula | null
): MigrateCurriculumPreview | null {
  if (!newCurriculumCode.trim() || newCourses.length === 0) {
    return null;
  }

  const passedByCode = buildPassedByCourseCode(enrollments);
  const failedCodes = buildFailedCourseCodes(enrollments);
  const termBlocks = buildCurriculumTermBlocks([...newCourses]);

  let autoMatched = 0;
  let mustRetake = 0;
  let pendingMatch = 0;
  let unitsCredited = 0;
  let unitsTotal = 0;

  const structureTerms: MigrateCurriculumStructureTerm[] = [];
  const mappingTerms: MigrateMappingTermBlock[] = [];

  for (const term of termBlocks) {
    const structureCourses: MigrateCurriculumStructureCourse[] = [];
    const mappingRows: MigrateCurriculumMappingRow[] = [];
    let creditedInTerm = 0;

    for (const course of term.courses) {
      const key = normalizeCode(course.courseCode);
      const passed = passedByCode.get(key);
      const isCredited = !!passed;
      const isMustRetake = !isCredited && failedCodes.has(key);

      unitsTotal += course.units;
      if (isCredited) {
        autoMatched++;
        creditedInTerm++;
        unitsCredited += course.units;
      } else if (isMustRetake) {
        mustRetake++;
      } else {
        pendingMatch++;
      }

      structureCourses.push({
        courseCode: course.courseCode,
        subjectDescription: course.subjectDescription,
        units: course.units,
        creditStatus: isCredited ? 'credited' : isMustRetake ? 'must-retake' : 'remaining'
      });

      if (isCredited && passed) {
        mappingRows.push({
          oldCourseCode: passed.courseCode,
          oldCourseTitle: passed.courseTitle,
          oldUnits: passed.units,
          grade: passed.grade,
          gradeStatus: 'Passed',
          matchType: 'AUTO',
          newCourseCode: course.courseCode,
          newCourseTitle: course.subjectDescription,
          newUnits: course.units
        });
      }
    }

    const remainingInTerm = structureCourses.length - creditedInTerm;
    structureTerms.push({
      label: term.label,
      subjectCount: structureCourses.length,
      totalUnits: term.totalUnits,
      creditedCount: creditedInTerm,
      remainingCount: remainingInTerm,
      courses: structureCourses
    });

    if (mappingRows.length > 0 || remainingInTerm > 0) {
      mappingTerms.push({
        label: term.label,
        subjectCount: structureCourses.length,
        totalUnits: term.totalUnits,
        creditedCount: creditedInTerm,
        remainingCount: remainingInTerm,
        rows: mappingRows
      });
    }
  }

  const summary: MigrateCurriculumSummary = {
    autoMatched,
    manualMatched: 0,
    pendingMatch,
    mustRetake,
    unitsCredited,
    unitsTotal
  };

  return {
    newCurriculumCode: newCurriculumCode.trim(),
    newCurriculumVersion: formatCurriculumVersion(newCurricula, newCurriculumCode),
    oldCurriculumVersion: formatCurriculumVersion(oldCurricula, oldCurricula?.curriculumCode ?? ''),
    summary,
    structureTerms,
    mappingTerms
  };
}

