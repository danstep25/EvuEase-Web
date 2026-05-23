import { Course } from '../../../core/models/course.model';
import { Curricula } from '../../../core/models/curricula.model';
import { Student } from '../../../core/models/student.model';
import { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';
import {
  compareAcademicTermChronological,
  groupEnrollmentsIntoSemesterBlocks,
  parseOfficialGradeToNumber
} from '../../Registrar/students/student-enrollments.mapper';
import { buildCurriculumDisplayLabel } from '../../Registrar/students/student-curriculum.mapper';
import type {
  AcademicPlanCourseRow,
  AcademicPlanCourseStatus,
  AcademicPlanTermBlock,
  AcademicRecordCurriculumTermBlock,
  AcademicRecordRemark,
  AcademicRecordSemesterBlock,
  StudentAcademicPlan,
  StudentAcademicRecordProfile
} from './evaluator-student-academic.models';
import type { AcademicRecordCourseRow as RegistrarCourseRow, AcademicRecordSemesterBlock as RegistrarSemesterBlock } from '../../../core/models/academic-records.model';

const YEAR_LEVEL_ORDER = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

function yearLevelSortKey(label: string): number {
  const idx = YEAR_LEVEL_ORDER.findIndex((y) => label.toLowerCase().includes(y.toLowerCase()));
  return idx >= 0 ? idx : 99;
}

function mapRegistrarRemarkToEvaluator(row: RegistrarCourseRow): AcademicRecordRemark {
  if (row.remarksSub?.toUpperCase().includes('RETAKE') && row.remarkKind === 'passed') {
    return 'PASSED (RETAKE)';
  }
  if (row.remarkKind === 'failed') {
    return 'FAILED';
  }
  return 'PASSED';
}

export function mapRegistrarSemestersToEvaluator(blocks: RegistrarSemesterBlock[]): AcademicRecordSemesterBlock[] {
  const sorted = [...blocks].sort((a, b) =>
    compareAcademicTermChronological(b.rawAcademicTerm, a.rawAcademicTerm)
  );

  return sorted.map((block, index) => ({
    label: index === 0 ? `${block.label} (Most Recent)` : block.label,
    headerVariant: index === 0 ? 'recent' : 'standard',
    totalUnits: block.courses.reduce((sum, c) => sum + c.units, 0),
    courses: block.courses.map((c) => ({
      courseCode: c.courseCode,
      subjectDescription: c.subjectDescription,
      units: c.units,
      grade: c.grade != null ? c.grade.toFixed(2) : '—',
      remarks: mapRegistrarRemarkToEvaluator(c),
      showGradeHistoryIcon: c.isRetake
    }))
  }));
}

export function buildCurriculumTermBlocks(courses: Course[]): AcademicRecordCurriculumTermBlock[] {
  const byTerm = new Map<string, Course[]>();

  for (const course of courses) {
    const label = `${course.courseYearLevel?.trim() || '—'} - ${course.courseSemester?.trim() || '—'}`;
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
      return a.localeCompare(b, undefined, { numeric: true });
    })
    .map(([label, termCourses]) => {
      const rows = termCourses.map((c) => ({
        courseCode: c.courseCode,
        subjectDescription: c.courseTitle,
        prerequisite: c.prerequisites?.trim() || 'None',
        units: c.courseTotalUnits
      }));
      return {
        label,
        courses: rows,
        totalUnits: rows.reduce((sum, r) => sum + r.units, 0)
      };
    });
}

function passedCourseCodes(enrollments: StudentClassEnrollmentRow[]): Set<string> {
  const passed = new Set<string>();
  for (const e of enrollments) {
    const code = e.courseCode?.trim().toLowerCase();
    if (!code) {
      continue;
    }
    const grade = parseOfficialGradeToNumber(e.officialGrade);
    const remarks = (e.remarks ?? '').toLowerCase();
    if (remarks === 'passed' || (grade != null && grade <= 3)) {
      passed.add(code);
    }
  }
  return passed;
}

function prerequisiteMet(prerequisite: string, passed: Set<string>): boolean {
  const raw = prerequisite?.trim() ?? '';
  if (!raw || raw.toLowerCase() === 'none') {
    return true;
  }
  const codes = raw.split(/[,;]/).map((p) => p.trim().toLowerCase()).filter(Boolean);
  return codes.every((code) => passed.has(code));
}

export function buildAcademicPlan(courses: Course[], enrollments: StudentClassEnrollmentRow[]): StudentAcademicPlan | null {
  if (courses.length === 0) {
    return null;
  }

  const passed = passedCourseCodes(enrollments);
  const totalUnitsRequired = courses.reduce((sum, c) => sum + (c.courseTotalUnits ?? 0), 0);
  let unitsCompleted = 0;
  for (const c of courses) {
    if (passed.has(c.courseCode.trim().toLowerCase())) {
      unitsCompleted += c.courseTotalUnits ?? 0;
    }
  }

  const currentYear = new Date().getFullYear();
  const termBlocks: AcademicPlanTermBlock[] = buildCurriculumTermBlocks(courses).map((term, index) => {
    const planCourses: AcademicPlanCourseRow[] = term.courses.map((row) => {
      const codeKey = row.courseCode.trim().toLowerCase();
      let status: AcademicPlanCourseStatus = 'Future';
      if (passed.has(codeKey)) {
        status = 'Available';
      } else if (prerequisiteMet(row.prerequisite, passed)) {
        status = 'Available';
      } else {
        status = 'Pending';
      }
      return { ...row, status };
    });

    return {
      termLabel: term.label,
      schoolYearLabel: index === 0 ? `SY ${currentYear}-${currentYear + 1} (Upcoming)` : `SY ${currentYear}-${currentYear + 1}`,
      headerVariant: index === 0 ? 'recommended' : 'standard',
      badgeLabel: index === 0 ? 'Recommended' : undefined,
      minCompletionYear: currentYear,
      courses: planCourses.filter((c) => !passed.has(c.courseCode.trim().toLowerCase())),
      totalUnits: planCourses.reduce((sum, c) => sum + c.units, 0)
    };
  });

  return {
    statusSummary: {
      totalUnitsRequired,
      unitsCompleted,
      unitsRemaining: Math.max(0, totalUnitsRequired - unitsCompleted)
    },
    expectedCompletionYearOptions: [currentYear, currentYear + 1, currentYear + 2, currentYear + 3],
    defaultExpectedCompletionYear: currentYear + 1,
    suggestedTerms: termBlocks.filter((t) => t.courses.length > 0)
  };
}

export function buildStudentAcademicProfile(
  student: Student,
  enrollments: StudentClassEnrollmentRow[],
  courses: Course[],
  curricula: Curricula | null
): StudentAcademicRecordProfile {
  const fullName = [student.lastName, student.firstName].filter(Boolean).join(', ');

  return {
    studentNumber: student.studentNumber,
    fullName,
    yearLevel: student.yearLevel,
    status: student.status || 'Active',
    program: student.programCode,
    currentCurriculum: buildCurriculumDisplayLabel(student.curriculumCode, curricula),
    currentCurriculumCode: student.curriculumCode?.trim() || undefined,
    termSemesters: mapRegistrarSemestersToEvaluator(groupEnrollmentsIntoSemesterBlocks(enrollments)),
    curriculumTerms: buildCurriculumTermBlocks(courses)
  };
}
