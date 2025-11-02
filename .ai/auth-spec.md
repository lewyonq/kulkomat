# Specyfikacja architektury modułu uwierzytelniania

Zakres: logowanie wyłącznie przez Google OAuth z wykorzystaniem Supabase Auth. Brak rejestracji e-mail/telefon i resetu hasła w tej iteracji. Integracja zgodna z PRD i stackiem: Angular ^20.3, TypeScript ~5.9.2, TailwindCSS ^4.1.14, RxJS ~7.8.

## 1. Cele i ograniczenia

- Logowanie/wylogowanie/sesja/dane bieżącego użytkownika obsługiwane przez Supabase Auth.
- Brak własnego formularza rejestracji i brak resetu hasła (US-011 poza zakresem na teraz). Ekrany mogą ukrywać/zastępować te opcje przyciskiem „Zaloguj przez Google”.
- Zgodność z PRD:
  - Dostęp do sekcji „Profile”, „History”, „Coupons” tylko dla zalogowanych.
  - Panel administracyjny dostępny tylko dla uprawnionych kont (wpis w tabeli `sellers`) – autoryzacja również przez Google.
  - Homepage i formularz kontaktowy dostępne publicznie.

## 2. Supabase – wymagane zasoby i konfiguracja

- Provider Google w Supabase: włączony w projekcie, ustawione Redirect URLs (dev/prod):
  - DEV: http://localhost:4200/auth/callback
  - PROD: https://<prod-domain>/auth/callback
- `supabase-js` v2 w kliencie przeglądarkowym, z włączoną persystencją sesji w localStorage i multi-tab sync.
- Tabele i dane użytkownika (na potrzeby profilu i zgodności z PRD):
  - `profiles` (widok/prosta tabela aplikacyjna, powiązana 1:1 z `auth.users`):
    - `id` uuid (PK, = `auth.users.id`)
    - `short_id` text UNIQUE NOT NULL (6–8 znaków; generowane przy pierwszym logowaniu)
    - `created_at` timestamptz DEFAULT now()
  - `sellers` (personel/admin; obecność rekordu = dostęp do panelu):
    - `id` uuid PRIMARY KEY REFERENCES auth.users(id)
    - `created_at` timestamptz DEFAULT now()
  - RLS:
    - użytkownik może czytać/aktualizować tylko swój rekord w `profiles`
    - sprzedawca (`exists (select 1 from public.sellers s where s.id = auth.uid())`) może czytać (SELECT) `profiles` wszystkich użytkowników na potrzeby panelu „Stali klienci”
    - operacje administracyjne dozwolone wyłącznie, gdy `exists (select 1 from public.sellers s where s.id = auth.uid())`
    - odczyt własnego wiersza w `sellers` dozwolony; brak wglądu w innych użytkowników

## 3. Konfiguracja środowiskowa (Angular)

- Zgodnie z zasadą projektu: wartości konfiguracyjne w `environment.ts`/`environment.prod.ts` (bez `process.env` w runtime przeglądarki).
- Klucze:
  - `supabaseUrl: string`
  - `supabaseAnonKey: string`
  - `auth: { redirectUri: string; defaultRedirectAfterLogin: string; defaultRedirectAfterLogout: string; adminEmails?: string[] }`
- Przykład (opis kontraktu, bez implementacji):
```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://<project>.supabase.co',
  supabaseAnonKey: '<anon-key>',
  auth: {
    redirectUri: 'http://localhost:4200/auth/callback',
    defaultRedirectAfterLogin: '/dashboard',
    defaultRedirectAfterLogout: '/login',
    adminEmails: ['owner@example.com'] // opcjonalnie do whitelisting'u adminów
  }
} as const;
```

## 4. Warstwa integracji z Supabase

- `SupabaseClientService` (singleton):
  - Odpowiada za utworzenie i udostępnienie instancji `createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })`.
  - Kontrakt:
```ts
export interface ISupabaseClientService {
  client: SupabaseClient
}
```

## 5. Warstwa domenowa autoryzacji

- `AuthService` (singleton): zarządza sesją, logowaniem, wylogowaniem i dostępem do bieżącego użytkownika.
  - Strumienie:
    - `session$: Observable<Session | null>` – bieżąca sesja.
    - `user$: Observable<User | null>` – pochodna z `session$`.
    - (opcjonalnie) `isAdmin$: Observable<boolean>` – na podstawie istnienia rekordu w `sellers` dla `user.id`.
  - Metody (kontrakty):
