export function normalizeAcademicTermLabel(value: string): string {
  return value
    .trim()
    .replace(/\bterm\b/gi, 'Semester')
    .replace(/\s*\/\s*/g, ' / ');
}

export function academicTermsMatch(a: string, b: string): boolean {
  const left = normalizeAcademicTermLabel(a);
  const right = normalizeAcademicTermLabel(b);
  if (!left || !right) {
    return false;
  }
  if (left.toLowerCase() === right.toLowerCase()) {
    return true;
  }
  const compactLeft = left.replace(' / ', '/').toLowerCase();
  const compactRight = right.replace(' / ', '/').toLowerCase();
  return compactLeft === compactRight;
}

export function classNumbersMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function isDuplicateClassNumber(
  rows: readonly { classNumber: string; academicTerm: string }[],
  classNumber: string,
  academicTerm: string
): boolean {
  const cn = classNumber.trim();
  const term = academicTerm.trim();
  if (!cn || !term) {
    return false;
  }
  return rows.some(
    row => classNumbersMatch(row.classNumber, cn) && academicTermsMatch(row.academicTerm, term)
  );
}
