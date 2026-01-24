import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiError } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = `${environment.apiUrl}/${environment.apiVersion}`;

  protected getHeaders(): HttpHeaders {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  protected get<T>(endpoint: string, params?: { [key: string]: any }): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<ApiResponse<T>>(url, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      map(response => this.extractData<T>(response)),
      catchError(error => this.handleError(error))
    );
  }

  protected post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.post<ApiResponse<T>>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      catchError(error => this.handleError(error))
    );
  }

  protected put<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.put<ApiResponse<T>>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      catchError(error => this.handleError(error))
    );
  }

  protected patch<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.patch<ApiResponse<T>>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      catchError(error => this.handleError(error))
    );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.delete<ApiResponse<T>>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      catchError(error => this.handleError(error))
    );
  }

  private extractData<T>(response: ApiResponse<T>): T {
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    throw new Error(response.message || 'Unknown error occurred');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      status: error.status,
      message: error.error?.message || error.message || 'An unexpected error occurred',
      errors: error.error?.errors || [],
      timestamp: error.error?.timestamp || new Date().toISOString()
    };

    if (error.status === 401) {
      this.handleUnauthorized();
    }

    return throwError(() => apiError);
  }

  private handleUnauthorized(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

