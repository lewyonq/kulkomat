# Plan implementacji widoku: Historia Aktywności Klienta (Panel Sprzedawcy)

## 1. Przegląd

Celem jest stworzenie nowego widoku w panelu administracyjnym, który umożliwi sprzedawcy przeglądanie szczegółowej historii aktywności wybranego klienta. Widok ten będzie dostępny po wyszukaniu klienta w panelu i kliknięciu dedykowanego przycisku. Wyświetli on chronologiczną listę zdarzeń, takich jak dodane pieczątki oraz wygenerowane i wykorzystane kupony, co pozwoli sprzedawcy na lepsze zrozumienie zaangażowania klienta w program lojalnościowy. Implementacja wykorzysta istniejący, współdzielony komponent `HistoryListComponent`.

## 2. Routing widoku

Widok historii klienta będzie dostępny pod dynamiczną ścieżką w module `admin`:

- **Ścieżka**: `/admin/customer/:id/history`
- **Parametr**: `:id` będzie przyjmować `user_id` klienta, którego historia ma zostać wyświetlona.
- **Guard**: Dostęp do tej ścieżki powinien być chroniony przez `AdminGuard`, aby upewnić się, że tylko zalogowany sprzedawca może ją otworzyć.

## 3. Struktura komponentów

Nowy widok będzie składał się z komponentu-strony (`CustomerHistoryPageComponent`), który będzie zarządzał logiką pobierania danych i wyświetlał reużywalny komponent `HistoryListComponent`.

```
- admin-routing.module.ts (aktualizacja)
- admin.module.ts (aktualizacja)

- src/app/pages/admin/
  └── customer-history/
      ├── customer-history-page.component.html
      ├── customer-history-page.component.scss
      └── customer-history-page.component.ts (Nowy)

- src/app/components/
  └── history-list/ (Istniejący, reużywany)
      ├── history-list.component.html
      ├── history-list.component.scss
      └── history-list.component.ts
```

## 4. Szczegóły komponentów

### `CustomerHistoryPageComponent` (Nowy)

- **Opis komponentu**: Jest to inteligentny komponent (strona), który odpowiada za pobranie `user_id` z parametrów ścieżki URL, a następnie za pomocą `ActivityHistoryService` pobiera i przekazuje dane o aktywności klienta do komponentu `HistoryListComponent`. Komponent wyświetla również nagłówek z informacją, czyjej historii dotyczy widok.
- **Główne elementy**: 
  - Nagłówek `<h1>` lub `<h2>` (np. "Historia klienta").
  - Komponent `<app-history-list>` do wyświetlenia danych.
  - Wskaźnik ładowania (`*ngIf="isLoading"`).
  - Komunikat o błędzie (`*ngIf="error"`).
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji użytkownika. Komponent reaguje na zmiany w parametrach routingu.
- **Obsługiwana walidacja**: Komponent musi zweryfikować, czy `user_id` z URL jest poprawnym identyfikatorem UUID.
- **Typy**: `ActivityItemDTO[]`, `ApiErrorResponse`.
- **Propsy**: Brak (komponent-strona).

### `HistoryListComponent` (Istniejący)

