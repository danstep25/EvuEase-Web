import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TuitionFee, CreateTuitionFeeRequest, UpdateTuitionFeeRequest } from '../../../../../core/models/tuition-fee.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { HttpBaseService } from '../../../../../shared/services/http-base.service';
import { API_URL } from '../../../../../shared/constants/api.url.constant';

export interface TuitionFeesPaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TuitionFeesService extends HttpBaseService {
  getTuitionFees(params?: TuitionFeesPaginationParams): Observable<PaginatedResponse<TuitionFee>> {
    const queryParams = params ? {
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 10,
      SortDirection: params.SortDirection || 'desc',
      SortKey: params.SortKey || '',
      SearchTerm: params.searchTerm || ''
    } : undefined;
    return this.getPaginated<TuitionFee>(API_URL.tuitionFees.getAll, queryParams, 'result');
  }

  getTuitionFeeById(id: string): Observable<TuitionFee> {
    return this.get<TuitionFee>(API_URL.tuitionFees.getById(id));
  }

  createTuitionFee(data: CreateTuitionFeeRequest): Observable<TuitionFee> {
    return this.post<TuitionFee>(API_URL.tuitionFees.create, data);
  }

  updateTuitionFee(id: string, data: UpdateTuitionFeeRequest): Observable<TuitionFee> {
    return this.put<TuitionFee>(API_URL.tuitionFees.update(id), data);
  }

  deleteTuitionFee(id: string): Observable<void> {
    return this.delete<void>(API_URL.tuitionFees.delete(id));
  }
}



