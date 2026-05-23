export interface SubjectEvaluationUpcomingTerm {
  readonly schoolYearTerm: string;
  readonly enrollmentPeriod: string;
}

export interface SubjectEvaluationFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface SubjectEvaluationStudentSummary {
  readonly studentName: string;
  readonly programYearLevel: string;
  readonly curriculum: string;
}

export interface SubjectEvaluationFinishedSubjectRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly grade: string;
  readonly remarks: 'Passed' | 'Failed';
}

export type SubjectSelectionViewMode = 'current' | 'all';

export interface SubjectSelectionSuggestedRow {
  readonly id: string;
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly component: string;
  readonly yearTerm: string;
}

export interface SubjectSelectionUnitsSummary {
  readonly regularUnitsForNextTerm: number;
  readonly totalUnitsSelected: number;
  readonly unitLimit: number;
}

export interface SubjectSelectionState {
  readonly limits: {
    readonly regularUnitsForNextTerm: number;
    readonly unitLimit: number;
  };
  readonly currentYearTerm: string;
  readonly allTermCourses: readonly SubjectSelectionSuggestedRow[];
}

export interface ChargeSlipTuitionRow {
  readonly rowNumber: number;
  readonly subjectDescription: string;
  readonly units: number;
  readonly component: string;
  readonly curriculumVersion: string;
  readonly levelTerm: string;
  readonly cash: string;
  readonly lowMonthlyPayment: string;
}

export interface ChargeSlipFeeRow {
  readonly label: string;
  readonly cash: string;
  readonly lowMonthlyPayment: string;
}

export interface ChargeSlipPaymentRow {
  readonly label: string;
  readonly cash: string;
  readonly lowMonthlyPayment: string;
}

export interface ChargeSlipPreview {
  readonly studentName: string;
  readonly studentId: string;
  readonly program: string;
  readonly curriculumVersion: string;
  readonly levelTerm: string;
  readonly tuitionRows: readonly ChargeSlipTuitionRow[];
  readonly totalTuitionUnits: number;
  readonly totalTuitionCash: string;
  readonly totalTuitionLowMonthly: string;
  readonly otherSchoolFees: readonly ChargeSlipFeeRow[];
  readonly totalOsfCash: string;
  readonly totalOsfLowMonthly: string;
  readonly miscellaneousFees: readonly ChargeSlipFeeRow[];
  readonly totalMfCash: string;
  readonly totalMfLowMonthly: string;
  readonly grossAssessmentCash: string;
  readonly grossAssessmentLowMonthly: string;
  readonly paymentScheme: readonly ChargeSlipPaymentRow[];
  readonly paymentTotalCash: string;
  readonly paymentTotalLowMonthly: string;
}

export interface AddSubjectCatalogItem {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly termLabel?: string;
  readonly prerequisiteMet: boolean;
}

export interface SubjectEvaluationInitialData {
  readonly upcomingTerm: SubjectEvaluationUpcomingTerm | null;
  readonly programFilterOptions: readonly SubjectEvaluationFilterOption[];
  readonly yearLevelFilterOptions: readonly SubjectEvaluationFilterOption[];
}

export interface SubjectEvaluationStudentWorkflow {
  readonly summary: SubjectEvaluationStudentSummary;
  readonly finishedSubjects: readonly SubjectEvaluationFinishedSubjectRow[];
  readonly subjectSelection: SubjectSelectionState;
}
