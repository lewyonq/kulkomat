# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard jest głównym widokiem aplikacji dostępnym po zalogowaniu użytkownika. Jego celem jest wyświetlenie kluczowych informacji o programie lojalnościowym oraz zapewnienie szybkiego dostępu do najważniejszych funkcji aplikacji. Widok prezentuje unikalny identyfikator użytkownika (short_id) z kodem QR ułatwiającym identyfikację przez sprzedawcę, wizualny postęp w zbieraniu pieczątek (X/10), oraz kartę nawigacyjną prowadzącą do sekcji z kuponami. Dashboard jest zaprojektowany zgodnie z podejściem mobile-first i wykorzystuje Material Design 3 guidelines.

## 2. Routing widoku

Dashboard powinien być dostępny pod główną ścieżką aplikacji:

**Ścieżka**: `/` lub `/dashboard`

**Konfiguracja w app.routes.ts**:

```typescript
{
  path: '',
  loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [AuthGuard] // Wymaga uwierzytelnienia
}
```

**Guard**: Widok musi być chroniony przez `AuthGuard`, który weryfikuje czy użytkownik jest zalogowany poprzez sprawdzenie `isAuthenticated` signal z Supabase service.

## 3. Struktura komponentów

Dashboard składa się z następujących komponentów:

```
DashboardComponent (Page Container)
│
├── UserIdDisplayComponent
│   └── QR Code display
│
├── StampProgressComponent
│   └── Visual stamp indicators (circles/icons)
│
└── CouponNavigationCardComponent
```

**Uwaga**: Komponent `FlavorListComponent` (lista smaków lodów) zostanie pominięty w pierwszej wersji ze względu na brak implementacji API dla smaków. Może zostać dodany w przyszłości po implementacji tabeli `ice_cream_flavors` w bazie danych.

## 4. Szczegóły komponentów

### 4.1. DashboardComponent (Page Container)

**Opis komponentu**: Główny kontener widoku Dashboard. Odpowiada za pobranie danych użytkownika z Supabase, zarządzanie stanem (loading, error), subskrypcję na realtime updates oraz orkiestrację komponentów potomnych.

**Główne elementy HTML i komponenty dzieci**:

- Loading spinner (podczas ładowania danych)
- Error message z przyciskiem "Spróbuj ponownie" (w przypadku błędu)
- Header z powitaniem użytkownika
- `<app-user-id-display>` - wyświetlenie short_id i QR kodu
- `<app-stamp-progress>` - postęp zbierania pieczątek
- `<app-coupon-navigation-card>` - karta nawigacyjna do kuponów
- Opcjonalnie: Floating Action Button (FAB) do ręcznego odświeżenia

**Obsługiwane zdarzenia**:

- `ngOnInit()`: Inicjalizacja komponentu, pobranie profilu użytkownika, subskrypcja Realtime
- `ngOnDestroy()`: Cleanup - anulowanie subskrypcji Realtime
- `onRetry()`: Ponowna próba pobrania danych po błędzie
- `onRefresh()`: Ręczne odświeżenie danych (opcjonalnie)

**Warunki walidacji**:

- Użytkownik musi być zalogowany (weryfikowane przez AuthGuard)
- Profil użytkownika musi istnieć w bazie danych
- `short_id` nie może być null/undefined
- `stamp_count` musi być liczbą od 0 do 10

**Typy (DTO i ViewModel)**:

- `ProfileDTO` (input z Supabase)
- `DashboardViewModel` (wewnętrzny stan komponentu)
- `StampProgressViewModel` (computed state)

**Propsy**: Brak (komponent page-level, pobiera dane samodzielnie)

---

### 4.2. UserIdDisplayComponent

**Opis komponentu**: Komponent prezentacyjny odpowiedzialny za wyświetlenie unikalnego identyfikatora użytkownika (short_id) w dużej, czytelnej czcionce oraz wygenerowanie kodu QR. Kod QR umożliwi w przyszłości szybkie skanowanie przez sprzedawcę. Short_id jest wyświetlany w sposób łatwo czytelny z ekranu telefonu.

**Główne elementy HTML i komponenty dzieci**:

