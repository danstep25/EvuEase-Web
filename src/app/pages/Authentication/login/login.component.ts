import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { validateFormForSubmit } from '../../../shared/utils/form-state.util';
import { controlFirstMessage, shouldShowControlError } from '../../../shared/utils/form-field-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage: string | null = null;
  submitted = false;

  onSubmit(): void {
    const result = validateFormForSubmit(this.loginForm);
    this.submitted = result.submitted;
    if (!result.canSubmit) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;
    
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success && response.data) {
          this.notificationService.success(
            'Login Successful',
            `Welcome back, ${response.data.name || 'User'}!`
          );
          
          const role = response.data.role?.toLowerCase();
          
          if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'evaluator') {
            this.router.navigate(['/evaluator']);
          } else if (role === 'registrar') {
            this.router.navigate(['/registrar']);
          } else {
            this.router.navigate(['/admin']);
          }
        } else {
          const errorMsg = response.error?.message || 'Login failed. Please try again.';
          this.errorMessage = errorMsg;
          this.notificationService.error('Login Failed', errorMsg);
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.userMessage || error.message || 'An error occurred during login. Please try again.';
        this.errorMessage = errorMsg;
        this.notificationService.error('Login Failed', errorMsg);
        console.error('Login failed:', error);
      }
    });
  }

  showFieldError(control: AbstractControl | null): boolean {
    return shouldShowControlError(control, this.submitted);
  }

  fieldError(control: AbstractControl | null): string {
    return controlFirstMessage(control, this.submitted);
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
