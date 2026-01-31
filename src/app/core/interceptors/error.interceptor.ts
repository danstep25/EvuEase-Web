import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad Request';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Forbidden. You do not have permission to access this resource.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 422:
            errorMessage = error.error?.message || 'Validation Error';
            break;
          case 500:
            errorMessage = 'Internal Server Error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service Unavailable. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error Code: ${error.status}`;
        }
      }

      console.error('HTTP Error:', {
        url: req.url,
        status: error.status,
        message: errorMessage,
        error: error.error
      });

      return throwError(() => ({
        ...error,
        userMessage: errorMessage
      }));
    })
  );
};

