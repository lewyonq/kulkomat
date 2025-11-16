# Testy E2E z Playwright

## Przegląd

Ten folder zawiera testy end-to-end (E2E) dla aplikacji Kulkomat, wykorzystujące framework Playwright.

## Struktura

```
tests/
├── auth/
│   └── user.json          # Mock sesji OAuth2 dla testów
├── auth.setup.ts          # Setup uwierzytelniania przed testami
├── coupon-usage.spec.ts   # Testy flow wykorzystania kuponu
└── README.md              # Ten plik
```

## Konfiguracja Uwierzytelniania

### Mockowanie Sesji OAuth2

Testy używają zmockowanej sesji OAuth2, aby symulować zalogowanego użytkownika bez konieczności przeprowadzania rzeczywistego procesu logowania przez Google.

#### `tests/auth/user.json`

Ten plik zawiera zmockowane dane sesji Supabase/OAuth2:
- Mock access token (nie wygaśnie do 2050 roku)
- Mock user ID: `00000000-0000-0000-0000-000000000001`
- Mock email: `playwright.test@kulkomat.test`

**UWAGA:** Ten plik zawiera tylko mockowe dane testowe i jest bezpieczny do commitowania.

#### `tests/auth.setup.ts`

Skrypt setup, który:
1. Ładuje mockową sesję z `user.json`
2. Pobiera URL Supabase ze zmiennej środowiskowej `SUPABASE_URL`
3. Generuje poprawny klucz localStorage na podstawie project-ref z URL
4. Ustawia sesję w localStorage przeglądarki
5. Weryfikuje, że użytkownik jest zalogowany
6. Zapisuje stan sesji do `playwright/.auth/user.json`

Ten stan sesji jest następnie używany przez wszystkie testy w projekcie `chromium`.

### Jak to działa?

1. **Setup project** (`auth.setup.ts`) uruchamia się najpierw
2. Tworzy zalogowaną sesję i zapisuje ją w `playwright/.auth/user.json`
3. **Testy główne** (`chromium` project) używają zapisanej sesji
4. Każdy test zaczyna się od już zalogowanego użytkownika

## Uruchamianie Testów

### Wymagania

#### 1. Konfiguracja zmiennych środowiskowych

Przed uruchomieniem testów, ustaw zmienną środowiskową `SUPABASE_URL`:

```bash
export SUPABASE_URL=https://your-project.supabase.co
```

Możesz też pobrać URL z pliku `src/app/environment/environment.ts`:

```bash
# Przykład: jeśli Twój URL w environment.ts to https://abc123.supabase.co
export SUPABASE_URL=https://abc123.supabase.co
```

#### 2. Uruchom serwer deweloperski

Upewnij się, że serwer deweloperski działa:

```bash
npm start
```

Serwer powinien być dostępny pod adresem `http://127.0.0.1:4200`

### Uruchomienie wszystkich testów

```bash
npx playwright test
```

### Uruchomienie konkretnego pliku testowego

```bash
npx playwright test tests/coupon-usage.spec.ts
```

### Uruchomienie w trybie UI (interaktywny)

```bash
npx playwright test --ui
```

### Uruchomienie w trybie debug

```bash
npx playwright test --debug
```

### Uruchomienie z widoczną przeglądarką (headed mode)

```bash
npx playwright test --headed
```

## Testy Kuponów (`coupon-usage.spec.ts`)

### Test 1: Pełny flow wykorzystania kuponu

**Co testuje:**
1. Użytkownik jest zalogowany (widzi link "Kupony")
2. Może przejść do strony kuponów
3. Widzi aktywne kupony
4. Może kliknąć na aktywny kupon
5. Pojawia się dialog potwierdzenia
6. Po potwierdzeniu pojawia się komunikat sukcesu
7. Toast z sukcesem znika po kilku sekundach

**Uwagi:**
- Test pomija się automatycznie, jeśli użytkownik nie ma aktywnych kuponów

### Test 2: Dialog potwierdzenia

**Co testuje:**
1. Kliknięcie na kupon pokazuje dialog
2. Dialog zawiera odpowiedni tekst
3. Kliknięcie "Nie" zamyka dialog
4. Kupon pozostaje aktywny po anulowaniu

### Test 3: Nieaktywne kupony

**Co testuje:**
1. Nieaktywne kupony (wykorzystane/wygasłe) są widoczne
2. Kliknięcie na nieaktywny kupon nie wywołuje dialogu
3. Nieaktywne kupony nie są klikaln

## Raporty

Po uruchomieniu testów, raporty są dostępne w:

```bash
npx playwright show-report
```

## Debugowanie

### Playwright Inspector

```bash
npx playwright test --debug
```

### Zrzuty ekranu przy błędach

Playwright automatycznie tworzy zrzuty ekranu gdy test się nie powiedzie.
Znajdują się one w folderze `test-results/`

### Trace viewer

Jeśli test się nie powiedzie, trace jest automatycznie zapisywany:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Mockowanie API (opcjonalne)

Jeśli chcesz zmockować odpowiedzi API zamiast używać prawdziwego backendu:

```typescript
test('example with mocked API', async ({ page }) => {
  // Mockuj endpoint API
  await page.route('**/api/coupons', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        coupons: [
          {
            id: 'mock-coupon-1',
            type: 'free_scoop',
            status: 'active',
            created_at: '2024-01-01',
            expires_at: '2025-12-31',
            value: null
          }
        ]
      })
    });
  });

  await page.goto('/coupons');
  // ... reszta testu
});
```

## Najlepsze Praktyki

1. **Używaj role-based selectors** - `getByRole('button', { name: 'Tak' })`
2. **Unikaj hardcodowanych timeoutów** - używaj `waitForTimeout` tylko gdy konieczne
3. **Używaj test.skip()** - gdy dane testowe są niedostępne
4. **Dodawaj komentarze** - opisz co test robi i dlaczego
5. **Testuj happy path i edge cases** - zarówno sukces jak i błędy

## Rozwiązywanie Problemów

### Problem: Testy nie mogą znaleźć linku "Kupony"

**Rozwiązanie:**
- Sprawdź czy serwer deweloperski działa
- Sprawdź czy mockowa sesja jest poprawnie ustawiona
- Uruchom test z `--headed --debug` aby zobaczyć co się dzieje

### Problem: Timeout podczas ładowania strony

**Rozwiązanie:**
- Zwiększ timeout w konfiguracji lub konkretnym teście
- Sprawdź czy aplikacja nie ma błędów w konsoli
- Upewnij się, że wszystkie zależności są zainstalowane

### Problem: Sesja OAuth2 wygasła

**Rozwiązanie:**
- Mock sesji ma długi czas wygaśnięcia (2050 rok)
- Jeśli problem persystuje, sprawdź `tests/auth/user.json`
- Możesz potrzebować zaktualizować `expires_at` na jeszcze dalszą datę

## Dodawanie Nowych Testów

1. Utwórz nowy plik `*.spec.ts` w folderze `tests/`
2. Import Playwright test API:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Użyj `test.describe()` do grupowania testów
4. Sesja OAuth2 jest automatycznie dostępna (dzięki `dependencies: ['setup']`)
5. Uruchom testy aby sprawdzić czy działają

## Dokumentacja

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
