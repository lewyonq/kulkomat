# Architektura UI dla Kulkomat

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji Kulkomat opiera się na frameworku Angular i została zaprojektowana zgodnie z podejściem "mobile-first". Aplikacja składa się z dwóch głównych części zintegrowanych w jednej bazie kodu:

1.  **Interfejs Klienta**: Publicznie dostępna część aplikacji, która po zalogowaniu przez Google OAuth umożliwia klientom śledzenie postępów w programie lojalnościowym, przeglądanie kuponów i historii aktywności.
2.  **Panel Sprzedawcy**: Chroniona strefa dostępna pod ścieżką `/admin`, przeznaczona dla personelu. Umożliwia zarządzanie kontami klientów (dodawanie pieczątek, kuponów), oznaczanie kuponów jako wykorzystane oraz zarządzanie listą dostępnych smaków lodów.

Zarządzanie stanem sesji użytkownika będzie realizowane za pomocą `AuthService` i Angular Signals, co zapewni reaktywność i spójność danych w całej aplikacji. Do natychmiastowej aktualizacji danych po stronie klienta (np. po dodaniu pieczątki przez sprzedawcę) wykorzystane zostaną subskrypcje Supabase Realtime.

## 2. Lista widoków

### Interfejs Klienta

#### 1. Strona Logowania
-   **Nazwa widoku**: Login
-   **Ścieżka widoku**: `/login`
-   **Główny cel**: Umożliwienie użytkownikowi zalogowania się do aplikacji.
-   **Kluczowe informacje do wyświetlenia**: Informacja o programie lojalnościowym, przycisk "Zaloguj się z Google".
-   **Kluczowe komponenty widoku**: Przycisk logowania OAuth.
-   **UX, dostępność i względy bezpieczeństwa**: Prosty i jasny interfejs. Proces logowania jest w pełni obsługiwany i zabezpieczony przez dostawcę OAuth (Google).

#### 2. Pulpit Klienta (Dashboard)
-   **Nazwa widoku**: Dashboard
-   **Ścieżka widoku**: `/` (główna strona po zalogowaniu)
-   **Główny cel**: Wyświetlenie kluczowych informacji o programie lojalnościowym i zapewnienie nawigacji do szczegółowych sekcji.
-   **Kluczowe informacje do wyświetlenia**:
    -   Identyfikator użytkownika (`short_id`) wraz z kodem QR.
    -   Wizualny postęp zbierania pieczątek (np. 0/10).
    -   Karta nawigacyjna przenosząca do sekcji z kuponami.
    -   Lista aktualnie dostępnych smaków lodów.
-   **Kluczowe komponenty widoku**: `UserIdDisplayComponent`, `StampProgressComponent`, `CouponNavigationCardComponent`, lista smaków.
-   **UX, dostępność i względy bezpieczeństwa**: Widok chroniony przez `AuthGuard`. Dane odświeżane w czasie rzeczywistym. Identyfikator `short_id` jest dobrze widoczny, aby ułatwić obsługę przy kasie.

#### 3. Kupony
-   **Nazwa widoku**: Coupons
-   **Ścieżka widoku**: `/coupons`
-   **Główny cel**: Wyświetlenie wszystkich dostępnych kuponów użytkownika.
-   **Kluczowe informacje do wyświetlenia**: Lista aktywnych i nieaktywnych kuponów, posortowana od najnowszych.
-   **Kluczowe komponenty widoku**: `CouponCardComponent`.
-   **UX, dostępność i względy bezpieczeństwa**: Widok chroniony. Kupony są wyraźnie rozróżnione wizualnie (kolor, ikona, wyszarzenie dla nieaktywnych), aby ułatwić ich identyfikację.

