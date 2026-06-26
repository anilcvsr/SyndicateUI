import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role();
  if (role === 'Admin' || role === 'SyndicateAdmin') return true;
  router.navigate(['/admin']);
  return false;
};

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.role() === 'SuperAdmin') return true;
  router.navigate(['/super-admin']);
  return false;
};

export const memberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.role() === 'Member') return true;
  router.navigate(['/login']);
  return false;
};

export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  const role = auth.role();
  if (role === 'SuperAdmin') {
    router.navigate(['/super-admin/dashboard']);
  } else if (role === 'Admin' || role === 'SyndicateAdmin') {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/member/home']);
  }
  return false;
};
