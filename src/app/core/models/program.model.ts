export interface Program {
  programId: number;
  programCode: string;
  programTitle: string;
  programCompletionYears: number;
  programTotalUnits?: number | null;
  programStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProgramListResponse {
  pageIndex: number;
  pageSize: number;
  totalRecords: number;
  totalEntries: number;
  totalPages: number;
  result: Program[];
}

export interface CreateProgramRequest {
  programCode: string;
  programTitle: string;
  programCompletionYears: number;
  programTotalUnits?: number | null;
  programStatus?: string;
}

export interface UpdateProgramRequest {
  programId: number;
  programCode: string;
  programTitle: string;
  programCompletionYears: number;
  programTotalUnits?: number | null;
  programStatus: string;
}


