import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { IResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class ApiBase {
  protected handleError(err: HttpErrorResponse): Observable<never> {
    let errorMessage: string = '';
    console.warn('error', err);
    
    if (err.error?.code === HttpStatusCode.Unauthorized) {
      errorMessage = `${err.error.message}`;
    } else if (err.error?.code === HttpStatusCode.Conflict) {
      errorMessage = `${err.error.message}`;
    } else {
      errorMessage =
        'An error occurred while processing your request. Please contact system administrator!';
    }

    console.error(errorMessage);
    return throwError(() => errorMessage);
  }

  protected buildHttpParams(paramsObj: { [key: string]: any }): HttpParams {
    let params = new HttpParams();
    Object.keys(paramsObj).forEach((key) => {
      if (paramsObj[key] !== undefined && paramsObj[key] !== null) {
        params = params.set(key, paramsObj[key].toString());
      }
    });
    return params;
  }
}




