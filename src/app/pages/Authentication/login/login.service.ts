import { Injectable } from '@angular/core';
import { BaseService } from '../../../shared/base.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { BaseResponse } from '../../../core/models/base-response.model';
import { LoginResponse } from './login.response';

@Injectable({
  providedIn: 'root'
})
export class LoginService extends BaseService {
  login(email: string, password: string): Observable<BaseResponse<LoginResponse>> {
    return this.http.post<BaseResponse<LoginResponse>>(
      `${environment.apiUrl}/Auth/Login`, 
      { email, password }
    );
  }
}
