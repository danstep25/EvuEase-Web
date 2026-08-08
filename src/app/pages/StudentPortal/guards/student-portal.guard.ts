import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StudentAuthService } from '../services/student-auth.service';

export const studentPortalGuard: CanActivateFn = () => {
  const studentAuth = inject(StudentAuthService);
  const router = inject(Router);

  if (!studentAuth.isAuthenticated()) {
    void router.navigate(['/student_portal/login']);
    return false;
  }

  if (studentAuth.mustChangePassword()) {
    void router.navigate(['/student_portal/set-password']);
    return false;
  }

  return true;
};

export const studentPortalGuestGuard: CanActivateFn = () => {
  const studentAuth = inject(StudentAuthService);
  const router = inject(Router);

  if (studentAuth.isAuthenticated()) {
    void router.navigate([
      studentAuth.mustChangePassword() ? '/student_portal/set-password' : '/student_portal/dashboard'
    ]);
    return false;
  }

  return true;
};

export const studentPortalSetPasswordGuard: CanActivateFn = () => {
  const studentAuth = inject(StudentAuthService);
  const router = inject(Router);

  if (!studentAuth.isAuthenticated()) {
    void router.navigate(['/student_portal/login']);
    return false;
  }

  if (!studentAuth.mustChangePassword()) {
    void router.navigate(['/student_portal/dashboard']);
    return false;
  }

  return true;
};