- Container z Material Design elevation/border
- Label "Twój identyfikator" lub "Pokaż sprzedawcy"
- Short_id w dużej czcionce (np. text-4xl, font-mono, letter-spacing)
- Kod QR wygenerowany z short_id (używając biblioteki `qrcode` lub podobnej)
- Opcjonalnie: Przycisk "Kopiuj" do schowka

**Obsługiwane zdarzenia**:

- `onCopyToClipboard()`: Kopiowanie short_id do schowka (opcjonalnie)

**Warunki walidacji**:

- `shortId` nie może być pusty lub null
- Jeśli `shortId` jest nieprawidłowy, wyświetl placeholder "Ładowanie..." lub komunikat błędu

**Typy (DTO i ViewModel)**:

```typescript
interface UserIdDisplayProps {
  shortId: string;
  showQRCode?: boolean; // default: true
}
```

**Propsy (Input)**:

- `@Input() shortId: string` - wymagany, unikalny identyfikator użytkownika
- `@Input() showQRCode: boolean = true` - opcjonalny, czy wyświetlać kod QR

---

### 4.3. StampProgressComponent

**Opis komponentu**: Komponent prezentacyjny wizualizujący postęp w zbieraniu pieczątek. Wyświetla aktualną liczbę zebranych pieczątek oraz liczbę potrzebną do otrzymania nagrody (10). Wizualizacja może być wykonana za pomocą ikon lodów, kółek lub progress bar.

**Główne elementy HTML i komponenty dzieci**:

- Container z tytułem "Twoje pieczątki" lub "Postęp"
- Tekstowa reprezentacja: "X / 10 pieczątek"
- Wizualna reprezentacja:
  - Opcja A: 10 ikon lodów (wypełnione vs. puste)
  - Opcja B: Progress bar (Angular Material `<mat-progress-bar>`)
  - Opcja C: Grid 10 kółek (filled vs. outlined)
- Tekst informacyjny: "Brakuje ci X pieczątek do darmowej gałki!"

**Obsługiwane zdarzenia**:

- Brak (komponent tylko do wyświetlania, brak interakcji użytkownika)

**Warunki walidacji**:

- `stampCount` musi być liczbą >= 0 i <= 10
- Jeśli `stampCount` przekracza `maxStamps`, wyświetl błąd lub obetnij wartość do max
- Jeśli `stampCount` === 10, wyświetl specjalny komunikat "Masz komplet! Wykorzystaj kupon."

**Typy (DTO i ViewModel)**:

```typescript
interface StampProgressProps {
  stampCount: number;
  maxStamps?: number; // default: 10
}

interface StampProgressViewModel {
  current: number;
  total: number;
  percentage: number; // 0-100
  stampsToReward: number;
  isComplete: boolean;
}
```

**Propsy (Input)**:

- `@Input() stampCount: number` - wymagany, aktualna liczba pieczątek
- `@Input() maxStamps: number = 10` - opcjonalny, maksymalna liczba pieczątek

---

### 4.4. CouponNavigationCardComponent

**Opis komponentu**: Karta nawigacyjna prowadząca użytkownika do widoku z kuponami (`/coupons`). Wyświetla ikonę, tytuł oraz opcjonalnie badge z liczbą aktywnych kuponów. Karta jest interaktywna i reaguje na kliknięcie.

**Główne elementy HTML i komponenty dzieci**:

- Material Card (`mat-card` lub custom card zgodny z MD3)
- Ikona kuponów (np. Material Icon `local_offer` lub `confirmation_number`)
- Tytuł: "Moje kupony"
- Subtitle: "Zobacz dostępne rabaty" lub liczba aktywnych kuponów
- Badge z licznikiem (jeśli `activeCouponsCount` > 0)
- Ripple effect (Material ripple) na hover/click
- Arrow icon sugerujący nawigację

**Obsługiwane zdarzenia**:

- `onClick()`: Nawigacja do `/coupons` za pomocą `Router.navigate()`

**Warunki walidacji**:

- Brak szczególnych warunków, komponent zawsze jest widoczny
- Jeśli `activeCouponsCount` === 0 lub undefined, nie wyświetlaj badge

**Typy (DTO i ViewModel)**:

```typescript
interface CouponNavigationCardProps {
  activeCouponsCount?: number;
}
```

**Propsy (Input)**:

- `@Input() activeCouponsCount?: number` - opcjonalny, liczba aktywnych kuponów do wyświetlenia w badge