#### 4. Historia Aktywności
-   **Nazwa widoku**: History
-   **Ścieżka widoku**: `/history`
-   **Główny cel**: Zapewnienie użytkownikowi wglądu w chronologiczną listę wszystkich jego aktywności w programie lojalnościowym.
-   **Kluczowe informacje do wyświetlenia**: Lista zdarzeń (dodanie pieczątki, otrzymanie kuponu, wykorzystanie kuponu) z datą i typem zdarzenia.
-   **Kluczowe komponenty widoku**: Lista aktywności.
-   **UX, dostępność i względy bezpieczeństwa**: Widok chroniony. Czytelna i łatwa do przewijania lista. Każdy element historii jasno opisuje zdarzenie.

#### 5. Kontakt / Profil
-   **Nazwa widoku**: Profile
-   **Ścieżka widoku**: `/profile`
-   **Główny cel**: Umożliwienie użytkownikowi kontaktu z obsługą oraz wylogowanie się z aplikacji.
-   **Kluczowe informacje do wyświetlenia**: Formularz kontaktowy, przycisk "Wyloguj".
-   **Kluczowe komponenty widoku**: Formularz kontaktowy.
-   **UX, dostępność i względy bezpieczeństwa**: Widok chroniony. Prosty formularz z walidacją. Przycisk wylogowania wyraźnie oznaczony.

### Panel Sprzedawcy

#### 1. Logowanie Sprzedawcy
-   **Nazwa widoku**: Admin Login
-   **Ścieżka widoku**: `/admin/login`
-   **Główny cel**: Uwierzytelnienie sprzedawcy w celu uzyskania dostępu do panelu administracyjnego.
-   **Kluczowe informacje do wyświetlenia**: Formularz logowania (e-mail, hasło).
-   **Kluczowe komponenty widoku**: Formularz logowania.
-   **UX, dostępność i względy bezpieczeństwa**: Oddzielna strona logowania dla personelu. Dostęp ograniczony do autoryzowanych kont z rolą `Seller`.

#### 2. Panel Administracyjny
-   **Nazwa widoku**: Admin Dashboard
-   **Ścieżka widoku**: `/admin`
-   **Główny cel**: Główne narzędzie pracy sprzedawcy do obsługi klientów w programie lojalnościowym.
-   **Kluczowe informacje do wyświetlenia**:
    -   Pole wyszukiwania klienta po `short_id`.
    -   Po wyszukaniu: profil klienta z aktualną liczbą pieczątek i listą kuponów.
    -   Opcje: dodawanie pieczątek (dropdown 1-10), dodawanie kuponów manualnych, oznaczanie kuponów jako wykorzystane.
-   **Kluczowe komponenty widoku**: Wyszukiwarka, `ConfirmDialogComponent` (przy oznaczaniu kuponu), `ToastNotificationComponent` (do potwierdzeń akcji).
-   **UX, dostępność i względy bezpieczeństwa**: Widok chroniony przez `AdminGuard`. Szybkie wyszukiwanie klienta. Akcje wymagające potwierdzenia (np. wykorzystanie kuponu) używają dialogu, aby zapobiec pomyłkom.

#### 3. Zarządzanie Smakami
-   **Nazwa widoku**: Manage Flavors
-   **Ścieżka widoku**: `/admin/flavors`
-   **Główny cel**: Umożliwienie sprzedawcy zarządzania listą dostępnych smaków lodów.
-   **Kluczowe informacje do wyświetlenia**: Lista wszystkich smaków z możliwością przełączania ich dostępności (`is_available`) oraz opcja dodania nowego smaku.
-   **Kluczowe komponenty widoku**: Lista smaków z przełącznikami, formularz dodawania nowego smaku.
-   **UX, dostępność i względy bezpieczeństwa**: Widok chroniony. Prosty interfejs do szybkiego aktualizowania oferty, która jest natychmiast widoczna dla klientów na ich pulpicie.

## 3. Mapa podróży użytkownika

### Przepływ Klienta

