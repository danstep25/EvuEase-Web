import type { SearchableSelectOption } from '../../app/shared/components/searchable-select/searchable-select-option.model';
import { MOCK_EVALUATOR_STUDENT_PERMANENT_RECORDS } from './student-permanent-records.mock';

export const SUBJECT_EVALUATION_ALLOWED_PROGRAMS = ['BSIT', 'BSCS'] as const;

export type SubjectEvaluationProgramCode = (typeof SUBJECT_EVALUATION_ALLOWED_PROGRAMS)[number];

export const SUBJECT_EVALUATION_UPCOMING_TERM = {
  schoolYearTerm: '2025-2026 - 2nd Semester',
  enrollmentPeriod: 'May 15, 2025 - June 15, 2025'
} as const;

export const SUBJECT_EVALUATION_PROGRAM_FILTER_OPTIONS = [
  { value: 'all', label: 'All Programs' },
  { value: 'BSIT', label: 'BSIT' },
  { value: 'BSCS', label: 'BSCS' }
] as const;

export const SUBJECT_EVALUATION_YEAR_LEVEL_FILTER_OPTIONS = [
  { value: 'all', label: 'All Year Levels' },
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' }
] as const;

export type SubjectEvaluationProgramFilter =
  (typeof SUBJECT_EVALUATION_PROGRAM_FILTER_OPTIONS)[number]['value'];

export type SubjectEvaluationYearLevelFilter =
  (typeof SUBJECT_EVALUATION_YEAR_LEVEL_FILTER_OPTIONS)[number]['value'];

export type SubjectEvaluationStudentYearLevel = Exclude<SubjectEvaluationYearLevelFilter, 'all'>;

export interface SubjectEvaluationStudentMock {
  readonly id: string;
  readonly studentNumber: string;
  readonly lastName: string;
  readonly firstName: string;
  readonly programCode: SubjectEvaluationProgramCode;
  readonly yearLevelShort: string;
  readonly yearLevelKey: SubjectEvaluationStudentYearLevel;
  readonly curriculumCode: string;
}

export interface SubjectEvaluationStudentSummary {
  readonly studentName: string;
  readonly programYearLevel: string;
  readonly curriculum: string;
}

interface SubjectEvaluationStudentSeed {
  readonly studentId: string;
  readonly lastName: string;
  readonly firstName: string;
  readonly programCode: SubjectEvaluationProgramCode;
  readonly yearLevel: string;
  readonly curriculumCode?: string;
}

function parseYearLevelKey(yearLevel: string): SubjectEvaluationStudentYearLevel | null {
  const match = yearLevel.match(/Year\s*(\d)/i);
  if (!match) {
    return null;
  }
  const key = match[1];
  if (key === '1' || key === '2' || key === '3' || key === '4') {
    return key;
  }
  return null;
}

function parseYearLevelShort(yearLevel: string): string {
  const match = yearLevel.match(/Year\s*(.+)$/i);
  return match ? match[1].trim() : yearLevel;
}

function defaultCurriculumCode(programCode: SubjectEvaluationProgramCode): string {
  return `${programCode}-25-01`;
}

function isAllowedProgram(code: string): code is SubjectEvaluationProgramCode {
  return SUBJECT_EVALUATION_ALLOWED_PROGRAMS.includes(code as SubjectEvaluationProgramCode);
}

function buildSubjectEvaluationStudent(seed: SubjectEvaluationStudentSeed): SubjectEvaluationStudentMock {
  const yearLevelShort = parseYearLevelShort(seed.yearLevel);
  return {
    id: seed.studentId,
    studentNumber: seed.studentId,
    lastName: seed.lastName,
    firstName: seed.firstName,
    programCode: seed.programCode,
    yearLevelShort,
    yearLevelKey: parseYearLevelKey(seed.yearLevel) ?? '1',
    curriculumCode: seed.curriculumCode ?? defaultCurriculumCode(seed.programCode)
  };
}

