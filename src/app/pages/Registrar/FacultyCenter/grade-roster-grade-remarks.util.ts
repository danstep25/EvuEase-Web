
export type GradeScaleRowLike = { mark: number; grade: number };


export function resolveOfficialGradeFromMark(rows: GradeScaleRowLike[], studentMark: number): number | null {
  if (!rows?.length || !Number.isFinite(studentMark)) {
    return null;
  }
  const sorted = [...rows].sort((a, b) => b.mark - a.mark || b.grade - a.grade);
  for (const r of sorted) {
    if (studentMark >= r.mark) {
      return r.grade;
    }
  }
  return null;
}


export function formatOfficialGradeDisplay(grade: number): string {
  return Number(grade.toFixed(4)).toString();
}


export function deriveRemarksFromOfficialGrade(officialGrade: string | null | undefined): string | null {
  if (officialGrade == null || String(officialGrade).trim() === '') {
    return null;
  }
  const t = String(officialGrade).trim().toUpperCase();
  if (t === 'INC' || t === 'INCOMPLETE' || t === 'I') {
    return 'Incomplete';
  }
  const n = parseFloat(String(officialGrade).trim().replace(',', '.'));
  if (!Number.isNaN(n)) {
    return n <= 3 ? 'Passed' : 'Failed';
  }
  return null;
}


export function rosterRemarkCategoryForFilter(row: {
  officialGrade: string | null;
  remarks: string | null;
}): 'Passed' | 'Failed' | 'Incomplete' | null {
  const gu = (row.officialGrade ?? '').trim().toUpperCase();
  if (gu === 'INC' || gu === 'INCOMPLETE' || gu === 'I') {
    return 'Incomplete';
  }

  const stored = (row.remarks ?? '').trim();
  if (stored) {
    const sl = stored.toLowerCase();
    if (sl === 'passed') return 'Passed';
    if (sl === 'failed') return 'Failed';
    if (sl === 'incomplete') return 'Incomplete';
    const fromGrade = deriveRemarksFromOfficialGrade(row.officialGrade);
    if (fromGrade === 'Passed' || fromGrade === 'Failed' || fromGrade === 'Incomplete') {
      return fromGrade;
    }
    return null;
  }

  const d = deriveRemarksFromOfficialGrade(row.officialGrade);
  if (d === 'Passed' || d === 'Failed' || d === 'Incomplete') {
    return d;
  }
  return null;
}
