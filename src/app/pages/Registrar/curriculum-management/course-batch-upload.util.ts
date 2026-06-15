import { CourseBatchImportPreviewRow, CourseBatchImportStatus } from './course-batch-upload.model';
import { normalizeUnitValue } from '../../../shared/utils/unit-value.util';

const UNIT_VALIDATION_MESSAGES = [
  'Total units must be greater than zero.',
  'Total units does not match LEC + LAB.'
] as const;

export function prerequisiteCodes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(/[;,]/)
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

export function clampUnitValue(value: number | string | null | undefined): number {
  return normalizeUnitValue(value);
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

export function deriveBatchRowStatus(messages: string[]): CourseBatchImportStatus {
  const isError = messages.some(
    (message) =>
      /required/i.test(message) ||
      /already exists/i.test(message) ||
      /duplicate/i.test(message) ||
      /must be/i.test(message) ||
      /cannot list/i.test(message) ||
      /not found/i.test(message) ||
      /exceed/i.test(message)
  );

  if (isError) {
    return 'Error';
  }

  return messages.length > 0 ? 'Warning' : 'Valid';
}