```ts
export interface IAuthService {
  init(): void; // pobranie sesji z Supabase i subskrypcja onAuthStateChange
  signInWithGoogle(options?: { redirectTo?: string; next?: string }): Promise<void>;
  handleOAuthCallback(url: string): Promise<void>; // wywoływane na /auth/callback
  signOut(): Promise<void>;
  getSessionOnce(): Promise<Session | null>;
  getUserOnce(): Promise<User | null>;
}
```
  - Zasady działania:
    - `init()` pobiera `getSession()` oraz ustawia `onAuthStateChange` do aktualizacji store.
    - `signInWithGoogle()` używa `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, scopes: 'openid email profile' } })` oraz dołącza `next` jako parametr stanu.
    - `handleOAuthCallback()` wywołuje `supabase.auth.exchangeCodeForSession()` (kod z query), w razie błędu kieruje na `/login` z komunikatem.
    - `signOut()` wywołuje `supabase.auth.signOut()` i czyści lokalny stan, przekierowuje na `defaultRedirectAfterLogout`.

- `ProfileService` (aplikacyjny):
  - Zajmuje się odczytem/aktualizacją rekordu `profiles` zalogowanego użytkownika.
  - Kontrakty minimalne:
```ts
export interface IUserProfile {
  id: string;        // = auth.users.id
  short_id: string;
  created_at: string;
}

export interface IProfileService {
  getMyProfile(): Promise<IUserProfile | null>;
  ensureMyProfile(): Promise<IUserProfile>; // tworzy rekord przy pierwszym logowaniu (short_id)
}
```

- `SellersService` (aplikacyjny):
  - Zajmuje się odczytem rekordu `sellers` zalogowanego użytkownika.
  - Kontrakty minimalne:
```ts
export interface ISellersService {
  isCurrentUserSeller(): Promise<boolean>;
  getCurrentSellerRecord(): Promise<{ user_id: string; created_at: string } | null>;
}
```

## 6. Routing, guardy i nawigacja

- Trasy publiczne: `/`, `/login`, `/auth/callback`, `/contact`.
- Trasy chronione (użytkownik): `/dashboard`, `/coupons`, `/profile`, `/history`.
- Trasy admin: `/admin/**`.

- `authGuard` (funkcyjny, Angular 15+):
  - Dopuszcza wejście, gdy `session$` != null, w przeciwnym razie przekierowuje do `/login?next=<url>`.

- `adminGuard` (funkcyjny):
  - Wymaga zalogowania i `isAdmin$ === true` (na podstawie istnienia rekordu w `sellers` dla `user.id`).

- `authCallbackResolver` (lub komponent-init na `/auth/callback`):
  - Wywołuje `AuthService.handleOAuthCallback(currentUrl)` i przekierowuje na `next` lub `defaultRedirectAfterLogin`.

- `loginRedirectGuard` (na `/login`):
  - Jeśli zalogowany, przekierowuje na `defaultRedirectAfterLogin` lub `next`.

## 7. Interceptory HTTP (opcjonalnie)

- `AuthHttpInterceptor` – jeśli aplikacja wywołuje własne API, dołącza `Authorization: Bearer <access_token>`.
  - Pobiera token z `AuthService.session$` (snapshot) i ustawia nagłówek dla domen własnego API (nie dla Supabase).

## 8. Komponenty UI

- `LoginPage` (standalone):
  - Jeden przycisk „Zaloguj przez Google”.
  - Obsługa błędów (query `error_description`), stan ładowania, focus management, a11y (`aria-busy`, `role="alert"`).

- `ProfilePage` (istniejący widok – wymagania PRD):
  - W sekcji nagłówka: e-mail (z `auth.user.email`), `created_at` (z `profiles.created_at`), przycisk „Wyloguj”.
  - Kod QR i `short_id` – dane z `ProfileService.getMyProfile()`.
  - Link do „Historia”.

- Pasek nawigacyjny:
  - Dostosowanie widoczności linków dla niezalogowanego (np. „Zaloguj”) vs zalogowanego (Profile/Coupons/History/Logout).

## 9. Stany brzegowe i obsługa błędów

- Anulowanie logowania u dostawcy – powrót do `/login` z komunikatem.
- Nieudana wymiana kodu na sesję – komunikat i możliwość ponowienia logowania.
- Użytkownik zalogowany, ale brak `profiles` – `ensureMyProfile()` tworzy profil i generuje unikalny `short_id` (np. algorytm: losowy base32 o długości 6, z ponawianiem przy kolizji).
- Wygasła sesja – automatyczne odświeżenie przez Supabase; przy błędzie wylogowanie kontrolowane i powrót na `/login`.

