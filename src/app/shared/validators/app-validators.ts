import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { countDecimalPlaces, UNIT_DECIMAL_PLACES } from '../utils/unit-value.util';


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

export function maxDecimalPlaces(maxPlaces: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') {
      return null;
    }

    if (countDecimalPlaces(value) > maxPlaces) {
      return { maxDecimalPlaces: { maxPlaces } };
    }

    return null;
  };
}

export function nonNegativeAmountValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') {
      return null;
    }

    const amount = Number(value);
    if (Number.isNaN(amount)) {
      return { invalidAmount: true };
    }

    if (amount < 0) {
      return { nonNegativeAmount: true };
    }

    return null;
  };
}

export function feeAmountFieldValidators(): ValidatorFn[] {
  return [Validators.required, nonNegativeAmountValidator()];
}

export function feePercentFieldValidators(maxPercent = 100): ValidatorFn[] {
  return [Validators.required, nonNegativeAmountValidator(), Validators.max(maxPercent)];
}

export function unitFieldValidators(options?: {
  required?: boolean;
  min?: number;
  max?: number;
}): ValidatorFn[] {
  const { required = true, min = 0, max } = options ?? {};
  const validators: ValidatorFn[] = [];

  if (required) {
    validators.push(Validators.required);
  }

  validators.push(Validators.min(min));
  validators.push(maxDecimalPlaces(UNIT_DECIMAL_PLACES));

  if (max != null) {
    validators.push(Validators.max(max));
  }

  return validators;
}
