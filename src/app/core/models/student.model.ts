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



