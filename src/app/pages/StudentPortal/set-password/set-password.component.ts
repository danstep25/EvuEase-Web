import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { StudentPortalService } from '../services/student-portal.service';
import { StudentAuthService } from '../services/student-auth.service';
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

@Component({
  selector: 'app-student-portal-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss'
})
export class StudentPortalSetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly portalService = inject(StudentPortalService);
  private readonly studentAuth = inject(StudentAuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly studentName = this.studentAuth.getCurrentStudent()?.name ?? '';

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: [passwordsMatch] }
  );

  isSubmitting = false;
  errorMessage: string | null = null;
  submitted = false;
  showNewPassword = false;
  showConfirmPassword = false;

  onSubmit(): void {
    const result = validateFormForSubmit(this.form);
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      return;
    }

    const { newPassword } = this.form.getRawValue();
    this.isSubmitting = true;
    this.errorMessage = null;

    this.portalService.setNewPassword(newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.studentAuth.markPasswordChanged();
        this.notificationService.success('Password updated', 'Your new password is now active.');
        void this.router.navigate(['/student_portal/dashboard']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          error?.message ||
          'Could not set your new password.';
      }
    });
  }

  logout(): void {
    this.studentAuth.logout();
  }

  showFieldError(controlName: 'newPassword' | 'confirmPassword'): boolean {
    return shouldShowControlError(this.form.get(controlName), this.submitted);
  }

  fieldMessage(controlName: 'newPassword' | 'confirmPassword'): string {
    return controlFirstMessage(this.form.get(controlName), this.submitted);
  }

  get showPasswordMismatch(): boolean {
    return this.submitted && !!this.form.errors?.['passwordMismatch'] && !!this.form.get('confirmPassword')?.value;
  }

  get meetsMinLength(): boolean {
    return (this.form.get('newPassword')?.value ?? '').length >= 6;
  }
}
