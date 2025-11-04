# Plan implementacji widoku Admin Dashboard

## 1. Przegląd

Widok `Admin Dashboard` to panel administracyjny przeznaczony dla sprzedawców, umożliwiający zarządzanie kontami klientów w programie lojalnościowym. Głównym celem jest zapewnienie szybkiego dostępu do danych klienta po jego `short_id` oraz umożliwienie wykonywania kluczowych akcji, takich jak dodawanie pieczątek, przyznawanie kuponów i oznaczanie ich jako wykorzystane. Widok jest kluczowym narzędziem do obsługi klienta w punkcie sprzedaży.

## 2. Routing widoku

- **Ścieżka**: `/admin`
- **Ochrona**: Widok powinien być chroniony przez `AdminGuard`, który zapewni, że dostęp do niego mają tylko zalogowani użytkownicy z rolą administratora (rekord zawarty w tabeli sellers w bazie danych).

## 3. Struktura komponentów

Hierarchia komponentów dla widoku `Admin Dashboard` będzie następująca:

```
AdminDashboardPage (komponent-strona, smart)
├── CustomerSearchComponent (komponent wyszukiwania, dumb)
└── CustomerDetailsComponent (komponent szczegółów klienta, dumb)
    ├── AddStampsFormComponent (formularz dodawania pieczątek, dumb)
    ├── AddCouponFormComponent (formularz dodawania kuponu, dumb)
    └── CouponsListComponent (lista kuponów klienta, dumb)
```

## 4. Szczegóły komponentów

### AdminDashboardPage

- **Opis**: Główny, inteligentny komponent strony, który zarządza stanem całego widoku. Odpowiada za wyszukiwanie klienta, obsługę wywołań API i przekazywanie danych do komponentów podrzędnych.
- **Główne elementy**: Zawiera `CustomerSearchComponent` oraz warunkowo renderuje `CustomerDetailsComponent` na podstawie wyników wyszukiwania.
- **Obsługiwane interakcje**: Obsługuje zdarzenie `search` z `CustomerSearchComponent`.
- **Typy**: `CustomerDetailsViewModel`, `ApiErrorResponse`.

### CustomerSearchComponent

- **Opis**: Prosty komponent formularza z jednym polem do wprowadzenia `short_id` klienta i przyciskiem wyszukiwania.
- **Główne elementy**: `<input>` tekstowy, `<button>`.
- **Obsługiwane interakcje**: Emituje zdarzenie `search` z `short_id` jako wartością.
- **Warunki walidacji**: Pole `short_id` jest wymagane i powinno mieć określoną długość (np. 6 znaków).
- **Propsy**:
  - `isSearching: boolean` - informuje, czy trwa proces wyszukiwania (do blokowania formularza).

### CustomerDetailsComponent

- **Opis**: Wyświetla szczegółowe informacje o znalezionym kliencie, w tym jego dane, liczbę pieczątek i listę kuponów. Zawiera również formularze do wykonywania akcji.
- **Główne elementy**: Wyświetla dane klienta, zawiera `AddStampsFormComponent`, `AddCouponFormComponent` i `CouponsListComponent`.
- **Obsługiwane interakcje**: Przekazuje zdarzenia `addStamps`, `addCoupon`, `useCoupon` do komponentu nadrzędnego.
- **Typy**: `CustomerDetailsViewModel`.
- **Propsy**:
  - `customer: CustomerDetailsViewModel` - obiekt z danymi klienta do wyświetlenia.

### AddStampsFormComponent

- **Opis**: Formularz umożliwiający dodanie określonej liczby pieczątek do konta klienta.
- **Główne elementy**: `<select>` (dropdown) z liczbą pieczątek (1-10), `<button>` do zatwierdzenia.
- **Obsługiwane interakcje**: Emituje zdarzenie `addStamps` z wybraną liczbą pieczątek.
- **Propsy**:
  - `isProcessing: boolean` - informuje o trwaniu operacji dodawania pieczątek.

### AddCouponFormComponent

