export type AcademicRecordRemark =
  | 'PASSED'
  | 'FAILED'
  | 'PASSED (RETAKE)'
  | 'NOT TAKEN'
  | 'PENDING'
  | 'INCOMPLETE';

export type AcademicRecordSemesterHeaderVariant = 'recent' | 'standard';

export interface AcademicRecordCourseRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly units: number;
  readonly grade: string;
  readonly remarks: AcademicRecordRemark;
  readonly showGradeHistoryIcon?: boolean;
  readonly isNotTaken?: boolean;
}

export interface AcademicRecordSemesterBlock {
  readonly label: string;
  readonly headerVariant: AcademicRecordSemesterHeaderVariant;
  readonly courses: readonly AcademicRecordCourseRow[];
  readonly totalUnits: number;
}

export interface AcademicRecordCurriculumCourseRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly grade?: string;
  readonly remarks?: AcademicRecordRemark;
  readonly isNotTaken?: boolean;
}

export interface AcademicRecordCurriculumTermBlock {
  readonly label: string;
  readonly courses: readonly AcademicRecordCurriculumCourseRow[];
  readonly totalUnits: number;
}

export interface StudentAcademicRecordProfile {
  readonly studentNumber: string;
  readonly fullName: string;
  readonly yearLevel: string;
  readonly status: string;
  readonly program: string;
  readonly currentCurriculum: string;
  readonly currentCurriculumCode?: string;
  readonly currentTermLabel: string;
  readonly termSemesters: readonly AcademicRecordSemesterBlock[];
  readonly curriculumTerms: readonly AcademicRecordCurriculumTermBlock[];
  readonly usesCurriculumRoadmap: boolean;
}

export type AcademicPlanCourseStatus = 'Available' | 'Pending' | 'Future';

export interface AcademicPlanCourseRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly status: AcademicPlanCourseStatus;
}

export interface AcademicPlanTermBlock {
  readonly termLabel: string;
  readonly schoolYearLabel: string;
  readonly headerVariant: 'recommended' | 'standard';
  readonly badgeLabel?: string;
  readonly minCompletionYear: number;
  readonly courses: readonly AcademicPlanCourseRow[];
  readonly totalUnits: number;
}

export interface StudentAcademicPlan {
  readonly statusSummary: {
    readonly totalUnitsRequired: number;
    readonly unitsCompleted: number;
    readonly unitsRemaining: number;
  };
  readonly expectedCompletionYearOptions: readonly number[];
  readonly defaultExpectedCompletionYear: number;
  readonly suggestedTerms: readonly AcademicPlanTermBlock[];
}

export interface MigrateCurriculumOption {
  readonly value: string;
  readonly label: string;
  readonly status: 'Active' | 'Inactive';
}

export interface MigrateCurriculumStudentContext {
  readonly studentNumber: string;
  readonly fullName: string;
  readonly program: string;
  readonly yearLevel: string;
  readonly currentCurriculumCode: string;
}

export interface MigrateCurriculumSummary {
  readonly autoMatched: number;
  readonly manualMatched: number;
  readonly pendingMatch: number;
  readonly mustRetake: number;
  readonly unitsCredited: number;
  readonly unitsTotal: number;
}

export type MigrateStructureCreditStatus = 'credited' | 'remaining' | 'must-retake';

export interface MigrateCurriculumStructureCourse {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly units: number;
  readonly creditStatus: MigrateStructureCreditStatus;
}

export interface MigrateCurriculumStructureTerm {
  readonly label: string;
  readonly subjectCount: number;
  readonly totalUnits: number;
  readonly creditedCount: number;
  readonly remainingCount: number;
  readonly courses: readonly MigrateCurriculumStructureCourse[];
}

export interface MigrateCurriculumMappingRow {
  readonly oldCourseCode: string;
  readonly oldCourseTitle: string;
  readonly oldUnits: number;
  readonly grade: string;
  readonly gradeStatus: 'Passed' | 'Failed';
  readonly matchType: 'AUTO' | 'MANUAL';
  readonly newCourseCode: string;
  readonly newCourseTitle: string;
  readonly newUnits: number;
}

export interface MigrateMappingTermBlock {
  readonly label: string;
  readonly subjectCount: number;
  readonly totalUnits: number;
  readonly creditedCount: number;
  readonly remainingCount: number;
  readonly rows: readonly MigrateCurriculumMappingRow[];
}

export interface MigrateCurriculumPreview {
  readonly newCurriculumCode: string;
  readonly newCurriculumVersion: string;
  readonly oldCurriculumVersion: string;
  readonly summary: MigrateCurriculumSummary;
  readonly structureTerms: readonly MigrateCurriculumStructureTerm[];
  readonly mappingTerms: readonly MigrateMappingTermBlock[];
}