function mergeSubjectEvaluationStudents(
  ...groups: ReadonlyArray<readonly SubjectEvaluationStudentMock[]>
): readonly SubjectEvaluationStudentMock[] {
  const byId = new Map<string, SubjectEvaluationStudentMock>();
  for (const group of groups) {
    for (const student of group) {
      byId.set(student.id, student);
    }
  }
  return [...byId.values()].sort((a, b) => a.studentNumber.localeCompare(b.studentNumber));
}

/** Figma Step 1 selector rows — merged last so these IDs always match the design. */
const SUBJECT_EVALUATION_SELECTOR_DEMO_STUDENTS: readonly SubjectEvaluationStudentMock[] = [
  buildSubjectEvaluationStudent({
    studentId: '010000145957',
    lastName: 'Dela Cruz',
    firstName: 'Juan',
    programCode: 'BSIT',
    yearLevel: 'Year 2Y1',
    curriculumCode: 'BSIT-22-01'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145958',
    lastName: 'Garcia',
    firstName: 'Maria',
    programCode: 'BSIT',
    yearLevel: 'Year 1Y2',
    curriculumCode: 'BSIT-22-01'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145959',
    lastName: 'Reyes',
    firstName: 'Pedro',
    programCode: 'BSIT',
    yearLevel: 'Year 2Y1',
    curriculumCode: 'BSIT-22-01'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145960',
    lastName: 'Santos',
    firstName: 'Ana',
    programCode: 'BSIT',
    yearLevel: 'Year 4Y2',
    curriculumCode: 'BSIT-22-01'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145961',
    lastName: 'Torres',
    firstName: 'Carlos',
    programCode: 'BSCS',
    yearLevel: 'Year 2Y2',
    curriculumCode: 'BSCS-22-01'
  })
];

/** UI-only overrides for other Subject Evaluation screenshots. */
const SUBJECT_EVALUATION_STUDENT_OVERRIDES: Partial<
  Record<string, Pick<SubjectEvaluationStudentMock, 'lastName' | 'firstName' | 'programCode' | 'yearLevelShort' | 'yearLevelKey' | 'curriculumCode'>>
> = {
  '010000145965': {
    lastName: 'Aquino',
    firstName: 'Luis',
    programCode: 'BSIT',
    yearLevelShort: '1Y1',
    yearLevelKey: '1',
    curriculumCode: 'BSIT-25-01'
  },
  '010000145968': {
    lastName: 'Castro',
    firstName: 'Lucia',
    programCode: 'BSIT',
    yearLevelShort: '1Y1',
    yearLevelKey: '1',
    curriculumCode: 'BSIT-25-01'
  }
};

const SUBJECT_EVALUATION_STUDENTS_FROM_RECORDS: readonly SubjectEvaluationStudentMock[] =
  MOCK_EVALUATOR_STUDENT_PERMANENT_RECORDS.filter((row) => isAllowedProgram(row.programCode)).map((row) => {
    const programCode = row.programCode as SubjectEvaluationProgramCode;
    const base = buildSubjectEvaluationStudent({
      studentId: row.studentId,
      lastName: row.lastName,
      firstName: row.firstName,
      programCode,
      yearLevel: row.yearLevel
    });
    const override = SUBJECT_EVALUATION_STUDENT_OVERRIDES[row.studentId];
    return override ? { ...base, ...override } : base;
  });

