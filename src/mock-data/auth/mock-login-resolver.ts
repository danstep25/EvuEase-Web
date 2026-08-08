import { BaseResponse } from '../../app/core/models/base-response.model';
import { LoginRequest, LoginResponseData } from '../../app/core/models/user.model';
import { MOCK_DEV_SHARED_PASSWORD, MOCK_LOGIN_ACCOUNTS } from './mock-login-accounts';

const MOCK_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365;

function createMockJwt(userId: number, expUnixSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      UserId: userId,
      exp: expUnixSeconds
    })
  );
  return `${header}.${payload}.mock-signature`;
}

function unauthorized(): BaseResponse<LoginResponseData> {
  return {
    success: false,
    data: null,
    error: {
      message: 'Invalid email or password.',
      statusCode: 401,
      details: null,
      timestamp: new Date().toISOString()
    }
  };
}

export function resolveMockLogin(credentials: LoginRequest): BaseResponse<LoginResponseData> {
  const email = credentials.email.trim().toLowerCase();
  const account = MOCK_LOGIN_ACCOUNTS.find((a) => a.email.toLowerCase() === email);

  if (!account || credentials.password !== MOCK_DEV_SHARED_PASSWORD) {
    return unauthorized();
  }

  const expUnixSeconds = Math.floor(Date.now() / 1000) + MOCK_TOKEN_TTL_SECONDS;
  const token = createMockJwt(account.id, expUnixSeconds);

  return {
    success: true,
    data: {
      token,
      email: account.email,
      name: account.name,
      role: account.role,
      expiresAt: new Date(expUnixSeconds * 1000).toISOString()
    },
    error: null
  };
}

