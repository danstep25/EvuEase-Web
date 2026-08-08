import { CourseBatchImportPreviewRow, CourseBatchImportStatus } from './course-batch-upload.model';
import { normalizeUnitValue } from '../../../shared/utils/unit-value.util';
import {
  parsePrerequisiteCodes,
  normalizePrerequisiteString
} from '../../../shared/utils/course-prerequisite.util';
import {
  COURSE_TITLE_MAX_LENGTH,
  COURSE_TITLE_TOO_LONG_MESSAGE,
  COURSE_PREREQUISITE_MAX_LENGTH,
  COURSE_PREREQUISITE_TOO_LONG_MESSAGE,
  isCourseTitleLengthMessage
} from '../../../shared/constants/course-validation.constant';

export { parsePrerequisiteCodes as prerequisiteCodes, normalizePrerequisiteString };

const UNIT_VALIDATION_MESSAGES = [
  'Total units must be greater than zero.',
  'Total units does not match LEC + LAB.'
] as const;

const PREREQUISITE_VALIDATION_PATTERNS = [
  /cannot list itself/i,
  /not found/i,
  /exceed the maximum length/i
] as const;

export function isPrerequisiteValidationMessage(message: string): boolean {
  return PREREQUISITE_VALIDATION_PATTERNS.some((pattern) => pattern.test(message));
}

export function applyRowPrerequisiteValidation(
  row: CourseBatchImportPreviewRow,
  knownCodes: ReadonlySet<string>
): void {
  row.messages = row.messages.filter((message) => !isPrerequisiteValidationMessage(message));

  const normalized = normalizePrerequisiteString(row.prerequisites);

  if (normalized && normalized.length > COURSE_PREREQUISITE_MAX_LENGTH) {
    row.messages.push(COURSE_PREREQUISITE_TOO_LONG_MESSAGE);
  }

  const courseCode = row.courseCode.trim().toUpperCase();
  for (const code of parsePrerequisiteCodes(normalized)) {
    if (code === courseCode) {
      row.messages.push(`Course cannot list itself as a pre-requisite (${code}).`);
      continue;
    }

    if (!knownCodes.has(code)) {
      row.messages.push(`Pre-requisite '${code}' was not found in this file or in curriculum.`);
    }
  }

  row.status = deriveBatchRowStatus(row.messages);
}

export function buildKnownPrerequisiteCodes(rows: readonly CourseBatchImportPreviewRow[]): Set<string> {
  const known = new Set<string>();

  for (const row of rows) {
    const courseCode = row.courseCode.trim().toUpperCase();
    if (courseCode) {
      known.add(courseCode);
    }

    for (const code of parsePrerequisiteCodes(row.prerequisites)) {
      known.add(code);
    }
  }

  return known;
}

export function clampUnitValue(value: number | string | null | undefined): number {
  return normalizeUnitValue(value);
}

function isErrorMessage(message: string): boolean {
  if (isCourseTitleLengthMessage(message)) {
    return false;
  }

  return (
    /required/i.test(message) ||
    /already exists/i.test(message) ||
    /duplicate/i.test(message) ||
    /must be/i.test(message) ||
    /cannot list/i.test(message) ||
    /not found/i.test(message) ||
    /exceed/i.test(message)
  );
}

export function deriveBatchRowStatus(messages: string[]): CourseBatchImportStatus {
  if (messages.some(isErrorMessage)) {
    return 'Error';
  }

  return messages.length > 0 ? 'Warning' : 'Valid';
}

export function applyRowTitleValidation(row: CourseBatchImportPreviewRow): void {
  row.messages = row.messages.filter((message) => !isCourseTitleLengthMessage(message));

  if (row.courseTitle.trim().length > COURSE_TITLE_MAX_LENGTH) {
    row.messages.push(COURSE_TITLE_TOO_LONG_MESSAGE);
  }

  row.status = deriveBatchRowStatus(row.messages);
}

export function applyRowUnitValidation(row: CourseBatchImportPreviewRow): void {
  row.messages = row.messages.filter((message) => !UNIT_VALIDATION_MESSAGES.includes(message as typeof UNIT_VALIDATION_MESSAGES[number]));

  if (row.courseTotalUnits <= 0) {
    row.messages.push(UNIT_VALIDATION_MESSAGES[0]);
  } else if (
    row.courseLecUnits + row.courseLabUnits > 0 &&
    row.courseTotalUnits !== row.courseLecUnits + row.courseLabUnits
  ) {
    row.messages.push(UNIT_VALIDATION_MESSAGES[1]);
  }

  row.status = deriveBatchRowStatus(row.messages);
}

export function applyRowValidation(row: CourseBatchImportPreviewRow): void {
  row.messages = row.messages.filter(
    (message) =>
      !isCourseTitleLengthMessage(message) &&
      !UNIT_VALIDATION_MESSAGES.includes(message as (typeof UNIT_VALIDATION_MESSAGES)[number])
  );

  if (row.courseTitle.trim().length > COURSE_TITLE_MAX_LENGTH) {
    row.messages.push(COURSE_TITLE_TOO_LONG_MESSAGE);
  }

  if (row.courseTotalUnits <= 0) {
    row.messages.push(UNIT_VALIDATION_MESSAGES[0]);
  } else if (
    row.courseLecUnits + row.courseLabUnits > 0 &&
    row.courseTotalUnits !== row.courseLecUnits + row.courseLabUnits
  ) {
    row.messages.push(UNIT_VALIDATION_MESSAGES[1]);
  }

  row.status = deriveBatchRowStatus(row.messages);
}

export function countRowsWithLongTitles(rows: readonly CourseBatchImportPreviewRow[]): number {
  return rows.filter((row) => row.courseTitle.trim().length > COURSE_TITLE_MAX_LENGTH).length;
}

export function hasExistingCourseCodeMessage(messages: readonly string[]): boolean {
  return messages.some((message) => /already exists/i.test(message));
}

export function isRowEligibleForImport(row: CourseBatchImportPreviewRow): boolean {
  return (
    row.selected &&
    row.status !== 'Error' &&
    row.courseTitle.trim().length <= COURSE_TITLE_MAX_LENGTH &&
    !hasExistingCourseCodeMessage(row.messages)
  );
}

export function countRowsWithExistingCourseCodes(rows: readonly CourseBatchImportPreviewRow[]): number {
  return rows.filter((row) => row.selected && hasExistingCourseCodeMessage(row.messages)).length;
}