/** Additional BSIT/BSCS students for Subject Evaluation selector only. */
const SUBJECT_EVALUATION_ADDITIONAL_STUDENTS: readonly SubjectEvaluationStudentMock[] = [
  buildSubjectEvaluationStudent({
    studentId: '010000145970',
    lastName: 'Rivera',
    firstName: 'Elena',
    programCode: 'BSIT',
    yearLevel: 'Year 3Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145973',
    lastName: 'Hernandez',
    firstName: 'Miguel',
    programCode: 'BSIT',
    yearLevel: 'Year 2Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145974',
    lastName: 'Lopez',
    firstName: 'Sofia',
    programCode: 'BSIT',
    yearLevel: 'Year 1Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145975',
    lastName: 'Ramirez',
    firstName: 'Anton',
    programCode: 'BSCS',
    yearLevel: 'Year 2Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145976',
    lastName: 'Gomez',
    firstName: 'Patricia',
    programCode: 'BSCS',
    yearLevel: 'Year 3Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145977',
    lastName: 'Diaz',
    firstName: 'Gabriel',
    programCode: 'BSIT',
    yearLevel: 'Year 3Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145978',
    lastName: 'Morales',
    firstName: 'Isabel',
    programCode: 'BSIT',
    yearLevel: 'Year 4Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145979',
    lastName: 'Fernandez',
    firstName: 'Marco',
    programCode: 'BSCS',
    yearLevel: 'Year 1Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145980',
    lastName: 'Castillo',
    firstName: 'Diana',
    programCode: 'BSIT',
    yearLevel: 'Year 2Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145981',
    lastName: 'Villar',
    firstName: 'James',
    programCode: 'BSIT',
    yearLevel: 'Year 1Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145982',
    lastName: 'Santiago',
    firstName: 'Bianca',
    programCode: 'BSCS',
    yearLevel: 'Year 4Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145983',
    lastName: 'Tolentino',
    firstName: 'Rafael',
    programCode: 'BSCS',
    yearLevel: 'Year 2Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145984',
    lastName: 'Pascual',
    firstName: 'Hannah',
    programCode: 'BSIT',
    yearLevel: 'Year 3Y1'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145985',
    lastName: 'Domingo',
    firstName: 'Ethan',
    programCode: 'BSIT',
    yearLevel: 'Year 4Y2'
  }),
  buildSubjectEvaluationStudent({
    studentId: '010000145986',
    lastName: 'Salazar',
    firstName: 'Nicole',
    programCode: 'BSCS',
    yearLevel: 'Year 3Y1'
  })
];

export const SUBJECT_EVALUATION_STUDENTS_MOCK: readonly SubjectEvaluationStudentMock[] =
  mergeSubjectEvaluationStudents(
    SUBJECT_EVALUATION_STUDENTS_FROM_RECORDS,
    SUBJECT_EVALUATION_ADDITIONAL_STUDENTS,
    SUBJECT_EVALUATION_SELECTOR_DEMO_STUDENTS
  );

/** Students listed in the Step 1 searchable selector dropdown. */
export function getSubjectEvaluationSelectorStudents(): readonly SubjectEvaluationStudentMock[] {
  return SUBJECT_EVALUATION_SELECTOR_DEMO_STUDENTS;
}

export function findSubjectEvaluationStudent(
  studentId: string | null
): SubjectEvaluationStudentMock | null {
  if (!studentId) {
    return null;
  }
  return SUBJECT_EVALUATION_STUDENTS_MOCK.find((student) => student.id === studentId) ?? null;
}

export function toSubjectEvaluationStudentSummary(
  student: SubjectEvaluationStudentMock
): SubjectEvaluationStudentSummary {
  return {
    studentName: `${student.lastName}, ${student.firstName}`,
    programYearLevel: `${student.programCode} - ${student.yearLevelShort}`,
    curriculum: student.curriculumCode
  };
}

export function toSubjectEvaluationStudentOption(
  student: SubjectEvaluationStudentMock
): SearchableSelectOption {
  return {
    id: student.id,
    primary: `${student.studentNumber} - ${student.lastName}, ${student.firstName}`,
    secondary: `${student.programCode} - Year ${student.yearLevelShort}`
  };
}

export function filterSubjectEvaluationStudents(
  students: readonly SubjectEvaluationStudentMock[],
  programFilter: SubjectEvaluationProgramFilter,
  yearLevelFilter: SubjectEvaluationYearLevelFilter
): SubjectEvaluationStudentMock[] {
  return students.filter((student) => {
    const programMatch = programFilter === 'all' || student.programCode === programFilter;
    const yearMatch = yearLevelFilter === 'all' || student.yearLevelKey === yearLevelFilter;
    return programMatch && yearMatch;
  });
}
