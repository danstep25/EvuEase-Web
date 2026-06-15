import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../../../core/models/course.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { BaseResponse } from '../../../core/models/base-response.model';
import { HttpBaseService } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';
import {
  CourseBatchImportPreviewResponse,
  CourseBatchImportRequest,
  CourseBatchImportResultResponse,
  CourseBatchPdfDetectionResponse
} from './course-batch-upload.model';

export interface CoursePaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  programId?: number;
  curriculumCode?: string;
  yearLevel?: string;
  semester?: string;
  hasPrerequisites?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService extends HttpBaseService {
  private readonly rawHttp = inject(HttpClient);

  getCourses(params?: CoursePaginationParams): Observable<PaginatedResponse<Course>> {
    const queryParams: any = {};
    
    if (params) {
      queryParams.PageIndex = params.PageIndex || 1;
      queryParams.PageSize = params.PageSize || 10;
      queryParams.SortDirection = params.SortDirection || 'desc';
      if (params.SortKey) {
        queryParams.SortKey = params.SortKey;
      }
      if (params.searchTerm) {
        queryParams.SearchTerm = params.searchTerm;
      }
      if (params.programId !== undefined && params.programId !== null) {
        queryParams.ProgramId = params.programId;
      }
      if (params.curriculumCode) {
        queryParams.CurriculumCode = params.curriculumCode;
      }
      if (params.yearLevel) {
        queryParams.YearLevel = params.yearLevel;
      }
      if (params.semester) {
        queryParams.Semester = params.semester;
      }
      if (params.hasPrerequisites !== undefined && params.hasPrerequisites !== null) {
        queryParams.HasPrerequisites = params.hasPrerequisites;
      }
    }
    
    return this.getPaginated<Course>(API_URL.course.getAll, queryParams, 'result');
  }

  getCourseById(code: string): Observable<Course> {
    return this.get<Course>(API_URL.course.getById(code));
  }

  createCourse(courseData: CreateCourseRequest): Observable<Course> {
    return this.post<Course>(API_URL.course.create, courseData);
  }

  updateCourse(code: string, courseData: UpdateCourseRequest): Observable<Course> {
    return this.put<Course>(API_URL.course.update(code), courseData);
  }

  deleteCourse(code: string): Observable<void> {
    return this.delete<void>(API_URL.course.delete(code));
  }

  previewCourseBatchImport(payload: CourseBatchImportRequest): Observable<CourseBatchImportPreviewResponse> {
    return this.post<CourseBatchImportPreviewResponse>(API_URL.course.batchPreview, payload);
  }

  previewCourseBatchPdf(
    file: File,
    programId: number,
    curriculumCode: string
  ): Observable<CourseBatchImportPreviewResponse> {
    return this.postFormPdf<CourseBatchImportPreviewResponse>(
      API_URL.course.batchParsePdf,
      file,
      { programId: String(programId), curriculumCode }
    );
  }

  detectCourseBatchPdf(file: File): Observable<CourseBatchPdfDetectionResponse> {
    return this.postFormPdf<CourseBatchPdfDetectionResponse>(API_URL.course.batchDetectPdf, file);
  }

  private postFormPdf<T>(
    endpoint: string,
    file: File,
    fields?: Record<string, string>
  ): Observable<T> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
      }
    }

    return this.rawHttp
      .post<BaseResponse<T>>(`${this.baseUrl}${endpoint}`, formData, { headers: this.getAuthHeaders() })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError((error) =>
          throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }))
        )
      );
  }

  importCourseBatch(payload: CourseBatchImportRequest): Observable<CourseBatchImportResultResponse> {
    return this.post<CourseBatchImportResultResponse>(API_URL.course.batchImport, payload);
  }
}

