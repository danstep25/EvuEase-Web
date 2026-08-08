export interface TuitionFee {
  id: string;
  syId?: string;
  batch?: string;
  semester?: string;
  courseCode?: string;
  courseTitle?: string;
  component?: string;
  units?: number;
  cash: number;
  lowMonthlyPayment: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTuitionFeeRequest {
  syId?: string;
  batch?: string;
  semester?: string;
  courseCode?: string;
  courseTitle?: string;
  component?: string;
  units?: number;
  cash: number;
  lowMonthlyPayment: number;
}

export interface UpdateTuitionFeeRequest extends CreateTuitionFeeRequest {
  id: string;
}



