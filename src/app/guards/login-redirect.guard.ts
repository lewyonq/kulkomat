import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase';
import { environment } from '../environment/environment';

export const loginRedirectGuard: CanActivateFn = async (route, _state) => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  while (supabase.isLoading()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (supabase.isAuthenticated()) {
    const next =
      route.queryParamMap.get('next') ||
      (environment as any)?.auth?.defaultRedirectAfterLogin ||
      '/';
    router.navigate([next]);
    return false;
  }

  return true;
};
