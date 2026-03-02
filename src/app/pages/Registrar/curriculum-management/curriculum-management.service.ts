import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Curricula, CreateCurriculaRequest, UpdateCurriculaRequest } from '../../../core/models/curricula.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface CurriculaPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurriculumManagementService extends HttpBaseService {
  getCurricula(params?: CurriculaPaginationParams): Observable<PaginatedResponse<Curricula>> {
    const queryParams = params ? {
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 10,
      SortDirection: params.SortDirection || 'desc',
      SortKey: params.SortKey || '',
      SearchTerm: params.searchTerm || ''
    } : undefined;
    return this.getPaginated<Curricula>(API_URL.curricula.getAll, queryParams, 'result');
  }

  getCurriculaById(id: string): Observable<Curricula> {
    return this.get<Curricula>(API_URL.curricula.getById(id));
  }

  createCurricula(curriculaData: CreateCurriculaRequest): Observable<Curricula> {
    return this.post<Curricula>(API_URL.curricula.create, curriculaData);
  }

  updateCurricula(id: string, curriculaData: UpdateCurriculaRequest): Observable<Curricula> {
    return this.put<Curricula>(API_URL.curricula.update(id), curriculaData);
  }

  deleteCurricula(id: string): Observable<void> {
    return this.delete<void>(API_URL.curricula.delete(id));
  }
}




