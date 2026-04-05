export interface Downpayment {
  id: string;
  programCode: string;
  programTitle: string;
  batch: string;
  downpaymentPercent: number;
  effectiveSchoolYear: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateDownpaymentRequest {
  programCode: string;
  programTitle: string;
  batch: string;
  downpaymentPercent: number;
  effectiveSchoolYear: string;
}

export interface UpdateDownpaymentRequest extends CreateDownpaymentRequest {
  id: string;
}