- **Opis**: Formularz do ręcznego dodawania kuponów rabatowych (procentowych lub kwotowych).
- **Główne elementy**: `<select>` dla typu kuponu, `<input type="number">` dla wartości, `<input type="date">` dla daty ważności, `<button>`.
- **Obsługiwane interakcje**: Emituje zdarzenie `addCoupon` z danymi nowego kuponu.
- **Warunki walidacji**: Typ kuponu i data ważności są wymagane. Wartość jest wymagana dla kuponów procentowych i kwotowych.
- **Propsy**:
  - `isProcessing: boolean` - informuje o trwaniu operacji dodawania kuponu.

### CouponsListComponent

- **Opis**: Wyświetla listę aktywnych kuponów klienta z opcją oznaczenia ich jako wykorzystane.
- **Główne elementy**: Lista (`<ul>`/`<li>`) kuponów, przycisk "Wykorzystaj" przy każdym kuponie.
- **Obsługiwane interakcje**: Emituje zdarzenie `useCoupon` z `coupon_id` kuponu, który ma być wykorzystany.
- **Typy**: `CouponDTO`.
- **Propsy**:
  - `coupons: CouponDTO[]` - lista kuponów do wyświetlenia.
  - `processingCouponId: number | null` - ID kuponu, który jest aktualnie przetwarzany.

## 5. Typy

Do implementacji widoku wymagane będą istniejące typy DTO (`ProfileDTO`, `CouponDTO`, `AddStampsCommand`, `CreateCouponCommand`, `UseCouponCommand`) oraz nowy typ ViewModel.

### CustomerDetailsViewModel (Nowy typ)

- **Opis**: Struktura danych łącząca informacje z wielu źródeł (`profiles`, `coupons`) w jeden obiekt, zoptymalizowany do wyświetlania w komponencie `CustomerDetailsComponent`.
- **Pola**:
  - `profile: ProfileDTO` - podstawowe dane profilowe klienta.
  - `coupons: CouponDTO[]` - lista aktywnych kuponów klienta.

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `AdminDashboardPage` przy użyciu `signal` z Angulara. Nie ma potrzeby tworzenia dedykowanego serwisu stanu (store) dla tego widoku.

- **Kluczowe sygnały (signals)**:
  - `customer = signal<CustomerDetailsViewModel | null>(null)`: Przechowuje dane znalezionego klienta.
  - `searchStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle')`: Śledzi stan procesu wyszukiwania klienta.
  - `actionStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle')`: Śledzi stan operacji takich jak dodawanie pieczątek/kuponów.
  - `error = signal<ApiErrorResponse | null>(null)`: Przechowuje informacje o błędach API.

## 7. Integracja API

Integracja z API Supabase będzie realizowana poprzez dedykowane serwisy Angulara, które będą wywoływać funkcje RPC.

- **Wyszukiwanie klienta**:
  - **Akcja**: `customerSearch(shortId: string)`
  - **Endpoint (RPC)**: `get_customer_details_by_short_id(p_short_id TEXT)`
  - **Odpowiedź**: `CustomerDetailsViewModel`

- **Dodawanie pieczątek**:
  - **Akcja**: `addStamps(command: AddStampsCommand)`
  - **Endpoint (RPC)**: `add_stamps_to_user(p_user_id UUID, p_count INT)`
  - **Żądanie**: `AddStampsCommand`
  - **Odpowiedź**: `AddStampsResponseDTO`

- **Dodawanie kuponu**:
  - **Akcja**: `addCoupon(command: CreateCouponCommand)`
  - **Endpoint (RPC)**: `create_manual_coupon(p_user_id UUID, p_type coupon_type, p_value NUMERIC, p_expires_at TIMESTAMPTZ)`
  - **Żądanie**: `CreateCouponCommand`
  - **Odpowiedź**: `CouponDTO`

- **Wykorzystanie kuponu**:
  - **Akcja**: `useCoupon(couponId: number, userId: string)`
  - **Endpoint (RPC)**: `use_coupon(p_coupon_id INT, p_user_id UUID)`
  - **Żądanie**: `UseCouponCommand` (przekazane w parametrach RPC)
  - **Odpowiedź**: `CouponDTO` (zaktualizowany kupon)

## 8. Interakcje użytkownika

