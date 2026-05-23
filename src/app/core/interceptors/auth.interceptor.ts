import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { API_URL } from '../../shared/constants/api.url.constant';

function isAnonymousAuthRequest(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes(API_URL.auth.login.toLowerCase()) ||
    lower.includes('/auth/login') ||
    lower.includes('/auth/register')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const skipAuth = isAnonymousAuthRequest(req.url);
  const token = authService.getToken();

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
        authService.logout();
        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};

