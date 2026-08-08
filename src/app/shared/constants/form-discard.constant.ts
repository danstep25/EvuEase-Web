import { ConfirmationModalConfig } from '../components/confirmation-modal/confirmation-modal.component';

export const FORM_DISCARD_MODAL_CONFIG: ConfirmationModalConfig = {
  title: 'Discard changes?',
  message: 'You have unsaved changes. If you leave now, your edits will be lost.',
  confirmText: 'Discard',
  cancelText: 'Keep editing',
  confirmButtonClass: 'bg-red-600 hover:bg-red-700'
};
