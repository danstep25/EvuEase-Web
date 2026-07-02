import { AbstractControl, ValidationErrors } from '@angular/forms';


export function firstValidationMessage(errors: ValidationErrors | null | undefined): string {
  if (!errors) {
    return '';
  }

  if (errors['required']) {
    return 'This field is required.';
  }
  if (errors['maxlength']) {
    const e = errors['maxlength'] as { requiredLength: number; actualLength: number };
    return `Use at most ${e.requiredLength} characters (currently ${e.actualLength}).`;
  }
  if (errors['minlength']) {
    const e = errors['minlength'] as { requiredLength: number; actualLength: number };
    return `Use at least ${e.requiredLength} characters.`;
  }
  if (errors['email']) {
    return 'Enter a valid email address.';
  }
  if (errors['futureDate']) {
    return 'Birthdate cannot be in the future.';
  }
  if (errors['invalidDate']) {
    return 'Enter a valid date.';
  }
  if (errors['phoneTooShort']) {
    const e = errors['phoneTooShort'] as { minDigits: number };
    return `Enter a phone number with at least ${e.minDigits} digits.`;
  }
  if (errors['phoneTooLong']) {
    const e = errors['phoneTooLong'] as { maxDigits: number };
    return `Phone number cannot exceed ${e.maxDigits} digits.`;
  }
  if (errors['nonNegativeAmount']) {
    return 'Amount cannot be negative.';
  }
  if (errors['invalidAmount']) {
    return 'Enter a valid amount.';
  }
  if (errors['min']) {
    const e = errors['min'] as { min: number; actual: number };
    if (e.min === 0) {
      return 'Amount cannot be negative.';
    }
    return `Value must be at least ${e.min}.`;
  }
  if (errors['max']) {
    const e = errors['max'] as { max: number; actual: number };
    return `Value must be at most ${e.max}.`;
  }
  if (errors['duplicateProgramCode']) {
    return 'This program already has a downpayment record.';
  }
  if (errors['duplicateClassNumber']) {
    return 'This class number already exists for the selected academic term.';
  }
  if (errors['passwordMismatch']) {
    return 'Passwords do not match.';
  }
  if (errors['passwordSameAsCurrent']) {
    return 'New password must be different from your current password.';
  }

  return 'This value is not valid.';
}

export function shouldShowControlError(
  control: AbstractControl | null,
  submitted: boolean
): boolean {
  return !!control && control.invalid && (control.touched || submitted);
}

export function controlFirstMessage(control: AbstractControl | null, submitted: boolean): string {
  if (!shouldShowControlError(control, submitted)) {
    return '';
  }
  return firstValidationMessage(control!.errors);
}