- **Wyszukiwanie klienta**: Sprzedawca wpisuje `short_id` i klika "Szukaj". Aplikacja wyświetla loader, a następnie dane klienta lub komunikat o błędzie.
- **Dodawanie pieczątek**: Sprzedawca wybiera liczbę pieczątek i klika "Dodaj". Przycisk jest blokowany, a po pomyślnej operacji wyświetlany jest toast z potwierdzeniem, a dane klienta są odświeżane.
- **Dodawanie kuponu**: Sprzedawca wypełnia formularz i klika "Dodaj". Przycisk jest blokowany, a po sukcesie wyświetlany jest toast, a lista kuponów klienta jest odświeżana.
- **Wykorzystanie kuponu**: Sprzedawca klika "Wykorzystaj" przy kuponie. Pojawia się modal z prośbą o potwierdzenie. Po potwierdzeniu przycisk jest blokowany, a po sukcesie kupon znika z listy, a sprzedawca widzi toast.

## 9. Warunki i walidacja

- **CustomerSearchComponent**: Pole `short_id` musi być wypełnione. Walidacja powinna sprawdzać, czy wartość ma oczekiwaną długość i format (np. 6 znaków alfanumerycznych).
- **AddCouponFormComponent**: Pola `type` i `expires_at` są wymagane. Pole `value` jest wymagane, jeśli `type` to `percentage` lub `amount`. Data ważności musi być datą przyszłą.

## 10. Obsługa błędów

- **Klient nie znaleziony**: Po wyszukaniu nieistniejącego `short_id`, komponent `AdminDashboardPage` powinien wyświetlić czytelny komunikat, np. "Nie znaleziono klienta o podanym identyfikatorze."
- **Błędy walidacji formularza**: Komponenty formularzy powinny wyświetlać komunikaty o błędach walidacji pod odpowiednimi polami (np. "To pole jest wymagane").
- **Błędy API**: W przypadku błędów serwera (np. 500) lub problemów z siecią, `AdminDashboardPage` powinien wyświetlić ogólny komunikat o błędzie oraz `ToastNotificationComponent` z informacją o niepowodzeniu operacji.
- **Brak uprawnień**: `AdminGuard` powinien przekierować nieautoryzowanych użytkowników na stronę logowania lub stronę główną.

## 11. Kroki implementacji

1.  **Routing**: Dodaj nową ścieżkę `/admin` w `app.routes.ts`, wskazując na `AdminDashboardPage` i zabezpieczając ją za pomocą `AdminGuard`.
2.  **Główny komponent**: Stwórz `AdminDashboardPage`, zdefiniuj w nim sygnały do zarządzania stanem (`customer`, `searchStatus`, `actionStatus`, `error`).
3.  **Serwis API**: Rozbuduj istniejący serwis (lub stwórz nowy, np. `AdminService`) o metody do komunikacji z RPC Supabase (`get_customer_details_by_short_id`, `add_stamps_to_user` itd.).
4.  **Komponent wyszukiwania**: Stwórz `CustomerSearchComponent` z formularzem i logiką walidacji.
5.  **Połączenie wyszukiwania**: Zintegruj `CustomerSearchComponent` z `AdminDashboardPage`, obsłuż zdarzenie `search` i zaimplementuj logikę wywołania API.
6.  **Komponent szczegółów**: Stwórz `CustomerDetailsComponent` do wyświetlania danych z `CustomerDetailsViewModel`.
7.  **Komponenty akcji**: Stwórz `AddStampsFormComponent`, `AddCouponFormComponent` i `CouponsListComponent`.
8.  **Integracja akcji**: Podłącz komponenty akcji do `CustomerDetailsComponent` i `AdminDashboardPage`, implementując logikę obsługi zdarzeń `addStamps`, `addCoupon`, `useCoupon`.
9.  **Obsługa potwierdzeń i powiadomień**: Zintegruj `ConfirmDialogComponent` (dla `useCoupon`) i `ToastNotificationComponent` (dla wszystkich akcji zakończonych sukcesem lub porażką).
10. **Stylowanie**: Ostyluj wszystkie komponenty zgodnie z systemem designu aplikacji przy użyciu Tailwind CSS.
11. **Testowanie**: Napisz testy jednostkowe dla logiki biznesowej w komponencie `AdminDashboardPage` oraz testy komponentów dla poszczególnych elementów UI.
