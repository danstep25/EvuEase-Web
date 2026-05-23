import { getStudentAcademicRecordProfile } from './student-academic-records.mock';

export type MigrateCurriculumStatus = 'Active' | 'Inactive';

export interface MigrateCurriculumStudentContext {
  readonly studentNumber: string;
  readonly fullName: string;
  readonly program: string;
  readonly yearLevel: string;
  readonly currentCurriculumCode: string;
}

export interface MigrateCurriculumOption {
  readonly value: string;
  readonly label: string;
  readonly status: MigrateCurriculumStatus;
}

function curriculumOption(
  code: string,
  yearRange: string,
  status: MigrateCurriculumStatus
): MigrateCurriculumOption {
  return {
    value: code,
    label: `${code} - ${yearRange} (${status})`,
    status
  };
}

const CURRICULUM_OPTIONS_BY_PROGRAM: Readonly<Record<string, readonly MigrateCurriculumOption[]>> = {
  BSIT: [
    curriculumOption('BSIT-25-01', '2025-2026', 'Active'),
    curriculumOption('BSIT-24-01', '2024-2025', 'Inactive'),
    curriculumOption('BSIT-23-01', '2023-2024', 'Inactive'),
    curriculumOption('BSIT-22-01', '2022-2023', 'Inactive')
  ],
  BSCS: [
    curriculumOption('BSCS-25-01', '2025-2026', 'Active'),
    curriculumOption('BSCS-24-01', '2024-2025', 'Inactive'),
    curriculumOption('BSCS-23-01', '2023-2024', 'Inactive'),
    curriculumOption('BSCS-22-01', '2022-2023', 'Inactive')
  ]
};

function parseCurriculumCode(currentCurriculum: string): string {
  const dashIndex = currentCurriculum.indexOf(' - ');
  return dashIndex >= 0 ? currentCurriculum.slice(0, dashIndex) : currentCurriculum;
}

export function getMigrateCurriculumContext(studentId: string | null): MigrateCurriculumStudentContext | null {
  const profile = getStudentAcademicRecordProfile(studentId);
  if (!profile) {
    return null;
  }

  const currentCurriculumCode =
    profile.currentCurriculumCode ?? parseCurriculumCode(profile.currentCurriculum);

  return {
    studentNumber: profile.studentNumber,
    fullName: profile.fullName,
    program: profile.program,
    yearLevel: profile.yearLevel,
    currentCurriculumCode
  };
}

export function getNewCurriculumOptions(studentId: string | null): readonly MigrateCurriculumOption[] {
  const context = getMigrateCurriculumContext(studentId);
  if (!context) {
    return [];
  }

  return CURRICULUM_OPTIONS_BY_PROGRAM[context.program] ?? [];
}
