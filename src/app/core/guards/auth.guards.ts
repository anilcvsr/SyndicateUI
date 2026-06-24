import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.role() === 'Admin') return true;
  router.navigate(['/admin']);
  return false;
};

export const memberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.role() === 'Member') return true;
  router.navigate(['/']);
  return false;
};

export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  const target = auth.role() === 'Admin' ? '/admin/dashboard' : '/member/home';
  router.navigate([target]);
  return false;
};