1.  **Rejestracja/Logowanie**: Nowy użytkownik trafia na `/login` i klika "Zaloguj się z Google". Po pomyślnym uwierzytelnieniu jest przekierowywany na pulpit (`/`).
2.  **Korzystanie z aplikacji**: Na pulpicie (`/`) klient widzi swój `short_id`, który pokazuje sprzedawcy przy zakupie. Sprawdza też postęp pieczątek.
3.  **Przeglądanie kuponów**: Z pulpitu klient przechodzi do nowej sekcji "Kupony" (`/coupons`), aby zobaczyć listę swoich aktywnych i wykorzystanych kuponów.
4.  **Otrzymanie pieczątki**: Sprzedawca dodaje pieczątkę w panelu admina. Dzięki Supabase Realtime, `StampProgressComponent` na pulpicie klienta natychmiast się aktualizuje.
5.  **Wykorzystanie kuponu**: Klient w sekcji `/coupons` pokazuje sprzedawcy wybrany kupon. Sprzedawca odnajduje klienta w panelu admina, oznacza kupon jako wykorzystany. Kupon na liście klienta zmienia status na nieaktywny.
6.  **Przeglądanie historii**: Klient przechodzi do `/history`, aby zobaczyć, kiedy otrzymał pieczątki lub kupony.
6.  **Wylogowanie**: Klient przechodzi do `/profile` i klika "Wyloguj".

### Przepływ Sprzedawcy

1.  **Logowanie**: Sprzedawca wchodzi na `/admin/login`, podaje swoje dane i uzyskuje dostęp do panelu `/admin`.
2.  **Obsługa klienta**: Klient podaje swój `short_id`. Sprzedawca wpisuje go w wyszukiwarkę w panelu `/admin`.
3.  **Zarządzanie kontem klienta**: Po znalezieniu klienta, na ekranie pojawia się jego profil. Sprzedawca:
    -   Wybiera z listy rozwijanej liczbę pieczątek do dodania (np. 2) i zatwierdza.
    -   Lub klika przycisk "Wykorzystaj" przy kuponie klienta, potwierdza akcję w oknie dialogowym.
4.  **Aktualizacja smaków**: Sprzedawca przechodzi do zakładki "Zarządzaj smakami" (`/admin/flavors`), aby oznaczyć smak jako niedostępny lub dodać nowy.

## 4. Układ i struktura nawigacji

### Nawigacja Klienta

Nawigacja będzie prosta i umieszczona na dole ekranu w widoku mobilnym (Tab Bar), zawierająca linki do kluczowych widoków:
-   **Pulpit** (`/`)
-   **Kupony** (`/coupons`)
-   **Historia** (`/history`)
-   **Profil** (`/profile`)

### Nawigacja Sprzedawcy

Po zalogowaniu do panelu administracyjnego, nawigacja będzie umieszczona w panelu bocznym lub na górze strony i będzie zawierać linki:
-   **Panel główny** (`/admin`)
-   **Zarządzaj smakami** (`/admin/flavors`)
-   **Wyloguj**

## 5. Kluczowe komponenty

-   **`StampProgressComponent`**: Reużywalny komponent wizualizujący postęp zbierania pieczątek (np. jako okręgi lub ikony lodów). Wyświetla `X na 10`.
-   **`CouponCardComponent`**: Komponent do wyświetlania pojedynczego kuponu. Będzie dynamicznie zmieniał styl (kolor, ikona) w zależności od typu kuponu (`free_scoop`, `percentage`, `amount`) oraz statusu (aktywny/nieaktywny).
-   **`UserIdDisplayComponent`**: Komponent wyświetlający `short_id` użytkownika w czytelny sposób oraz generujący kod QR dla przyszłych zastosowań.
-   **`ToastNotificationComponent`**: Komponent do wyświetlania krótkich, nieblokujących komunikatów (np. "Pomyślnie dodano pieczątkę").
-   **`ConfirmDialogComponent`**: Modalne okno dialogowe używane do potwierdzania krytycznych akcji, np. "Czy na pewno chcesz oznaczyć ten kupon jako wykorzystany?".
-   **`CouponNavigationCardComponent`**: Karta na pulpicie, która wizualnie reprezentuje sekcję i przenosi do niej użytkownika (np. karta "Moje Kupony").
-   **`DashboardComponent`**: Komponent-kontener dla pulpitu klienta, agregujący `StampProgressComponent`, `CouponNavigationCardComponent` i listę smaków.
