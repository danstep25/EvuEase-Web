import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StudentAuthService } from '../services/student-auth.service';

export const studentPortalGuard: CanActivateFn = () => {
  const studentAuth = inject(StudentAuthService);
  const router = inject(Router);

  if (studentAuth.isAuthenticated()) {
    return true;
  }

  void router.navigate(['/student_portal/login']);
  return false;
};

export const studentPortalGuestGuard: CanActivateFn = () => {
  const studentAuth = inject(StudentAuthService);
  const router = inject(Router);

  if (studentAuth.isAuthenticated()) {
    void router.navigate(['/student_portal/dashboard']);
    return false;
  }

  return true;
};
