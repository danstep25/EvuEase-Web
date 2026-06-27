import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentPortalService } from '../services/student-portal.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { validateFormForSubmit } from '../../../shared/utils/form-state.util';

@Component({
  selector: 'app-student-portal-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly portalService = inject(StudentPortalService);
  private readonly notificationService = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  isSubmitting = false;
  errorMessage: string | null = null;
  submitted = false;

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
    this.portalService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.form.reset();
        this.submitted = false;
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
}
