# Backend API Services

This directory contains all backend API service implementations following Angular best practices.

## Structure

```
core/
├── models/              # TypeScript interfaces and models
│   ├── api-response.model.ts
│   └── user.model.ts
├── services/            # API service classes
│   ├── base-api.service.ts    # Base service with common HTTP methods
│   ├── auth.service.ts         # Authentication service
│   ├── user.service.ts         # User management service
│   └── system-logs.service.ts  # System logs service
└── interceptors/       # HTTP interceptors
    ├── auth.interceptor.ts     # Authentication token interceptor
    └── error.interceptor.ts    # Error handling interceptor
```

## Usage Examples

### Authentication Service

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';

@Component({...})
export class LoginComponent {
  private authService = inject(AuthService);

  login(username: string, password: string) {
    this.authService.login({ username, password })
      .subscribe({
        next: (response) => {
          console.log('Login successful', response);
        },
        error: (error) => {
          console.error('Login failed', error);
        }
      });
  }
}
```

### User Service

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from '@app/core/services/user.service';

@Component({...})
export class UserManagementComponent {
  private userService = inject(UserService);

  loadUsers() {
    this.userService.getUsers({ page: 1, limit: 10 })
      .subscribe({
        next: (response) => {
          console.log('Users:', response.data);
          console.log('Total:', response.pagination?.total);
        }
      });
  }
}
```

## Features

- ✅ Type-safe API calls with TypeScript interfaces
- ✅ Centralized error handling
- ✅ Automatic token management
- ✅ Token refresh on 401 errors
- ✅ Environment-based configuration
- ✅ Pagination support
- ✅ Request/Response interceptors

## Environment Configuration

Update `src/environments/environment.ts` for development:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiVersion: 'v1'
};
```

Update `src/environments/environment.prod.ts` for production:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.evalease.com/api',
  apiVersion: 'v1'
};
```

## Creating New Services

1. Extend `BaseApiService`:
```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class YourService extends BaseApiService {
  getData(): Observable<YourModel> {
    return this.get<YourModel>('/your-endpoint');
  }
}
```

2. Create corresponding model interfaces in `models/` directory

3. Use the service in your components using `inject()`

