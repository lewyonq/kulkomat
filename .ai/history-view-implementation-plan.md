# Plan implementacji widoku Historia

## 1. Przegląd

Widok "Historia" ma na celu zapewnienie zalogowanemu użytkownikowi wglądu w chronologiczną listę wszystkich jego aktywności w ramach programu lojalnościowego. Umożliwi to śledzenie zdarzeń takich jak dodanie pieczątki, otrzymanie kuponu czy jego wykorzystanie, zwiększając transparentność i zaangażowanie w program.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/history`. Dostęp do tej ścieżki będzie chroniony przez `AuthGuard`, co oznacza, że tylko zalogowani użytkownicy będą mogli go zobaczyć. Trasa zostanie zdefiniowana w głównym pliku routingu aplikacji.

## 3. Struktura komponentów

Struktura będzie składać się z jednego głównego komponentu "smart" i komponentów "dumb" do prezentacji.

```mermaid
graph TD
    A[HistoryViewComponent (Smart)] --> B{ng-container *ngIf="isLoading()"}
    A --> C{ng-container *ngIf="error()"}
    A --> D[ActivityListComponent (Dumb)]

    B --> E[LoaderComponent]
    C --> F[ErrorComponent]
    D -- *ngFor --> G[ActivityListItemComponent (Dumb)]
