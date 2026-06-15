import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Attach to the modal overlay element. Form modals should leave dismissOnBackdrop false (default).
 * Confirmation and read-only dialogs may set dismissOnBackdrop to true.
 */
@Directive({
  selector: '[appModalBackdrop]',
  standalone: true
})
export class ModalBackdropDirective {
  @Input() dismissOnBackdrop = false;

  @Output() backdropDismiss = new EventEmitter<void>();

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent): void {
    if (!this.dismissOnBackdrop || event.target !== event.currentTarget) {
      return;
    }

    this.backdropDismiss.emit();
  }
}