---

## 5. Typy

### 5.1. Istniejące DTO (z `src/app/types/index.ts`)

**ProfileDTO**:

```typescript
type ProfileDTO = {
  id: string; // UUID użytkownika z Supabase Auth
  short_id: string; // 6-8 znakowy alfanumeryczny identyfikator (np. "A1B2C3D")
  stamp_count: number; // Liczba zebranych pieczątek (0-10)
  created_at: string; // ISO timestamp utworzenia profilu
};
```

### 5.2. Nowe typy ViewModel (do stworzenia)

**DashboardViewModel** - główny model widoku Dashboard:

```typescript
interface DashboardViewModel {
  profile: ProfileDTO;
  stampProgress: StampProgressViewModel;
  activeCouponsCount?: number; // Opcjonalnie na przyszłość
}
```

**StampProgressViewModel** - computed state dla postępu pieczątek:

```typescript
interface StampProgressViewModel {
  current: number; // Aktualna liczba pieczątek (z profile.stamp_count)
  total: number; // Maksymalna liczba pieczątek (zawsze 10)
  percentage: number; // Procentowy postęp: (current / total) * 100
  stampsToReward: number; // Pozostałe pieczątki do nagrody: total - current
  isComplete: boolean; // Czy zebrano wszystkie pieczątki: current === total
}
```

**UserIdDisplayViewModel** (opcjonalnie):

```typescript
interface UserIdDisplayViewModel {
  shortId: string;
  qrCodeDataUrl?: string; // Data URL wygenerowanego QR kodu (jeśli używamy pre-generowania)
}
```

### 5.3. Typy Props dla komponentów

**UserIdDisplayProps**:

```typescript
interface UserIdDisplayProps {
  shortId: string;
  showQRCode?: boolean; // default: true
}
```

**StampProgressProps**:

```typescript
interface StampProgressProps {
  stampCount: number;
  maxStamps?: number; // default: 10
}
```

**CouponNavigationCardProps**:

```typescript
interface CouponNavigationCardProps {
  activeCouponsCount?: number;
}
```

## 6. Zarządzanie stanem

### 6.1. Wzorzec zarządzania stanem

Dashboard wykorzystuje **Angular Signals** do reaktywnego zarządzania stanem. Nie ma potrzeby tworzenia custom hooków - wystarczą wbudowane funkcje `signal()` i `computed()`.

### 6.2. State w DashboardComponent

**Loading states**:

```typescript
protected isLoading = signal<boolean>(true);
protected error = signal<Error | null>(null);
protected refreshing = signal<boolean>(false); // dla pull-to-refresh
```

**Data states**:

```typescript
protected profile = signal<ProfileDTO | null>(null);
```

**Computed states** (automatycznie przeliczane na podstawie `profile`):

```typescript
protected stampProgress = computed<StampProgressViewModel | null>(() => {
  const currentProfile = this.profile();
  if (!currentProfile) return null;

  const current = currentProfile.stamp_count;
  const total = 10;

  return {
    current,
    total,
    percentage: (current / total) * 100,
    stampsToReward: Math.max(0, total - current),
    isComplete: current >= total
  };
});

protected shortId = computed<string | null>(() => {
  return this.profile()?.short_id ?? null;
});
```

### 6.3. Lifecycle i Realtime Updates

**ngOnInit**:

1. Wywołanie `loadProfile()` do pobrania danych użytkownika
2. Subskrypcja na Realtime updates z Supabase dla tabeli `profiles`

**ngOnDestroy**:

1. Cleanup subskrypcji Realtime

**Realtime subscription**:

```typescript
private setupRealtimeSubscription(): void {
  const userId = this.supabase.user()?.id;
  if (!userId) return;

  this.realtimeSubscription = this.supabase.client
    .channel('profile-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        // Aktualizacja profilu w czasie rzeczywistym
        this.profile.set(payload.new as ProfileDTO);
      }
    )
    .subscribe();
}
```

### 6.4. Brak potrzeby custom state management service

Dla widoku Dashboard wystarczy lokalny state w komponencie. Jeśli w przyszłości będzie potrzeba współdzielenia stanu między wieloma widokami, można rozważyć stworzenie `ProfileStateService` z signals.

## 7. Integracja API