```

- **HistoryViewComponent**: Komponent nadrzędny (smart), odpowiedzialny za logikę, pobieranie danych z `ActivityHistory` service, zarządzanie stanem (ładowanie, błędy) i przekazywanie danych do komponentów podrzędnych.
- **ActivityListComponent**: Komponent prezentacyjny (dumb), który otrzymuje listę aktywności i renderuje ją, używając w pętli `ActivityListItemComponent`.
- **ActivityListItemComponent**: Komponent prezentacyjny (dumb), odpowiedzialny za wyświetlanie pojedynczego wpisu w historii. Jego wygląd i treść będą zależeć od typu aktywności.

## 4. Szczegóły komponentów

### HistoryViewComponent

- **Opis komponentu**: Główny komponent strony `/history`. Zarządza pobieraniem danych o historii aktywności, obsługuje stany ładowania i błędów oraz przekazuje dane do listy.
- **Główne elementy**: Zawiera `ActivityListComponent` oraz logikę warunkowego wyświetlania komunikatów o ładowaniu, błędach lub braku aktywności.
- **Obsługiwane interakcje**: Komponent będzie obsługiwał mechanizm "infinite scroll" do doładowywania kolejnych stron historii, gdy użytkownik przewinie listę do końca.
- **Warunki walidacji**: Sprawdza, czy użytkownik jest zalogowany (za pośrednictwem `AuthGuard`).
- **Typy**: `ActivityHistoryViewModel`
- **Propsy**: Brak (komponent routowalny).

### ActivityListComponent

- **Opis komponentu**: Wyświetla listę aktywności użytkownika.
- **Główne elementy**: Lista (`<ul>` lub `<div>` z rolą `list`), która iteruje po tablicy `activities` i dla każdego elementu renderuje `ActivityListItemComponent`.
- **Obsługiwane interakcje**: Emituje zdarzenie `loadMore` po dotarciu do końca listy, aby `HistoryViewComponent` mógł pobrać kolejną partię danych.
- **Warunki walidacji**: Brak.
- **Typy**: `ActivityItemViewModel[]`
- **Propsy**:
  - `activities: ActivityItemViewModel[]`

### ActivityListItemComponent

- **Opis komponentu**: Reprezentuje pojedynczy wiersz na liście historii. Wyświetla ikonę, tytuł, opis i datę zdarzenia.
- **Główne elementy**: Kontener `div` z ikoną (np. SVG), tytułem (`<h4>`), opisem (`<p>`) i datą (`<time>`). Używa `ngSwitch` na `activity.type` do renderowania odpowiedniej treści.
- **Obsługiwane interakcje**: Brak.
- **Warunki walidacji**: Brak.
- **Typy**: `ActivityItemViewModel`
- **Propsy**:
  - `activity: ActivityItemViewModel`

## 5. Typy

Do implementacji widoku potrzebne będą następujące typy, w tym dedykowane modele widoku (ViewModel) do transformacji danych z DTO na potrzeby UI.

- **ActivityHistoryDTO**: Obiekt transferu danych bezpośrednio z API.

  ```typescript
  export interface ActivityHistoryDTO {
    activities: ActivityItemDTO[];
    total: number;
    limit: number;
    offset: number;
  }
  ```

- **ActivityItemDTO**: Pojedynczy element aktywności z API.

  ```typescript
  export interface ActivityItemDTO {
    type: ActivityType; // 'stamp_added' | 'coupon_generated' | 'coupon_used' | 'coupon_expired'
    id: number;
    user_id: string;
    details: ActivityDetails; // Union type
    created_at: string;
  }
  ```

- **ActivityHistoryViewModel**: Główny model widoku dla `HistoryViewComponent`.

  ```typescript
  export interface ActivityHistoryViewModel {
    activities: ActivityItemViewModel[];
    total: number;
    hasMore: boolean;
  }
  ```

- **ActivityItemViewModel**: Model widoku dla pojedynczego elementu listy, wzbogacony o pola potrzebne do renderowania w UI.
  ```typescript
  export interface ActivityItemViewModel {
    id: number;
    type: ActivityType;
    title: string; // Np. 'Dodano pieczątkę'
    description: string; // Np. 'Otrzymano w zamian za 10 pieczątek'
    date: string; // Sformatowana data, np. '14 października 2025'
    icon: string; // Nazwa ikony do wyświetlenia, np. 'stamp-plus'
  }
  ```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w `HistoryViewComponent` przy użyciu sygnałów (signals) z Angulara.

- **`viewModel`**: `signal<ActivityHistoryViewModel>` - przechowuje stan widoku, w tym listę aktywności i informacje o paginacji.
- **`isLoading`**: `signal<boolean>` - sygnał z serwisu `ActivityHistory`, używany do pokazywania/ukrywania wskaźnika ładowania.
- **`error`**: `signal<Error | null>` - sygnał z serwisu `ActivityHistory`, używany do wyświetlania komunikatu o błędzie.

Nie ma potrzeby tworzenia dedykowanego customowego hooka (serwisu stanu), ponieważ logika jest ograniczona do jednego widoku. Stan będzie aktualizowany w odpowiedzi na interakcje użytkownika (przewijanie) i cykl życia komponentu (`ngOnInit`).

## 7. Integracja API

Integracja z API odbędzie się poprzez serwis `ActivityHistory`.

- **Wywołanie**: W `HistoryViewComponent`, metoda `ngOnInit` wywoła `activityHistoryService.getUserActivityHistory()`.
- **Paginacja**: Kolejne strony danych będą pobierane przez wywołanie tej samej metody z nowymi parametrami `offset` i `limit`, gdy użytkownik przewinie listę do końca.
- **Typy**:
  - **Żądanie**: `ActivityHistoryQueryParams` (opcjonalnie `limit` i `offset`).
  - **Odpowiedź**: `Observable<ActivityHistoryDTO>`.

Komponent będzie subskrybował do strumienia, a dane z `ActivityHistoryDTO` zostaną zmapowane na `ActivityHistoryViewModel`.

## 8. Interakcje użytkownika

- **Przewijanie listy (Infinite Scroll)**: Gdy użytkownik przewinie listę do określonego punktu blisko końca, `ActivityListComponent` wyemituje zdarzenie `loadMore`. `HistoryViewComponent` obsłuży to zdarzenie, sprawdzi, czy `viewModel().hasMore` jest `true`, a następnie wywoła serwis w celu pobrania kolejnej partii danych i dołączenia ich do istniejącej listy w `viewModel`.
- **Brak interakcji**: Jeśli użytkownik nie ma żadnych aktywności, zostanie wyświetlony stosowny komunikat, np. "Brak historii aktywności".

## 9. Warunki i walidacja

- **Ochrona trasy**: `AuthGuard` sprawdzi, czy użytkownik jest zalogowany przed aktywacją trasy `/history`. Jeśli nie, przekieruje go do strony logowania.
- **Brak danych**: W `HistoryViewComponent`, po pomyślnym załadowaniu danych, jeśli tablica `activities` jest pusta, komponent wyświetli komunikat informujący o braku historii.
- **Koniec listy**: Mechanizm "infinite scroll" zostanie zablokowany, gdy `viewModel().hasMore` będzie `false`, co zapobiegnie niepotrzebnym wywołaniom API.

## 10. Obsługa błędów

- **Błąd API**: Jeśli `activityHistoryService.getUserActivityHistory()` zwróci błąd, zostanie on przechwycony, a sygnał `error` w serwisie zostanie ustawiony. `HistoryViewComponent` odczyta ten sygnał i wyświetli generyczny komunikat o błędzie (np. "Nie udało się załadować historii. Spróbuj ponownie później.") wraz z przyciskiem umożliwiającym ponowienie próby.
- **Brak uwierzytelnienia**: Serwis `ActivityHistory` wewnętrznie obsługuje przypadek braku zalogowanego użytkownika, zwracając błąd. Ten scenariusz powinien być jednak przechwycony już na poziomie `AuthGuard`, więc w komponencie będzie to traktowane jako standardowy błąd API.

## 11. Kroki implementacji

1. **Utworzenie komponentów**: Wygenerowanie `HistoryViewComponent`, `ActivityListComponent` i `ActivityListItemComponent` za pomocą Angular CLI (`ng generate component ... --standalone`).
2. **Definicja routingu**: Dodanie nowej, chronionej trasy `/history` w pliku `app.routes.ts`, która wskazuje na `HistoryViewComponent`.
3. **Implementacja `HistoryViewComponent`**:
   - Wstrzyknięcie serwisu `ActivityHistory`.
   - Utworzenie sygnałów dla `viewModel`.
   - Implementacja logiki `ngOnInit` do pobrania pierwszej partii danych.
   - Stworzenie metody do mapowania `ActivityHistoryDTO` na `ActivityHistoryViewModel`.
   - Implementacja metody do ładowania kolejnych stron danych (dla infinite scroll).
   - Przygotowanie szablonu HTML z obsługą stanów ładowania, błędu i braku danych.
4. **Implementacja `ActivityListComponent`**:
   - Zdefiniowanie propsa `activities`.
   - Zdefiniowanie eventu `loadMore`.
   - Implementacja szablonu z pętlą `*ngFor` renderującą `ActivityListItemComponent`.
   - Dodanie logiki do wykrywania końca listy i emitowania `loadMore`.
5. **Implementacja `ActivityListItemComponent`**:
   - Zdefiniowanie propsa `activity`.
   - Stworzenie szablonu HTML z `ngSwitch` na `activity.type` do dynamicznego renderowania treści (ikona, tytuł, opis) dla każdego typu zdarzenia.
   - Dodanie formatowania daty za pomocą `DatePipe`.
6. **Styling**: Ostylowanie wszystkich komponentów za pomocą Tailwind CSS, zapewniając czytelność i spójność z resztą aplikacji.
7. **Testowanie**: Przetestowanie działania widoku w różnych scenariuszach: pomyślne załadowanie, stan ładowania, błąd API, brak aktywności, doładowywanie kolejnych stron.
