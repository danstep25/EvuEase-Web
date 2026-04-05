
export interface ClassListPdfCoursePrefillItem {
  courseCode: string;
  courseTitle: string;
  courseTotalUnits: number;
  programCode: string;
  yearLevelRaw: string;
  academicTerm: string;
}

export interface ClassListPdfCoursePrefillPayload {
  prefills: ClassListPdfCoursePrefillItem[];
  academicTerm?: string;
}
