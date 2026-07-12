import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Curricula, CreateCurriculaRequest, UpdateCurriculaRequest } from '../../../core/models/curricula.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { BaseResponse } from '../../../core/models/base-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface CurriculaPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  
  status?: string;
  programId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurriculumManagementService extends HttpBaseService {
  private readonly rawHttp = inject(HttpClient);

  getCurricula(params?: CurriculaPaginationParams): Observable<PaginatedResponse<Curricula>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 10,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || '',
          ...(params.status ? { Status: params.status } : {}),
          ...(params.programId != null ? { ProgramId: params.programId } : {})
        }
      : undefined;
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

  uploadSupportingDocument(curriculumCode: string, file: File): Observable<Curricula> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.rawHttp
      .post<BaseResponse<Curricula>>(
        `${this.baseUrl}${API_URL.curricula.uploadSupportingDocument(curriculumCode)}`,
        formData,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.error?.message || 'Upload failed');
        }),
        catchError((error) =>
          throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message ||
              error.error?.message ||
              error.message ||
              'Could not upload supporting document.'
          }))
        )
      );
  }

  downloadSupportingDocument(curriculumCode: string): Observable<Blob> {
    return this.rawHttp
      .get(`${this.baseUrl}${API_URL.curricula.downloadSupportingDocument(curriculumCode)}`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      })
      .pipe(
        catchError((error) =>
          throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message ||
              error.error?.message ||
              error.message ||
              'Could not download supporting document.'
          }))
        )
      );
  }
}

