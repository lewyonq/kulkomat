# Plan implementacji widoku Coupons

## 1. Przegląd

Widok Coupons to chroniony widok aplikacji, który umożliwia zalogowanym użytkownikom przeglądanie wszystkich dostępnych kuponów rabatowych. Widok wyświetla listę aktywnych i nieaktywnych kuponów, posortowaną od najnowszych. Kupony są wyraźnie rozróżnione wizualnie (kolor, ikona, wyszarzenie dla nieaktywnych), aby ułatwić ich identyfikację. Widok wspiera trzy typy kuponów: darmowa gałka, procentowe i kwotowe rabaty.

## 2. Routing widoku

- **Ścieżka**: `/coupons`
- **Ochrona**: Widok chroniony przez `authGuard`
- **Lazy loading**: Komponent ładowany asynchronicznie
- **Konfiguracja w `app.routes.ts`**:

```typescript
{
  path: 'coupons',
  loadComponent: () => import('./pages/coupons/coupons.component').then(m => m.CouponsComponent),
  canActivate: [authGuard]
}
```

## 3. Struktura komponentów

```
CouponsComponent (Page Container)
├── CouponCardComponent (Lista kuponów)
│   ├── Ikona kuponu (zależna od typu)
│   ├── Tytuł i opis kuponu
│   ├── Wartość rabatu
│   ├── Data wygaśnięcia
│   └── Status (aktywny/wykorzystany/wygasły)
└── EmptyStateComponent (Opcjonalnie - gdy brak kuponów)
```

## 4. Szczegóły komponentów

### CouponsComponent (Page Container)

**Opis komponentu**: Główny kontener strony kuponów. Zarządza stanem ładowania, pobieraniem danych z API, obsługą błędów i wyświetlaniem listy kuponów. Odpowiada za sortowanie kuponów (aktywne na górze, posortowane od najnowszych).

**Główne elementy HTML**:

- Kontener główny z gradientowym tłem
- Nagłówek strony z tytułem "Moje kupony"
- Stan ładowania (spinner + tekst)
- Stan błędu (ikona + komunikat + przycisk retry)
- Stan pusty (gdy brak kuponów)
- Lista kuponów (grid/flex layout)
- Przycisk odświeżania (opcjonalnie)

**Komponenty dzieci**:

- `CouponCardComponent` - wyświetlany dla każdego kuponu w pętli
- Opcjonalnie: `EmptyStateComponent` - gdy lista kuponów jest pusta

**Obsługiwane zdarzenia**:

- `ngOnInit()` - inicjalizacja, pobieranie kuponów
- `ngOnDestroy()` - cleanup subskrypcji
- `onRetry()` - ponowne pobieranie danych po błędzie
- `onRefresh()` - manualne odświeżenie listy kuponów

**Warunki walidacji**:

- Użytkownik musi być zalogowany (weryfikowane przez `authGuard`)
- Kupony sortowane według statusu (aktywne > nieaktywne) i daty utworzenia (najnowsze pierwsze)
- Kupony wygasłe (`expires_at < now()`) traktowane jako nieaktywne
- Kupony wykorzystane (`status === 'used'`) traktowane jako nieaktywne

**Typy**:

- `CouponDTO` - dane kuponu z API
- `CouponsListDTO` - lista kuponów z paginacją
- `CouponQueryParams` - parametry zapytania
- `CouponCardViewModel` - model widoku dla pojedynczego kuponu

**Propsy**: Brak (komponent strony)

### CouponCardComponent

**Opis komponentu**: Komponent prezentacyjny wyświetlający pojedynczy kupon. Wizualnie rozróżnia typy kuponów (ikona, kolor) oraz statusy (aktywny, wykorzystany, wygasły). Wyświetla kluczowe informacje: typ, wartość, datę wygaśnięcia i status.

**Główne elementy HTML**:

- Kontener karty z warunkowym stylowaniem (aktywny/nieaktywny)
- Sekcja ikony z gradientem (zależnym od typu kuponu)
- Ikona SVG (ticket dla free_scoop, percent dla percentage, coins dla amount)
- Sekcja treści:
  - Tytuł kuponu (np. "Darmowa gałka", "Rabat 15%", "Rabat 5 zł")
  - Opis kuponu
  - Data wygaśnięcia (formatowana)
- Badge statusu (aktywny/wykorzystany/wygasły)

**Komponenty dzieci**: Brak (komponent prezentacyjny)

