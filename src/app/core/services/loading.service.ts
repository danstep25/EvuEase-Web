import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _active = signal(0);

  readonly activeCount = this._active.asReadonly();

  readonly isLoading = computed(() => this._active() > 0);

  increment(): void {
    this._active.update((n) => n + 1);
  }

  decrement(): void {
    this._active.update((n) => Math.max(0, n - 1));
  }
}
