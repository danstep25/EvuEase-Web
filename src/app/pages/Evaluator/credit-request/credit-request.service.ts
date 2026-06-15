import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CreateCreditRequestRequest,
  CreditRequest
} from '../../../core/models/credit-request.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { BaseResponse } from '../../../core/models/base-response.model';
import { HttpBaseService } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';

export interface CreditRequestPaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  requestStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreditRequestService extends HttpBaseService {
  private readonly rawHttp = inject(HttpClient);

  getCreditRequests(params?: CreditRequestPaginationParams): Observable<PaginatedResponse<CreditRequest>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 25,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || '',
          RequestStatus: params.requestStatus || ''
        }
      : undefined;

    return this.getPaginated<CreditRequest>(API_URL.creditRequest.getAll, queryParams, 'result').pipe(
      map((response) => ({
        ...response,
        data: (response.data ?? []).map((row) => this.mapCreditRequest(row))
      }))
    );
  }

  getCreditRequestById(id: string): Observable<CreditRequest> {
    return this.get<CreditRequest>(API_URL.creditRequest.getById(id)).pipe(
      map((row) => this.mapCreditRequest(row))
    );
  }

  createCreditRequest(data: CreateCreditRequestRequest): Observable<CreditRequest> {
    return this.post<CreditRequest>(API_URL.creditRequest.create, data).pipe(
      map((row) => this.mapCreditRequest(row))
    );
  }

  updateCreditRequestStatus(id: number | string, requestStatus: string): Observable<CreditRequest> {
    return this.patch<CreditRequest>(API_URL.creditRequest.updateStatus(String(id)), { requestStatus }).pipe(
      map((row) => this.mapCreditRequest(row))
    );
  }

  uploadSignedPdf(id: number | string, file: File): Observable<CreditRequest> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.rawHttp
      .post<BaseResponse<CreditRequest>>(`${this.baseUrl}${API_URL.creditRequest.uploadSignedPdf(String(id))}`, formData, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return this.mapCreditRequest(response.data);
          }
          throw new Error(response.error?.message || 'Upload failed');
        }),
        catchError((error) =>
          throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Could not upload signed PDF.'
          }))
        )
      );
  }

  downloadSignedPdf(id: number | string): Observable<Blob> {
    return this.rawHttp
      .get(`${this.baseUrl}${API_URL.creditRequest.downloadSignedPdf(String(id))}`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      })
      .pipe(
        catchError((error) =>
          throwError(() => ({
            ...error,
            userMessage:
              error.error?.error?.message || error.error?.message || error.message || 'Could not download signed PDF.'
          }))
        )
      );
  }

  removeSignedPdf(id: number | string): Observable<CreditRequest> {
    return this.delete<CreditRequest>(API_URL.creditRequest.uploadSignedPdf(String(id))).pipe(
      map((row) => (row ? this.mapCreditRequest(row) : this.mapCreditRequest({})))
    );
  }

  private mapCreditRequest(raw: CreditRequest | Record<string, unknown>): CreditRequest {
    const row = raw as Record<string, unknown>;
    return {
      id: Number(row['id'] ?? row['Id'] ?? 0),
      creditRequestNo: String(row['creditRequestNo'] ?? row['CreditRequestNo'] ?? ''),
      studentId: (row['studentId'] ?? row['StudentId'] ?? null) as number | null,
      studentNumber: String(row['studentNumber'] ?? row['StudentNumber'] ?? ''),
      firstName: String(row['firstName'] ?? row['FirstName'] ?? ''),
      middleName: (row['middleName'] ?? row['MiddleName'] ?? null) as string | null,
      lastName: String(row['lastName'] ?? row['LastName'] ?? ''),
      studentName: String(row['studentName'] ?? row['StudentName'] ?? ''),
      programId: Number(row['programId'] ?? row['ProgramId'] ?? 0),
      programCode: String(row['programCode'] ?? row['ProgramCode'] ?? ''),
      programTitle: String(row['programTitle'] ?? row['ProgramTitle'] ?? ''),
      syId: Number(row['syId'] ?? row['SyId'] ?? 0),
      syCode: String(row['syCode'] ?? row['SyCode'] ?? ''),
      syYear: String(row['syYear'] ?? row['SyYear'] ?? ''),
      sySemester: String(row['sySemester'] ?? row['SySemester'] ?? ''),
      requestStatus: String(row['requestStatus'] ?? row['RequestStatus'] ?? 'Pending'),
      signedPdfFileName: (row['signedPdfFileName'] ?? row['SignedPdfFileName'] ?? null) as string | null,
      hasSignedPdf: Boolean(row['hasSignedPdf'] ?? row['HasSignedPdf'] ?? false),
      lines: this.mapLines(row['lines'] ?? row['Lines'])
    };
  }

  private mapLines(raw: unknown): CreditRequest['lines'] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((line) => {
      const item = line as Record<string, unknown>;
      return {
        id: Number(item['id'] ?? item['Id'] ?? 0),
        sortOrder: Number(item['sortOrder'] ?? item['SortOrder'] ?? 0),
        appliedCourseCode: (item['appliedCourseCode'] ?? item['AppliedCourseCode'] ?? null) as string | null,
        appliedCourseTitle: (item['appliedCourseTitle'] ?? item['AppliedCourseTitle'] ?? null) as string | null,
        appliedLecUnits: Number(item['appliedLecUnits'] ?? item['AppliedLecUnits'] ?? 0),
        appliedLabUnits: Number(item['appliedLabUnits'] ?? item['AppliedLabUnits'] ?? 0),
        grade: (item['grade'] ?? item['Grade'] ?? null) as string | null,
        equivalentCourseCode: (item['equivalentCourseCode'] ?? item['EquivalentCourseCode'] ?? null) as string | null,
        equivalentCourseTitle: (item['equivalentCourseTitle'] ?? item['EquivalentCourseTitle'] ?? null) as
          | string
          | null,
        equivalentLecUnits: this.mapNullableNumber(item['equivalentLecUnits'] ?? item['EquivalentLecUnits']),
        equivalentLabUnits: this.mapNullableNumber(item['equivalentLabUnits'] ?? item['EquivalentLabUnits']),
        equivalentTotalUnits: this.mapNullableNumber(item['equivalentTotalUnits'] ?? item['EquivalentTotalUnits'])
      };
    });
  }

  private mapNullableNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
