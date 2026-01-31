import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import { LoginRequest, LoginResponseData, User } from '../models/user.model';
import { API_URL } from '../../shared/constants/api.url.constant';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}${API_URL.auth.login}`;
  
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<BaseResponse<LoginResponseData>> {
    return this.http.post<BaseResponse<LoginResponseData>>(
      this.apiUrl,
      credentials
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeAuthData(response.data);
          // Extract user ID from JWT token if available
          const userId = this.extractUserIdFromToken(response.data.token);
          this.currentUserSubject.next({
            id: userId || 0, // Use 0 as fallback if ID not found in token
            email: response.data.email,
            name: response.data.name,
            role: response.data.role
          });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('expires_at');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired using expiresAt
    const expiresAt = localStorage.getItem('expires_at');
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (new Date() >= expirationDate) {
        this.logout();
        return false;
      }
    }

    // Also check JWT expiration as fallback
    return !this.isTokenExpired(token);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role?.toLowerCase() === role.toLowerCase();
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.some(role => user.role?.toLowerCase() === role.toLowerCase());
  }

  private storeAuthData(data: LoginResponseData): void {
    localStorage.setItem('auth_token', data.token);
    // Extract user ID from token
    const userId = this.extractUserIdFromToken(data.token);
    localStorage.setItem('user', JSON.stringify({
      id: userId || 0,
      email: data.email,
      name: data.name,
      role: data.role
    }));
    localStorage.setItem('expires_at', data.expiresAt);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private extractUserIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Try different possible property names for user ID
      const userId = payload.UserId || payload.userId || payload.id || payload.sub;
      return userId ? Number(userId) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}

