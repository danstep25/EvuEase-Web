export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  emailVerifiedAt?: string | null;
  createdAt?: string | null;
  // Optional fields for compatibility
  userId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive?: boolean;
  status?: 'Active' | 'Inactive' | number;
  lastLogin?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  pageIndex: number;
  pageSize: number;
  totalRecords: number;
  totalEntries: number;
  totalPages: number;
  result: User[];
}

export enum UserRole {
  ADMIN = 'admin',
  REGISTRAR = 'Registrar',
  EVALUATOR = 'Evaluator',
  STUDENT = 'Student'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  email: string;
  name: string;
  role: string;
  expiresAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: number;
  status: number;
}

export interface UpdateUserRequest {
  id: number;
  fullName: string;
  email: string;
  role: number;
  status: number;
}

