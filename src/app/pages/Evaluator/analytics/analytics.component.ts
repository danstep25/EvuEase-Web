import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AnalyticsService } from './analytics.service';
import { ProgramService } from '../../Admin/program-management/program.service';
import { SchoolYearTermService } from '../../Registrar/school-year-term/school-year-term.service';
import { AnalyticsBarChartComponent } from './analytics-bar-chart.component';
import {
  LINE_CHART,
  buildYTicks,
  lineColumnBands,
  smoothLinePath,
  type GridColumnHover,
  type LineSeriesPoint
} from './analytics-chart.helpers';
import type {
  AnalyticsCountLabel,
  AnalyticsDashboard,
  AnalyticsDashboardFilters,
  AnalyticsFilterOption,
  AnalyticsMonthlyTrendPoint
} from './analytics.models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, AnalyticsBarChartComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly programService = inject(ProgramService);
  private readonly syTermService = inject(SchoolYearTermService);

  readonly pageTitle = 'Analytics & Reports';
  readonly pageSubtitle = 'Evaluation insights and performance metrics';
  readonly lineChart = LINE_CHART;

  isLoading = true;
  loadError: string | null = null;
  dashboard: AnalyticsDashboard | null = null;

  hoveredLineIndex: number | null = null;

  programFilterOptions: AnalyticsFilterOption[] = [{ value: 'all', label: 'All' }];
  yearLevelFilterOptions: AnalyticsFilterOption[] = [
    { value: 'all', label: 'All' },
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' }
  ];
  schoolYearFilterOptions: AnalyticsFilterOption[] = [{ value: 'all', label: 'All' }];

  filters: AnalyticsDashboardFilters = {
    programCode: 'all',
    yearLevel: 'all',
    schoolYear: 'all'
  };

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  onFilterChange(): void {
    this.hoveredLineIndex = null;
    this.loadDashboard();
  }

  onExportReport(): void {
    if (!this.dashboard) {
      return;
    }
    const lines = [
      'EvuEase Analytics Report',
      `Program,${this.filters.programCode}`,
      `Year Level,${this.filters.yearLevel}`,
      `School Year,${this.filters.schoolYear}`,
      '',
      `Total Students,${this.dashboard.kpis.totalStudents}`,
      `Total Evaluations,${this.dashboard.kpis.totalEvaluations}`,
      `Completion Rate,${this.dashboard.kpis.completionRatePercent}%`,
      `Failed Subjects,${this.dashboard.kpis.failedSubjects}`,
      `Average Units,${this.dashboard.kpis.averageUnitsPerStudent}`,
      '',
      'Pass Rate,' + this.dashboard.quickStatistics.passRatePercent + '%',
      'Failure Rate,' + this.dashboard.quickStatistics.failureRatePercent + '%',
      'Avg Subjects/Student,' + this.dashboard.quickStatistics.averageSubjectsPerStudent
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  setLineHover(index: number): void {
    this.hoveredLineIndex = index;
  }

  clearLineHover(): void {
    this.hoveredLineIndex = null;
  }

  get averageUnitsDisplay(): string {
    const v = this.dashboard?.kpis.averageUnitsPerStudent;
    if (v == null || Number.isNaN(v)) {
      return '0';
    }
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  get lineChartMax(): number {
    const trend = this.dashboard?.monthlyTrend ?? [];
    const max = Math.max(1, ...trend.map((p) => Math.max(p.evaluations, p.chargeSlips)));
    return Math.ceil(max / 20) * 20;
  }

  get lineYAxisTicks(): number[] {
    return buildYTicks(this.lineChartMax, 4);
  }

  get linePoints(): LineSeriesPoint[] {
    const trend = this.dashboard?.monthlyTrend ?? [];
    const max = this.lineChartMax;
    const { padLeft, padRight, width, plotBottom, padTop } = LINE_CHART;
    const plotHeight = plotBottom - padTop;
    const plotWidth = width - padLeft - padRight;
    const step = trend.length > 1 ? plotWidth / (trend.length - 1) : 0;

    return trend.map((p, i) => ({
      x: padLeft + step * i,
      y: 0,
      yEval: plotBottom - (p.evaluations / max) * plotHeight,
      yCharge: plotBottom - (p.chargeSlips / max) * plotHeight
    }));
  }

  get lineEvalPath(): string {
    return smoothLinePath(this.linePoints.map((p) => ({ x: p.x, y: p.yEval })));
  }

  get lineChargePath(): string {
    return smoothLinePath(this.linePoints.map((p) => ({ x: p.x, y: p.yCharge })));
  }

  get lineColumnBands(): GridColumnHover[] {
    return lineColumnBands(this.linePoints.map((p) => ({ x: p.x, y: p.yEval })));
  }

  get hoveredLineMonth(): AnalyticsMonthlyTrendPoint | null {
    if (this.hoveredLineIndex == null || !this.dashboard) {
      return null;
    }
    return this.dashboard.monthlyTrend[this.hoveredLineIndex] ?? null;
  }

  get subjectStatusTotal(): number {
    const s = this.dashboard?.subjectStatus;
    if (!s) {
      return 0;
    }
    return s.passed + s.failed + s.inProgress;
  }

  pieSlicePercent(part: number): number {
    const total = this.subjectStatusTotal;
    return total > 0 ? (part / total) * 100 : 0;
  }

  lineYToSvg(yTick: number): number {
    const max = this.lineChartMax;
    const { padTop, plotBottom } = LINE_CHART;
    const plotHeight = plotBottom - padTop;
    return plotBottom - (yTick / max) * plotHeight;
  }

  trackFilter(_i: number, o: AnalyticsFilterOption): string {
    return o.value;
  }

  trackMonth(_i: number, p: AnalyticsMonthlyTrendPoint): string {
    return p.monthLabel;
  }

  trackCount(_i: number, p: AnalyticsCountLabel): string {
    return p.label;
  }

  trackCourse(_i: number, c: { courseCode: string }): string {
    return c.courseCode;
  }

  trackTick(tick: number): number {
    return tick;
  }

  trackBand(_i: number, band: GridColumnHover): number {
    return band.index;
  }

  private loadFilterOptions(): void {
    forkJoin({
      programs: this.programService
        .getPrograms({ PageIndex: 1, PageSize: 500, SortKey: 'program_code', SortDirection: 'asc' })
        .pipe(catchError(() => of({ data: [] }))),
      terms: this.syTermService
        .getSyTerms({ PageIndex: 1, PageSize: 500, SortKey: 'sy_year', SortDirection: 'desc' })
        .pipe(catchError(() => of({ data: [] })))
    }).subscribe(({ programs, terms }) => {
      const programCodes = (programs.data ?? []).map((p) => p.programCode).filter(Boolean);
      this.programFilterOptions = [
        { value: 'all', label: 'All' },
        ...programCodes.map((code) => ({ value: code, label: code }))
      ];

      const years = [...new Set((terms.data ?? []).map((t) => t.syYear?.trim()).filter(Boolean))] as string[];
      this.schoolYearFilterOptions = [
        { value: 'all', label: 'All' },
        ...years.map((y) => ({ value: y, label: y }))
      ];

      this.loadDashboard();
    });
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.loadError = null;
    this.analyticsService.getDashboard(this.filters).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: () => {
        this.dashboard = null;
        this.loadError = 'Unable to load analytics. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
