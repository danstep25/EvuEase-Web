import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Student } from '../../../core/models/student.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface StudentsPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  programCode?: string;
  yearLevel?: string;
  type?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentsService extends HttpBaseService {
  getStudents(params?: StudentsPaginationParams): Observable<PaginatedResponse<Student>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 10,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || '',
          ProgramCode: params.programCode || '',
          YearLevel: params.yearLevel || '',
          Type: params.type || '',
          Status: params.status || ''
        }
      : undefined;

    return this.getPaginated<Student>(API_URL.student.getAll, queryParams, 'result');
  }
}



