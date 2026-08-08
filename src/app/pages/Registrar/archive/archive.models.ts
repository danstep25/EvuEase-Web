
export interface ArchivedRecordBase {
  id: string;
  deletedAt: string;
  deletedBy: string;
}

export interface ArchivedProgramRow extends ArchivedRecordBase {
  programCode: string;
  programTitle: string;
  years: number;
  totalUnits: number;
}

export interface ArchivedStudentRow extends ArchivedRecordBase {
  studentNumber: string;
  displayName: string;
  programCode: string;
}

export interface ArchivedSchoolYearRow extends ArchivedRecordBase {
  label: string;
}

export interface ArchivedCurriculumRow extends ArchivedRecordBase {
  curriculumCode: string;
  curriculumTitle: string;
}
