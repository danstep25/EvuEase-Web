export interface AnalyticsFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface AnalyticsKpis {
  readonly totalStudents: number;
  readonly totalEvaluations: number;
  readonly completionRatePercent: number;
  readonly failedSubjects: number;
  readonly averageUnitsPerStudent: number;
}

export interface AnalyticsMonthlyTrendPoint {
  readonly monthLabel: string;
  readonly evaluations: number;
  readonly chargeSlips: number;
}

export interface AnalyticsSubjectStatus {
  readonly passed: number;
  readonly failed: number;
  readonly inProgress: number;
}

export interface AnalyticsCountLabel {
  readonly label: string;
  readonly count: number;
}

export interface AnalyticsCourseFailureRate {
  readonly courseCode: string;
  readonly failed: number;
  readonly total: number;
  readonly ratePercent: number;
}

export interface AnalyticsQuickStatistics {
  readonly passRatePercent: number;
  readonly failureRatePercent: number;
  readonly averageSubjectsPerStudent: number;
}

export interface AnalyticsDashboard {
  readonly kpis: AnalyticsKpis;
  readonly monthlyTrend: readonly AnalyticsMonthlyTrendPoint[];
  readonly subjectStatus: AnalyticsSubjectStatus;
  readonly studentsByProgram: readonly AnalyticsCountLabel[];
  readonly studentsByYearLevel: readonly AnalyticsCountLabel[];
  readonly unitLoadDistribution: readonly AnalyticsCountLabel[];
  readonly topFailedCourses: readonly AnalyticsCourseFailureRate[];
  readonly quickStatistics: AnalyticsQuickStatistics;
}

export interface AnalyticsDashboardFilters {
  programCode: string;
  yearLevel: string;
  schoolYear: string;
}
