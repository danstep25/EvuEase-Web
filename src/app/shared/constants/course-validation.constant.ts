export const COURSE_TITLE_MAX_LENGTH = 250;

export const COURSE_PREREQUISITE_MAX_LENGTH = 200;

export const COURSE_TITLE_TOO_LONG_MESSAGE = `Course title must be ${COURSE_TITLE_MAX_LENGTH} characters or fewer.`;

export const COURSE_PREREQUISITE_TOO_LONG_MESSAGE = 'Pre-requisites exceed the maximum length.';

export function isCourseTitleLengthMessage(message: string): boolean {
  return message.startsWith('Course title must');
}
