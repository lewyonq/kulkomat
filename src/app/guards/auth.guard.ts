import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase';

/**
 * Auth Guard - Protects routes requiring authentication
 *
 * Checks if user is authenticated using Supabase service.
 * Redirects to /login if user is not authenticated.
 *
 * Usage:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  // Wait for auth initialization to complete
  while (supabase.isLoading()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const isAuth = supabase.isAuthenticated();

  if (!isAuth) {
    const next = state?.url || '/';
    router.navigate(['/login'], { queryParams: { next } });
    return false;
  }

  return true;
};
