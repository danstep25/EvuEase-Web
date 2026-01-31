export interface BaseError {
  message: string;
  statusCode: number;
  details: any | null;
  timestamp: string;
}

export interface BaseResponse<T = any> {
  data: T | null;
  error: BaseError | null;
  success: boolean;
}

