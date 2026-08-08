import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateStudentRequest, Student, UpdateStudentRequest } from '../../../core/models/student.model';
import {
  MigrateStudentCurriculumRequest,
  StudentCurriculumHistoryEntry
} from '../../../core/models/student-curriculum.model';
import { StudentEnrollmentOverview } from '../../../core/models/student-enrollments.model';
import { mapStudentEnrollmentOverview } from './student-enrollments.mapper';
import { mapStudentCurriculumHistoryList } from './student-curriculum.mapper';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { HttpBaseService } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface StudentsPaginationParams {
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

  createStudent(request: CreateStudentRequest): Observable<Student> {
    return this.post<Student>(API_URL.student.create, request);
  }

  getStudentById(id: string): Observable<Student> {
    return this.get<Student>(API_URL.student.getById(id));
  }

  getStudentEnrollmentOverview(id: string): Observable<StudentEnrollmentOverview> {
    return this.get<unknown>(API_URL.student.enrollments(id)).pipe(map((raw) => mapStudentEnrollmentOverview(raw)));
  }

  getStudentCurriculumHistory(id: string): Observable<StudentCurriculumHistoryEntry[]> {
    return this.get<unknown[]>(API_URL.student.curriculumHistory(id)).pipe(map(mapStudentCurriculumHistoryList));
  }

  migrateStudentCurriculum(id: string, request: MigrateStudentCurriculumRequest): Observable<Student> {
    return this.post<Student>(API_URL.student.migrateCurriculum(id), request);
  }

  updateStudent(id: string, request: UpdateStudentRequest): Observable<Student> {
    const body: UpdateStudentRequest = { ...request, id: Number(id) };
    return this.put<Student>(API_URL.student.update(id), body);
  }
}
