import { CanDeactivateFn } from '@angular/router';
import { CanComponentDeactivate } from '../models/can-deactivate.model';

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component?.canDeactivate) {
    return true;
  }
  return component.canDeactivate();
};
