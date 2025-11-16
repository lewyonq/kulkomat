import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ścieżka do pliku, w którym Playwright zapisze stan sesji
const authFile = 'playwright/.auth/user.json';
// Ścieżka do naszego mocka sesji OAuth2
const mockAuthFile = path.join(__dirname, 'auth/user.json');

/**
 * Pobierz klucz localStorage dla Supabase na podstawie URL projektu
 * Format: sb-{project-ref}-auth-token
 */
function getSupabaseStorageKey(supabaseUrl: string): string {
  try {
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split('.')[0];
    return `sb-${projectRef}-auth-token`;
  } catch (e) {
    console.warn('Could not parse Supabase URL, using default key');
    return 'sb-localhost-auth-token';
  }
}

setup('authenticate', async ({ page }) => {
  // Wczytaj dane mockowej sesji OAuth2
  const authData = JSON.parse(fs.readFileSync(mockAuthFile, 'utf-8'));

  // Pobierz Supabase URL ze zmiennej środowiskowej
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      'SUPABASE_URL environment variable is not set. ' +
        'Please set it before running tests: export SUPABASE_URL=https://your-project.supabase.co',
    );
  }

  // Wygeneruj klucz localStorage na podstawie URL
  const storageKey = getSupabaseStorageKey(supabaseUrl);

  // Przejdź do strony głównej aplikacji
  await page.goto('/');

  // Ustaw sesję OAuth2 w localStorage
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: storageKey, value: JSON.stringify(authData) },
  );

  // Odśwież stronę, aby aplikacja załadowała się z sesją
  await page.reload();

  // Poczekaj na załadowanie strony i upewnij się, że użytkownik jest zalogowany
  // Sprawdź czy link do kuponów jest widoczny - to oznacza że użytkownik jest zalogowany
  await expect(page.getByRole('link', { name: /przejdź do kuponów/i })).toBeVisible({
    timeout: 10000,
  });

  // Zapisz stan sesji (localStorage + cookies) do pliku authFile
  // Ten plik będzie używany przez wszystkie testy
  await page.context().storageState({ path: authFile });
});
