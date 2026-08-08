import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpBaseService } from '../../../shared/services/http-base.service';
import { API_URL } from '../../../shared/constants/api.url.constant';
import { mapAnalyticsDashboard } from './analytics.mapper';
import type { AnalyticsDashboard, AnalyticsDashboardFilters } from './analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService extends HttpBaseService {
  getDashboard(filters: AnalyticsDashboardFilters): Observable<AnalyticsDashboard> {
    return this.get<unknown>(API_URL.analytics.dashboard, {
      ProgramCode: filters.programCode === 'all' ? '' : filters.programCode,
      YearLevel: filters.yearLevel === 'all' ? '' : filters.yearLevel,
      SchoolYear: filters.schoolYear === 'all' ? '' : filters.schoolYear
    }).pipe(map((raw) => mapAnalyticsDashboard(raw)));
  }
}
