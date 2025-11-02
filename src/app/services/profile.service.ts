import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { firstValueFrom } from 'rxjs';

export interface IUserProfile {
  id: string;
  email: string;
  short_id: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(Supabase);

  async getMyProfile(): Promise<IUserProfile | null> {
    const user = this.supabase.user();
    if (!user) return null;

    const cached = this.supabase.currentProfile();
    if (cached) {
      return { id: cached.id, email: user.email || '', short_id: cached.short_id, created_at: cached.created_at };
    }

    const profile = await firstValueFrom(this.supabase.getCurrentUserProfile());
    return { id: profile.id, email: user.email || '', short_id: profile.short_id, created_at: profile.created_at };
  }

  async ensureMyProfile(): Promise<IUserProfile> {
    const user = this.supabase.user();
    if (!user) throw new Error('User not authenticated');

    await this.supabase.ensureProfileExists(user.id);
    const profile = await firstValueFrom(this.supabase.refreshCurrentUserProfile());
    return { id: profile.id, email: user.email || '', short_id: profile.short_id, created_at: profile.created_at };
  }
}
