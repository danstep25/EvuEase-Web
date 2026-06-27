import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PaymentScheme,
  CreatePaymentSchemeRequest,
  UpdatePaymentSchemeRequest,
  PaymentSchemeInstallment
} from '../../../../../core/models/payment-scheme.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { HttpBaseService } from '../../../../../shared/services/http-base.service';
import { API_URL } from '../../../../../shared/constants/api.url.constant';

export interface PaymentSchemePaginationParams {
  PageIndex?: number;
  PageSize?: number;
  SortDirection?: string;
  SortKey?: string;
  searchTerm?: string;
  schoolYear?: string;
  semester?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentSchemeService extends HttpBaseService {
  getPaymentSchemes(params?: PaymentSchemePaginationParams): Observable<PaginatedResponse<PaymentScheme>> {
    const queryParams = params
      ? {
          PageIndex: params.PageIndex || 1,
          PageSize: params.PageSize || 500,
          SortDirection: params.SortDirection || 'desc',
          SortKey: params.SortKey || '',
          SearchTerm: params.searchTerm || '',
          SchoolYear: params.schoolYear || '',
          Semester: params.semester || ''
        }
      : undefined;
    return this.getPaginated<PaymentScheme>(API_URL.paymentScheme.getAll, queryParams, 'result').pipe(
      map(res => ({
        ...res,
        data: (res.data ?? []).map(r => this.mapSchemeRow(r as unknown as Record<string, unknown>))
      }))
    );
  }

  createPaymentScheme(data: CreatePaymentSchemeRequest): Observable<PaymentScheme> {
    return this.post<PaymentScheme>(API_URL.paymentScheme.create, {
      schoolYear: data.schoolYear,
      semester: data.semester,
      description: data.description || '',
      installments: data.installments.map(row => ({
        paymentName: row.paymentName,
        dueDate: row.dueDate
      }))
    }).pipe(map(r => this.mapSchemeRow(r as unknown as Record<string, unknown>)));
  }

  updatePaymentScheme(data: UpdatePaymentSchemeRequest): Observable<PaymentScheme> {
    return this.put<PaymentScheme>(API_URL.paymentScheme.update(data.id), {
      id: Number(data.id),
      schoolYear: data.schoolYear,
      semester: data.semester,
      description: data.description || '',
      installments: data.installments.map(row => ({
        paymentName: row.paymentName,
        dueDate: row.dueDate
      }))
    }).pipe(map(r => this.mapSchemeRow(r as unknown as Record<string, unknown>)));
  }

  deletePaymentScheme(id: string): Observable<void> {
    return this.delete<void>(API_URL.paymentScheme.delete(id));
  }

  private mapSchemeRow(raw: Record<string, unknown>): PaymentScheme {
    const installmentsRaw = raw['installments'] ?? raw['Installments'];
    const installments = Array.isArray(installmentsRaw)
      ? installmentsRaw.map(i => this.mapInstallmentRow(i as Record<string, unknown>))
      : [];

    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      schoolYear: String(raw['schoolYear'] ?? raw['SchoolYear'] ?? ''),
      semester: String(raw['semester'] ?? raw['Semester'] ?? ''),
      description: String(raw['description'] ?? raw['Description'] ?? ''),
      installmentCount: Number(raw['installmentCount'] ?? raw['InstallmentCount'] ?? installments.length),
      installments,
      createdAt: (raw['createdAt'] ?? raw['CreatedAt']) as string | undefined,
      updatedAt: (raw['updatedAt'] ?? raw['UpdatedAt']) as string | undefined
    };
  }

  private mapInstallmentRow(raw: Record<string, unknown>): PaymentSchemeInstallment {
    const due = raw['dueDate'] ?? raw['DueDate'];
    let dueDate = '';
    if (typeof due === 'string') {
      dueDate = due.length >= 10 ? due.slice(0, 10) : due;
    } else if (due) {
      dueDate = String(due).slice(0, 10);
    }

    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      installmentOrder: Number(raw['installmentOrder'] ?? raw['InstallmentOrder'] ?? 0),
      paymentName: String(raw['paymentName'] ?? raw['PaymentName'] ?? ''),
      dueDate
    };
  }
}