- **Opis komponentu**: Głupi (prezentacyjny) komponent, który renderuje listę aktywności na podstawie otrzymanych danych. Każdy element listy jest stylizowany w zależności od typu aktywności.
- **Główne elementy**: 
  - Kontener listy (`<ul>` lub `<div>` z `*ngFor`).
  - Elementy listy (`<li>` lub `<app-history-item>`), które wyświetlają ikonę, opis i datę dla każdego zdarzenia.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ActivityItemDTO[]`.
- **Propsy**: Komponent powinien przyjmować jedną właściwość:
  - `@Input() activities: ActivityItemDTO[]` - tablica obiektów aktywności do wyświetlenia.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy zdefiniowane w `src/app/types/index.ts`.

- **`ActivityItemDTO`**: Główny obiekt transferu danych dla pojedynczego zdarzenia w historii.
  ```typescript
  export interface ActivityItemDTO {
    type: ActivityType; // 'stamp_added' | 'coupon_generated' | 'coupon_used' | 'coupon_expired'
    id: number;
    user_id: string;
    details: ActivityDetails; // Zależne od 'type'
    created_at: string;
  }
  ```
- **`ActivityHistoryDTO`**: Odpowiedź z API zawierająca paginowaną listę aktywności.
  ```typescript
  export interface ActivityHistoryDTO {
    activities: ActivityItemDTO[];
    total: number;
    limit: number;
    offset: number;
  }
  ```
- **`ActivityHistoryQueryParams`**: Parametry zapytania do API w celu filtrowania historii.
  ```typescript
  export interface ActivityHistoryQueryParams extends PaginationParams {
    user_id?: string; // Kluczowy parametr do pobrania historii konkretnego klienta
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w komponencie `CustomerHistoryPageComponent`.

- **Zmienne stanu**:
  - `activities$: Observable<ActivityItemDTO[]>`: Strumień przechowujący listę aktywności pobraną z serwisu.
  - `isLoading$: BehaviorSubject<boolean>`: Flaga informująca o stanie ładowania danych.
  - `error$: BehaviorSubject<ApiErrorResponse | null>`: Przechowuje informacje o ewentualnym błędzie z API.
- **Niestandardowe hooki**: Nie są wymagane. Logika będzie oparta na serwisach Angulara i `ActivatedRoute` do odczytu parametrów URL.

## 7. Integracja API

Integracja z API będzie realizowana poprzez dedykowany serwis `ActivityHistoryService`.

- **Serwis**: `ActivityHistoryService` musi zostać rozszerzony o nową metodę lub wykorzystywać istniejącą, która pozwoli na pobranie historii dla konkretnego `user_id`.
- **Metoda w serwisie**:
  ```typescript
  // W ActivityHistoryService
  getActivityHistoryForUser(userId: string, params?: PaginationParams): Observable<ActivityHistoryDTO> {
    const queryParams: ActivityHistoryQueryParams = { ...params, user_id: userId };
    // Logika wywołania API Supabase z odpowiednimi parametrami
    // np. this.supabase.from('activity_history').select('*').eq('user_id', userId).order(...)
  }
  ```
- **Wywołanie w komponencie**:
  ```typescript
  // W CustomerHistoryPageComponent.ts (ngOnInit)
  this.route.params.pipe(
    map(params => params['id']),
    switchMap(userId => this.activityHistoryService.getActivityHistoryForUser(userId))
  ).subscribe(response => { /* ... */ });
  ```
- **Typy żądania/odpowiedzi**:
  - **Żądanie**: `GET /api/activity-history?user_id={userId}`
  - **Odpowiedź**: `ActivityHistoryDTO`

## 8. Interakcje użytkownika

1.  **Sprzedawca wyszukuje klienta** w panelu `admin`.
2.  **Sprzedawca klika przycisk "Wyświetl historię"** umieszczony pod sekcją dodawania pieczątek.
3.  **Aplikacja nawiguje** do ścieżki `/admin/customer/{userId}/history`.
4.  **Komponent `CustomerHistoryPageComponent` jest aktywowany**, pobiera `userId` z URL.
5.  **Wyświetlany jest wskaźnik ładowania**, a w tle `ActivityHistoryService` wysyła żądanie do API.
6.  **Po otrzymaniu danych**, wskaźnik ładowania jest ukrywany, a dane są przekazywane do `HistoryListComponent`.
7.  **`HistoryListComponent` renderuje** chronologiczną listę aktywności klienta.

## 9. Warunki i walidacja

- **Walidacja `user_id`**: W `CustomerHistoryPageComponent`, przed wywołaniem API, należy sprawdzić, czy `id` pobrane z `ActivatedRoute` jest poprawnym identyfikatorem (np. nie jest `null` lub `undefined`).
- **Ochrona trasy**: `AdminGuard` musi być zastosowany do nowej ścieżki `/admin/customer/:id/history`, aby uniemożliwić dostęp nieautoryzowanym użytkownikom.
- **Stan interfejsu**: 
  - Gdy `isLoading` jest `true`, wyświetlany jest loader.
  - Gdy `error` nie jest `null`, wyświetlany jest komunikat o błędzie.
  - Gdy dane zostaną pomyślnie załadowane, wyświetlana jest lista historii.
  - Jeśli lista `activities` jest pusta, należy wyświetlić komunikat "Brak historii aktywności dla tego klienta".

## 10. Obsługa błędów

- **Błąd pobierania danych**: Jeśli wywołanie API w `ActivityHistoryService` zakończy się niepowodzeniem (np. błąd sieci, błąd serwera 5xx), błąd powinien zostać przechwycony w subskrypcji w `CustomerHistoryPageComponent`. Zmienna stanu `error` powinna zostać ustawiona, a użytkownikowi należy wyświetlić stosowny komunikat (np. "Nie udało się załadować historii. Spróbuj ponownie później.").
- **Nieprawidłowy `user_id`**: Jeśli `user_id` w URL jest nieprawidłowe lub nie istnieje, API powinno zwrócić błąd 404. Komponent powinien obsłużyć ten przypadek, wyświetlając komunikat "Nie znaleziono klienta o podanym identyfikatorze".
- **Brak uprawnień**: Jeśli `AdminGuard` zadziała poprawnie, ten scenariusz nie powinien wystąpić. Jednak na poziomie API, polityki RLS w Supabase powinny uniemożliwić pobranie danych, jeśli rola użytkownika nie jest `admin` lub `seller`.

## 11. Kroki implementacji

1.  **Utworzenie komponentu**: Wygeneruj nowy komponent `CustomerHistoryPageComponent` za pomocą Angular CLI: `ng generate component pages/admin/customer-history-page`.
2.  **Aktualizacja routingu**: W `admin-routing.module.ts` dodaj nową ścieżkę: `{ path: 'customer/:id/history', component: CustomerHistoryPageComponent, canActivate: [AdminGuard] }`.
3.  **Implementacja `CustomerHistoryPageComponent`**: 
    - Wstrzyknij `ActivatedRoute` i `ActivityHistoryService`.
    - W `ngOnInit` zaimplementuj logikę pobierania `id` z trasy i wywołania serwisu.
    - Dodaj do szablonu HTML obsługę stanów ładowania, błędu oraz wywołanie komponentu `<app-history-list>`.
4.  **Modyfikacja serwisu `ActivityHistoryService`**: Upewnij się, że serwis posiada metodę do pobierania historii dla konkretnego `user_id` i poprawnie przekazuje ten parametr do API Supabase.
5.  **Modyfikacja komponentu `AdminDashboardComponent`**: W komponencie, gdzie sprzedawca wyszukuje klienta, dodaj przycisk "Wyświetl historię" z atrybutem `[routerLink]`, który będzie dynamicznie kierował do nowej ścieżki, np. `[routerLink]="['/admin/customer', selectedUser.id, 'history']"`.
6.  **Weryfikacja `HistoryListComponent`**: Sprawdź, czy istniejący komponent `HistoryListComponent` jest gotowy do reużycia i czy jego interfejs (`@Input()`) jest zgodny z planem.
7.  **Testowanie**: Przetestuj cały przepływ – od kliknięcia przycisku w panelu admina, przez poprawne załadowanie danych, aż po wyświetlenie historii. Sprawdź również obsługę błędów i przypadków brzegowych (np. pustej historii).
