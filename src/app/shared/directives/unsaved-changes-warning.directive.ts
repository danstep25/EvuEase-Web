import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appUnsavedChangesWarning]',
  standalone: true
})
export class UnsavedChangesWarningDirective {
  @Input({ alias: 'appUnsavedChangesWarning', required: true })
  hasUnsavedChanges!: () => boolean;

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }
}
