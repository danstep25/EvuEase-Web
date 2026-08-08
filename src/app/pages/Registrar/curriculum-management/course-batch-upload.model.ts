export type CourseBatchImportStatus = 'Valid' | 'Warning' | 'Error';

export interface CourseBatchImportRow {
  rowNumber: number;
  courseCode: string;
  courseTitle: string;
  courseLecUnits: number;
  courseLabUnits: number;
  courseTotalUnits: number;
  courseYearLevel: string;
  courseSemester: string;
  prerequisites?: string | null;
  courseComponent?: string | null;
  selected: boolean;
}

export interface CourseBatchImportPreviewRow extends CourseBatchImportRow {
  status: CourseBatchImportStatus;
  messages: string[];
}

export interface CourseBatchImportRequest {
  programId: number;
  curriculumCode: string;
  rows: CourseBatchImportRow[];
}

export interface CourseBatchImportPreviewResponse {
  curriculumCode: string;
  programCode: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  skippedPdfLines?: number;
  parseWarnings?: string[];
  detectedReferenceNumber?: string | null;
  rows: CourseBatchImportPreviewRow[];
}

export interface CourseBatchPdfDetectionResponse {
  referenceNumber?: string | null;
  programCode?: string | null;
  curriculumCode?: string | null;
  schoolYear?: string | null;
  programId?: number | null;
  curriculumFound: boolean;
  message?: string | null;
}

export interface CourseBatchImportResultResponse {
  importedCount: number;
  skippedCount: number;
  errors: string[];
  warnings: string[];
}