### 7.1. Endpoint: getCurrentUserProfile()

**Metoda**: `getCurrentUserProfile()` z `Supabase` service

**Typ żądania**: Brak (metoda korzysta z istniejącej sesji)

**Typ odpowiedzi**: `Observable<ProfileDTO>`

**Przykład użycia w DashboardComponent**:

```typescript
private loadProfile(): void {
  this.isLoading.set(true);
  this.error.set(null);

  this.supabase.getCurrentUserProfile()
    .subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
        console.error('Failed to load profile:', err);
      }
    });
}
```

**Obsługa błędów**:

- Network error: Wyświetlenie komunikatu "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
- User not authenticated: Przekierowanie do `/login` (obsługiwane przez AuthGuard)
- Profile not found: Wyświetlenie komunikatu "Profil nie został znaleziony. Spróbuj wylogować się i zalogować ponownie."

### 7.2. Realtime Subscription

**Tabela**: `profiles`

**Event**: `UPDATE`

**Filter**: `id=eq.{userId}`

**Typ payload**: `ProfileDTO`

**Cel**: Automatyczna aktualizacja widoku gdy sprzedawca doda pieczątki

**Graceful Fallback**: Jeśli Realtime nie jest dostępne, użytkownik może ręcznie odświeżyć widok (pull-to-refresh lub przycisk refresh)

### 7.3. Przyszłe API (poza zakresem MVP)

**getFlavors()**: Pobieranie listy smaków lodów

- Typ odpowiedzi: `Observable<FlavorDTO[]>`
- Status: Brak implementacji w bazie danych i API

**getActiveCouponsCount()**: Pobieranie liczby aktywnych kuponów

- Typ odpowiedzi: `Observable<number>`
- Status: Do implementacji w przyszłości dla badge w CouponNavigationCard

## 8. Interakcje użytkownika

### 8.1. Wejście na stronę Dashboard

**Akcja**: Użytkownik nawiguje do `/` lub `/dashboard` po zalogowaniu

**Przebieg**:

1. AuthGuard weryfikuje czy użytkownik jest zalogowany
2. Jeśli nie - przekierowanie do `/login`
3. Jeśli tak - DashboardComponent się ładuje
4. Wyświetlenie loading spinnera
5. Wywołanie `getCurrentUserProfile()`
6. Supabase zwraca ProfileDTO
7. Aktualizacja signals: `profile`, `stampProgress`, `shortId`
8. Ukrycie loading spinnera, wyświetlenie danych
9. Ustawienie Realtime subscription

**Wynik**: Użytkownik widzi swój short_id, kod QR, postęp pieczątek i kartę kuponów

### 8.2. Kliknięcie na kartę kuponów

**Akcja**: Użytkownik klika na `CouponNavigationCardComponent`

**Przebieg**:

1. Event handler `onClick()` w komponencie
2. Wywołanie `this.router.navigate(['/coupons'])`
3. Angular Router przechodzi do widoku Coupons

**Wynik**: Użytkownik jest przekierowany do strony z kuponami

### 8.3. Kopiowanie short_id do schowka (opcjonalnie)

**Akcja**: Użytkownik klika przycisk "Kopiuj" w `UserIdDisplayComponent`

**Przebieg**:

1. Event handler `onCopyToClipboard()`
2. Użycie `navigator.clipboard.writeText(this.shortId)`
3. Wyświetlenie toast notification "Skopiowano ID do schowka"

**Wynik**: Short_id jest w schowku, użytkownik może go wkleić gdzie potrzebuje

### 8.4. Realtime update pieczątek

**Akcja**: Sprzedawca dodaje pieczątkę w panelu administracyjnym

**Przebieg**:

1. Sprzedawca dodaje pieczątkę w `/admin`
2. Supabase aktualizuje rekord w tabeli `profiles` (stamp_count++)
3. Realtime event jest wysyłany do klienta
4. Callback w subscription aktualizuje `profile` signal
5. `stampProgress` computed signal automatycznie przelicza wartości
6. StampProgressComponent reaktywnie się aktualizuje
7. Opcjonalnie: Wyświetlenie toast "Otrzymałeś pieczątkę!"

**Wynik**: Użytkownik widzi zaktualizowany postęp bez konieczności odświeżania strony

### 8.5. Retry po błędzie

