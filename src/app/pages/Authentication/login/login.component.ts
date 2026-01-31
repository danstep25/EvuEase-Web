import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
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

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
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
          
          // Navigate based on role
          if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'evaluator') {
            this.router.navigate(['/evaluator']);
          } else if (role === 'registrar') {
            this.router.navigate(['/registrar']);
          } else {
            // Default fallback
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

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
