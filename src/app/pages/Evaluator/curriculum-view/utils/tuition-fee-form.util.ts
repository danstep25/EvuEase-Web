import { CreateTuitionFeeRequest } from '../../../../core/models/tuition-fee.model';
import { CreateOtherSchoolFeeRequest } from '../../../../core/models/other-school-fee.model';
import { CreateMiscellaneousFeeRequest } from '../../../../core/models/miscellaneous-fee.model';
import { SyTerm } from '../../../../core/models/sy-term.model';
import { Semester } from '../../../Registrar/curriculum-management/enums/semester.enum';

export const TUITION_FEE_COMPONENT_OPTIONS = ['Lecture', 'Lab', 'Lec/Lab'] as const;

export const TUITION_FEE_SEMESTER_OPTIONS: string[] = Object.values(Semester);

export interface TuitionFeeSelectOption {
  value: string;
  label: string;
}

export function buildTuitionFeeBatchYears(past = 5, future = 5): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let year = currentYear + future; year >= currentYear - past; year--) {
    years.push(String(year));
  }
  return years;
}

export function mapSyTermsToTuitionFeeOptions(syTerms: SyTerm[]): TuitionFeeSelectOption[] {
  return syTerms.map((term) => ({
    value: term.syCode,
    label: `${term.syCode} - ${term.syYear}${term.sySemester ? ` (${term.sySemester})` : ''}`
  }));
}

export function mapCourseComponentFromApi(component: string | undefined | null): string | null {
  if (!component?.trim()) {
    return null;
  }
  const parts = component.split(',').map((c) => c.trim()).filter(Boolean);
  if (parts.length > 1) {
    return TUITION_FEE_COMPONENT_OPTIONS.includes('Lec/Lab' as (typeof TUITION_FEE_COMPONENT_OPTIONS)[number])
      ? 'Lec/Lab'
      : parts.join(', ');
  }
  const single = parts[0];
  const matched = TUITION_FEE_COMPONENT_OPTIONS.find(
    (opt) =>
      single.toLowerCase().includes(opt.toLowerCase()) || opt.toLowerCase().includes(single.toLowerCase())
  );
  return matched ?? single;
}

export function buildCreateTuitionFeeRequest(formValue: {
  syId: string;
  batch: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  component: string;
  units: number | null;
  cash: number | null;
  lowMonthlyPayment: number | null;
}): CreateTuitionFeeRequest {
  return {
    syId: formValue.syId?.trim() || undefined,
    batch: formValue.batch?.trim(),
    semester: formValue.semester?.trim(),
    courseCode: formValue.courseCode?.trim(),
    courseTitle: formValue.courseTitle?.trim(),
    component: formValue.component?.trim(),
    units: formValue.units != null ? Number(formValue.units) : undefined,
    cash: Number(formValue.cash ?? 0),
    lowMonthlyPayment: Number(formValue.lowMonthlyPayment ?? 0)
  };
}

export function buildCreateOtherSchoolFeeRequest(formValue: {
  syId: string;
  batch: string;
  semester: string;
  schoolFee: string;
  cash: number | null;
  lowMonthlyPayment: number | null;
}): CreateOtherSchoolFeeRequest {
  return {
    syId: formValue.syId?.trim() || undefined,
    batch: formValue.batch?.trim(),
    semester: formValue.semester?.trim(),
    schoolFee: formValue.schoolFee?.trim(),
    cash: Number(formValue.cash ?? 0),
    lowMonthlyPayment: Number(formValue.lowMonthlyPayment ?? 0)
  };
}

export function buildCreateMiscellaneousFeeRequest(formValue: {
  syId: string;
  batch: string;
  semester: string;
  miscellaneousFee: string;
  cash: number | null;
  lowMonthlyPayment: number | null;
}): CreateMiscellaneousFeeRequest {
  return {
    syId: formValue.syId?.trim() || undefined,
    batch: formValue.batch?.trim(),
    semester: formValue.semester?.trim(),
    miscellaneousFee: formValue.miscellaneousFee?.trim(),
    cash: Number(formValue.cash ?? 0),
    lowMonthlyPayment: Number(formValue.lowMonthlyPayment ?? 0)
  };
}