**Akcja**: Użytkownik klika "Spróbuj ponownie" po błędzie ładowania

**Przebieg**:

1. Event handler `onRetry()` w DashboardComponent
2. Ponowne wywołanie `loadProfile()`
3. Wyświetlenie loading spinnera
4. Próba pobrania danych

**Wynik**:

- Sukces: Dane są wyświetlone
- Błąd: Ponowne wyświetlenie komunikatu o błędzie

### 8.6. Pull-to-refresh (opcjonalnie)

**Akcja**: Użytkownik wykonuje gest pull-to-refresh (przeciągnięcie w dół)

**Przebieg**:

1. Detekcja gestu (np. za pomocą biblioteki lub touch events)
2. Ustawienie `refreshing` signal na true
3. Wywołanie `loadProfile()`
4. Po zakończeniu: `refreshing.set(false)`

**Wynik**: Dane są odświeżone, użytkownik widzi animację pull-to-refresh

## 9. Warunki i walidacja

### 9.1. Warunki na poziomie routingu

**Komponent**: `AuthGuard`

**Warunek**: Użytkownik musi być zalogowany (`isAuthenticated === true`)

**Weryfikacja**:

```typescript
canActivate(): boolean {
  const isAuth = this.supabase.isAuthenticated();
  if (!isAuth) {
    this.router.navigate(['/login']);
    return false;
  }
  return true;
}
```

**Wpływ na UI**: Jeśli warunek nie jest spełniony, użytkownik jest przekierowywany do `/login` i nie widzi Dashboard

### 9.2. Warunki na poziomie DashboardComponent

**Warunek 1**: Profil użytkownika musi istnieć

**Weryfikacja**: Sprawdzenie czy `getCurrentUserProfile()` zwraca dane

**Wpływ na UI**:

- Jeśli profil istnieje: Normalne wyświetlenie widoku
- Jeśli profil nie istnieje: Wyświetlenie error message "Profil nie został znaleziony"

**Warunek 2**: `short_id` nie może być null/undefined

**Weryfikacja**:

```typescript
const shortId = this.shortId();
if (!shortId) {
  // Wyświetl placeholder lub error
}
```

**Wpływ na UI**:

- Jeśli `short_id` jest dostępny: Wyświetlenie w UserIdDisplayComponent
- Jeśli nie: Placeholder "Ładowanie..." lub error message

**Warunek 3**: `stamp_count` musi być w zakresie 0-10

**Weryfikacja**:

```typescript
const stampCount = this.profile()?.stamp_count ?? 0;
if (stampCount < 0 || stampCount > 10) {
  console.error('Invalid stamp_count:', stampCount);
  // Fallback do 0 lub 10
}
```

**Wpływ na UI**:

- Prawidłowy `stamp_count`: Normalne wyświetlenie postępu
- Nieprawidłowy: Obcięcie wartości do 0 lub 10, logowanie błędu

### 9.3. Warunki na poziomie UserIdDisplayComponent

**Warunek**: `shortId` prop nie może być pusty

**Weryfikacja**:

```typescript
@Input() shortId!: string;

ngOnInit() {
  if (!this.shortId || this.shortId.trim() === '') {
    console.error('UserIdDisplayComponent: shortId is required');
  }
}
```

**Wpływ na UI**:

- Prawidłowy `shortId`: Wyświetlenie ID i QR kodu
- Nieprawidłowy: Placeholder "---" lub error state

### 9.4. Warunki na poziomie StampProgressComponent

**Warunek 1**: `stampCount` >= 0

**Weryfikacja**:

```typescript
@Input() stampCount!: number;

get normalizedStampCount(): number {
  return Math.max(0, Math.min(this.stampCount, this.maxStamps));
}
```

**Wpływ na UI**: Automatyczne obcięcie wartości do zakresu 0-maxStamps

**Warunek 2**: Jeśli `stampCount === 10`, wyświetl specjalny komunikat

**Weryfikacja**:

```typescript
get isComplete(): boolean {
  return this.stampCount >= this.maxStamps;
}
```

**Wpływ na UI**:

- Jeśli complete: Komunikat "Masz komplet! Wykorzystaj kupon na darmową gałkę."
- Jeśli nie: Standardowy komunikat "Brakuje ci X pieczątek"

