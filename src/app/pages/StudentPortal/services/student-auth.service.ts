import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../core/models/base-response.model';
import { API_URL } from '../../../shared/constants/api.url.constant';
import type { StudentPortalAuthData, StudentPortalLoginRequest, StudentPortalSession } from '../models/student-portal.models';

const TOKEN_KEY = 'student_portal_token';
const USER_KEY = 'student_portal_user';
const EXPIRES_KEY = 'student_portal_expires_at';

@Injectable({ providedIn: 'root' })
export class StudentAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}${API_URL.studentPortal.login}`;

  private readonly currentStudentSubject = new BehaviorSubject<StudentPortalSession | null>(this.getStoredStudent());
  readonly currentStudent$ = this.currentStudentSubject.asObservable();

  login(credentials: StudentPortalLoginRequest): Observable<BaseResponse<StudentPortalAuthData>> {
    return this.http.post<BaseResponse<StudentPortalAuthData>>(this.apiUrl, credentials).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.storeAuthData(response.data);
          this.currentStudentSubject.next(this.mapSession(response.data));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    this.currentStudentSubject.next(null);
    void this.router.navigate(['/student_portal/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentStudent(): StudentPortalSession | null {
    return this.currentStudentSubject.value;
  }

  mustChangePassword(): boolean {
    return this.currentStudentSubject.value?.mustChangePassword ?? false;
  }

  markPasswordChanged(): void {
    const current = this.currentStudentSubject.value;
    if (!current) {
      return;
    }
    const updated: StudentPortalSession = { ...current, mustChangePassword: false };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentStudentSubject.next(updated);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const expiresAt = localStorage.getItem(EXPIRES_KEY);
    if (expiresAt && new Date() >= new Date(expiresAt)) {
      this.logout();
      return false;
    }

    return true;
  }

  private storeAuthData(data: StudentPortalAuthData): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(this.mapSession(data))
    );
    localStorage.setItem(EXPIRES_KEY, data.expiresAt);
  }

  private getStoredStudent(): StudentPortalSession | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StudentPortalSession;
    } catch {
      return null;
    }
  }

  private mapSession(data: StudentPortalAuthData): StudentPortalSession {
    return {
      studentId: data.studentId,
      studentNumber: data.studentNumber,
      name: data.name,
      programCode: data.programCode,
      yearLevel: data.yearLevel,
      curriculumCode: data.curriculumCode ?? null,
      role: data.role,
      mustChangePassword: data.mustChangePassword ?? false
    };
  }
}
