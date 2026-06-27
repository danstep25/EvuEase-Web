import { studentYearTermToCurriculumTermLabel } from '../../../shared/utils/student-year-level.util';
import type { StudentPortalPendingSubject } from '../models/student-portal.models';

export interface StudentPortalPendingTermGroup {
  readonly yearTerm: string;
  readonly label: string;
  readonly rows: readonly StudentPortalPendingSubject[];
}

function compareYearTermKeys(a: string, b: string): number {
  const parse = (key: string): { year: number; sem: number } => {
    const match = key.trim().match(/^(\d)Y([12])$/i);
    if (!match) {
      return { year: 99, sem: 99 };
    }
    return { year: Number(match[1]), sem: Number(match[2]) };
  };

  const left = parse(a);
  const right = parse(b);
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  return left.sem - right.sem;
}

export function groupPendingSubjectsByYearTerm(
  rows: readonly StudentPortalPendingSubject[]
): readonly StudentPortalPendingTermGroup[] {
  const byTerm = new Map<string, StudentPortalPendingSubject[]>();

  for (const row of rows) {
    const key = row.yearTerm.trim().toUpperCase() || '1Y1';
    const list = byTerm.get(key) ?? [];
    list.push(row);
    byTerm.set(key, list);
  }

  return [...byTerm.entries()]
    .sort(([left], [right]) => compareYearTermKeys(left, right))
    .map(([yearTerm, termRows]) => ({
      yearTerm,
      label: studentYearTermToCurriculumTermLabel(yearTerm),
      rows: [...termRows].sort((left, right) => left.courseCode.localeCompare(right.courseCode))
    }));
}
