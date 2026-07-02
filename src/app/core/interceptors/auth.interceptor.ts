import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StudentAuthService } from '../../pages/StudentPortal/services/student-auth.service';
import { API_URL } from '../../shared/constants/api.url.constant';

function isAnonymousAuthRequest(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes(API_URL.auth.login.toLowerCase()) ||
    lower.includes('/auth/login') ||
    lower.includes('/auth/register') ||
    lower.includes('/studentportal/login') ||
    (lower.includes('/studentportal/password-reset-request') &&
      !lower.includes('/studentportal/password-reset-requests'))
  );
}

function resolveAuthToken(url: string, staffToken: string | null): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('/studentportal/')) {
    return localStorage.getItem('student_portal_token') ?? staffToken;
  }
  return staffToken;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const studentAuth = inject(StudentAuthService);
  const router = inject(Router);

  const skipAuth = isAnonymousAuthRequest(req.url);
  const token = resolveAuthToken(req.url, authService.getToken());

  if (!skipAuth && token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !skipAuth) {
        if (req.url.toLowerCase().includes('/studentportal/')) {
          studentAuth.logout();
        } else {
          authService.logout();
          router.navigate(['/']);
        }
      }

      return throwError(() => error);
    })
  );
};

