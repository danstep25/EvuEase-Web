export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  programCode: string;
  programTitle: string;
  yearLevel: string;
  type: string;
  status: string;
  curriculumCode?: string | null;
  address?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  hasPortalAccess?: boolean;
  isCandidateForGraduation?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentFilters {
  programCode?: string | null;
  yearLevel?: string | null;
  type?: string | null;
  status?: string | null;
  searchTerm?: string | null;
}

export interface CreateStudentRequest {
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  programCode: string;
  programTitle: string;
  yearLevel: string;
  studentType: string;
  enrollmentStatus: string;
  address?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  portalPassword?: string | null;
}

export interface UpdateStudentRequest {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  programCode: string;
  programTitle: string;
  yearLevel: string;
  studentType: string;
  enrollmentStatus: string;
  address?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  portalPassword?: string | null;
}
