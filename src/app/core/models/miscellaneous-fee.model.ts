export interface MiscellaneousFee {
  id: string;
  syId?: string;
  batch?: string;
  semester?: string;
  miscellaneousFee?: string;
  cash: number;
  lowMonthlyPayment: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMiscellaneousFeeRequest {
  syId?: string;
  batch?: string;
  semester?: string;
  miscellaneousFee?: string;
  cash: number;
  lowMonthlyPayment: number;
}

export interface UpdateMiscellaneousFeeRequest extends CreateMiscellaneousFeeRequest {
  id: string;
}



