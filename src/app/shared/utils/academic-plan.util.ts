import { normalizeStudentYearTerm } from './student-year-level.util';
import { parseCourseYearLevelNumber } from './curriculum-completion.util';

export interface StudentYearSemester {
  readonly year: number;
  readonly semester: 1 | 2;
}

export function parseStudentYearSemester(raw: string | null | undefined): StudentYearSemester {
  const normalized = normalizeStudentYearTerm(raw);
  const match = normalized.match(/^(\d)Y([12])$/i);
  if (!match) {
    return { year: 1, semester: 1 };
  }

  return {
    year: Number.parseInt(match[1], 10),
    semester: Number.parseInt(match[2], 10) as 1 | 2
  };
}

export function parseCurriculumTermYearSemester(termLabel: string): StudentYearSemester {
  const yearMatch = termLabel.match(/Year\s*(\d+)/i);
  const year = yearMatch ? Number.parseInt(yearMatch[1], 10) : 1;
  const semester: 1 | 2 = /\b2\s*nd\b|\bsecond\b/i.test(termLabel) ? 2 : 1;
  return { year, semester };
}

export function isTermAtOrAfterStudentTerm(
  termLabel: string,
  studentYearLevel: string | null | undefined
): boolean {
  return compareTermPosition(parseCurriculumTermYearSemester(termLabel), parseStudentYearSemester(studentYearLevel)) !== 'before';
}

export function isTermAtOrBeforeStudentTerm(
  termLabel: string,
  studentYearLevel: string | null | undefined
): boolean {
  return compareTermPosition(parseCurriculumTermYearSemester(termLabel), parseStudentYearSemester(studentYearLevel)) !== 'after';
}

export type TermPosition = 'before' | 'current' | 'after';

export function compareTermPosition(
  term: StudentYearSemester,
  student: StudentYearSemester
): TermPosition {
  if (term.year < student.year) {
    return 'before';
  }
  if (term.year > student.year) {
    return 'after';
  }
  if (term.semester < student.semester) {
    return 'before';
  }
  if (term.semester > student.semester) {
    return 'after';
  }
  return 'current';
}

export function isCourseInStudentCurrentTerm(
  termLabel: string,
  studentYearLevel: string | null | undefined
): boolean {
  return (
    compareTermPosition(
      parseCurriculumTermYearSemester(termLabel),
      parseStudentYearSemester(studentYearLevel)
    ) === 'current'
  );
}

export function resolveAcademicPlanCourseStatus(
  termLabel: string,
  studentYearLevel: string | null | undefined,
  prerequisite: string,
  passedCourseCodes: ReadonlySet<string>
): 'Available' | 'Pending' | 'Future' {
  const position = compareTermPosition(
    parseCurriculumTermYearSemester(termLabel),
    parseStudentYearSemester(studentYearLevel)
  );

  if (position === 'after') {
    return 'Future';
  }

  const raw = prerequisite?.trim() ?? '';
  if (!raw || raw.toLowerCase() === 'none') {
    return 'Available';
  }

  const codes = raw.split(/[,;]/).map((code) => code.trim().toLowerCase()).filter(Boolean);
  const prerequisitesMet = codes.every((code) => passedCourseCodes.has(code));
  return prerequisitesMet ? 'Available' : 'Pending';
}

export function resolveProgramYearsForPlan(
  programCompletionYears: number | null | undefined,
  courses: ReadonlyArray<{ courseYearLevel?: string | null }>
): number {
  const fromProgram = programCompletionYears ?? 0;
  if (fromProgram > 0) {
    return fromProgram;
  }

  let maxYear = 0;
  for (const course of courses) {
    const year = parseCourseYearLevelNumber(course.courseYearLevel);
    if (year != null && year > maxYear) {
      maxYear = year;
    }
  }

  return maxYear > 0 ? maxYear : 4;
}

export function countRemainingProgramTerms(
  studentYearLevel: string | null | undefined,
  programYears: number
): number {
  const { year: studentYear, semester } = parseStudentYearSemester(studentYearLevel);
  const completedTerms = (studentYear - 1) * 2 + (semester - 1);
  const totalTerms = programYears * 2;
  return Math.max(0, totalTerms - completedTerms);
}

export function computeTermCompletionEndYear(
  termIndex: number,
  currentCalendarYear: number,
  studentYearLevel: string | null | undefined
): number {
  const { semester } = parseStudentYearSemester(studentYearLevel);
  const academicYearOffset = Math.floor((termIndex + (semester - 1)) / 2);
  return currentCalendarYear + academicYearOffset + 1;
}

export function computeEarliestGraduationYear(
  currentCalendarYear: number,
  studentYearLevel: string | null | undefined,
  programYears: number
): number {
  const remainingTerms = countRemainingProgramTerms(studentYearLevel, programYears);
  if (remainingTerms <= 0) {
    return currentCalendarYear;
  }

  return computeTermCompletionEndYear(
    remainingTerms - 1,
    currentCalendarYear,
    studentYearLevel
  );
}

export function computeTermMinCompletionYear(
  termIndex: number,
  currentCalendarYear: number,
  studentYearLevel: string | null | undefined
): number {
  return computeTermCompletionEndYear(termIndex, currentCalendarYear, studentYearLevel);
}

export function buildExpectedCompletionYearOptions(
  earliestYear: number,
  span = 4
): number[] {
  return Array.from({ length: span }, (_, index) => earliestYear + index);
}

export function projectAcademicPlanSchoolYearLabel(
  termIndex: number,
  currentCalendarYear: number,
  studentYearLevel: string | null | undefined
): string {
  const { semester } = parseStudentYearSemester(studentYearLevel);
  const academicYearOffset = Math.floor((termIndex + (semester - 1)) / 2);
  const syStart = currentCalendarYear + academicYearOffset;
  const label = `SY ${syStart}-${syStart + 1}`;
  return termIndex === 0 ? `${label} (Upcoming)` : label;
}
