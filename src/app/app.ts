import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('kulkomat');
  supabase = inject(Supabase);

  onLogin() {
    this.supabase.signInWithGoogle();
  }

  onLogout() {
    this.supabase.signOut();
  }
}
