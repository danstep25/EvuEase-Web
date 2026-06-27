import { Course } from '../../../core/models/course.model';
import { Curricula } from '../../../core/models/curricula.model';
import { Student } from '../../../core/models/student.model';
import { StudentClassEnrollmentRow } from '../../../core/models/student-enrollments.model';
import {
  compareAcademicTermChronological,
  groupEnrollmentsIntoSemesterBlocks,
  parseOfficialGradeToNumber
} from '../../Registrar/students/student-enrollments.mapper';
import {
  buildCurriculumTermBlocks,
  mergeCurriculumWithEnrollments
} from '../../Registrar/students/academic-records-curriculum.mapper';
import { buildCurriculumDisplayLabel } from '../../Registrar/students/student-curriculum.mapper';
import {
  buildExpectedCompletionYearOptions,
  computeEarliestGraduationYear,
  computeTermMinCompletionYear,
  isTermAtOrAfterStudentTerm,
  parseCurriculumTermYearSemester,
  projectAcademicPlanSchoolYearLabel,
  resolveAcademicPlanCourseStatus,
  resolveProgramYearsForPlan
} from '../../../shared/utils/academic-plan.util';
import {
  curriculumTermLabelMatchesStudentYearTerm,
  enrollmentMatchesStudentYearTerm,
  studentYearTermToCurriculumTermLabel
} from '../../../shared/utils/student-year-level.util';
import type {
  AcademicPlanCourseRow,
  AcademicPlanCourseStatus,
  AcademicPlanTermBlock,
  AcademicRecordCourseRow,
  AcademicRecordCurriculumTermBlock,
  AcademicRecordRemark,
  AcademicRecordSemesterBlock,
  StudentAcademicPlan,
  StudentAcademicRecordProfile
} from './evaluator-student-academic.models';
import type { AcademicRecordCourseRow as RegistrarCourseRow, AcademicRecordSemesterBlock as RegistrarSemesterBlock } from '../../../core/models/academic-records.model';

function mapRegistrarRemarkToEvaluator(row: RegistrarCourseRow): AcademicRecordRemark {
  if (row.isNotTaken || row.remarkKind === 'not-taken') {
    return 'NOT TAKEN';
  }
  if (row.remarkKind === 'pending') {
    return 'PENDING';
  }
  if (row.remarkKind === 'incomplete') {
    return 'INCOMPLETE';
  }
  if (row.remarksSub?.toUpperCase().includes('RETAKE') && row.remarkKind === 'passed') {
    return 'PASSED (RETAKE)';
  }
  if (row.remarkKind === 'failed') {
    return 'FAILED';
  }
  if (row.remarkKind === 'passed') {
    return 'PASSED';
  }
  return 'PASSED';
}

function mapRegistrarRowToEvaluator(row: RegistrarCourseRow): AcademicRecordCourseRow {
  return {
    courseCode: row.courseCode,
    subjectDescription: row.subjectDescription,
    units: row.units,
    grade: row.isNotTaken ? '—' : row.grade != null ? row.grade.toFixed(2) : '—',
    remarks: mapRegistrarRemarkToEvaluator(row),
    showGradeHistoryIcon: row.isRetake,
    isNotTaken: row.isNotTaken
  };
}

export function mapRegistrarSemestersToEvaluator(blocks: RegistrarSemesterBlock[]): AcademicRecordSemesterBlock[] {
  const sorted = [...blocks].sort((a, b) =>
    compareAcademicTermChronological(b.rawAcademicTerm, a.rawAcademicTerm)
  );

  return sorted.map((block, index) => ({
    label: index === 0 ? `${block.label} (Most Recent)` : block.label,
    headerVariant: index === 0 ? 'recent' : 'standard',
    totalUnits: block.courses.reduce((sum, c) => sum + c.units, 0),
    courses: block.courses.map((c) => mapRegistrarRowToEvaluator(c))
  }));
}

export function mapCurriculumMergedSemestersToEvaluator(
  blocks: RegistrarSemesterBlock[],
  extraBlocks: RegistrarSemesterBlock[] = []
): AcademicRecordSemesterBlock[] {
  return [...blocks, ...extraBlocks].map((block) => ({
    label: block.label,
    headerVariant: 'standard' as const,
    totalUnits: block.courses.reduce((sum, c) => sum + c.units, 0),
    courses: block.courses.map((c) => mapRegistrarRowToEvaluator(c))
  }));
}

function mapCurrentTermSemestersToEvaluator(
  blocks: RegistrarSemesterBlock[]
): AcademicRecordSemesterBlock[] {
  return blocks.map((block) => ({
    label: block.label,
    headerVariant: 'recent' as const,
    totalUnits: block.courses.reduce((sum, c) => sum + c.units, 0),
    courses: block.courses.map((c) => mapRegistrarRowToEvaluator(c))
  }));
}

