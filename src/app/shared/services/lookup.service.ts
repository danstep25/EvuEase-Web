import { Injectable } from '@angular/core';
import { Observable, shareReplay, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { API_URL } from '../constants/api.url.constant';
import { Program } from '../../core/models/program.model';
import { SyTerm } from '../../core/models/sy-term.model';
import { Curricula } from '../../core/models/curricula.model';

export interface LookupItem {
  id: number;
  name: string;
  value?: string;
  description?: string;
}

export interface LookupResponse {
  id: number;
  value: string;
  displayText?: string;
  numericValue?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LookupService extends HttpBaseService {
  private programsCache$?: Observable<Program[]>;
  private syTermsCache$?: Observable<SyTerm[]>;
  private curriculaCache$?: Observable<Curricula[]>;

  getModules(): Observable<string[]> {
    return this.get<LookupResponse[] | string[]>(API_URL.lookup.modules).pipe(
      map(data => {
        if (Array.isArray(data)) {
          if (data.length > 0 && typeof data[0] === 'string') {
            return data as string[];
          } else {
            return (data as LookupResponse[]).map(item => item.value || '').filter(name => name !== '');
          }
        }
        return [];
      })
    );
  }

  getLookup(lookupType: string): Observable<LookupItem[]> {
    return this.get<LookupItem[]>(API_URL.lookup.getLookup(lookupType));
  }

  
  getProgramsForDropdown(): Observable<Program[]> {
    if (!this.programsCache$) {
      this.programsCache$ = this.get<LookupResponse[]>(API_URL.lookup.programs).pipe(
        map((lookups: LookupResponse[]) => {
          if (!Array.isArray(lookups)) {
            return [];
          }
          return lookups.map(lookup => {
            const row = lookup as LookupResponse & {
              Value?: string;
              DisplayText?: string;
              Id?: number;
              NumericValue?: number;
            };
            const value = (row.value ?? row.Value ?? '').toString();
            const displayText = row.displayText ?? row.DisplayText;
            const id = row.id ?? row.Id ?? 0;
            const completionYears = row.numericValue ?? row.NumericValue ?? 0;
            const parts = displayText?.split(' - ') || [value, ''];
            return {
              programId: id,
              programCode: value,
              programTitle: parts.length > 1 ? parts[1] : '',
              programCompletionYears: completionYears,
              programTotalUnits: null,
              programStatus: '',
              createdAt: null,
              updatedAt: null
            } as Program;
          });
        }),
        shareReplay(1)
      );
    }
    return this.programsCache$;
  }

  getSyTermsForDropdown(): Observable<SyTerm[]> {
    if (!this.syTermsCache$) {
      this.syTermsCache$ = this.get<LookupResponse[]>(API_URL.lookup.syTerms).pipe(
        map((lookups: LookupResponse[]) => {
          return lookups.map(lookup => {
            const parts = lookup.displayText?.split(' - ') || ['', ''];
            return {
              syId: lookup.id,
              syCode: lookup.value,
              syYear: parts[0] || '',
              sySemester: parts[1] || '',
              syStartDate: '',
              syEndDate: '',
              syEnrollmentStart: '',
              syEnrollmentEnd: '',
              syStatus: '',
              createdAt: null,
              updatedAt: null
            } as SyTerm;
          });
        }),
        shareReplay(1)
      );
    }
    return this.syTermsCache$;
  }

  getCurriculaForDropdown(programId?: number): Observable<Curricula[]> {
    const url = programId 
      ? `${API_URL.lookup.curricula}?programId=${programId}`
      : API_URL.lookup.curricula;
    
    return this.get<LookupResponse[]>(url).pipe(
      map((lookups: LookupResponse[]) => {
        return lookups.map(lookup => {
          const parts = lookup.displayText?.split(' - ') || [lookup.value, ''];
          return {
            id: lookup.id,
            curriculumCode: lookup.value,
            version: parts.length > 1 ? parts[1] : '',
            programId: 0,
            programCode: '',
            programTitle: '',
            syId: 0,
            syYear: '',
            effectiveDate: '',
            curriculumStatus: '',
            createdAt: null,
            updatedAt: null
          } as Curricula;
        });
      })
    );
  }

  getCurriculumVersionsForDropdown(programCode: string): Observable<Curricula[]> {
    if (!programCode || programCode.trim() === '') {
      return of([]);
    }

    const url = `${API_URL.lookup.curriculumVersions}?programCode=${encodeURIComponent(programCode)}`;
    
    return this.get<LookupResponse[]>(url).pipe(
      map((lookups: LookupResponse[]) => {
        if (!lookups || !Array.isArray(lookups)) {
          return [];
        }
        
        return lookups.map(lookup => {
          const parts = lookup.displayText?.split(' - ') || [lookup.value, ''];
          const version = lookup.value;
          const fullCurriculumCode = parts[0] || `${programCode}-${version}`;
          
          return {
            id: lookup.id,
            curriculumCode: fullCurriculumCode,
            version: version,
            programId: 0,
            programCode: programCode,
            programTitle: '',
            syId: 0,
            syYear: '',
            effectiveDate: '',
            curriculumStatus: '',
            createdAt: null,
            updatedAt: null
          } as Curricula;
        });
      })
    );
  }

  getCoursesForDropdown(): Observable<string[]> {
    return this.get<LookupResponse[]>(API_URL.lookup.courses).pipe(
      map((lookups: LookupResponse[]) => {
        if (!lookups || !Array.isArray(lookups)) {
          return [];
        }
        return lookups.map(lookup => lookup.value || '').filter(code => code !== '');
      })
    );
  }

  getCoursesLookupForDropdown(): Observable<LookupResponse[]> {
    return this.get<LookupResponse[]>(API_URL.lookup.courses).pipe(
      map((lookups) => {
        if (!lookups || !Array.isArray(lookups)) {
          return [];
        }
        return lookups.map((lookup) => {
          const row = lookup as LookupResponse & { Value?: string; DisplayText?: string; Id?: number };
          const value = (row.value ?? row.Value ?? '').toString();
          const displayText = (row.displayText ?? row.DisplayText ?? value).toString();
          const id = row.id ?? row.Id ?? 0;
          return { id, value, displayText };
        });
      })
    );
  }

  getCoursesBySemesterForDropdown(semester: string): Observable<LookupResponse[]> {
    if (!semester || semester.trim() === '') {
      return of([]);
    }
    const url = `${API_URL.lookup.courses}?semester=${encodeURIComponent(semester)}`;
    return this.get<LookupResponse[]>(url);
  }

  
  clearCache(): void {
    this.programsCache$ = undefined;
    this.syTermsCache$ = undefined;
    this.curriculaCache$ = undefined;
  }
}
