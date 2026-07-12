import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';
import type {
  CreateEvaluationAuditRequest,
  EvaluationAuditDetail,
  EvaluationAuditListItem
} from './evaluation-audit.models';

export interface EvaluationAuditPaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  searchTerm?: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationAuditService extends HttpBaseService {
  getAuditRecords(params?: EvaluationAuditPaginationParams): Observable<PaginatedResponse<EvaluationAuditListItem>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 25,
          SortDirection: params.SortDirection || 'desc',
          SearchTerm: params.searchTerm || ''
        }
      : undefined;

    return this.getPaginated<EvaluationAuditListItem>(API_URL.evaluationAudit.getAll, queryParams, 'result');
  }

  getAuditRecordById(id: number): Observable<EvaluationAuditDetail> {
    return this.get<EvaluationAuditDetail>(API_URL.evaluationAudit.getById(id));
  }

  createAuditRecord(request: CreateEvaluationAuditRequest): Observable<EvaluationAuditDetail> {
    return this.post<EvaluationAuditDetail>(API_URL.evaluationAudit.create, request).pipe(
      map((row) => row)
    );
  }
}
