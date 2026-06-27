import { Student } from '../../../core/models/student.model';
import { StudentEnrollmentOverview } from '../../../core/models/student-enrollments.model';

export interface StudentPortalSession {
  studentId: number;
  studentNumber: string;
  name: string;
  programCode: string;
  yearLevel: string;
  curriculumCode?: string | null;
  role: string;
}

export interface StudentPortalLoginRequest {
  studentNumber: string;
  password: string;
}

export interface StudentPortalAuthData {
  token: string;
  studentId: number;
  studentNumber: string;
  name: string;
  programCode: string;
  yearLevel: string;
  curriculumCode?: string | null;
  role: string;
  expiresAt: string;
}

export interface StudentPortalDashboard {
  studentName: string;
  programYearLevel: string;
  curriculumCode?: string | null;
  enrollmentStatus: string;
  currentTermSubjects: number;
  completedSubjects: number;
  pendingSubjects: number;
  cumulativeGpa: number | null;
  totalUnitsCompleted: number;
  hasPendingPasswordReset: boolean;
}

export interface StudentPortalPendingSubject {
  courseCode: string;
  subjectDescription: string;
  prerequisite: string;
  units: number;
  component: string;
  yearTerm: string;
}

export interface StudentPortalPasswordResetRequest {
  id: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  reason?: string | null;
  status: string;
  registrarNotes?: string | null;
  resolvedBy?: string | null;
  requestedAt: string;
  resolvedAt?: string | null;
}

export type StudentPortalProfile = Student;
export type StudentPortalEnrollments = StudentEnrollmentOverview;
