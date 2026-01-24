import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PaginatedResponse } from '../models/api-response.model';

export interface SystemLog {
  id: string;
  action: string;
  user: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  metadata?: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class SystemLogsService extends BaseApiService {
  getLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<PaginatedResponse<SystemLog>> {
    return this.get<PaginatedResponse<SystemLog>>('/system-logs', params);
  }

  getLogById(id: string): Observable<SystemLog> {
    return this.get<SystemLog>(`/system-logs/${id}`);
  }

  getTodayLogs(): Observable<SystemLog[]> {
    return this.get<SystemLog[]>('/system-logs/today');
  }

  exportLogs(params?: {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json' | 'pdf';
  }): Observable<Blob> {
    const url = `${this.baseUrl}/system-logs/export`;
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== null && params[key as keyof typeof params] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }

    return this.http.get(url, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    });
  }
}

