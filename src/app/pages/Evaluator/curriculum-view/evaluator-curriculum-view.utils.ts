import type {
  EvaluatorCourseDetailRow,
  EvaluatorCourseFilterOption,
  EvaluatorCourseProgramCard,
  EvaluatorCourseSemesterLabel,
  EvaluatorCurriculumProgramCard,
  EvaluatorCurriculumRow,
  EvaluatorTableViewCurriculumOption
} from './evaluator-curriculum-view.models';
import type { Curricula } from '../../../core/models/curricula.model';
import type { Course } from '../../../core/models/course.model';
import { CurriculumStatus } from '../../Registrar/curriculum-management/enums/curriculum-status.enum';

export const EVALUATOR_COURSE_PREREQ_FILTER = {
  all: '',
  withPre: 'with-pre',
  noPre: 'no-pre'
} as const;

export function mapCoursePrerequisiteFilter(value: string | null | undefined): boolean | undefined {
  const pre = (value ?? '').trim();
  if (pre === EVALUATOR_COURSE_PREREQ_FILTER.withPre) {
    return true;
  }
  if (pre === EVALUATOR_COURSE_PREREQ_FILTER.noPre) {
    return false;
  }
  return undefined;
}

export const EVALUATOR_COURSE_PREREQ_FILTER_OPTIONS: EvaluatorCourseFilterOption[] = [
  { value: EVALUATOR_COURSE_PREREQ_FILTER.all, label: 'All' },
  { value: EVALUATOR_COURSE_PREREQ_FILTER.withPre, label: 'With Pre-requisite(s)' },
  { value: EVALUATOR_COURSE_PREREQ_FILTER.noPre, label: 'No Pre-requisite(s)' }
];

export const EVALUATOR_TABLE_VIEW_YEAR_ORDER = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'] as const;

export function evaluatorCourseHasPrerequisite(prerequisite: string): boolean {
  const normalized = prerequisite.trim().toLowerCase();
  return normalized !== '' && normalized !== 'none' && normalized !== 'n/a';
}

export function parseEvaluatorCourseYearSem(
  yearSem: string
): { year: string; semester: EvaluatorCourseSemesterLabel } | null {
  const trimmed = yearSem.trim();
  const combined = trimmed.match(/^(Year \d+)\s*[-–]\s*(1st|2nd)/i);
  if (combined) {
    const semester: EvaluatorCourseSemesterLabel =
      combined[2].toLowerCase() === '1st' ? '1st Semester' : '2nd Semester';
    return { year: combined[1], semester };
  }

  const yearOnly = trimmed.match(/^(Year \d+)$/i);
  if (yearOnly) {
    return { year: yearOnly[1], semester: '1st Semester' };
  }

  return null;
}

export function resolveCourseYearAndSemester(
  course: Pick<EvaluatorCourseDetailRow, 'yearSem'> & {
    courseYearLevel?: string;
    courseSemester?: string;
  }
): { year: string; semester: EvaluatorCourseSemesterLabel } | null {
  const fromYearSem = parseEvaluatorCourseYearSem(course.yearSem);
  if (fromYearSem) {
    return fromYearSem;
  }

  const year = (course.courseYearLevel ?? '').trim();
  const semRaw = (course.courseSemester ?? '').trim().toLowerCase();
  if (!year.match(/^Year \d+$/i)) {
    return null;
  }

  let semester: EvaluatorCourseSemesterLabel = '1st Semester';
  if (semRaw.startsWith('2') || semRaw.includes('second') || semRaw.includes('2nd')) {
    semester = '2nd Semester';
  }

  return { year, semester };
}

export function groupEvaluatorCoursesByYearSemester(
  courses: EvaluatorCourseDetailRow[]
): Record<string, Record<EvaluatorCourseSemesterLabel, EvaluatorCourseDetailRow[]>> {
  const grouped: Record<string, Record<EvaluatorCourseSemesterLabel, EvaluatorCourseDetailRow[]>> = {};

  for (const course of courses) {
    const parsed = resolveCourseYearAndSemester(course);
    if (!parsed) {
      continue;
    }
    if (!grouped[parsed.year]) {
      grouped[parsed.year] = { '1st Semester': [], '2nd Semester': [] };
    }
    grouped[parsed.year][parsed.semester].push(course);
  }

  return grouped;
}

export function getEvaluatorTableViewYearHeading(year: string): string {
  const headings: Record<string, string> = {
    'Year 1': 'FIRST YEAR',
    'Year 2': 'SECOND YEAR',
    'Year 3': 'THIRD YEAR',
    'Year 4': 'FOURTH YEAR',
    'Year 5': 'FIFTH YEAR'
  };
  return headings[year] ?? year.toUpperCase();
}

export function formatTableViewCurriculumDropdownLabel(option: EvaluatorTableViewCurriculumOption): string {
  return `${option.curriculumId} - ${option.versionSuffix}`;
}

export function formatTableViewCurriculumVersionDisplay(option: EvaluatorTableViewCurriculumOption): string {
  return `${option.curriculumId} - ${option.versionSuffix}`;
}

export function buildProgramCards(curricula: Curricula[]): EvaluatorCurriculumProgramCard[] {
  const counts = new Map<string, { versionCount: number; activeCount: number }>();

  for (const row of curricula) {
    const code = row.programCode?.trim();
    if (!code) {
      continue;
    }
    const entry = counts.get(code) ?? { versionCount: 0, activeCount: 0 };
    entry.versionCount += 1;
    if (row.curriculumStatus === CurriculumStatus.Active) {
      entry.activeCount += 1;
    }
    counts.set(code, entry);
  }

  return [...counts.entries()]
    .map(([programCode, stats]) => ({
      programCode,
      versionCount: stats.versionCount,
      activeCount: stats.activeCount
    }))
    .sort((a, b) => a.programCode.localeCompare(b.programCode));
}

export function buildCourseProgramCards(curricula: Curricula[], courses: Course[]): EvaluatorCourseProgramCard[] {
  const versionCards = buildProgramCards(curricula);
  const courseCounts = new Map<string, number>();

  for (const course of courses) {
    const code = course.programCode?.trim();
    if (!code) {
      continue;
    }
    courseCounts.set(code, (courseCounts.get(code) ?? 0) + 1);
  }

  return versionCards.map((card) => ({
    programCode: card.programCode,
    courseCount: courseCounts.get(card.programCode) ?? 0,
    versionCount: card.versionCount
  }));
}

export function curriculaForProgram(
  rows: EvaluatorCurriculumRow[],
  programCode: string
): EvaluatorCurriculumRow[] {
  return rows.filter((row) => row.program === programCode);
}

