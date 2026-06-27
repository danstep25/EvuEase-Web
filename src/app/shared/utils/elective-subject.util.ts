import { Course } from '../../core/models/course.model';

const ELECTIVE_SLOT_TITLE_PATTERN =
  /\b(?:CS|IT|GE|BSCS|BSIT|Professional|General\s+Education|Prof\.?|Gen\.?\s+Ed\.?)\s+Elective\s*(?:\d+|[IVXLC]+)\b/i;

const GENERIC_ELECTIVE_SLOT_TITLE_PATTERN = /\bElective\s*(?:\d+|[IVXLC]+)\b/i;

const ELECTIVE_SLOT_CODE_PATTERN = /^ELEC/i;

export function isElectiveSlotCourse(courseTitle: string | null | undefined, courseCode?: string | null): boolean {
  const title = (courseTitle ?? '').trim();
  const code = (courseCode ?? '').trim();

  if (title && (ELECTIVE_SLOT_TITLE_PATTERN.test(title) || GENERIC_ELECTIVE_SLOT_TITLE_PATTERN.test(title))) {
    return true;
  }

  return code.length > 0 && ELECTIVE_SLOT_CODE_PATTERN.test(code);
}

export function isElectiveOptionCourse(course: Course): boolean {
  return !!course.isElectiveOption && !course.isElectiveSlot;
}

export function resolveElectiveSlotFlag(
  courseTitle: string,
  courseCode: string,
  requested?: boolean | null
): boolean {
  if (requested != null) {
    return requested;
  }
  return isElectiveSlotCourse(courseTitle, courseCode);
}

export function resolveElectiveOptionFlag(isElectiveSlot: boolean, requested?: boolean | null): boolean {
  if (isElectiveSlot) {
    return false;
  }
  return requested ?? false;
}

export interface ElectiveOptionChoice {
  courseCode: string;
  subjectDescription: string;
  units: number;
  component: string;
  prerequisite: string;
}

export function mapCourseToElectiveOption(course: Course): ElectiveOptionChoice {
  return {
    courseCode: course.courseCode,
    subjectDescription: course.courseTitle,
    units: course.courseTotalUnits ?? 0,
    component: course.courseComponent?.trim() || 'Lecture',
    prerequisite: course.prerequisites?.trim() || 'None'
  };
}