## 10. Obsługa błędów

### 10.1. Błąd pobierania profilu (Network error)

**Scenariusz**: Brak połączenia z internetem lub Supabase jest niedostępny

**Komunikat**: "Nie udało się pobrać danych. Sprawdź połączenie internetowe."

**UI**:

```html
<div class="error-container">
  <mat-icon>error_outline</mat-icon>
  <p class="error-message">{{ error() }}</p>
  <button mat-raised-button color="primary" (click)="onRetry()">Spróbuj ponownie</button>
</div>
```

**Akcje użytkownika**: Kliknięcie "Spróbuj ponownie" → `onRetry()` → ponowne wywołanie `loadProfile()`

### 10.2. Profil nie istnieje (teoretycznie niemożliwe)

**Scenariusz**: Użytkownik jest zalogowany, ale nie ma profilu w bazie

**Komunikat**: "Nie znaleziono profilu użytkownika. Spróbuj wylogować się i zalogować ponownie."

**UI**: Error message + przycisk "Wyloguj"

**Akcje użytkownika**: Kliknięcie "Wyloguj" → `signOut()` → przekierowanie do `/login`

**Zapobieganie**: `ensureProfileExists()` w Supabase service powinno tworzyć profil przy logowaniu

### 10.3. Nieprawidłowy short_id

**Scenariusz**: `short_id` jest null, undefined lub pusty string

**Komunikat**: Brak (silent error)

**UI**: Placeholder "---" lub "Ładowanie..." w UserIdDisplayComponent

**Logowanie**: `console.error('Invalid short_id:', shortId)`

### 10.4. Błąd generowania QR kodu

**Scenariusz**: Biblioteka QR nie działa lub `short_id` jest nieprawidłowy

**Komunikat**: Brak (QR jest opcjonalny)

**UI**: Wyświetlenie tylko `short_id` bez QR kodu

**Fallback**: Jeśli generowanie QR się nie powiedzie, użytkownik dalej może pokazać `short_id` tekstowo

### 10.5. Realtime connection failure

**Scenariusz**: Supabase Realtime nie jest włączony lub połączenie się nie udało

**Komunikat**: Brak (silent fallback)

**UI**: Brak zmian w UI, aplikacja działa normalnie bez realtime

**Fallback**: Użytkownik może ręcznie odświeżyć stronę lub użyć pull-to-refresh

**Logowanie**: `console.warn('Realtime subscription failed, falling back to manual refresh')`

### 10.6. Nieprawidłowy stamp_count

**Scenariusz**: `stamp_count` < 0 lub > 10 (błąd danych)

**Komunikat**: Brak dla użytkownika

**UI**: Automatyczne obcięcie wartości do 0 lub 10

**Logowanie**: `console.error('Invalid stamp_count value:', stampCount)`

## 11. Kroki implementacji

### Krok 1: Stworzenie AuthGuard

**Plik**: `src/app/guards/auth.guard.ts`

**Zadania**:

- Stworzenie functional guard za pomocą `canActivateFn`
- Sprawdzenie `isAuthenticated` signal z Supabase service
- Jeśli nie zalogowany: przekierowanie do `/login`
- Jeśli zalogowany: return true

**Zależności**: `Supabase` service, `Router`

---

### Krok 2: Aktualizacja routingu

**Plik**: `src/app/app.routes.ts`

**Zadania**:

- Dodanie route dla Dashboard (`''` lub `'dashboard'`)
- Dodanie `canActivate: [authGuard]`
- Konfiguracja lazy loading

**Przykład**:

```typescript
{
  path: '',
  loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [authGuard]
}
```

---

### Krok 3: Stworzenie typów ViewModel

**Plik**: `src/app/types/view-models.ts` (nowy plik)

**Zadania**:

- Zdefiniowanie `DashboardViewModel`
- Zdefiniowanie `StampProgressViewModel`
- Zdefiniowanie props interfaces dla komponentów dzieci
- Export wszystkich typów

---

### Krok 4: Stworzenie UserIdDisplayComponent

**Plik**: `src/app/components/dashboard/user-id-display.component.ts`

**Zadania**:

