const YEAR_DIGITS = ['1', '2', '3', '4', '5'] as const;
type YearDigit = (typeof YEAR_DIGITS)[number];

const YEAR_LABEL_TO_DIGIT: Readonly<Record<string, YearDigit>> = {
  'first year': '1',
  'second year': '2',
  'third year': '3',
  'fourth year': '4',
  'fifth year': '5',
  'year 1': '1',
  'year 2': '2',
  'year 3': '3',
  'year 4': '4',
  'year 5': '5',
  '1st year': '1',
  '2nd year': '2',
  '3rd year': '3',
  '4th year': '4',
  '5th year': '5'
};

export const STUDENT_YEAR_TERM_OPTIONS: readonly string[] = YEAR_DIGITS.flatMap((year) => [
  `${year}Y1`,
  `${year}Y2`
]);

function isYearDigit(value: string): value is YearDigit {
  return (YEAR_DIGITS as readonly string[]).includes(value);
}

function toYearTerm(yearDigit: YearDigit, semesterDigit: '1' | '2'): string {
  return `${yearDigit}Y${semesterDigit}`;
}

export function normalizeStudentYearTerm(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) {
    return '1Y1';
  }

  const compact = value.replace(/\s/g, '');
  const compactMatch = compact.match(/^(\d)Y([12])$/i);
  if (compactMatch) {
    const yearDigit = compactMatch[1];
    const semesterDigit = compactMatch[2] as '1' | '2';
    if (isYearDigit(yearDigit)) {
      return toYearTerm(yearDigit, semesterDigit);
    }
  }

  const yearTermSuffix = value.match(/Year\s*(\d)\s*Y\s*([12])/i);
  if (yearTermSuffix) {
    const yearDigit = yearTermSuffix[1];
    const semesterDigit = yearTermSuffix[2] as '1' | '2';
    if (isYearDigit(yearDigit)) {
      return toYearTerm(yearDigit, semesterDigit);
    }
  }

  const lower = value.toLowerCase();
  const fromLabel = YEAR_LABEL_TO_DIGIT[lower];
  if (fromLabel) {
    return toYearTerm(fromLabel, '1');
  }

  const yearOnlyMatch = lower.match(/^year\s*(\d)(?:\s|$)/i);
  if (yearOnlyMatch?.[1] && isYearDigit(yearOnlyMatch[1])) {
    return toYearTerm(yearOnlyMatch[1], '1');
  }

  const ordinalMatch = lower.match(/^(\d)(?:st|nd|rd|th)\s+year$/i);
  if (ordinalMatch?.[1] && isYearDigit(ordinalMatch[1])) {
    return toYearTerm(ordinalMatch[1], '1');
  }

  if (STUDENT_YEAR_TERM_OPTIONS.some((option) => option.toLowerCase() === compact.toLowerCase())) {
    return compact.toUpperCase();
  }

  return '1Y1';
}

export function studentYearTermFilterOptions(): { value: string; label: string }[] {
  return [
    { value: '', label: 'All Year Levels' },
    ...STUDENT_YEAR_TERM_OPTIONS.map((level) => ({ value: level, label: level }))
  ];
}

export function studentYearTermToCurriculumTermLabel(raw: string | null | undefined): string {
  const normalized = normalizeStudentYearTerm(raw);
  const match = normalized.match(/^(\d)Y([12])$/i);
  if (!match) {
    return 'Year 1 - 1st Semester';
  }

  const semesterLabel = match[2] === '2' ? '2nd Semester' : '1st Semester';
  return `Year ${match[1]} - ${semesterLabel}`;
}

function normalizeTermLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function curriculumTermLabelMatchesStudentYearTerm(
  termLabel: string,
  studentYearLevel: string | null | undefined
): boolean {
  const expected = studentYearTermToCurriculumTermLabel(studentYearLevel);
  const stripSuffix = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return normalizeTermLabel(stripSuffix(termLabel)) === normalizeTermLabel(expected);
}

export function enrollmentMatchesStudentYearTerm(
  enrollmentYearLevel: string | null | undefined,
  studentYearLevel: string | null | undefined
): boolean {
  return (
    normalizeStudentYearTerm(enrollmentYearLevel).toLowerCase() ===
    normalizeStudentYearTerm(studentYearLevel).toLowerCase()
  );
}
