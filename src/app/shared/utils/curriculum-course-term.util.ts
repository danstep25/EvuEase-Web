import { Course } from '../../core/models/course.model';
import { isElectiveOptionCourse } from './elective-subject.util';

export function normalizeCurriculumYearLevel(year: string | null | undefined): string {
  const value = (year ?? '').trim() || '—';
  const yearMatch = value.match(/^year\s*(\d+)$/i) ?? value.match(/^(\d+)$/);
  if (yearMatch?.[1]) {
    return `Year ${yearMatch[1]}`;
  }

  const lower = value.toLowerCase();
  if (lower.includes('first') || lower === '1st year') {
    return 'Year 1';
  }
  if (lower.includes('second') || lower === '2nd year') {
    return 'Year 2';
  }
  if (lower.includes('third') || lower === '3rd year') {
    return 'Year 3';
  }
  if (lower.includes('fourth') || lower === '4th year') {
    return 'Year 4';
  }
  if (lower.includes('fifth') || lower === '5th year') {
    return 'Year 5';
  }

  return value;
}

export function normalizeCurriculumSemester(semester: string | null | undefined): string {
  const value = (semester ?? '').trim() || '—';
  const lower = value.toLowerCase();
  if (lower.startsWith('2') || lower.includes('second') || lower.includes('2nd')) {
    return '2nd Semester';
  }
  if (lower.startsWith('1') || lower.includes('first') || lower.includes('1st')) {
    return '1st Semester';
  }
  return value;
}

export function buildCurriculumTermLabel(
  yearLevel: string | null | undefined,
  semester: string | null | undefined
): string {
  return `${normalizeCurriculumYearLevel(yearLevel)} - ${normalizeCurriculumSemester(semester)}`;
}

export function filterCurriculumStructureCourses(courses: readonly Course[]): Course[] {
  return courses.filter((course) => !isElectiveOptionCourse(course));
}
