import type {
  AnalyticsCountLabel,
  AnalyticsCourseFailureRate,
  AnalyticsDashboard,
  AnalyticsKpis,
  AnalyticsMonthlyTrendPoint,
  AnalyticsQuickStatistics,
  AnalyticsSubjectStatus
} from './analytics.models';

function num(o: Record<string, unknown>, camel: string, pascal: string): number {
  const v = o[camel] ?? o[pascal];
  return v != null && v !== '' ? Number(v) : 0;
}

function str(o: Record<string, unknown>, camel: string, pascal: string): string {
  const v = o[camel] ?? o[pascal];
  return v != null ? String(v) : '';
}

function mapCountLabel(raw: unknown): AnalyticsCountLabel {
  const o = raw as Record<string, unknown>;
  return { label: str(o, 'label', 'Label'), count: num(o, 'count', 'Count') };
}

function mapCourseFailure(raw: unknown): AnalyticsCourseFailureRate {
  const o = raw as Record<string, unknown>;
  return {
    courseCode: str(o, 'courseCode', 'CourseCode'),
    failed: num(o, 'failed', 'Failed'),
    total: num(o, 'total', 'Total'),
    ratePercent: num(o, 'ratePercent', 'RatePercent')
  };
}

export function mapAnalyticsDashboard(raw: unknown): AnalyticsDashboard {
  const o = raw as Record<string, unknown>;
  const kpisRaw = (o['kpis'] ?? o['Kpis']) as Record<string, unknown>;
  const statusRaw = (o['subjectStatus'] ?? o['SubjectStatus']) as Record<string, unknown>;
  const quickRaw = (o['quickStatistics'] ?? o['QuickStatistics']) as Record<string, unknown>;

  const kpis: AnalyticsKpis = {
    totalStudents: num(kpisRaw, 'totalStudents', 'TotalStudents'),
    totalEvaluations: num(kpisRaw, 'totalEvaluations', 'TotalEvaluations'),
    completionRatePercent: num(kpisRaw, 'completionRatePercent', 'CompletionRatePercent'),
    failedSubjects: num(kpisRaw, 'failedSubjects', 'FailedSubjects'),
    averageUnitsPerStudent: num(kpisRaw, 'averageUnitsPerStudent', 'AverageUnitsPerStudent')
  };

  const subjectStatus: AnalyticsSubjectStatus = {
    passed: num(statusRaw, 'passed', 'Passed'),
    failed: num(statusRaw, 'failed', 'Failed'),
    inProgress: num(statusRaw, 'inProgress', 'InProgress')
  };

  const quickStatistics: AnalyticsQuickStatistics = {
    passRatePercent: num(quickRaw, 'passRatePercent', 'PassRatePercent'),
    failureRatePercent: num(quickRaw, 'failureRatePercent', 'FailureRatePercent'),
    averageSubjectsPerStudent: num(quickRaw, 'averageSubjectsPerStudent', 'AverageSubjectsPerStudent')
  };

  const monthlyTrendRaw = (o['monthlyTrend'] ?? o['MonthlyTrend']) as unknown[] | undefined;
  const studentsByProgramRaw = (o['studentsByProgram'] ?? o['StudentsByProgram']) as unknown[] | undefined;
  const studentsByYearLevelRaw = (o['studentsByYearLevel'] ?? o['StudentsByYearLevel']) as unknown[] | undefined;
  const unitLoadRaw = (o['unitLoadDistribution'] ?? o['UnitLoadDistribution']) as unknown[] | undefined;
  const topFailedRaw = (o['topFailedCourses'] ?? o['TopFailedCourses']) as unknown[] | undefined;

  return {
    kpis,
    monthlyTrend: (monthlyTrendRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        monthLabel: str(r, 'monthLabel', 'MonthLabel'),
        evaluations: num(r, 'evaluations', 'Evaluations'),
        chargeSlips: num(r, 'chargeSlips', 'ChargeSlips')
      } satisfies AnalyticsMonthlyTrendPoint;
    }),
    subjectStatus,
    studentsByProgram: (studentsByProgramRaw ?? []).map(mapCountLabel),
    studentsByYearLevel: (studentsByYearLevelRaw ?? []).map(mapCountLabel),
    unitLoadDistribution: (unitLoadRaw ?? []).map(mapCountLabel),
    topFailedCourses: (topFailedRaw ?? []).map(mapCourseFailure),
    quickStatistics
  };
}
