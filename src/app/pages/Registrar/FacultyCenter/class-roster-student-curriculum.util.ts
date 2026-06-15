import { Curricula } from '../../../core/models/curricula.model';

export interface ProgramCurriculumImportSelection {
  programCode: string;
  curriculumCode: string;
}

const FIRST_YEAR_PATTERNS = [
  /^year\s*1\b/i,
  /^first\s+year\b/i,
  /^1st\s+year\b/i,
  /^1y\d/i
];

export function isFirstYearLevel(yearLevel: string | null | undefined): boolean {
  const value = yearLevel?.trim() ?? '';
  if (!value) {
    return false;
  }
  return FIRST_YEAR_PATTERNS.some((pattern) => pattern.test(value));
}

export function isActiveCurriculum(curriculum: Pick<Curricula, 'curriculumStatus'> | null | undefined): boolean {
  return (curriculum?.curriculumStatus ?? '').trim().toLowerCase() === 'active';
}

export function filterActiveCurricula(curricula: readonly Curricula[]): Curricula[] {
  return curricula.filter((row) => isActiveCurriculum(row));
}

export function resolveActiveCurriculumForProgram(
  curricula: readonly Curricula[],
  programCode: string
): Curricula | null {
  const code = programCode.trim().toUpperCase();
  const active = curricula.filter(
    (row) =>
      row.programCode?.trim().toUpperCase() === code &&
      (row.curriculumStatus ?? '').trim().toLowerCase() === 'active'
  );

  if (active.length === 0) {
    return null;
  }

  return [...active].sort((a, b) => {
    const dateCompare = (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? '');
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return (b.id ?? 0) - (a.id ?? 0);
  })[0];
}

export function formatCurriculumOptionLabel(row: Curricula): string {
  const status = (row.curriculumStatus ?? '').trim();
  const statusSuffix =
    status.toLowerCase() === 'active' ? ' · Active' : status ? ` · ${status}` : '';
  const schoolYear = row.syYear?.trim();
  const yearSuffix = schoolYear ? ` (${schoolYear})` : '';
  return `${row.curriculumCode}${yearSuffix}${statusSuffix}`;
}

export function uniqueProgramCodes(programCodes: readonly (string | null | undefined)[]): string[] {
  return [...new Set(programCodes.map((code) => code?.trim() ?? '').filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
}

export function normalizeProgramCode(code: string | null | undefined): string {
  return code?.trim().toUpperCase() ?? '';
}

export function hasMultiplePrograms(programCodes: readonly (string | null | undefined)[]): boolean {
  return uniqueProgramCodes(programCodes).length > 1;
}

export interface ProgramTabStats {
  total: number;
  selected: number;
}

export function programTabStatsForRows<T extends { rowKey: string; programCode?: string | null }>(
  rows: readonly T[],
  programCode: string,
  selectedKeys: ReadonlySet<string>
): ProgramTabStats {
  const key = normalizeProgramCode(programCode);
  let total = 0;
  let selected = 0;
  for (const row of rows) {
    if (normalizeProgramCode(row.programCode) !== key) {
      continue;
    }
    total++;
    if (selectedKeys.has(row.rowKey)) {
      selected++;
    }
  }
  return { total, selected };
}

export function filterRowsByProgram<T extends { programCode?: string | null }>(
  rows: readonly T[],
  programCode: string | null | undefined
): T[] {
  if (!programCode?.trim()) {
    return [...rows];
  }
  const key = normalizeProgramCode(programCode);
  return rows.filter((row) => normalizeProgramCode(row.programCode) === key);
}

export function buildProgramCurriculumImportPayload(
  selections: Readonly<Record<string, string>>
): ProgramCurriculumImportSelection[] {
  return Object.entries(selections)
    .map(([programCode, curriculumCode]) => ({
      programCode: programCode.trim(),
      curriculumCode: curriculumCode.trim()
    }))
    .filter((row) => row.programCode && row.curriculumCode);
}

export function allProgramsHaveCurriculumSelection(
  programCodes: readonly string[],
  selections: Readonly<Record<string, string>>
): boolean {
  return programCodes.every((programCode) => !!selections[programCode]?.trim());
}

export function groupCurriculaByProgram(curricula: readonly Curricula[]): Record<string, Curricula[]> {
  const grouped: Record<string, Curricula[]> = {};
  for (const row of filterActiveCurricula([...curricula])) {
    const code = row.programCode?.trim().toUpperCase()
      || row.curriculumCode?.split('-')[0]?.trim().toUpperCase()
      || '';
    if (!code) {
      continue;
    }
    grouped[code] = grouped[code] ?? [];
    grouped[code].push(row);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = [...grouped[key]].sort((a, b) =>
      (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? '')
    );
  }

  return grouped;
}

export function defaultCurriculumSelectionsForPrograms(
  programCodes: readonly string[],
  groupedCurricula: Readonly<Record<string, Curricula[]>>
): Record<string, string> {
  const selections: Record<string, string> = {};
  for (const programCode of programCodes) {
    const key = programCode.trim().toUpperCase();
    const rows = groupedCurricula[key] ?? [];
    const active = resolveActiveCurriculumForProgram(rows, programCode);
    if (active?.curriculumCode) {
      selections[programCode] = active.curriculumCode.trim();
    }
  }
  return selections;
}