**Obsługiwane zdarzenia**: Brak (komponent tylko do odczytu)

**Warunki walidacji**:

- Kupon aktywny: `status === 'active'` AND `expires_at > now()`
- Kupon wykorzystany: `status === 'used'`
- Kupon wygasły: `status === 'active'` AND `expires_at <= now()`
- Dla typu `free_scoop`: `value` jest `null`
- Dla typu `percentage`: `value` w zakresie 1-100
- Dla typu `amount`: `value > 0`

**Typy**:

- `CouponCardViewModel` - model widoku kuponu
- `CouponType` - enum typu kuponu
- `CouponStatus` - enum statusu kuponu

**Propsy**:

```typescript
@Input() coupon!: CouponCardViewModel;
```

## 5. Typy

### Istniejące typy (z `src/app/types/index.ts`)

```typescript
// Enums
export type CouponStatus = 'active' | 'used';
export type CouponType = 'free_scoop' | 'percentage' | 'amount';

// DTO
export type CouponDTO = {
  id: number;
  user_id: string;
  type: CouponType;
  value: number | null;
  status: CouponStatus;
  created_at: string;
  expires_at: string;
};

// Lista kuponów
export interface CouponsListDTO {
  coupons: CouponDTO[];
  total: number;
  limit: number;
  offset: number;
}

// Parametry zapytania
export interface CouponQueryParams extends PaginationParams {
  status?: CouponStatus;
  type?: CouponType;
  user_id?: string;
}
```

### Nowe typy (do dodania w `src/app/types/view-models.ts`)

```typescript
/**
 * Coupon Card View Model - Model widoku dla pojedynczego kuponu
 * Rozszerza CouponDTO o computed properties dla UI
 */
export interface CouponCardViewModel {
  /** ID kuponu */
  id: number;
  /** Typ kuponu */
  type: CouponType;
  /** Wartość rabatu (null dla free_scoop) */
  value: number | null;
  /** Status kuponu */
  status: CouponStatus;
  /** Data utworzenia (ISO string) */
  createdAt: string;
  /** Data wygaśnięcia (ISO string) */
  expiresAt: string;
  /** Czy kupon jest aktywny (computed) */
  isActive: boolean;
  /** Czy kupon wygasł (computed) */
  isExpired: boolean;
  /** Czy kupon został wykorzystany (computed) */
  isUsed: boolean;
  /** Sformatowany tytuł kuponu (np. "Darmowa gałka", "Rabat 15%") */
  title: string;
  /** Opis kuponu */
  description: string;
  /** Sformatowana data wygaśnięcia (np. "Ważny do 31.12.2024") */
  formattedExpiryDate: string;
  /** Kolor gradientu dla ikony (zależny od typu) */
  iconGradient: string;
  /** Nazwa ikony SVG (zależna od typu) */
  iconName: 'ticket' | 'percent' | 'coins';
}

/**
 * Coupons View Model - Model widoku dla strony kuponów
 */
export interface CouponsViewModel {
  /** Lista kuponów (posortowana) */
  coupons: CouponCardViewModel[];
  /** Liczba aktywnych kuponów */
  activeCouponsCount: number;
  /** Liczba wykorzystanych kuponów */
  usedCouponsCount: number;
  /** Czy lista jest pusta */
  isEmpty: boolean;
}
```

## 6. Zarządzanie stanem

### Stan komponentu CouponsComponent

Zarządzanie stanem odbywa się za pomocą Angular signals:

```typescript
// Stany ładowania i błędów
protected isLoading = signal<boolean>(true);
protected error = signal<Error | null>(null);
protected refreshing = signal<boolean>(false);

// Stan danych
protected coupons = signal<CouponCardViewModel[]>([]);

// Computed states
protected activeCoupons = computed(() =>
  this.coupons().filter(c => c.isActive)
);

protected inactiveCoupons = computed(() =>
  this.coupons().filter(c => !c.isActive)
);

protected isEmpty = computed(() =>
  this.coupons().length === 0
);

protected activeCouponsCount = computed(() =>
  this.activeCoupons().length
);
```

### Transformacja danych

Funkcja pomocnicza do transformacji `CouponDTO` na `CouponCardViewModel`:

