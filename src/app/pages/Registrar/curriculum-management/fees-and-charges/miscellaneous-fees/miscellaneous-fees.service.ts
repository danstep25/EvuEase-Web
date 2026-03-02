import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MiscellaneousFee, CreateMiscellaneousFeeRequest, UpdateMiscellaneousFeeRequest } from '../../../../../core/models/miscellaneous-fee.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../../../shared/services/http-base.service';
import { API_URL } from '../../../../../shared/constants/api.url.constant';

export interface MiscellaneousFeesPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiscellaneousFeesService extends HttpBaseService {
  getMiscellaneousFees(params?: MiscellaneousFeesPaginationParams): Observable<PaginatedResponse<MiscellaneousFee>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 10,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || ''
        }
      : undefined;
    return this.getPaginated<MiscellaneousFee>(API_URL.miscellaneousFees.getAll, queryParams, 'result');
  }

  getMiscellaneousFeeById(id: string): Observable<MiscellaneousFee> {
    return this.get<MiscellaneousFee>(API_URL.miscellaneousFees.getById(id));
  }

  createMiscellaneousFee(data: CreateMiscellaneousFeeRequest): Observable<MiscellaneousFee> {
    return this.post<MiscellaneousFee>(API_URL.miscellaneousFees.create, data);
  }

  updateMiscellaneousFee(id: string, data: UpdateMiscellaneousFeeRequest): Observable<MiscellaneousFee> {
    return this.put<MiscellaneousFee>(API_URL.miscellaneousFees.update(id), data);
  }

  deleteMiscellaneousFee(id: string): Observable<void> {
    return this.delete<void>(API_URL.miscellaneousFees.delete(id));
  }
}



