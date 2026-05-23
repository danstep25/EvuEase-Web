
export interface MockLoginAccount {
  id: number;
  email: string;
  name: string;
  
  role: 'admin' | 'registrar' | 'evaluator';
}

export const MOCK_DEV_SHARED_PASSWORD = 'password123';

export const MOCK_LOGIN_ACCOUNTS: readonly MockLoginAccount[] = [
  { id: 1, email: 'admin@evalease.com', name: 'Admin', role: 'admin' },
  { id: 2, email: 'registrar@evalease.com', name: 'Registrar', role: 'registrar' },
  { id: 3, email: 'evaluator@evalease.com', name: 'Evaluator', role: 'evaluator' }
] as const;

