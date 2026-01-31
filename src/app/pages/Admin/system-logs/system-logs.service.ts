import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SystemLog } from '../../../shared/models/system-log.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface SystemLogPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface SystemLogStatistics {
  total: number;
  create: number;
  update: number;
  delete: number;
}

interface StatisticsResponse {
  totalLogs: number;
  createActions: number;
  updateActions: number;
  deleteActions: number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemLogsService extends HttpBaseService {
  getLogs(params?: SystemLogPaginationParams): Observable<PaginatedResponse<SystemLog>> {
    const baseParams = PaginationUtil.buildPaginationParams(params);
    const queryParams: any = { ...baseParams };
    
    if (params?.module) queryParams['module'] = params.module;
    if (params?.action) queryParams['action'] = params.action;
    if (params?.startDate) queryParams['startDate'] = params.startDate;
    if (params?.endDate) queryParams['endDate'] = params.endDate;

    return this.getPaginated<SystemLog>(API_URL.systemLog.getAll, queryParams, 'result');
  }

  getLogStats(): Observable<SystemLogStatistics> {
    return this.get<StatisticsResponse>(API_URL.systemLog.statistics).pipe(
      map(response => ({
        total: response.totalLogs,
        create: response.createActions,
        update: response.updateActions,
        delete: response.deleteActions
      }))
    );
  }
}
