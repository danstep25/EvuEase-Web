import { HttpContext, HttpContextToken } from '@angular/common/http';

export const HTTP_SKIP_GLOBAL_LOADING = new HttpContextToken<boolean>(() => false);

export function withSkipGlobalLoading(context?: HttpContext): HttpContext {
  return (context ?? new HttpContext()).set(HTTP_SKIP_GLOBAL_LOADING, true);
}
