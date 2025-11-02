import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  while (supabase.isLoading()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const user = supabase.user();
  if (!user) {
    router.navigate(['/login'], { queryParams: { next: state?.url || '/' } });
    return false;
  }

  try {
    const { data } = await supabase.client
      .from('sellers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (data) return true;
  } catch {}

  router.navigate(['/']);
  return false;
};
