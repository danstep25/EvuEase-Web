import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StudentPortalService } from '../services/student-portal.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { validateFormForSubmit } from '../../../shared/utils/form-state.util';
import { controlFirstMessage, shouldShowControlError } from '../../../shared/utils/form-field-error.util';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!newPassword || !confirmPassword) {
    return null;
  }
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

function newPasswordDifferent(group: AbstractControl): ValidationErrors | null {
  const currentPassword = group.get('currentPassword')?.value;
  const newPassword = group.get('newPassword')?.value;
  if (!currentPassword || !newPassword) {
    return null;
  }
  return currentPassword === newPassword ? { passwordSameAsCurrent: true } : null;
}

@Component({
  selector: 'app-student-portal-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly portalService = inject(StudentPortalService);
  private readonly notificationService = inject(NotificationService);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: [passwordsMatch, newPasswordDifferent] }
  );

  isSubmitting = false;
  errorMessage: string | null = null;
  submitted = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  changeSuccess = false;

  onSubmit(): void {
    const result = validateFormForSubmit(this.form);
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'New password and confirmation do not match.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.changeSuccess = false;
    this.portalService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.form.reset();
        this.submitted = false;
        this.changeSuccess = true;
        this.notificationService.success('Password updated', 'Your portal password was changed.');
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          error?.message ||
          'Could not change password.';
      }
    });
  }

  showFieldError(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): boolean {
    return shouldShowControlError(this.form.get(controlName), this.submitted);
  }

  fieldMessage(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    return controlFirstMessage(this.form.get(controlName), this.submitted);
  }

  get showPasswordMismatch(): boolean {
    return (
      this.submitted &&
      !!this.form.errors?.['passwordMismatch'] &&
      !!this.form.get('confirmPassword')?.value
    );
  }

  get showSameAsCurrent(): boolean {
    return this.submitted && !!this.form.errors?.['passwordSameAsCurrent'];
  }

  get newPasswordValue(): string {
    return this.form.get('newPassword')?.value ?? '';
  }

  get meetsMinLength(): boolean {
    return this.newPasswordValue.length >= 6;
  }
}
