export const COURSE_PREREQUISITE_MAX_LENGTH = 200;

const NONE_VALUES = new Set(['none', 'n/a', '-']);

export function parsePrerequisiteCodes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  const trimmed = raw.trim();
  if (NONE_VALUES.has(trimmed.toLowerCase())) {
    return [];
  }

  const seen = new Set<string>();
  const codes: string[] = [];

  for (const part of trimmed.split(/[;,]/)) {
    const code = part.trim().toUpperCase();
    if (!code || seen.has(code)) {
      continue;
    }
    seen.add(code);
    codes.push(code);
  }

  return codes;
}

export function formatPrerequisiteCodes(codes: readonly string[]): string | null {
  const normalized = parsePrerequisiteCodes(codes.join('; '));
  return normalized.length === 0 ? null : normalized.join('; ');
}

export function normalizePrerequisiteString(raw: string | null | undefined): string | null {
  return formatPrerequisiteCodes(parsePrerequisiteCodes(raw));
}

export function prerequisitesToFormArray(raw: string | null | undefined): string[] {
  return parsePrerequisiteCodes(raw);
}