```typescript
private transformCouponToViewModel(dto: CouponDTO): CouponCardViewModel {
  const now = new Date();
  const expiresAt = new Date(dto.expires_at);

  const isExpired = expiresAt <= now;
  const isUsed = dto.status === 'used';
  const isActive = !isExpired && !isUsed;

  return {
    id: dto.id,
    type: dto.type,
    value: dto.value,
    status: dto.status,
    createdAt: dto.created_at,
    expiresAt: dto.expires_at,
    isActive,
    isExpired,
    isUsed,
    title: this.getCouponTitle(dto.type, dto.value),
    description: this.getCouponDescription(dto.type, dto.value),
    formattedExpiryDate: this.formatExpiryDate(dto.expires_at),
    iconGradient: this.getIconGradient(dto.type),
    iconName: this.getIconName(dto.type)
  };
}
```

### Custom hook

Nie jest wymagany custom hook. Zarządzanie stanem odbywa się bezpośrednio w komponencie za pomocą signals i serwisu `CouponService`.

## 7. Integracja API

### Serwis CouponService

Należy stworzyć nowy serwis `src/app/services/coupon.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class CouponService {
  private supabase = inject(Supabase);

  /**
   * Pobiera kupony zalogowanego użytkownika
   * Endpoint: GET /api/profiles/me/coupons (Supabase RPC lub query)
   */
  getUserCoupons(params?: CouponQueryParams): Observable<CouponsListDTO> {
    // Implementacja z użyciem Supabase client
  }
}
```

### Typy żądania i odpowiedzi

**Żądanie**:

- Metoda: `GET`
- Endpoint: Supabase query na tabeli `coupons`
- Parametry: `CouponQueryParams` (opcjonalne filtry)
- Headers: Authorization (automatycznie przez Supabase client)

**Odpowiedź**:

- Typ: `CouponsListDTO`
- Struktura:

```typescript
{
  coupons: CouponDTO[],
  total: number,
  limit: number,
  offset: number
}
```

### Wywołanie w komponencie

```typescript
ngOnInit(): void {
  this.loadCoupons();
}

private loadCoupons(): void {
  this.isLoading.set(true);
  this.error.set(null);

  this.couponService.getUserCoupons().subscribe({
    next: (response) => {
      const viewModels = response.coupons
        .map(dto => this.transformCouponToViewModel(dto))
        .sort(this.sortCoupons);

      this.coupons.set(viewModels);
      this.isLoading.set(false);
    },
    error: (err) => {
      this.error.set(err);
      this.isLoading.set(false);
    }
  });
}
```

## 8. Interakcje użytkownika

### Przeglądanie kuponów

**Akcja**: Użytkownik wchodzi na stronę `/coupons`

**Przepływ**:

1. Guard `authGuard` weryfikuje autentykację
2. Komponent ładuje się i wyświetla stan ładowania
3. Wywołanie API do pobrania kuponów
4. Transformacja danych do view models
5. Sortowanie kuponów (aktywne > nieaktywne, najnowsze > starsze)
6. Wyświetlenie listy kuponów

**Wynik**: Lista kuponów wyświetlona w formie kart

### Odświeżanie listy

**Akcja**: Użytkownik klika przycisk "Odśwież"

**Przepływ**:

1. Ustawienie flagi `refreshing = true`
2. Wywołanie API
3. Aktualizacja stanu `coupons`
4. Ustawienie flagi `refreshing = false`

**Wynik**: Zaktualizowana lista kuponów

### Obsługa błędu

**Akcja**: Użytkownik klika "Spróbuj ponownie" po błędzie

**Przepływ**:

1. Wywołanie `onRetry()`
2. Ponowne wywołanie `loadCoupons()`
3. Wyświetlenie stanu ładowania
4. Próba ponownego pobrania danych

**Wynik**: Dane załadowane lub ponowny błąd

### Informowanie sprzedawcy o kuponie

**Akcja**: Użytkownik informuje sprzedawcę o chęci wykorzystania kuponu

**Przepływ** (poza aplikacją klienta):

1. Klient pokazuje kupon sprzedawcy
2. Sprzedawca weryfikuje kupon w panelu administracyjnym po `user_id`
3. Sprzedawca ręcznie nalicza rabat
4. Sprzedawca oznacza kupon jako wykorzystany
5. Status kuponu aktualizuje się w aplikacji klienta (realtime lub po odświeżeniu)

**Wynik**: Kupon oznaczony jako wykorzystany

## 9. Warunki i walidacja

### Warunki dostępu do widoku

