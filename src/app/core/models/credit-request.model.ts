export interface CreditRequestLine {
  id: number;
  sortOrder: number;
  appliedCourseCode?: string | null;
  appliedCourseTitle?: string | null;
  appliedLecUnits: number;
  appliedLabUnits: number;
  grade?: string | null;
  equivalentCourseCode?: string | null;
  equivalentCourseTitle?: string | null;
  equivalentLecUnits?: number | null;
  equivalentLabUnits?: number | null;
  equivalentTotalUnits?: number | null;
}

export interface CreditRequest {
  id: number;
  creditRequestNo: string;
  studentId?: number | null;
  studentNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  studentName: string;
  programId: number;
  programCode: string;
  programTitle: string;
  syId: number;
  syCode: string;
  syYear: string;
  sySemester: string;
  requestStatus: string;
  signedPdfFileName?: string | null;
  hasSignedPdf?: boolean;
  lines?: CreditRequestLine[];
}

export interface CreateCreditRequestLineRequest {
  appliedCourseCode?: string;
  appliedCourseTitle?: string;
  appliedLecUnits: number;
  appliedLabUnits: number;
  grade?: string;
  equivalentCourseCode?: string;
}

export interface CreateCreditRequestRequest {
  studentNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  programId: number;
  syId: number;
  lines: CreateCreditRequestLineRequest[];
}

export interface CreditRequestListRow {
  id: number;
  creditRequestNo: string;
  studentNumber: string;
  studentName: string;
  programCode: string;
  programName: string;
  status: 'pending' | 'approved' | 'rejected';
}
