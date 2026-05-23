import { Curricula } from '../../../core/models/curricula.model';
import { Course } from '../../../core/models/course.model';
import { Program } from '../../../core/models/program.model';
import { TuitionFee } from '../../../core/models/tuition-fee.model';
import { OtherSchoolFee } from '../../../core/models/other-school-fee.model';
import { MiscellaneousFee } from '../../../core/models/miscellaneous-fee.model';
import { Downpayment } from '../../../core/models/downpayment.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { CurriculumStatus } from '../../Registrar/curriculum-management/enums/curriculum-status.enum';
import type {
  EvaluatorCourseDetailRow,
  EvaluatorCurriculumRow,
  EvaluatorDownpaymentHistoryRow,
  EvaluatorDownpaymentRow,
  EvaluatorMiscellaneousFeeRow,
  EvaluatorOtherSchoolFeeRow,
  EvaluatorProgramTableMeta,
  EvaluatorTableViewCurriculumOption,
  EvaluatorTuitionFeeRow
} from './evaluator-curriculum-view.models';

function mapCurriculumStatus(status: string | undefined): EvaluatorCurriculumRow['status'] {
  return status === CurriculumStatus.Active ? 'active' : 'inactive';
}

export function resolveCurriculumCode(curricula: Curricula): string {
  const code = curricula.curriculumCode?.trim();
  if (code) {
    return code;
  }
  const program = curricula.programCode?.trim();
  const version = curricula.version?.trim();
  if (program && version) {
    return `${program}-${version}`;
  }
  return '';
}

export function mapCurriculaToRow(curricula: Curricula): EvaluatorCurriculumRow {
  const curriculumId = resolveCurriculumCode(curricula);
  return {
    id: String(curricula.id),
    curriculumId,
    version: curricula.version,
    program: curricula.programCode,
    schoolYear: curricula.syYear,
    effectiveDate: DateUtil.formatDate(curricula.effectiveDate) || curricula.effectiveDate,
    status: mapCurriculumStatus(curricula.curriculumStatus)
  };
}

export function mapCurriculaToTableViewOption(curricula: Curricula): EvaluatorTableViewCurriculumOption {
  const row = mapCurriculaToRow(curricula);
  return {
    ...row,
    versionSuffix: curricula.version
  };
}

export function mapCourseToEvaluatorRow(course: Course): EvaluatorCourseDetailRow {
  const yearLevel = course.courseYearLevel?.trim() ?? '';
  const semester = course.courseSemester?.trim() ?? '';
  const yearSem = yearLevel && semester ? `${yearLevel} - ${semester}` : yearLevel || semester;

  return {
    id: course.courseCode,
    curriculum: course.curriculumCode,
    program: course.programCode ?? '',
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    component: course.courseComponent ?? '',
    units: course.courseTotalUnits ?? 0,
    prerequisite: course.prerequisites?.trim() || 'None',
    yearSem,
    courseYearLevel: yearLevel,
    courseSemester: semester,
    description: course.description ?? ''
  };
}

export function mapProgramTableMeta(program: Program): EvaluatorProgramTableMeta {
  return {
    programTitle: program.programTitle,
    completionYears: program.programCompletionYears ?? 0,
    totalUnits: program.programTotalUnits ?? null
  };
}

export function mapTuitionFeeRow(fee: TuitionFee): EvaluatorTuitionFeeRow {
  return {
    id: String(fee.id),
    syId: fee.syId ?? '',
    batch: fee.batch ?? '',
    semester: fee.semester ?? '',
    courseCode: fee.courseCode ?? '',
    courseTitle: fee.courseTitle ?? '',
    component: fee.component ?? '',
    units: fee.units ?? 0,
    cash: fee.cash,
    lowMonthlyPayment: fee.lowMonthlyPayment
  };
}

export function mapOtherSchoolFeeRow(fee: OtherSchoolFee): EvaluatorOtherSchoolFeeRow {
  return {
    id: String(fee.id),
    syId: fee.syId ?? '',
    batch: fee.batch ?? '',
    semester: fee.semester ?? '',
    schoolFee: fee.schoolFee ?? '',
    cash: fee.cash,
    lowMonthlyPayment: fee.lowMonthlyPayment
  };
}

export function mapMiscellaneousFeeRow(fee: MiscellaneousFee): EvaluatorMiscellaneousFeeRow {
  return {
    id: String(fee.id),
    syId: fee.syId ?? '',
    batch: fee.batch ?? '',
    semester: fee.semester ?? '',
    miscellaneousFee: fee.miscellaneousFee ?? '',
    cash: fee.cash,
    lowMonthlyPayment: fee.lowMonthlyPayment
  };
}

export function mapDownpaymentRow(row: Downpayment): EvaluatorDownpaymentRow {
  return {
    id: String(row.id),
    programCode: row.programCode,
    programTitle: row.programTitle,
    batch: row.batch,
    downpaymentPercent: row.downpaymentPercent,
    effectiveSchoolYear: row.effectiveSchoolYear,
    lastUpdated: row.updatedAt ?? row.createdAt ?? ''
  };
}

export function mapDownpaymentHistoryRow(row: Downpayment): EvaluatorDownpaymentHistoryRow {
  return {
    id: row.id,
    programCode: row.programCode,
    downpaymentPercent: row.downpaymentPercent,
    effectiveSchoolYear: row.effectiveSchoolYear,
    updatedBy: row.updatedBy ?? '—',
    dateModified: row.updatedAt ?? row.createdAt ?? ''
  };
}