- Komponent standalone z inline template
- Input prop: `shortId`
- Input prop: `showQRCode` (default: true)
- Instalacja biblioteki QR: `npm install qrcode @types/qrcode`
- Generowanie QR kodu w `ngOnInit` lub `ngOnChanges`
- Wyświetlenie short_id w dużej, czytelnej czcionce (font-mono, letter-spacing)
- Wyświetlenie QR kodu jako image (data URL)
- Opcjonalnie: Przycisk "Kopiuj" z użyciem Clipboard API
- Stylowanie zgodne z Material Design 3
- Obsługa błędów generowania QR (graceful fallback)

**Zależności**: `qrcode` library

---

### Krok 5: Stworzenie StampProgressComponent

**Plik**: `src/app/components/dashboard/stamp-progress.component.ts`

**Zadania**:

- Komponent standalone z inline template
- Input prop: `stampCount`
- Input prop: `maxStamps` (default: 10)
- Computed gettery: `percentage`, `stampsToReward`, `isComplete`
- Wyświetlenie tekstowej reprezentacji: "X / 10 pieczątek"
- Wizualizacja postępu (wybór jednej opcji):
  - Opcja A: Angular Material `<mat-progress-bar [value]="percentage">`
  - Opcja B: Grid 10 ikon lodów (używając `*ngFor` i conditional styling)
  - Opcja C: Custom SVG circles
- Komunikat: "Brakuje ci X pieczątek do darmowej gałki!" lub "Masz komplet!"
- Stylowanie zgodne z Material Design 3
- Animacja przy zmianie liczby pieczątek (opcjonalnie)

**Zależności**: Angular Material (jeśli używamy `mat-progress-bar`)

---

### Krok 6: Stworzenie CouponNavigationCardComponent

**Plik**: `src/app/components/dashboard/coupon-navigation-card.component.ts`

**Zadania**:

- Komponent standalone z inline template
- Input prop: `activeCouponsCount` (opcjonalny)
- Material Card lub custom card (zgodny z MD3)
- Ikona kuponów (Material Icon)
- Tytuł: "Moje kupony"
- Subtitle: "Zobacz dostępne rabaty"
- Badge z licznikiem (jeśli `activeCouponsCount` > 0)
- Click handler: `onClick()` → `router.navigate(['/coupons'])`
- Ripple effect (Material ripple directive)
- Stylowanie zgodne z Material Design 3
- Hover effects

**Zależności**: `Router`, Angular Material (opcjonalnie)

---

### Krok 7: Stworzenie DashboardComponent (container)

**Plik**: `src/app/pages/dashboard/dashboard.component.ts`

**Zadania**:

- Komponent standalone page-level
- Importy: `UserIdDisplayComponent`, `StampProgressComponent`, `CouponNavigationCardComponent`
- Dependency Injection: `Supabase` service, `Router`
- Signals:
  - `isLoading = signal<boolean>(true)`
  - `error = signal<Error | null>(null)`
  - `profile = signal<ProfileDTO | null>(null)`
- Computed signals:
  - `stampProgress = computed(() => { ... })`
  - `shortId = computed(() => { ... })`
- Lifecycle hooks:
  - `ngOnInit()`: Wywołanie `loadProfile()` i `setupRealtimeSubscription()`
  - `ngOnDestroy()`: Cleanup subskrypcji
- Metody:
  - `loadProfile()`: Wywołanie `supabase.getCurrentUserProfile()`, aktualizacja signals
  - `setupRealtimeSubscription()`: Subskrypcja Realtime na tabele `profiles`
  - `onRetry()`: Ponowne wywołanie `loadProfile()`
- Template:
  - Loading spinner (gdy `isLoading()`)
  - Error message + retry button (gdy `error()`)
  - Layout z componentami dzieci (gdy dane dostępne)
- Stylowanie: Mobile-first grid/flexbox layout, Tailwind utilities

**Zależności**: `Supabase` service, komponenty dzieci

---

### Krok 8: Implementacja Realtime subscription

**Zadania** (w DashboardComponent):

- Stworzenie prywatnej zmiennej: `realtimeSubscription: RealtimeChannel | null`
- Metoda `setupRealtimeSubscription()`:
  - Pobranie `userId` z `supabase.user()`
  - Wywołanie `supabase.client.channel().on().subscribe()`
  - Filter: `id=eq.{userId}`
  - Event handler: Aktualizacja `profile` signal nowym payload
