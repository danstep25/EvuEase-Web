# Shared Module

This folder contains reusable code that can be shared across multiple modules in the application.

## Structure

### Services (`services/`)
- **`http-base.service.ts`**: Generic HTTP base service that provides common HTTP methods (GET, POST, PUT, PATCH, DELETE) with authentication headers and error handling. All feature services should extend this service.
- **`lookup.service.ts`**: Service for fetching lookup data (modules, actions, etc.) from the API.

### Utils (`utils/`)
- **`date.util.ts`**: Utility functions for date formatting (`formatDate`, `formatTimestamp`).
- **`badge.util.ts`**: Utility functions for generating CSS badge classes based on roles, actions, and statuses.
- **`pagination.util.ts`**: Utility functions for pagination operations (`getDisplayRange`, `buildPaginationParams`).

### Models (`models/`)
- **`system-log.model.ts`**: SystemLog interface definition.

### Constants (`constants/`)
- **`api.url.constant.ts`**: API endpoint constants.
- **`date.constant.ts`**: Date-related constants.
- **`module.constant.ts`**: Module-related constants.
- **`nav-menu.constant.ts`**: Navigation menu constants.
- **`pagination.constant.ts`**: Pagination default values.

### Components (`components/`)
- **`paginator/`**: Reusable pagination component.

### Handlers (`handlers/`)
- **`api-request.handler.ts`**: API request handling utilities.
- **`pagination.handler.ts`**: Pagination handling utilities.

## Usage Examples

### Extending HttpBaseService

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../../../shared/services/http-base.service';

@Injectable({
  providedIn: 'root'
})
export class MyService extends HttpBaseService {
  private readonly apiUrl = '/MyEndpoint';

  getItems(): Observable<Item[]> {
    return this.get<Item[]>(this.apiUrl);
  }

  createItem(item: CreateItemRequest): Observable<Item> {
    return this.post<Item>(`${this.apiUrl}/new`, item);
  }
}
```

### Using Utility Functions

```typescript
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';

// In component
formatDate = DateUtil.formatDate;
getRoleBadgeClass = BadgeUtil.getRoleBadgeClass;
getDisplayRange = (): string => PaginationUtil.getDisplayRange(this.currentPage, this.pageSize, this.totalRecords);
```

## Best Practices

1. **Services**: Always extend `HttpBaseService` for new services to avoid code duplication.
2. **Utilities**: Use utility functions instead of duplicating logic in components.
3. **Models**: Place shared interfaces and types in `shared/models/`.
4. **Constants**: Use constants for magic strings and default values.
