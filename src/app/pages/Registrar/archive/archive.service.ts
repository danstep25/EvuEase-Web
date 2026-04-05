import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../core/models/base-response.model';
import { HttpBaseService, PaginationParams } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';
import {
  ArchivedCurriculumRow,
  ArchivedProgramRow,
  ArchivedSchoolYearRow,
  ArchivedStudentRow
} from './archive.models';


@Injectable({
  providedIn: 'root'
})
export class ArchiveService extends HttpBaseService {
  listArchivedPrograms(filters: PaginationParams): Observable<ArchivedProgramRow[]> {
    return this.fetchList<ArchivedProgramRow>(API_URL.archive.programs, filters);
  }

  listArchivedStudents(filters: PaginationParams): Observable<ArchivedStudentRow[]> {
    return this.fetchList<ArchivedStudentRow>(API_URL.archive.students, filters);
  }

  listArchivedSchoolYears(filters: PaginationParams): Observable<ArchivedSchoolYearRow[]> {
    return this.fetchList<ArchivedSchoolYearRow>(API_URL.archive.schoolYears, filters);
  }

  listArchivedCurricula(filters: PaginationParams): Observable<ArchivedCurriculumRow[]> {
    return this.fetchList<ArchivedCurriculumRow>(API_URL.archive.curricula, filters);
  }

  restoreProgram(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.restoreProgram(id));
  }

  permanentDeleteProgram(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.permanentProgram(id));
  }

  restoreStudent(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.restoreStudent(id));
  }

  permanentDeleteStudent(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.permanentStudent(id));
  }

  restoreSchoolYear(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.restoreSchoolYear(id));
  }

  permanentDeleteSchoolYear(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.permanentSchoolYear(id));
  }

  restoreCurriculum(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.restoreCurriculum(id));
  }

  permanentDeleteCurriculum(id: string): Observable<void> {
    return this.postEmpty(API_URL.archive.permanentCurriculum(id));
  }

  private fetchList<T>(endpoint: string, filters: PaginationParams): Observable<T[]> {
    return this.http
      .get<BaseResponse<T[]>>(`${environment.apiUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params: this.buildQueryParams(filters)
      })
      .pipe(
        map(res => (res.success && Array.isArray(res.data) ? res.data : [])),
        catchError(err => {
          console.warn(`Archive list ${endpoint} unavailable:`, err?.message ?? err);
          return of([]);
        })
      );
  }

  private postEmpty(endpoint: string): Observable<void> {
    return this.http
      .post<BaseResponse<unknown>>(`${environment.apiUrl}${endpoint}`, {}, { headers: this.getHeaders() })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.error?.message || 'Request failed');
          }
        })
      );
  }
}
