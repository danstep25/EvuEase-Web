export function parseCourseYearLevelNumber(yearLevel: string | null | undefined): number | null {
  const match = /^Year\s*(\d+)/i.exec((yearLevel ?? '').trim());
  if (!match) {
    return null;
  }
  const year = parseInt(match[1], 10);
  return Number.isFinite(year) && year > 0 ? year : null;
}

export function resolveCompletionYearsFromCourses(
  courses: ReadonlyArray<{ courseYearLevel?: string | null }>
): number {
  let maxYear = 0;
  for (const course of courses) {
    const year = parseCourseYearLevelNumber(course.courseYearLevel);
    if (year != null && year > maxYear) {
      maxYear = year;
    }
  }
  return maxYear;
}

export function resolveCurriculumCompletionYears(options: {
  programCompletionYears?: number | null;
  courses?: ReadonlyArray<{ courseYearLevel?: string | null }>;
}): number {
  const fromProgram = options.programCompletionYears ?? 0;
  if (fromProgram > 0) {
    return fromProgram;
  }
  return resolveCompletionYearsFromCourses(options.courses ?? []);
}
