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

  // Przejdź do strony głównej aplikacji
  await page.goto('/');

  // Pobierz URL Supabase z aplikacji (może być dostępny w window lub w środowisku)
  // Dla celów testowych, spróbujmy wykryć klucz automatycznie
  const supabaseUrl = await page.evaluate(() => {
    // Sprawdź czy Supabase URL jest dostępny w localStorage
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (authKey) {
      // Wyciągnij project ref z klucza
      return authKey;
    }
    // Fallback - sprawdź environment (jeśli jest dostępny w window)
    if ((window as any).__env && (window as any).__env.supabase) {
      return (window as any).__env.supabase.url;
    }
    return null;
  });

  let storageKey: string;
  if (supabaseUrl && supabaseUrl.startsWith('sb-')) {
    // Klucz został znaleziony bezpośrednio
    storageKey = supabaseUrl;
  } else if (supabaseUrl) {
    // URL został znaleziony, generujemy klucz
    storageKey = getSupabaseStorageKey(supabaseUrl);
  } else {
    // Fallback - użyj ogólnego klucza testowego
    storageKey = 'sb-localhost-auth-token';
    console.warn(`Using fallback storage key: ${storageKey}`);
  }

  console.log(`Setting up authentication with storage key: ${storageKey}`);

  // Ustaw sesję OAuth2 w localStorage
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: storageKey, value: JSON.stringify(authData) }
  );

  // Odśwież stronę, aby aplikacja załadowała się z sesją
  await page.reload();

  // Poczekaj na załadowanie strony i upewnij się, że użytkownik jest zalogowany
  // Sprawdź czy link do kuponów jest widoczny - to oznacza że użytkownik jest zalogowany
  await expect(page.getByRole('link', { name: /przejdź do kuponów/i })).toBeVisible({ timeout: 10000 });

  console.log('Authentication setup complete - user is logged in');

  // Zapisz stan sesji (localStorage + cookies) do pliku authFile
  // Ten plik będzie używany przez wszystkie testy
  await page.context().storageState({ path: authFile });
});