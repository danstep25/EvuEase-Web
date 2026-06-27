import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../core/models/base-response.model';
import { API_URL } from '../../../shared/constants/api.url.constant';
import { mapStudentEnrollmentOverview } from '../../Registrar/students/student-enrollments.mapper';
import { StudentAuthService } from './student-auth.service';
import type {
  StudentPortalDashboard,
  StudentPortalEnrollments,
  StudentPortalPasswordResetRequest,
  StudentPortalPendingSubject,
  StudentPortalProfile
} from '../models/student-portal.models';

@Injectable({ providedIn: 'root' })
export class StudentPortalService {
  private readonly http = inject(HttpClient);
  private readonly studentAuth = inject(StudentAuthService);
  private readonly baseUrl = environment.apiUrl;

  getDashboard(): Observable<StudentPortalDashboard> {
    return this.get<StudentPortalDashboard>(API_URL.studentPortal.dashboard);
  }

  getProfile(): Observable<StudentPortalProfile> {
    return this.get<StudentPortalProfile>(API_URL.studentPortal.me);
  }

  getEnrollments(): Observable<StudentPortalEnrollments> {
    return this.get<unknown>(API_URL.studentPortal.enrollments).pipe(
      map((raw) => mapStudentEnrollmentOverview(raw))
    );
  }

  getPendingSubjects(): Observable<readonly StudentPortalPendingSubject[]> {
    return this.get<StudentPortalPendingSubject[]>(API_URL.studentPortal.pendingSubjects);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.post<void>(API_URL.studentPortal.changePassword, { currentPassword, newPassword });
  }

  requestPasswordReset(studentNumber: string, reason?: string): Observable<void> {
    return this.anonymousPost<void>(API_URL.studentPortal.passwordResetRequest, { studentNumber, reason });
  }

  listPasswordResetRequests(status?: string): Observable<readonly StudentPortalPasswordResetRequest[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.staffGet<StudentPortalPasswordResetRequest[]>(
      `${API_URL.studentPortal.passwordResetRequests}${query}`
    );
  }

  resolvePasswordResetRequest(id: number, newPortalPassword: string, registrarNotes?: string): Observable<void> {
    return this.staffPost<void>(API_URL.studentPortal.resolvePasswordReset(id), {
      newPortalPassword,
      registrarNotes
    });
  }

  rejectPasswordResetRequest(id: number, registrarNotes?: string): Observable<void> {
    return this.staffPost<void>(API_URL.studentPortal.rejectPasswordReset(id), { registrarNotes });
  }

  private get<T>(endpoint: string): Observable<T> {
    return this.http
      .get<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, { headers: this.studentHeaders() })
      .pipe(map((response) => this.unwrap(response)), catchError((error) => throwError(() => error)));
  }

  private post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, body, { headers: this.studentHeaders() })
      .pipe(map((response) => this.unwrap(response, true)), catchError((error) => throwError(() => error)));
  }

  private anonymousPost<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      })
      .pipe(map((response) => this.unwrap(response, true)), catchError((error) => throwError(() => error)));
  }

  private staffGet<T>(endpoint: string): Observable<T> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http
      .get<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, { headers })
      .pipe(map((response) => this.unwrap(response)), catchError((error) => throwError(() => error)));
  }

  private staffPost<T>(endpoint: string, body: unknown): Observable<T> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http
      .post<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, body, { headers })
      .pipe(map((response) => this.unwrap(response, true)), catchError((error) => throwError(() => error)));
  }

  private studentHeaders(): HttpHeaders {
    const token = this.studentAuth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private unwrap<T>(response: BaseResponse<T>, allowEmpty = false): T {
    if (response.success) {
      if (response.data != null || allowEmpty) {
        return response.data as T;
      }
    }
    throw new Error(response.error?.message || 'Request failed');
  }
}
