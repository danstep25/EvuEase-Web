import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StudentAuthService } from '../services/student-auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { validateFormForSubmit } from '../../../shared/utils/form-state.util';

@Component({
  selector: 'app-student-portal-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class StudentPortalLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly studentAuth = inject(StudentAuthService);
  private readonly notificationService = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    studentNumber: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage: string | null = null;
  submitted = false;

  onSubmit(): void {
    const result = validateFormForSubmit(this.form);
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const { studentNumber, password } = this.form.getRawValue();

    this.studentAuth.login({ studentNumber: studentNumber.trim(), password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          if (response.data.mustChangePassword) {
            void this.router.navigate(['/student_portal/set-password']);
            return;
          }
          this.notificationService.success('Welcome', `Signed in as ${response.data.name}`);
          void this.router.navigate(['/student_portal/dashboard']);
          return;
        }
        this.errorMessage = response.error?.message || 'Login failed.';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          error?.message ||
          'Invalid student number or password.';
      }
    });
  }
}
