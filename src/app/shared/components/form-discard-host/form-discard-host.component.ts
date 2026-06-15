import { Component, inject } from '@angular/core';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { FORM_DISCARD_MODAL_CONFIG } from '../../constants/form-discard.constant';
import { FormDiscardService } from '../../services/form-discard.service';

@Component({
  selector: 'app-form-discard-host',
  standalone: true,
  imports: [ConfirmationModalComponent],
  template: `
    <app-confirmation-modal
      [isOpen]="formDiscard.isOpen()"
      [config]="discardConfig"
      (confirm)="formDiscard.acceptDiscard()"
      (cancel)="formDiscard.declineDiscard()"
    />
  `
})
export class FormDiscardHostComponent {
  readonly formDiscard = inject(FormDiscardService);
  readonly discardConfig = FORM_DISCARD_MODAL_CONFIG;
}
