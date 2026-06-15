import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { FormDiscardService } from '../services/form-discard.service';

export interface FormSubmitResult {
  canSubmit: boolean;
  submitted: boolean;
  errorMessage: string | null;
}

export function markAllControlsTouched(control: AbstractControl): void {
  control.markAsTouched();
  if (control instanceof FormGroup) {
    Object.values(control.controls).forEach((child) => markAllControlsTouched(child));
    return;
  }
  if (control instanceof FormArray) {
    control.controls.forEach((child) => markAllControlsTouched(child));
  }
}

export function formHasUnsavedChanges(control: AbstractControl | null | undefined): boolean {
  return !!control?.dirty;
}

export function validateFormForSubmit(
  form: FormGroup,
  options?: { requireChanges?: boolean; isEditMode?: boolean }
): FormSubmitResult {
  markAllControlsTouched(form);

  if (form.invalid) {
    return {
      canSubmit: false,
      submitted: true,
      errorMessage: 'Please fill in all required fields.'
    };
  }

  const requireChanges = options?.requireChanges !== false;
  if (requireChanges && options?.isEditMode && !form.dirty) {
    return {
      canSubmit: false,
      submitted: true,
      errorMessage: 'No changes to save.'
    };
  }

  return {
    canSubmit: true,
    submitted: true,
    errorMessage: null
  };
}

export async function attemptFormClose(params: {
  form: AbstractControl;
  discardService: FormDiscardService;
  close: () => void;
}): Promise<void> {
  if (!formHasUnsavedChanges(params.form)) {
    params.close();
    return;
  }

  const discard = await params.discardService.confirmDiscard();
  if (discard) {
    params.close();
  }
}
