import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';


export function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v == null) {
    return { required: true };
  }
  if (typeof v === 'string' && v.trim() === '') {
    return { required: true };
  }
  return null;
}


export function birthdateNotInFuture(control: AbstractControl): ValidationErrors | null {
  const raw = control.value;
  if (raw == null || raw === '') {
    return null;
  }
  const d = new Date(raw as string);
  if (Number.isNaN(d.getTime())) {
    return { invalidDate: true };
  }
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (d > endOfToday) {
    return { futureDate: true };
  }
  return null;
}


export function phoneDigitsLength(minDigits: number, maxDigits: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || (typeof v === 'string' && v.trim() === '')) {
      return null;
    }
    if (typeof v !== 'string') {
      return null;
    }
    const digits = v.replace(/\D/g, '');
    if (digits.length < minDigits) {
      return { phoneTooShort: { minDigits, actual: digits.length } };
    }
    if (digits.length > maxDigits) {
      return { phoneTooLong: { maxDigits, actual: digits.length } };
    }
    return null;
  };
}
