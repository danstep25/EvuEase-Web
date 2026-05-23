import { Curricula } from '../../../core/models/curricula.model';
import { StudentCurriculumHistoryEntry } from '../../../core/models/student-curriculum.model';

function str(raw: Record<string, unknown>, camel: string, pascal: string): string {
  const v = raw[camel] ?? raw[pascal];
  return v != null ? String(v) : '';
}

function strNull(raw: Record<string, unknown>, camel: string, pascal: string): string | null {
  const v = raw[camel] ?? raw[pascal];
  if (v == null || v === '') {
    return null;
  }
  return String(v);
}

function bool(raw: Record<string, unknown>, camel: string, pascal: string): boolean {
  const v = raw[camel] ?? raw[pascal];
  return Boolean(v);
}

export function mapStudentCurriculumHistoryEntry(raw: unknown): StudentCurriculumHistoryEntry {
  const r = raw as Record<string, unknown>;
  return {
    id: str(r, 'id', 'Id'),
    curriculumCode: str(r, 'curriculumCode', 'CurriculumCode'),
    effectiveSchoolYear: strNull(r, 'effectiveSchoolYear', 'EffectiveSchoolYear'),
    reason: strNull(r, 'reason', 'Reason'),
    notes: strNull(r, 'notes', 'Notes'),
    migratedBy: strNull(r, 'migratedBy', 'MigratedBy'),
    createdAt: str(r, 'createdAt', 'CreatedAt'),
    isCurrent: bool(r, 'isCurrent', 'IsCurrent')
  };
}

export function mapStudentCurriculumHistoryList(raw: unknown): StudentCurriculumHistoryEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(mapStudentCurriculumHistoryEntry);
}

export function formatCurriculumHistoryDate(iso: string): string {
  if (!iso?.trim()) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

export function buildCurriculumDisplayLabel(
  curriculumCode: string | null | undefined,
  curricula: Curricula | null
): string {
  const code = curriculumCode?.trim();
  if (!code) {
    return '—';
  }
  if (curricula?.syYear) {
    return `${code} - ${curricula.syYear}`;
  }
  return code;
}

export interface CurriculumHistoryViewModel {
  studentLabel: string;
  entries: StudentCurriculumHistoryEntry[];
}

export function buildCurriculumHistoryViewModel(
  studentNumber: string,
  lastName: string,
  firstName: string,
  entries: StudentCurriculumHistoryEntry[]
): CurriculumHistoryViewModel {
  const sorted = [...entries].sort((a, b) => {
    const tb = Date.parse(b.createdAt) || 0;
    const ta = Date.parse(a.createdAt) || 0;
    return tb - ta;
  });

  return {
    studentLabel: `${studentNumber} - ${lastName}, ${firstName}`,
    entries: sorted
  };
}

export function enrichCurriculumHistoryEntries(
  entries: StudentCurriculumHistoryEntry[],
  schoolYearByCurriculumCode: ReadonlyMap<string, string>
): StudentCurriculumHistoryEntry[] {
  return entries.map((entry) => {
    if (entry.effectiveSchoolYear?.trim()) {
      return entry;
    }
    const syYear = schoolYearByCurriculumCode.get(entry.curriculumCode.trim().toLowerCase());
    if (!syYear?.trim()) {
      return entry;
    }
    return { ...entry, effectiveSchoolYear: syYear.trim() };
  });
}
