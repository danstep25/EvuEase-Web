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
  const studentToken = localStorage.getItem('student_portal_token');
  if (lower.includes('/studentportal/')) {
    return studentToken ?? staffToken;
  }
  // Shared endpoints (e.g. /SyTerm/current) may be hit from the student portal,
  // where only the student token exists. Prefer the staff token but fall back to it.
  return staffToken ?? studentToken;
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
        const isStudentPortalRequest = req.url.toLowerCase().includes('/studentportal/');
        const hasStaffSession = !!authService.getToken();
        // A student may hit shared endpoints (e.g. /SyTerm/current). Don't bounce
        // them to the staff login on 401 — keep them in the student portal.
        if (isStudentPortalRequest || (!hasStaffSession && studentAuth.isAuthenticated())) {
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

