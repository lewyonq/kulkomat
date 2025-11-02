import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from './supabase';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import type { Session, User } from '@supabase/supabase-js';
import { environment } from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(Supabase);
  private router = inject(Router);

  readonly session$: Observable<Session | null> = toObservable(this.supabase.session) as unknown as Observable<Session | null>;
  readonly user$: Observable<User | null> = this.session$.pipe(map((s) => (s ? (s.user as User) : null)));

  init(): void {
    // Supabase service initializes itself in constructor; nothing additional required here.
  }

  async signInWithGoogle(options?: { redirectTo?: string; next?: string }): Promise<void> {
    const defaultRedirect = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback';
    const redirectTo = options?.redirectTo || (environment as any)?.auth?.redirectUri || defaultRedirect;

    if (options?.next && typeof window !== 'undefined') {
      const url = new URL(redirectTo);
      url.searchParams.set('next', options.next);
      await this.supabase.signInWithGoogle();
      return;
    }

    await this.supabase.signInWithGoogle();
  }

  async handleOAuthCallback(url: string): Promise<void> {
    await this.supabase.handleOAuthCallback(url);
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    const afterLogout = (environment as any)?.auth?.defaultRedirectAfterLogout || '/login';
    this.router.navigate([afterLogout]);
  }

  async getSessionOnce(): Promise<Session | null> {
    const { data, error } = await this.supabase.client.auth.getSession();
    if (error) return null;
    return (data?.session as Session) ?? null;
  }

  async getUserOnce(): Promise<User | null> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) return null;
    return (data?.user as User) ?? null;
  }
}
