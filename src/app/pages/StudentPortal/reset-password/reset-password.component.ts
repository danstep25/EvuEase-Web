import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StudentPortalService } from '../services/student-portal.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { validateFormForSubmit } from '../../../shared/utils/form-state.util';

@Component({
  selector: 'app-student-portal-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class StudentPortalResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly portalService = inject(StudentPortalService);
  private readonly notificationService = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    studentNumber: ['', Validators.required],
    reason: ['']
  });

  isSubmitting = false;
  submittedSuccess = false;
  errorMessage: string | null = null;
  submitted = false;

  onSubmit(): void {
    const result = validateFormForSubmit(this.form);
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      return;
    }

    const { studentNumber, reason } = this.form.getRawValue();
    this.isSubmitting = true;
    this.errorMessage = null;

    this.portalService.requestPasswordReset(studentNumber.trim(), reason.trim() || undefined).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submittedSuccess = true;
        this.notificationService.success(
          'Request submitted',
          'The registrar will review your password reset request.'
        );
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          error?.message ||
          'Could not submit password reset request.';
      }
    });
  }
}
