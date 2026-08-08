import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Downpayment, CreateDownpaymentRequest, UpdateDownpaymentRequest } from '../../../../../core/models/downpayment.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { HttpBaseService } from '../../../../../shared/services/http-base.service';
import { API_URL } from '../../../../../shared/constants/api.url.constant';

function normalizeOptString(v: unknown): string | undefined {
  if (v == null) {
    return undefined;
  }
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export interface DownpaymentPaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DownpaymentService extends HttpBaseService {
  getDownpayments(params?: DownpaymentPaginationParams): Observable<PaginatedResponse<Downpayment>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 10,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || ''
        }
      : undefined;
    return this.getPaginated<Downpayment>(API_URL.downpayment.getAll, queryParams, 'result').pipe(
      map(res => ({
        ...res,
        data: (res.data ?? []).map(r => this.mapDownpaymentRow(r as unknown as Record<string, unknown>))
      }))
    );
  }

  private mapDownpaymentRow(raw: Record<string, unknown>): Downpayment {
    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      programCode: String(raw['programCode'] ?? raw['ProgramCode'] ?? ''),
      programTitle: String(raw['programTitle'] ?? raw['ProgramTitle'] ?? ''),
      batch: String(raw['batch'] ?? raw['Batch'] ?? ''),
      downpaymentPercent: Number(raw['downpaymentPercent'] ?? raw['DownpaymentPercent'] ?? 0),
      effectiveSchoolYear: String(raw['effectiveSchoolYear'] ?? raw['EffectiveSchoolYear'] ?? ''),
      createdAt: (raw['createdAt'] ?? raw['CreatedAt']) as string | undefined,
      updatedAt: (raw['updatedAt'] ?? raw['UpdatedAt']) as string | undefined,
      createdBy: normalizeOptString(raw['createdBy'] ?? raw['CreatedBy']),
      updatedBy: normalizeOptString(raw['updatedBy'] ?? raw['UpdatedBy'])
    };
  }

  getHistoryByProgram(programCode: string): Observable<Downpayment[]> {
    const code = (programCode || '').trim();
    return this.get<unknown[]>(API_URL.downpayment.history, { programCode: code }).pipe(
      map(data => {
        const list = Array.isArray(data) ? data : [];
        return list.map(r => this.mapDownpaymentRow(r as Record<string, unknown>));
      })
    );
  }

  createDownpayment(data: CreateDownpaymentRequest): Observable<Downpayment> {
    return this.post<Downpayment>(API_URL.downpayment.create, {
      programCode: data.programCode,
      programTitle: data.programTitle,
      batch: data.batch,
      downpaymentPercent: data.downpaymentPercent,
      effectiveSchoolYear: data.effectiveSchoolYear
    });
  }

  updateDownpayment(data: UpdateDownpaymentRequest): Observable<Downpayment> {
    return this.put<Downpayment>(API_URL.downpayment.update(data.id), {
      id: Number(data.id),
      programCode: data.programCode,
      programTitle: data.programTitle,
      batch: data.batch,
      downpaymentPercent: data.downpaymentPercent,
      effectiveSchoolYear: data.effectiveSchoolYear
    });
  }

  deleteDownpayment(id: string): Observable<void> {
    return this.delete<void>(API_URL.downpayment.delete(id));
  }
}
