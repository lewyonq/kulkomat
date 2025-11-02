import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({ providedIn: 'root' })
export class SellersService {
  private supabase = inject(Supabase);

  async isCurrentUserSeller(): Promise<boolean> {
    const user = this.supabase.user();
    if (!user) return false;

    try {
      const { data, error } = await this.supabase.client
        .from('sellers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        return false;
      }

      return !!data;
    } catch {
      return false;
    }
  }

  async getCurrentSellerRecord(): Promise<{ user_id: string; active: boolean; created_at: string } | null> {
    const user = this.supabase.user();
    if (!user) return null;

    const { data, error } = await this.supabase.client
      .from('sellers')
      .select('id, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) return null;

    return { user_id: data.id, active: true, created_at: data.created_at };
  }
}
