/**
 * Temporary local-only credentials for UI development.
 * Disable via `environment.useMockAuth` before pointing at a real API.
 */
export interface MockLoginAccount {
  id: number;
  email: string;
  name: string;
  /** Must match `login.component` role routing (`admin` | `registrar` | `evaluator`). */
  role: 'admin' | 'registrar' | 'evaluator';
}

/** Shared dev password for all mock accounts below. */
export const MOCK_DEV_SHARED_PASSWORD = 'password123';

export const MOCK_LOGIN_ACCOUNTS: readonly MockLoginAccount[] = [
  { id: 1, email: 'admin@evalease.com', name: 'Admin', role: 'admin' },
  { id: 2, email: 'registrar@evalease.com', name: 'Registrar', role: 'registrar' },
  { id: 3, email: 'evaluator@evalease.com', name: 'Evaluator', role: 'evaluator' }
] as const;
