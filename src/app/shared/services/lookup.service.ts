import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { API_URL } from '../constants/api.url.constant';

export interface LookupItem {
  id: number;
  name: string;
  value?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LookupService extends HttpBaseService {
  getModules(): Observable<string[]> {
    return this.get<LookupItem[] | string[]>(API_URL.lookup.modules).pipe(
      map(data => {
        if (Array.isArray(data)) {
          if (data.length > 0 && typeof data[0] === 'string') {
            return data as string[];
          } else {
            return (data as LookupItem[]).map(item => item.name || item.value || '').filter(name => name !== '');
          }
        }
        return [];
      })
    );
  }

  getLookup(lookupType: string): Observable<LookupItem[]> {
    return this.get<LookupItem[]>(API_URL.lookup.getLookup(lookupType));
  }
}
