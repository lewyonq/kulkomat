import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * SellersService
 *
 * Manages seller-related operations.
 * Uses AuthService for authentication state and database access.
 */
@Injectable({ providedIn: 'root' })
export class SellersService {
  private authService = inject(AuthService);

  async isCurrentUserSeller(): Promise<boolean> {
    const user = this.authService.user();
    if (!user) return false;

    try {
      const { data, error } = await this.authService.client
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

  async getCurrentSellerRecord(): Promise<{
    user_id: string;
    active: boolean;
    created_at: string;
  } | null> {
    const user = this.authService.user();
    if (!user) return null;

    const { data, error } = await this.authService.client
      .from('sellers')
      .select('id, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) return null;

    return { user_id: data.id, active: true, created_at: data.created_at };
  }
}
