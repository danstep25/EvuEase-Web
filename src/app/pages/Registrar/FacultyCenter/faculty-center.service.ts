import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseResponse } from '../../../core/models/base-response.model';
import { API_URL } from '../../../shared/constants/api.url.constant';
import { HttpBaseService } from '../../../shared/services/http-base.service';

export interface GradeScaleRowPayload {
  mark: number;
  grade: number;
}

export interface SaveGradingSchemeBasisPayload {
  academicTermKey: string;
  gradingSchemeCode: string;
  gradingSchemeDescription: string;
  gradingBasisCode: string;
  gradingBasisDescription: string;
  gradeScaleRows: GradeScaleRowPayload[];
}

export interface GradeScaleRowDto {
  id: number;
  mark: number;
  grade: number;
  sortOrder: number;
}

export interface GradingSchemeBasisDto {
  academicTermKey: string;
  gradingSchemeCode: string;
  gradingSchemeDescription: string;
  gradingBasisCode: string;
  gradingBasisDescription: string;
  gradeScaleRows: GradeScaleRowDto[];
}

export interface ClassRosterDto {
  id: number;
  courseCode: string;
  classNumber: string;
  section: string;
  courseTitle: string;
  component: string;
  academicTerm: string;
  enrolled: number;
  programCode: string;
  yearLevel: string;
}

export interface CreateClassRosterPayload {
  courseCode: string;
  classNumber: string;
  section: string;
  courseTitle: string;
  component: string;
  academicTerm: string;
  enrolled: number;
  programCode: string;
  yearLevel: string;
}

export interface ClassRosterStudentDto {
  id: number;
  studentId: string;
  displayName: string;
  programCode: string;
  yearLevel: string;
  
  officialGrade: string | null;
  
  remarks: string | null;
}


export interface GradeRosterClassLookupDto {
  id: number;
  courseCode: string;
  courseTitle: string;
  displayText: string;
}


export interface RosterPdfStudentNotInRegistryDto {
  studentNumber: string;
  pdfDisplayName: string;
  pdfProgramCode: string;
  pdfYearLevel: string;
}

export interface ClassRosterBatchUploadDto {
  importedCount: number;
  notFoundInRegistry: RosterPdfStudentNotInRegistryDto[];
  warnings: string[];
}

export interface ClassRosterPdfImportPageResultDto {
  pageNumber: number;
  courseCode: string;
  classNumber: string;
  section: string;
  programCode: string;
  yearLevel: string;
  facultyClassId: number;
  classCreatedFromPdf: boolean;
  importedCount: number;
  notFoundInRegistry: RosterPdfStudentNotInRegistryDto[];
  warnings: string[];
  skippedReason: string | null;
}

export interface ClassRosterPdfImportSummaryDto {
  pages: ClassRosterPdfImportPageResultDto[];
}


export interface ClassListPdfPreviewPageDto {
  pageNumber: number;
  skippedReason: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  totalUnits: number | null;
  programCode: string | null;
  classNumber: string | null;
  sectionLetter: string | null;
  yearLevel: string | null;
  academicTerm: string | null;
  courseExistsInModule: boolean;
}

export interface ClassListPdfPreviewDto {
  academicTerm: string;
  pages: ClassListPdfPreviewPageDto[];
}

