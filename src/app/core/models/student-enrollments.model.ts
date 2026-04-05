
export interface StudentClassEnrollmentRow {
  enrollmentId: number;
  facultyClassId: number;
  courseCode: string;
  courseTitle: string;
  classNumber: string;
  section: string;
  component: string;
  academicTerm: string;
  programCode: string;
  yearLevel: string;
  units: number;
  officialGrade: string | null;
  remarks: string | null;
}

export interface StudentAcademicSummary {
  totalUnitsCompleted: number;
  cumulativeGpa: number | null;
  failedSubjects: number;
  retakenSubjects: number;
}

export interface StudentEnrollmentOverview {
  enrollments: StudentClassEnrollmentRow[];
  summary: StudentAcademicSummary;
}
