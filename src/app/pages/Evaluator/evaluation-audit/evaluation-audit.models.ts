import type { ChargeSlipPreview, SubjectEvaluationFinishedSubjectRow, SubjectSelectionSuggestedRow } from '../subject-evaluation/subject-evaluation.models';

export interface EvaluationAuditListItem {
  id: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  programCode: string;
  programYearLevel: string;
  schoolYear: string;
  semester: string;
  schoolYearTerm: string;
  totalUnitsSelected: number;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface EvaluationAuditData {
  chargeSlipPreview: ChargeSlipPreview;
  selectedSubjects: readonly SubjectSelectionSuggestedRow[];
  finishedSubjects: readonly SubjectEvaluationFinishedSubjectRow[];
}

export interface EvaluationAuditDetail extends EvaluationAuditListItem {
  evaluationData: EvaluationAuditData;
}

export interface CreateEvaluationAuditRequest {
  studentId: number;
  studentNumber: string;
  studentName: string;
  programCode: string;
  programYearLevel: string;
  schoolYear: string;
  semester: string;
  schoolYearTerm: string;
  totalUnitsSelected: number;
  evaluationData: EvaluationAuditData;
}
