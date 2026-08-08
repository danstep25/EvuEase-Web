import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FormDiscardService {
  private pendingResolve: ((confirmed: boolean) => void) | null = null;

  readonly isOpen = signal(false);

  confirmDiscard(): Promise<boolean> {
    if (this.pendingResolve) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      this.pendingResolve = resolve;
      this.isOpen.set(true);
    });
  }

  acceptDiscard(): void {
    this.finish(true);
  }

  declineDiscard(): void {
    this.finish(false);
  }

  private finish(confirmed: boolean): void {
    this.isOpen.set(false);
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    resolve?.(confirmed);
  }
}
