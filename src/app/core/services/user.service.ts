import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService {
  getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Observable<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('/users', params);
  }

  getUserById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`);
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.post<User>('/users', userData);
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.put<User>(`/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<void> {
    return this.delete<void>(`/users/${id}`);
  }

  activateUser(id: string): Observable<User> {
    return this.patch<User>(`/users/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<User> {
    return this.patch<User>(`/users/${id}/deactivate`, {});
  }

  getUserStats(): Observable<{
    total: number;
    active: number;
    byRole: { [key: string]: number };
  }> {
    return this.get<{
      total: number;
      active: number;
      byRole: { [key: string]: number };
    }>('/users/stats');
  }
}

