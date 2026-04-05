import { HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, finalize, share } from 'rxjs';
import { HTTP_SKIP_GLOBAL_LOADING } from '../http/http-context.tokens';
import { LoadingService } from '../services/loading.service';

const inflight = new Map<string, Observable<HttpEvent<unknown>>>();

function shouldCoalesce(req: HttpRequest<unknown>): boolean {
  const m = req.method.toUpperCase();
  return m === 'GET' || m === 'HEAD';
}

function buildCoalesceKey(req: HttpRequest<unknown>): string {
  return `${req.method.toUpperCase()}\u0001${req.urlWithParams}`;
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  if (req.context.get(HTTP_SKIP_GLOBAL_LOADING)) {
    return next(req);
  }

  if (!shouldCoalesce(req)) {
    loading.increment();
    return next(req).pipe(finalize(() => loading.decrement()));
  }

  const key = buildCoalesceKey(req);
  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }

  loading.increment();
  const shared$ = next(req).pipe(
    finalize(() => {
      loading.decrement();
      inflight.delete(key);
    }),
    share({
      resetOnComplete: true,
      resetOnError: true
    })
  );
  inflight.set(key, shared$);
  return shared$;
};
