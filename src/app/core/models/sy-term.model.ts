export interface SyTerm {
  syId: number;
  syCode: string;
  syYear: string;
  sySemester: string;
  syStartDate: string;
  syEndDate: string;
  syEnrollmentStart: string;
  syEnrollmentEnd: string;
  syStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateSyTermRequest {
  syCode: string;
  syYear: string;
  sySemester: string;
  syStartDate: string;
  syEndDate: string;
  syEnrollmentStart: string;
  syEnrollmentEnd: string;
  syStatus?: string;
}

export interface UpdateSyTermRequest {
  syId: number;
  syCode: string;
  syYear: string;
  sySemester: string;
  syStartDate: string;
  syEndDate: string;
  syEnrollmentStart: string;
  syEnrollmentEnd: string;
  syStatus: string;
}

