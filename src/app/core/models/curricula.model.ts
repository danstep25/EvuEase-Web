export interface Curricula {
  id: number;
  curriculumCode: string;
  version: string;
  programId: number;
  programCode: string;
  programTitle: string;
  syId: number;
  syYear: string;
  effectiveDate: string;
  curriculumStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateCurriculaRequest {
  version: string;
  programId: number;
  programCode: string;
  syId: number;
  effectiveDate: string;
  curriculumStatus?: string;
}

export interface UpdateCurriculaRequest {
  id: number;
  curriculumCode: string;
  version: string;
  programId: number;
  programCode: string;
  syId: number;
  effectiveDate: string;
  curriculumStatus: string;
}

