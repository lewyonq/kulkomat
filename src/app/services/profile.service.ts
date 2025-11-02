import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface IUserProfile {
  id: string;
  email: string;
  short_id: string;
  created_at: string;
}

/**
 * ProfileService
 *
 * High-level profile operations service.
 * Uses AuthService for authentication state and profile access.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private authService = inject(AuthService);

  async getMyProfile(): Promise<IUserProfile | null> {
    const user = this.authService.user();
    if (!user) return null;

    const cached = this.authService.currentProfile();
    if (cached) {
      return { id: cached.id, email: user.email || '', short_id: cached.short_id, created_at: cached.created_at };
    }

    const profile = await firstValueFrom(this.authService.getCurrentUserProfile());
    return { id: profile.id, email: user.email || '', short_id: profile.short_id, created_at: profile.created_at };
  }

  async ensureMyProfile(): Promise<IUserProfile> {
    const user = this.authService.user();
    if (!user) throw new Error('User not authenticated');

    // Note: ensureProfileExists is handled automatically by Supabase service during auth initialization
    // We just need to refresh the profile here
    const profile = await firstValueFrom(this.authService.refreshCurrentUserProfile());
    return { id: profile.id, email: user.email || '', short_id: profile.short_id, created_at: profile.created_at };
  }
}
