import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase';

/**
 * adminGuard - Protects admin panel routes
 *
 * Verifies that:
 * 1. User is authenticated
 * 2. User has seller role (exists in sellers table)
 *
 * Redirects:
 * - Unauthenticated users -> /admin/login
 * - Authenticated non-sellers -> / (home page)
 *
 * Usage:
 * Apply this guard to all /admin/* routes except /admin/login
 *
 * @example
 * {
 *   path: 'admin/dashboard',
 *   loadComponent: () => import('./admin-dashboard.component'),
 *   canActivate: [adminGuard]
 * }
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  // Wait for authentication state to be ready
  while (supabase.isLoading()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const user = supabase.user();

  // Redirect unauthenticated users to admin login page
  if (!user) {
    router.navigate(['/admin/login'], { queryParams: { next: state?.url || '/admin/dashboard' } });
    return false;
  }

  // Check if user is a seller
  try {
    const { data, error } = await supabase.client
      .from('sellers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking seller status:', error);
      router.navigate(['/']);
      return false;
    }

    // Allow access if user is a seller
    if (data) return true;
  } catch (err) {
    console.error('Error in admin guard:', err);
  }

  // User is authenticated but not a seller - redirect to home
  router.navigate(['/']);
  return false;
};
