import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SyTerm, CreateSyTermRequest, UpdateSyTermRequest } from '../../../core/models/sy-term.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface SyTermPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolYearTermService extends HttpBaseService {
  getSyTerms(params?: SyTermPaginationParams): Observable<PaginatedResponse<SyTerm>> {
    const queryParams = params ? {
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 10,
      SortDirection: params.SortDirection || 'desc',
      SortKey: params.SortKey || '',
      SearchTerm: params.searchTerm || ''
    } : undefined;
    return this.getPaginated<SyTerm>(API_URL.syTerm.getAll, queryParams, 'result');
  }

  getCurrentSyTerm(): Observable<SyTerm> {
    return this.get<SyTerm>(API_URL.syTerm.current);
  }

  setCurrentSyTerm(id: string): Observable<SyTerm> {
    return this.put<SyTerm>(API_URL.syTerm.setCurrent(id), {});
  }

  getSyTermById(id: string): Observable<SyTerm> {
    return this.get<SyTerm>(API_URL.syTerm.getById(id));
  }

  createSyTerm(syTermData: CreateSyTermRequest): Observable<SyTerm> {
    return this.post<SyTerm>(API_URL.syTerm.create, syTermData);
  }

  updateSyTerm(id: string, syTermData: UpdateSyTermRequest): Observable<SyTerm> {
    return this.put<SyTerm>(API_URL.syTerm.update(id), syTermData);
  }

  deleteSyTerm(id: string): Observable<void> {
    return this.delete<void>(API_URL.syTerm.delete(id));
  }
}

