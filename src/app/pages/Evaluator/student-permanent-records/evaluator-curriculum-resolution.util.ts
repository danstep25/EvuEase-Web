import { Curricula } from '../../../core/models/curricula.model';
import { Student } from '../../../core/models/student.model';
import { CurriculumStatus } from '../../Registrar/curriculum-management/enums/curriculum-status.enum';
import {
  getCurriculumVersionTerm,
  getVersionFromCurriculumCode
} from '../../../shared/utils/curriculum-version.util';

function pickMostRecentCurriculum(items: readonly Curricula[]): Curricula {
  return [...items].sort((a, b) => {
    const yearCmp = (b.syYear ?? '').localeCompare(a.syYear ?? '', undefined, { numeric: true });
    if (yearCmp !== 0) {
      return yearCmp;
    }
    return (b.version ?? '').localeCompare(a.version ?? '', undefined, { numeric: true });
  })[0];
}

export function resolveEffectiveCurriculum(
  student: Student,
  programCurricula: readonly Curricula[]
): Curricula | null {
  const programCode = student.programCode?.trim();
  if (!programCode || programCurricula.length === 0) {
    return null;
  }

  const forProgram = programCurricula.filter(
    (curriculum) => curriculum.programCode?.trim().toLowerCase() === programCode.toLowerCase()
  );
  if (forProgram.length === 0) {
    return null;
  }

  const assignedCode = student.curriculumCode?.trim().toLowerCase();
  if (assignedCode) {
    const assigned = forProgram.find(
      (curriculum) => curriculum.curriculumCode.trim().toLowerCase() === assignedCode
    );
    if (assigned) {
      return assigned;
    }
  }

  const active = forProgram.filter(
    (curriculum) => curriculum.curriculumStatus?.trim() === CurriculumStatus.Active
  );

  const studentVersion = getVersionFromCurriculumCode(student.curriculumCode, programCode);
  const studentTerm = getCurriculumVersionTerm(studentVersion);

  if (studentTerm && active.length > 0) {
    const termMatches = active.filter(
      (curriculum) => getCurriculumVersionTerm(curriculum.version)?.toLowerCase() === studentTerm.toLowerCase()
    );
    if (termMatches.length > 0) {
      return pickMostRecentCurriculum(termMatches);
    }
  }

  if (active.length > 0) {
    return pickMostRecentCurriculum(active);
  }

  return null;
}

export function resolveEffectiveCurriculumCode(
  student: Student,
  programCurricula: readonly Curricula[]
): string | null {
  const resolved = resolveEffectiveCurriculum(student, programCurricula);
  if (resolved?.curriculumCode?.trim()) {
    return resolved.curriculumCode.trim();
  }

  return student.curriculumCode?.trim() || null;
}
