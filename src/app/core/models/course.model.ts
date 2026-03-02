export interface Course {
  courseCode: string;
  curriculumCode: string;
  programId: number;
  programCode?: string;
  programTitle?: string;
  courseTitle: string;
  courseLecUnits: number;
  courseLabUnits: number;
  courseTotalUnits: number;
  courseYearLevel: string;
  courseSemester: string;
  courseComponent?: string;
  prerequisites?: string;
  description?: string;
  courseHasPrerequisites: number;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateCourseRequest {
  courseCode: string;
  curriculumCode: string;
  programId: number;
  courseTitle: string;
  courseTotalUnits: number;
  courseYearLevel: string;
  courseSemester: string;
  courseComponent?: string;
  prerequisites?: string;
  description?: string;
}

export interface UpdateCourseRequest {
  courseCode: string;
  curriculumCode: string;
  programId: number;
  courseTitle: string;
  courseTotalUnits: number;
  courseYearLevel: string;
  courseSemester: string;
  courseComponent?: string;
  prerequisites?: string;
  description?: string;
}