- **Komponent**: `CouponsComponent`
- **Warunek**: Użytkownik musi być zalogowany
- **Weryfikacja**: `authGuard` w routingu
- **Wpływ na UI**: Przekierowanie do `/login` jeśli niezalogowany

### Warunki statusu kuponu

- **Komponent**: `CouponCardComponent`
- **Warunki**:
  - Aktywny: `status === 'active'` AND `expires_at > now()`
  - Wykorzystany: `status === 'used'`
  - Wygasły: `status === 'active'` AND `expires_at <= now()`
- **Wpływ na UI**:
  - Aktywny: pełne kolory, brak wyszarzenia, badge "Aktywny"
  - Wykorzystany: wyszarzenie, badge "Wykorzystany"
  - Wygasły: wyszarzenie, badge "Wygasły"

### Warunki typu kuponu

- **Komponent**: `CouponCardComponent`
- **Warunki**:
  - `free_scoop`: `value === null`, ikona ticket, gradient fioletowy
  - `percentage`: `value` w zakresie 1-100, ikona percent, gradient niebieski
  - `amount`: `value > 0`, ikona coins, gradient zielony
- **Wpływ na UI**: Różne ikony, kolory gradientów, formatowanie tytułu

### Warunki sortowania

- **Komponent**: `CouponsComponent`
- **Warunki**:
  1. Aktywne kupony przed nieaktywnymi
  2. W ramach grupy: sortowanie po `created_at` DESC (najnowsze pierwsze)
- **Wpływ na UI**: Kolejność wyświetlania kuponów na liście

### Warunki pustej listy

- **Komponent**: `CouponsComponent`
- **Warunek**: `coupons.length === 0`
- **Wpływ na UI**: Wyświetlenie stanu pustego z komunikatem "Nie masz jeszcze żadnych kuponów"

## 10. Obsługa błędów

### Błąd połączenia sieciowego

**Scenariusz**: Brak połączenia z internetem lub serwer niedostępny

**Obsługa**:

- Wyświetlenie stanu błędu z ikoną
- Komunikat: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
- Przycisk "Spróbuj ponownie"

**Kod**:

```typescript
if (message.includes('network') || message.includes('fetch')) {
  return 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.';
}
```

### Błąd autoryzacji

**Scenariusz**: Sesja użytkownika wygasła

**Obsługa**:

- Wyświetlenie komunikatu: "Sesja wygasła. Zaloguj się ponownie."
- Automatyczne przekierowanie do `/login` (przez guard)

**Kod**:

```typescript
if (message.includes('not authenticated') || message.includes('unauthorized')) {
  this.router.navigate(['/login']);
  return 'Sesja wygasła. Zaloguj się ponownie.';
}
```

### Błąd pobierania danych

**Scenariusz**: Błąd API podczas pobierania kuponów

**Obsługa**:

- Wyświetlenie stanu błędu
- Komunikat: "Wystąpił błąd podczas ładowania kuponów. Spróbuj ponownie później."
- Przycisk "Spróbuj ponownie"
- Logowanie błędu do konsoli

**Kod**:

```typescript
error: (err) => {
  this.error.set(err);
  this.isLoading.set(false);
  console.error('Failed to load coupons:', err);
};
```

### Pusta lista kuponów

**Scenariusz**: Użytkownik nie ma żadnych kuponów

**Obsługa**:

- Wyświetlenie przyjaznego stanu pustego
- Ikona kuponu
- Komunikat: "Nie masz jeszcze żadnych kuponów"
- Podpowiedź: "Zbieraj pieczątki, aby otrzymać darmową gałkę!"

**Kod**:

```typescript
@if (isEmpty()) {
  <div class="empty-state">
    <!-- Ikona i komunikat -->
  </div>
}
```

### Błąd formatowania daty

**Scenariusz**: Nieprawidłowy format daty w `expires_at`

**Obsługa**:

- Fallback do wyświetlenia surowej daty
- Logowanie ostrzeżenia do konsoli
- Nie blokowanie renderowania komponentu

**Kod**:

```typescript
private formatExpiryDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return `Ważny do ${date.toLocaleDateString('pl-PL')}`;
  } catch (err) {
    console.warn('Failed to format date:', dateString, err);
    return `Ważny do ${dateString}`;
  }
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów

1.1. Dodać nowe typy view models do `src/app/types/view-models.ts`:

- `CouponCardViewModel`
- `CouponsViewModel`

### Krok 2: Stworzenie serwisu CouponService

2.1. Utworzyć plik `src/app/services/coupon.service.ts`

2.2. Zaimplementować metodę `getUserCoupons()`:

- Użyć Supabase client do query tabeli `coupons`
- Filtrować po `user_id` zalogowanego użytkownika
- Zwrócić Observable z `CouponsListDTO`

  2.3. Dodać obsługę błędów i retry logic

  2.4. Napisać testy jednostkowe dla serwisu

### Krok 3: Implementacja CouponCardComponent

3.1. Utworzyć plik `src/app/components/coupons/coupon-card.component.ts`

3.2. Zdefiniować interfejs komponentu:

- Input: `coupon: CouponCardViewModel`
- Standalone component z CommonModule

  3.3. Zaimplementować template:

- Kontener karty z warunkowym stylowaniem
- Sekcja ikony z gradientem
- Ikony SVG dla każdego typu (ticket, percent, coins)
- Sekcja treści (tytuł, opis, data)
- Badge statusu

  3.4. Zaimplementować style:

- Responsywny design (mobile-first)
- Różne gradienty dla typów kuponów
- Wyszarzenie dla nieaktywnych kuponów
- Animacje hover (tylko dla aktywnych)

  3.5. Dodać accessibility:

- Odpowiednie aria-labels
- Semantyczny HTML
- Kontrast kolorów (WCAG AA)

### Krok 4: Implementacja CouponsComponent (Page)

4.1. Utworzyć plik `src/app/pages/coupons/coupons.component.ts`

4.2. Zdefiniować stan komponentu:

- Signals dla loading, error, coupons
- Computed signals dla aktywnych/nieaktywnych kuponów

  4.3. Zaimplementować lifecycle hooks:

- `ngOnInit()`: załadowanie kuponów
- `ngOnDestroy()`: cleanup subskrypcji

  4.4. Zaimplementować funkcje pomocnicze:

- `transformCouponToViewModel()`
- `sortCoupons()`
- `getCouponTitle()`
- `getCouponDescription()`
- `formatExpiryDate()`
- `getIconGradient()`
- `getIconName()`

  4.5. Zaimplementować template:

- Stan ładowania (spinner)
- Stan błędu (ikona + komunikat + retry)
- Stan pusty (gdy brak kuponów)
- Lista kuponów (grid layout)
- Przycisk odświeżania

  4.6. Zaimplementować style:

- Gradientowe tło
- Responsywny grid dla kart
- Style dla stanów (loading, error, empty)

### Krok 5: Konfiguracja routingu

5.1. Dodać route do `src/app/app.routes.ts`:

```typescript
{
  path: 'coupons',
  loadComponent: () => import('./pages/coupons/coupons.component').then(m => m.CouponsComponent),
  canActivate: [authGuard]
}
```

### Krok 6: Integracja z Dashboard

6.1. Zaktualizować `DashboardComponent`:

- Pobrać liczbę aktywnych kuponów z API
- Przekazać `activeCouponsCount` do `CouponNavigationCardComponent`

  6.2. Opcjonalnie: dodać realtime subscription dla kuponów

### Krok 7: Testowanie

7.1. Testy jednostkowe:

- `CouponService.spec.ts`
- `CouponCardComponent.spec.ts`
- `CouponsComponent.spec.ts`

  7.2. Testy integracyjne:

- Routing do `/coupons`
- Ochrona przez `authGuard`
- Ładowanie i wyświetlanie kuponów

  7.3. Testy manualne:

- Różne typy kuponów (free_scoop, percentage, amount)
- Różne statusy (active, used, expired)
- Pusta lista kuponów
- Błędy sieciowe
- Responsywność (mobile, tablet, desktop)
- Accessibility (screen reader, keyboard navigation)

### Krok 8: Optymalizacje

8.1. Dodać caching dla kuponów (opcjonalnie)

8.2. Dodać infinite scroll lub paginację (jeśli lista długa)

8.3. Dodać realtime updates dla statusu kuponów

8.4. Dodać animacje wejścia dla kart

### Krok 9: Dokumentacja

9.1. Dodać komentarze JSDoc do wszystkich publicznych metod

9.2. Zaktualizować README z informacjami o nowym widoku

9.3. Dodać przykłady użycia w dokumentacji

### Krok 10: Code review i deployment

10.1. Code review przez zespół

10.2. Poprawki po review

10.3. Merge do głównej gałęzi

10.4. Deployment na środowisko produkcyjne
