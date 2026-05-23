export interface StudentCurriculumHistoryEntry {
  id: string;
  curriculumCode: string;
  effectiveSchoolYear?: string | null;
  reason?: string | null;
  notes?: string | null;
  migratedBy?: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface MigrateStudentCurriculumRequest {
  curriculumCode: string;
  effectiveSchoolYear?: string;
  reason?: string;
  notes?: string;
}
