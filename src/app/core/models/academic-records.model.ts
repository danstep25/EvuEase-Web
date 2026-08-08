
export interface AcademicRecordCourseRow {
  
  enrollmentId: number;
  courseCode: string;
  subjectDescription: string;
  units: number;
  
  grade: number | null;
  
  remarks: string;
  
  remarkKind: 'passed' | 'failed' | 'incomplete' | 'pending' | 'neutral' | 'not-taken';
  
  remarksSub: string | null;
  
  isRetake: boolean;

  isNotTaken?: boolean;

  coursePending?: boolean;

  gradePending?: boolean;
}

export interface AcademicRecordSemesterBlock {
  
  label: string;
  
  rawAcademicTerm: string;
  courses: AcademicRecordCourseRow[];
}


export interface SemesterLayoutPair {
  schoolYearKey: string;
  left: AcademicRecordSemesterBlock | null;
  right: AcademicRecordSemesterBlock | null;
}

export interface AcademicRecordCurriculumCourseRow {
  courseCode: string;
  subjectDescription: string;
  prerequisite: string;
  units: number;
}

export interface AcademicRecordCurriculumTermBlock {
  label: string;
  courses: AcademicRecordCurriculumCourseRow[];
  totalUnits: number;
}

export interface CurriculumTermLayoutPair {
  left: AcademicRecordCurriculumTermBlock | null;
  right: AcademicRecordCurriculumTermBlock | null;
}


export interface CourseEnrollmentHistoryRow {
  termLabel: string;
  units: number;
  gradeDisplay: string;
  remarksPrimary: string;
  remarksSub: string | null;
  remarkKind: AcademicRecordCourseRow['remarkKind'];
}