function filterEnrollmentsForStudentCurrentTerm(
  enrollments: StudentClassEnrollmentRow[],
  studentYearLevel: string
): StudentClassEnrollmentRow[] {
  return enrollments.filter((row) =>
    enrollmentMatchesStudentYearTerm(row.yearLevel, studentYearLevel)
  );
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

export function buildAcademicPlan(
  courses: Course[],
  enrollments: StudentClassEnrollmentRow[],
  studentYearLevel: string,
  programCompletionYears?: number | null
): StudentAcademicPlan | null {
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
  const programYears = resolveProgramYearsForPlan(programCompletionYears, courses);
  const earliestGraduationYear = computeEarliestGraduationYear(
    currentYear,
    studentYearLevel,
    programYears
  );

  const remainingTerms = buildCurriculumTermBlocks(courses).filter((term) =>
    isTermAtOrAfterStudentTerm(term.label, studentYearLevel)
  );

  const termBlocks: AcademicPlanTermBlock[] = remainingTerms.map((term, index) => {
    const planCourses: AcademicPlanCourseRow[] = term.courses
      .map((row) => ({
        ...row,
        status: resolveAcademicPlanCourseStatus(
          term.label,
          studentYearLevel,
          row.prerequisite,
          passed
        )
      }))
      .filter((course) => !passed.has(course.courseCode.trim().toLowerCase()));

    const termYear = parseCurriculumTermYearSemester(term.label).year;

    return {
      termLabel: term.label,
      schoolYearLabel: projectAcademicPlanSchoolYearLabel(index, currentYear, studentYearLevel),
      headerVariant: index === 0 ? 'recommended' : 'standard',
      badgeLabel: index === 0 ? 'Recommended' : undefined,
      minCompletionYear: computeTermMinCompletionYear(termYear, programYears, currentYear),
      courses: planCourses,
      totalUnits: planCourses.reduce((sum, course) => sum + course.units, 0)
    };
  });

  return {
    statusSummary: {
      totalUnitsRequired,
      unitsCompleted,
      unitsRemaining: Math.max(0, totalUnitsRequired - unitsCompleted)
    },
    expectedCompletionYearOptions: buildExpectedCompletionYearOptions(earliestGraduationYear),
    defaultExpectedCompletionYear: earliestGraduationYear,
    suggestedTerms: termBlocks.filter((term) => term.courses.length > 0)
  };
}

export function buildCurriculumTermsWithEnrollmentStatus(
  courses: Course[],
  enrollments: StudentClassEnrollmentRow[]
): AcademicRecordCurriculumTermBlock[] {
  if (courses.length === 0) {
    return [];
  }

  const merged = mergeCurriculumWithEnrollments(courses, enrollments);
  const prerequisiteByCode = new Map<string, string>();
  for (const course of courses) {
    const code = course.courseCode?.trim().toLowerCase();
    if (!code) {
      continue;
    }
    prerequisiteByCode.set(code, course.prerequisites?.trim() || 'None');
  }

  return merged.blocks.map((block) => {
    const rows = block.courses.map((row) => ({
      courseCode: row.courseCode,
      subjectDescription: row.subjectDescription,
      prerequisite: prerequisiteByCode.get(row.courseCode.trim().toLowerCase()) ?? 'None',
      units: row.units,
      grade: row.isNotTaken ? '—' : row.grade != null ? row.grade.toFixed(2) : '—',
      remarks: mapRegistrarRemarkToEvaluator(row),
      isNotTaken: row.isNotTaken
    }));

    return {
      label: block.label,
      courses: rows,
      totalUnits: rows.reduce((sum, row) => sum + row.units, 0)
    };
  });
}

export function buildStudentAcademicProfile(
  student: Student,
  enrollments: StudentClassEnrollmentRow[],
  courses: Course[],
  curricula: Curricula | null,
  effectiveCurriculumCode?: string | null
): StudentAcademicRecordProfile {
  const fullName = [student.lastName, student.firstName].filter(Boolean).join(', ');
  const curriculumCode = effectiveCurriculumCode?.trim() || student.curriculumCode?.trim() || undefined;

  const usesCurriculumRoadmap = courses.length > 0;
  const merged = usesCurriculumRoadmap
    ? mergeCurriculumWithEnrollments(courses, enrollments)
    : null;
  const currentTermLabel = studentYearTermToCurriculumTermLabel(student.yearLevel);

  const currentTermSemesters = merged
    ? mapCurrentTermSemestersToEvaluator(
        merged.blocks.filter((block) =>
          curriculumTermLabelMatchesStudentYearTerm(block.label, student.yearLevel)
        )
      )
    : mapCurrentTermSemestersToEvaluator(
        groupEnrollmentsIntoSemesterBlocks(
          filterEnrollmentsForStudentCurrentTerm(enrollments, student.yearLevel)
        )
      );

  return {
    studentNumber: student.studentNumber,
    fullName,
    yearLevel: student.yearLevel,
    status: student.status || 'Active',
    program: student.programCode,
    currentCurriculum: buildCurriculumDisplayLabel(curriculumCode, curricula),
    currentCurriculumCode: curriculumCode,
    currentTermLabel,
    termSemesters: currentTermSemesters,
    curriculumTerms: buildCurriculumTermsWithEnrollmentStatus(courses, enrollments),
    usesCurriculumRoadmap
  };
}
