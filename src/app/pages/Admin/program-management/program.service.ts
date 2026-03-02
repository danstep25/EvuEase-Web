import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Program, CreateProgramRequest, UpdateProgramRequest } from '../../../core/models/program.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface ProgramPaginationParams extends PaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgramService extends HttpBaseService {
  getPrograms(params?: ProgramPaginationParams): Observable<PaginatedResponse<Program>> {
    const queryParams = params ? {
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 10,
      SortDirection: params.SortDirection || 'desc',
      SortKey: params.SortKey || '',
      SearchTerm: params.searchTerm || ''
    } : undefined;
    return this.getPaginated<Program>(API_URL.program.getAll, queryParams, 'result');
  }

  getProgramById(id: string): Observable<Program> {
    return this.get<Program>(API_URL.program.getById(id));
  }

  createProgram(programData: CreateProgramRequest): Observable<Program> {
    return this.post<Program>(API_URL.program.create, programData);
  }

  updateProgram(id: string, programData: UpdateProgramRequest): Observable<Program> {
    return this.put<Program>(API_URL.program.update(id), programData);
  }

  deleteProgram(id: string): Observable<void> {
    return this.delete<void>(API_URL.program.delete(id));
  }
}