@Injectable({
  providedIn: 'root'
})
export class FacultyCenterService extends HttpBaseService {
  getGradingSchemeBasis(academicTermKey: string): Observable<GradingSchemeBasisDto | null> {
    const params = new HttpParams().set('academicTermKey', academicTermKey);
    return this.http
      .get<BaseResponse<GradingSchemeBasisDto | null>>(`${this.baseUrl}${API_URL.classAssignment.gradingSchemeBasis}`, {
        headers: this.getHeaders(),
        params
      })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data ?? null;
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in GET ${API_URL.classAssignment.gradingSchemeBasis}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  saveGradingSchemeBasis(body: SaveGradingSchemeBasisPayload): Observable<void> {
    return this.http
      .post<BaseResponse<unknown>>(`${this.baseUrl}${API_URL.classAssignment.gradingSchemeBasis}`, body, {
        headers: this.getHeaders()
      })
      .pipe(
        map(response => {
          if (response.success) {
            return void 0;
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in POST ${API_URL.classAssignment.gradingSchemeBasis}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  getClasses(search?: string): Observable<ClassRosterDto[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http
      .get<BaseResponse<ClassRosterDto[]>>(`${this.baseUrl}${API_URL.classRoster.base}`, {
        headers: this.getHeaders(),
        params
      })
      .pipe(
        map(response => {
          if (response.success) {
            const rows = response.data ?? [];
            return rows.map(r => this.mapClassRosterDto(r));
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in GET ${API_URL.classRoster.base}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  createClass(body: CreateClassRosterPayload): Observable<ClassRosterDto> {
    return this.http
      .post<BaseResponse<ClassRosterDto>>(`${this.baseUrl}${API_URL.classRoster.base}`, body, {
        headers: this.getHeaders()
      })
      .pipe(
        map(response => {
          if (response.success && response.data != null) {
            return this.mapClassRosterDto(response.data);
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in POST ${API_URL.classRoster.base}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  deleteClass(id: number): Observable<void> {
    return this.http
      .delete<BaseResponse<unknown>>(`${this.baseUrl}${API_URL.classRoster.byId(id)}`, {
        headers: this.getHeaders()
      })
      .pipe(
        map(response => {
          if (response.success) {
            return void 0;
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in DELETE ${API_URL.classRoster.byId(id)}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  
  previewClassListPdf(file: File): Observable<ClassListPdfPreviewDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .post<BaseResponse<unknown>>(`${this.baseUrl}${API_URL.classRoster.previewClassListPdf}`, formData, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map(response => {
          if (response.success && response.data != null) {
            return this.mapClassListPdfPreviewDto(response.data);
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in POST ${API_URL.classRoster.previewClassListPdf}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  
  importClassRosterPdf(file: File): Observable<ClassRosterPdfImportSummaryDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .post<BaseResponse<unknown>>(`${this.baseUrl}${API_URL.classRoster.importPdf}`, formData, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map(response => {
          if (response.success && response.data != null) {
            return this.mapPdfImportSummaryDto(response.data);
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in POST ${API_URL.classRoster.importPdf}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  getGradeRosterClassLookup(academicTerm: string, search?: string): Observable<GradeRosterClassLookupDto[]> {
    let params = new HttpParams().set('academicTerm', academicTerm.trim());
    const q = search?.trim();
    if (q) {
      params = params.set('search', q);
    }
    return this.http
      .get<BaseResponse<GradeRosterClassLookupDto[]>>(`${this.baseUrl}${API_URL.lookup.gradeRosterClasses}`, {
        headers: this.getHeaders(),
        params
      })
      .pipe(
        map(response => {
          if (response.success) {
            const rows = response.data ?? [];
            return rows.map(r => this.mapGradeRosterClassLookupDto(r));
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in GET ${API_URL.lookup.gradeRosterClasses}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  getClassStudents(classId: number): Observable<ClassRosterStudentDto[]> {
    return this.http
      .get<BaseResponse<ClassRosterStudentDto[]>>(`${this.baseUrl}${API_URL.classRoster.students(classId)}`, {
        headers: this.getHeaders()
      })
      .pipe(
        map(response => {
          if (response.success) {
            const rows = response.data ?? [];
            return rows.map(r => this.mapClassRosterStudentDto(r));
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in GET ${API_URL.classRoster.students(classId)}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  
  addStudentToClass(classId: number, studentId: number): Observable<ClassRosterStudentDto> {
    return this.http
      .post<BaseResponse<ClassRosterStudentDto>>(
        `${this.baseUrl}${API_URL.classRoster.students(classId)}`,
        { studentId },
        { headers: this.getHeaders() }
      )
      .pipe(
        map(response => {
          if (response.success && response.data != null) {
            return this.mapClassRosterStudentDto(response.data);
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in POST ${API_URL.classRoster.students(classId)}:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  removeStudentFromClass(classId: number, enrollmentId: number): Observable<void> {
    return this.http
      .delete<BaseResponse<unknown>>(
        `${this.baseUrl}${API_URL.classRoster.classEnrollment(classId, enrollmentId)}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        map(response => {
          if (response.success) {
            return void 0;
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error(`Error in DELETE class enrollment:`, error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  updateEnrollmentGrade(
    enrollmentId: number,
    payload:
      | { rawMark: number; academicTermKey: string }
      | { officialGrade: string; remarks?: string | null }
  ): Observable<ClassRosterStudentDto> {
    const body =
      'rawMark' in payload
        ? { rawMark: payload.rawMark, academicTermKey: payload.academicTermKey }
        : { officialGrade: payload.officialGrade, remarks: payload.remarks ?? null };
    return this.http
      .patch<BaseResponse<ClassRosterStudentDto>>(
        `${this.baseUrl}${API_URL.classRoster.enrollmentGrade(enrollmentId)}`,
        body,
        { headers: this.getHeaders() }
      )
      .pipe(
        map(response => {
          if (response.success && response.data != null) {
            return this.mapClassRosterStudentDto(response.data);
          }
          throw new Error(response.error?.message || 'Request failed');
        }),
        catchError(error => {
          console.error('Error in PATCH enrollment grade:', error);
          return throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Request failed'
          }));
        })
      );
  }

  private mapGradeRosterClassLookupDto(raw: unknown): GradeRosterClassLookupDto {
    const o = raw as Record<string, unknown>;
    const txt = (camel: string, pascal: string) => {
      const a = o[camel];
      const b = o[pascal];
      if (a != null && a !== '') return String(a);
      if (b != null && b !== '') return String(b);
      return '';
    };
    return {
      id: Number(o['id'] ?? o['Id'] ?? 0),
      courseCode: txt('courseCode', 'CourseCode'),
      courseTitle: txt('courseTitle', 'CourseTitle'),
      displayText: txt('displayText', 'DisplayText')
    };
  }

  private mapClassRosterDto(raw: unknown): ClassRosterDto {
    const o = raw as Record<string, unknown>;
    const txt = (camel: string, pascal: string) => {
      const a = o[camel];
      const b = o[pascal];
      if (a != null && a !== '') return String(a);
      if (b != null && b !== '') return String(b);
      return '';
    };
    return {
      id: Number(o['id'] ?? o['Id'] ?? 0),
      courseCode: txt('courseCode', 'CourseCode'),
      classNumber: txt('classNumber', 'ClassNumber'),
      section: txt('section', 'Section'),
      courseTitle: txt('courseTitle', 'CourseTitle'),
      component: txt('component', 'Component'),
      academicTerm: txt('academicTerm', 'AcademicTerm'),
      enrolled: Number(o['enrolled'] ?? o['Enrolled'] ?? 0),
      programCode: txt('programCode', 'ProgramCode'),
      yearLevel: txt('yearLevel', 'YearLevel')
    };
  }

  private mapBatchUploadDto(raw: unknown): ClassRosterBatchUploadDto {
    const o = raw as Record<string, unknown>;
    const warningsRaw = o['warnings'] ?? o['Warnings'];
    const warnings = Array.isArray(warningsRaw)
      ? (warningsRaw as unknown[]).map(w => String(w))
      : [];
    const nfRaw = o['notFoundInRegistry'] ?? o['NotFoundInRegistry'];
    const notFoundInRegistry = Array.isArray(nfRaw)
      ? (nfRaw as Record<string, unknown>[]).map(r => ({
          studentNumber: String(r['studentNumber'] ?? r['StudentNumber'] ?? ''),
          pdfDisplayName: String(r['pdfDisplayName'] ?? r['PdfDisplayName'] ?? ''),
          pdfProgramCode: String(r['pdfProgramCode'] ?? r['PdfProgramCode'] ?? ''),
          pdfYearLevel: String(r['pdfYearLevel'] ?? r['PdfYearLevel'] ?? '')
        }))
      : [];
    return {
      importedCount: Number(o['importedCount'] ?? o['ImportedCount'] ?? 0),
      notFoundInRegistry,
      warnings
    };
  }

  private mapClassListPdfPreviewDto(raw: unknown): ClassListPdfPreviewDto {
    const o = raw as Record<string, unknown>;
    const pagesRaw = o['pages'] ?? o['Pages'];
    const pages = Array.isArray(pagesRaw)
      ? (pagesRaw as Record<string, unknown>[]).map(p => this.mapClassListPdfPreviewPageDto(p))
      : [];
    const term = o['academicTerm'] ?? o['AcademicTerm'];
    return {
      academicTerm: term != null ? String(term) : '',
      pages
    };
  }

  private mapClassListPdfPreviewPageDto(p: Record<string, unknown>): ClassListPdfPreviewPageDto {
    const txt = (camel: string, pascal: string) => {
      const a = p[camel];
      const b = p[pascal];
      if (a != null && a !== '') return String(a);
      if (b != null && b !== '') return String(b);
      return '';
    };
    const optNum = (camel: string, pascal: string): number | null => {
      const v = p[camel] ?? p[pascal];
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const skip = p['skippedReason'] ?? p['SkippedReason'];
    const cc = txt('courseCode', 'CourseCode');
    return {
      pageNumber: Number(p['pageNumber'] ?? p['PageNumber'] ?? 0),
      skippedReason: skip != null && String(skip).length > 0 ? String(skip) : null,
      courseCode: cc.length > 0 ? cc : null,
      courseTitle: (() => {
        const s = txt('courseTitle', 'CourseTitle');
        return s.length > 0 ? s : null;
      })(),
      totalUnits: optNum('totalUnits', 'TotalUnits'),
      programCode: (() => {
        const s = txt('programCode', 'ProgramCode');
        return s.length > 0 ? s : null;
      })(),
      classNumber: (() => {
        const s = txt('classNumber', 'ClassNumber');
        return s.length > 0 ? s : null;
      })(),
      sectionLetter: (() => {
        const s = txt('sectionLetter', 'SectionLetter');
        return s.length > 0 ? s : null;
      })(),
      yearLevel: (() => {
        const s = txt('yearLevel', 'YearLevel');
        return s.length > 0 ? s : null;
      })(),
      academicTerm: (() => {
        const s = txt('academicTerm', 'AcademicTerm');
        return s.length > 0 ? s : null;
      })(),
      courseExistsInModule: Boolean(p['courseExistsInModule'] ?? p['CourseExistsInModule'])
    };
  }

  private mapPdfImportSummaryDto(raw: unknown): ClassRosterPdfImportSummaryDto {
    const o = raw as Record<string, unknown>;
    const pagesRaw = o['pages'] ?? o['Pages'];
    const pages = Array.isArray(pagesRaw)
      ? (pagesRaw as Record<string, unknown>[]).map(p => this.mapPdfImportPageDto(p))
      : [];
    return { pages };
  }

  private mapPdfImportPageDto(p: Record<string, unknown>): ClassRosterPdfImportPageResultDto {
    const txt = (camel: string, pascal: string) => {
      const a = p[camel];
      const b = p[pascal];
      if (a != null && a !== '') return String(a);
      if (b != null && b !== '') return String(b);
      return '';
    };
    const nfRaw = p['notFoundInRegistry'] ?? p['NotFoundInRegistry'];
    const notFoundInRegistry = Array.isArray(nfRaw)
      ? (nfRaw as Record<string, unknown>[]).map(r => ({
          studentNumber: String(r['studentNumber'] ?? r['StudentNumber'] ?? ''),
          pdfDisplayName: String(r['pdfDisplayName'] ?? r['PdfDisplayName'] ?? ''),
          pdfProgramCode: String(r['pdfProgramCode'] ?? r['PdfProgramCode'] ?? ''),
          pdfYearLevel: String(r['pdfYearLevel'] ?? r['PdfYearLevel'] ?? '')
        }))
      : [];
    const wRaw = p['warnings'] ?? p['Warnings'];
    const warnings = Array.isArray(wRaw) ? (wRaw as unknown[]).map(w => String(w)) : [];
    const skip = p['skippedReason'] ?? p['SkippedReason'];
    return {
      pageNumber: Number(p['pageNumber'] ?? p['PageNumber'] ?? 0),
      courseCode: txt('courseCode', 'CourseCode'),
      classNumber: txt('classNumber', 'ClassNumber'),
      section: txt('section', 'Section'),
      programCode: txt('programCode', 'ProgramCode'),
      yearLevel: txt('yearLevel', 'YearLevel'),
      facultyClassId: Number(p['facultyClassId'] ?? p['FacultyClassId'] ?? 0),
      classCreatedFromPdf: Boolean(p['classCreatedFromPdf'] ?? p['ClassCreatedFromPdf']),
      importedCount: Number(p['importedCount'] ?? p['ImportedCount'] ?? 0),
      notFoundInRegistry,
      warnings,
      skippedReason: skip != null && String(skip).length > 0 ? String(skip) : null
    };
  }

  private mapClassRosterStudentDto(raw: unknown): ClassRosterStudentDto {
    const o = raw as Record<string, unknown>;
    const txt = (camel: string, pascal: string) => {
      const a = o[camel];
      const b = o[pascal];
      if (a != null && a !== '') return String(a);
      if (b != null && b !== '') return String(b);
      return '';
    };
    const opt = (camel: string, pascal: string): string | null => {
      const a = o[camel];
      const b = o[pascal];
      if (a != null && String(a).length > 0) return String(a);
      if (b != null && String(b).length > 0) return String(b);
      return null;
    };
    return {
      id: Number(o['id'] ?? o['Id'] ?? 0),
      studentId: txt('studentId', 'StudentId'),
      displayName: txt('displayName', 'DisplayName'),
      programCode: txt('programCode', 'ProgramCode'),
      yearLevel: txt('yearLevel', 'YearLevel'),
      officialGrade: opt('officialGrade', 'OfficialGrade'),
      remarks: opt('remarks', 'Remarks')
    };
  }
}
