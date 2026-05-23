import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../../../core/models/course.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

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
}

