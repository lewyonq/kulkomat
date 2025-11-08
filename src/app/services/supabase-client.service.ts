import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../environment/environment';
import { Database } from '../../db/database.types';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly _client: SupabaseClient<Database>;

  constructor() {
    this._client = createClient<Database>(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  get client(): SupabaseClient<Database> {
    return this._client;
  }
}
