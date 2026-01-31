import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { API_URL } from '../../shared/constants/api.url.constant';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip adding token for login endpoint
  const isLoginRequest = req.url.includes(API_URL.auth.login) || req.url.includes('/auth/login');
  
  if (!isLoginRequest) {
    const token = authService.getToken();
    
    if (token && authService.isAuthenticated()) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginRequest) {
        // Token expired or invalid, logout user
        authService.logout();
        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};