- Cleanup w `ngOnDestroy()`: `this.realtimeSubscription?.unsubscribe()`
- Graceful error handling: Jeśli subscription fail, log warning

**Testowanie**:

- Otworzyć Dashboard w przeglądarce
- W innej zakładce/oknie otworzyć panel admin (lub Supabase Dashboard)
- Zaktualizować `stamp_count` w bazie
- Sprawdzić czy Dashboard automatycznie się aktualizuje

---

### Krok 9: Stylowanie i responsive design

**Zadania**:

- Dashboard layout:
  - Mobile: Vertical stack (flex-col)
  - Desktop: Możliwy grid 2-kolumnowy dla większych ekranów
- Użycie Tailwind utilities: `flex`, `gap`, `p-4`, `rounded-lg`, etc.
- Użycie CSS variables z Material theme: `--md-sys-color-primary`, `--md-sys-color-surface`, etc.
- Elevation/shadows zgodne z MD3
- Spacing system zgodny z MD3 (4px base unit)
- Testowanie na różnych rozdzielczościach (mobile, tablet, desktop)

---

### Krok 10: Dodanie opcjonalnych features

**Pull-to-refresh** (opcjonalnie):

- Instalacja biblioteki: `npm install @angular/cdk` (jeśli nie ma)
- Użycie touch events lub biblioteki jak `ionic` refresh component
- Event handler: `onPullRefresh()` → `loadProfile()`

**Toast notifications** (opcjonalnie):

- Instalacja Angular Material Snackbar: już dostępne w Material
- Wyświetlenie toast po realtime update: "Otrzymałeś pieczątkę!"
- Service: `MatSnackBar.open()`

**Copy to clipboard** (opcjonalnie):

- W UserIdDisplayComponent: Przycisk "Kopiuj"
- Użycie `navigator.clipboard.writeText()`
- Toast po skopiowaniu: "Skopiowano ID do schowka"

---

### Krok 11: Testowanie i walidacja

**Unit testy**:

- DashboardComponent: Testowanie `loadProfile()`, computed signals
- UserIdDisplayComponent: Testowanie generowania QR
- StampProgressComponent: Testowanie obliczeń procentowych
- CouponNavigationCardComponent: Testowanie nawigacji

**Integration testy**:

- Testowanie AuthGuard: Czy przekierowuje niezalogowanych
- Testowanie Realtime: Czy aktualizuje dane po zmianie w bazie

**Manual testing**:

- Scenariusz 1: Zalogowanie i wejście na Dashboard
- Scenariusz 2: Wyświetlenie short_id i QR kodu
- Scenariusz 3: Realtime update pieczątek
- Scenariusz 4: Kliknięcie w kartę kuponów
- Scenariusz 5: Obsługa błędów (offline, brak profilu)
- Scenariusz 6: Responsive design (mobile, desktop)

**Accessibility testing**:

- Sprawdzenie czy wszystkie interaktywne elementy mają proper ARIA labels
- Keyboard navigation
- Screen reader compatibility

---

### Krok 12: Optymalizacja i finalizacja

**Performance**:

- Sprawdzenie czy nie ma memory leaks (cleanup subscriptions)
- Lazy loading komponentów
- OnPush change detection strategy (jeśli możliwe)

**Code quality**:

- Linting: `ng lint`
- Formatting: Prettier
- Code review

**Dokumentacja**:

- Dodanie JSDoc comments do komponentów i metod
- README update (jeśli potrzebne)

**Deployment**:

- Build: `ng build`
- Testowanie production build
- Deploy do DigitalOcean

---

## Podsumowanie

Plan implementacji widoku Dashboard obejmuje 12 kroków od stworzenia AuthGuard po finalne testowanie i deployment. Kluczowe elementy to:

1. **Bezpieczeństwo**: AuthGuard chroniący route
2. **Komponenty**: Modularne, reużywalne komponenty (UserIdDisplay, StampProgress, CouponNavigationCard)
3. **State management**: Angular Signals dla reaktywnego stanu
4. **Realtime**: Supabase Realtime subscription dla live updates
5. **UX**: Mobile-first design zgodny z Material Design 3
6. **Error handling**: Graceful degradation i retry mechanisms

Implementacja powinna zająć około 2-3 dni roboczych dla doświadczonego programisty Angular.
