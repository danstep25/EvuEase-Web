import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OtherSchoolFee, CreateOtherSchoolFeeRequest, UpdateOtherSchoolFeeRequest } from '../../../../../core/models/other-school-fee.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../../../shared/services/http-base.service';
import { API_URL } from '../../../../../shared/constants/api.url.constant';

export interface OtherSchoolFeesPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtherSchoolFeesService extends HttpBaseService {
  getOtherSchoolFees(params?: OtherSchoolFeesPaginationParams): Observable<PaginatedResponse<OtherSchoolFee>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 10,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || ''
        }
      : undefined;
    return this.getPaginated<OtherSchoolFee>(API_URL.otherSchoolFees.getAll, queryParams, 'result');
  }

  getOtherSchoolFeeById(id: string): Observable<OtherSchoolFee> {
    return this.get<OtherSchoolFee>(API_URL.otherSchoolFees.getById(id));
  }

  createOtherSchoolFee(data: CreateOtherSchoolFeeRequest): Observable<OtherSchoolFee> {
    return this.post<OtherSchoolFee>(API_URL.otherSchoolFees.create, data);
  }

  updateOtherSchoolFee(id: string, data: UpdateOtherSchoolFeeRequest): Observable<OtherSchoolFee> {
    return this.put<OtherSchoolFee>(API_URL.otherSchoolFees.update(id), data);
  }

  deleteOtherSchoolFee(id: string): Observable<void> {
    return this.delete<void>(API_URL.otherSchoolFees.delete(id));
  }
}



