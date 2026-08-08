export interface OtherSchoolFee {
  id: string;
  syId?: string;
  batch?: string;
  semester?: string;
  schoolFee?: string;
  cash: number;
  lowMonthlyPayment: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOtherSchoolFeeRequest {
  syId?: string;
  batch?: string;
  semester?: string;
  schoolFee?: string;
  cash: number;
  lowMonthlyPayment: number;
}

export interface UpdateOtherSchoolFeeRequest extends CreateOtherSchoolFeeRequest {
  id: string;
}



