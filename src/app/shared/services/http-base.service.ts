import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../core/models/base-response.model';
import { PaginatedResponse } from '../../core/models/api-response.model';

export interface PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  [key: string]: string | number | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class HttpBaseService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;

  protected getHeaders(): HttpHeaders {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  
  protected getAuthHeaders(): HttpHeaders {
    const headers: { [key: string]: string } = {};
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  protected buildQueryParams(params?: PaginationParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }

  protected get<T>(endpoint: string, params?: PaginationParams): Observable<T> {
    return this.http.get<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: this.buildQueryParams(params)
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Request failed');
      }),
      catchError(error => {
        console.error(`Error in GET ${endpoint}:`, error);
        return throwError(() => error);
      })
    );
  }

  protected post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Request failed');
      }),
      catchError(error => {
        console.error(`Error in POST ${endpoint}:`, error);
        return throwError(() => error);
      })
    );
  }

  protected put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Request failed');
      }),
      catchError(error => {
        console.error(`Error in PUT ${endpoint}:`, error);
        return throwError(() => error);
      })
    );
  }

  protected patch<T>(endpoint: string, body: any = {}): Observable<T> {
    return this.http.patch<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Request failed');
      }),
      catchError(error => {
        console.error(`Error in PATCH ${endpoint}:`, error);
        return throwError(() => error);
      })
    );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      observe: 'response'
    }).pipe(
      map((httpResponse: HttpResponse<BaseResponse<T>>) => {
        if (httpResponse.status === 204) {
          return null as T;
        }
        if (httpResponse.status === 200 && httpResponse.body) {
          if (httpResponse.body.success) {
            return httpResponse.body.data || (null as T);
          }
          throw new Error(httpResponse.body.error?.message || 'Request failed');
        }
        throw new Error('Unexpected response status');
      }),
      catchError(error => {
        console.error(`Error in DELETE ${endpoint}:`, error);
        if (error.error) {
          return throwError(() => ({
            ...error,
            userMessage: error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        }
        return throwError(() => error);
      })
    );
  }

  protected getPaginated<T>(
    endpoint: string,
    params?: PaginationParams,
    dataPath?: string
  ): Observable<PaginatedResponse<T>> {
    return this.http.get<BaseResponse<any>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: this.buildQueryParams(params)
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          const logData = response.data;
          const result = dataPath 
            ? (logData[dataPath] || logData[dataPath.charAt(0).toUpperCase() + dataPath.slice(1)])
            : (logData.result || logData.Result || logData.data || []);
          
          if (!Array.isArray(result)) {
            console.error('Expected array but got:', result);
            throw new Error('Invalid response format: expected array in result');
          }
          
          return {
            success: true,
            data: result,
            pagination: {
              page: logData.pageIndex || logData.PageIndex || 1,
              limit: logData.pageSize || logData.PageSize || 10,
              total: logData.totalRecords || logData.TotalRecords || 0,
              totalPages: logData.totalPages || logData.TotalPages || 1
            }
          } as PaginatedResponse<T>;
        }
        throw new Error(response.error?.message || 'Failed to fetch data');
      }),
      catchError(error => {
        console.error(`Error in GET paginated ${endpoint}:`, error);
        return throwError(() => error);
      })
    );
  }
}