## 10. Role i dostęp do panelu administracyjnego

- Mechanika po stronie frontu (autoryzacja dostępu):
  - `AdminGuard` oparty o:
    - istnienie wiersza w `sellers` dla `user.id`
    - (opcjonalnie) `user.email ∈ environment.auth.adminEmails` – fallback MVP
- Źródło prawdy o uprawnieniach admina: tabela `sellers`. Whitelist e‑mail w env opcjonalna na start.

## 11. Telemetria i logowanie

- Minimalne eventy: `auth_login_started`, `auth_login_succeeded`, `auth_login_failed`, `auth_logout`, z kontekstem `provider: 'google'`.
- Logi błędów z `AuthService` i `authCallback` (ciche dla użytkownika, a czytelne w konsoli/devtools).

## 12. Testy

- Jednostkowe:
  - `AuthService` (init, signInWithGoogle, handleOAuthCallback szczęśliwe/nieudane ścieżki, signOut).
  - Guardy (`authGuard`, `adminGuard`) – dopuszczenie/odrzucenie i redirect.
- Integracyjne/E2E (Cypress/Playwright):
  - Przepływ login → redirect na `next`.
  - Ochrona tras przed dostępem niezalogowanym.
  - Wylogowanie i redirect.

## 13. Dostępność (a11y) i UX

- Wyraźny status logowania/ładowania, przyciski o odpowiednim kontraście (Tailwind), focus management po powrocie z OAuth.
- Komunikaty o błędach w `aria-live="polite"`.

## 14. Checklist wdrożeniowy

- Skonfigurowany provider Google w Supabase i poprawne Redirect URLs (dev/prod).
- Uzupełnione `environment.ts`/`environment.prod.ts` (supabaseUrl, supabaseAnonKey, redirectUri, defaulty redirectów, opcjonalnie adminEmails).
- Trasy: `/login`, `/auth/callback` dodane i spięte z guardami.
- Utworzony `SupabaseClientService`, `AuthService`, `ProfileService`, guardy: `authGuard`, `adminGuard`.
- UI: `LoginPage` z przyciskiem Google, integracja przycisku „Wyloguj” w profilu.
- Tabela `profiles` i mechanizm generacji `short_id` (przy pierwszym logowaniu).
- Tabela `sellers` (personel/admin) i polityki RLS dla operacji administracyjnych.

## 15. Zgodność z PRD – kluczowe uwagi

- US-002 Logowanie – realizowane przyciskiem „Zaloguj przez Google” (zamiast login+hasło), wynik: użytkownik trafia na stronę główną lub `next`.
- US-022 Profil użytkownika – dane e-mail i data utworzenia dostępne; `short_id` i QR w profilu – dane z tabeli `profiles`.
- US-013 Logowanie do panelu admin – dostęp przez Google i `AdminGuard`; zasada „tylko autoryzowany personel ma dostęp” jest zachowana.
- US-011 Reset hasła – poza zakresem w tej iteracji (logowanie tylko przez Google nie wymaga haseł aplikacji).
- Panel admin operuje na `short_id` w UI (zgodnie z PRD 4.1 i US‑014/US‑015); mapowanie `short_id → user_id` realizowane przez SELECT z `profiles` (dostępne dla sprzedawców przez RLS).

## 16. Kontrakty – podsumowanie (TypeScript)

```ts
// Auth
export interface IAuthService {
  init(): void;
  signInWithGoogle(options?: { redirectTo?: string; next?: string }): Promise<void>;
  handleOAuthCallback(url: string): Promise<void>;
  signOut(): Promise<void>;
  getSessionOnce(): Promise<Session | null>;
  getUserOnce(): Promise<User | null>;
  readonly session$: Observable<Session | null>;
  readonly user$: Observable<User | null>;
}

// Profile
export interface IUserProfile {
  id: string;
  short_id: string;
  created_at: string;
}

export interface IProfileService {
  getMyProfile(): Promise<IUserProfile | null>;
  ensureMyProfile(): Promise<IUserProfile>;
}

// Sellers
export interface ISellersService {
  isCurrentUserSeller(): Promise<boolean>;
  getCurrentSellerRecord(): Promise<{ user_id: string; active: boolean; created_at: string } | null>;
}

// Guardy (opisowo)
// authGuard: allow if session != null; else redirect('/login?next=...')
// adminGuard: allow if session != null && (exists sellers[user.id] || email in adminEmails)
```
