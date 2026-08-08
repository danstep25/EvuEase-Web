export function getCurriculumVersionTerm(version: string | null | undefined): string | null {
  const trimmed = version?.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split('-').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return parts[1];
}

export function curriculumVersionTermsMatch(
  leftVersion: string | null | undefined,
  rightVersion: string | null | undefined
): boolean {
  const leftTerm = getCurriculumVersionTerm(leftVersion);
  const rightTerm = getCurriculumVersionTerm(rightVersion);
  if (!leftTerm || !rightTerm) {
    return false;
  }

  return leftTerm.toLowerCase() === rightTerm.toLowerCase();
}

export function getVersionFromCurriculumCode(
  curriculumCode: string | null | undefined,
  programCode: string | null | undefined
): string | null {
  const code = curriculumCode?.trim();
  if (!code) {
    return null;
  }

  const program = programCode?.trim();
  if (program) {
    const prefix = `${program}-`;
    if (code.toLowerCase().startsWith(prefix.toLowerCase())) {
      const version = code.slice(prefix.length).trim();
      return version || null;
    }
  }

  const parts = code.split('-').filter(Boolean);
  if (parts.length >= 3) {
    return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  }

  return getCurriculumVersionTerm(code) ? code : null;
}
