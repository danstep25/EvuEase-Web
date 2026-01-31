import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../core/models/user.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface UserPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  registrars: number;
  evaluators: number;
  administrators: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends HttpBaseService {
  getUsers(params?: UserPaginationParams): Observable<PaginatedResponse<User>> {
    const queryParams = PaginationUtil.buildPaginationParams(params);
    return this.getPaginated<User>(API_URL.user.getAll, queryParams, 'result');
  }

  getUserById(id: string): Observable<User> {
    return this.get<User>(API_URL.user.getById(id));
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.post<User>(API_URL.user.create, userData);
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.put<User>(API_URL.user.update(id), userData);
  }

  deleteUser(id: string): Observable<void> {
    return this.delete<void>(API_URL.user.delete(id));
  }

  activateUser(id: string): Observable<User> {
    return this.patch<User>(API_URL.user.activate(id));
  }

  deactivateUser(id: string): Observable<User> {
    return this.patch<User>(API_URL.user.deactivate(id));
  }

  getStatistics(): Observable<UserStatistics> {
    return this.get<UserStatistics>(API_URL.user.statistics);
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
    }>(API_URL.user.stats);
  }
}
