# Plan implementacji widoku Admin Login

## 1. Przegląd
Widok `Admin Login` stanowi dedykowaną stronę logowania dla personelu (sprzedawców), umożliwiającą im dostęp do panelu administracyjnego. Uwierzytelnianie odbywa się wyłącznie za pośrednictwem dostawcy OAuth (Google), zgodnie ze specyfikacją `auth-spec.md`. Po pomyślnym zalogowaniu i weryfikacji uprawnień (rola `Seller`), użytkownik jest przekierowywany do głównego widoku panelu administracyjnego.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- **Ścieżka**: `/admin/login`
- **Guard**: `noAuthGuard` zostanie zastosowany, aby przekierować już zalogowanych użytkowników z tej strony do panelu `/admin/dashboard`.

## 3. Struktura komponentów
Struktura widoku będzie prosta i skupi się na jednym głównym komponencie, który obsłuży logikę uwierzytelniania.

```
/admin/login
└── AdminLoginPageComponent
    └── AdminLoginFormComponent (komponent-dziecko)
```

- **AdminLoginPageComponent**: Komponent-kontener (smart component), który zarządza stanem, wywołaniami `AuthService` i nawigacją.
- **AdminLoginFormComponent**: Komponent prezentacyjny (dumb component), który wyświetla interfejs użytkownika, w tym przycisk logowania, i emituje zdarzenia do rodzica.

## 4. Szczegóły komponentów

### AdminLoginPageComponent
- **Opis**: Główny komponent strony `/admin/login`. Odpowiada za orkiestrację procesu logowania, obsługę stanu (ładowanie, błędy) oraz komunikację z `AuthService`.
- **Główne elementy**: Wyświetla `AdminLoginFormComponent` i przekazuje do niego aktualny stan.
- **Obsługiwane interakcje**: Reaguje na zdarzenie `login` wyemitowane przez `AdminLoginFormComponent`.
- **Typy**: `AdminLoginViewModel`.
- **Propsy**: Brak.

### AdminLoginFormComponent
- **Opis**: Komponent UI, który renderuje formularz logowania. W tym przypadku będzie to prosty interfejs z przyciskiem inicjującym proces OAuth.
- **Główne elementy**:
  - Nagłówek `h1` z tekstem "Panel dla sprzedawcy".
  - Przycisk `button` z ikoną Google i tekstem "Zaloguj się z Google".
  - Komponent `SpinnerComponent` wyświetlany podczas ładowania.
  - Komponent `AlertComponent` do wyświetlania komunikatów o błędach.
- **Obsługiwane interakcje**:
  - `(click)` na przycisku logowania: emituje zdarzenie `(login)`.
- **Obsługiwana walidacja**: Brak walidacji po stronie formularza, ponieważ nie ma pól do wypełnienia.
- **Typy**: `AdminLoginViewModel`.
- **Propsy (wejście)**:
  - `vm: AdminLoginViewModel`: Obiekt zawierający stan widoku (`isLoading`, `error`).

## 5. Typy
Do implementacji widoku wymagany będzie jeden nowy typ `ViewModel`.

- **AdminLoginViewModel**: Interfejs opisujący stan widoku `AdminLogin`.
  ```typescript
  export interface AdminLoginViewModel {
    isLoading: boolean;
    error: string | null;
  }
  ```
  - `isLoading` (boolean): Wskazuje, czy operacja logowania jest w toku. Używane do pokazywania/ukrywania spinnera i blokowania przycisku.
  - `error` (string | null): Przechowuje komunikat o błędzie, jeśli wystąpił problem z logowaniem lub autoryzacją. `null`, jeśli nie ma błędu.

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w `AdminLoginPageComponent` przy użyciu `BehaviorSubject` z RxJS, zgodnie z architekturą opartą na strumieniach.

- **`state$`**: `BehaviorSubject<AdminLoginViewModel>` będzie przechowywać aktualny stan widoku.
- **`vm$`**: `Observable<AdminLoginViewModel>` wystawiony z `state$` do szablonu komponentu za pomocą potoku `async`.
- **Modyfikacja stanu**: Stan będzie aktualizowany w odpowiedzi na akcje użytkownika (kliknięcie przycisku) i wyniki wywołań asynchronicznych (np. błąd z `AuthService`).

## 7. Integracja API
Integracja z API będzie realizowana przez `AuthService`, który jest już częściowo zdefiniowany w architekturze (`.ai/auth-spec.md`).

- **Wywołanie**: `AdminLoginPageComponent` wywoła metodę `authService.signInWithGoogle()`.
- **Proces**:
  1. Metoda `signInWithGoogle()` w `AuthService` wywołuje `supabase.auth.signInWithOAuth()` z opcją `redirectTo` wskazującą na `/auth/callback`.
  2. Użytkownik jest przekierowywany na stronę logowania Google.
  3. Po pomyślnym uwierzytelnieniu, Google przekierowuje użytkownika z powrotem do aplikacji na ścieżkę `/auth/callback`.
  4. `AuthCallbackComponent` (do zaimplementowania w ramach innego zadania) obsłuży sesję i zweryfikuje, czy zalogowany użytkownik ma rolę `Seller` (poprzez wywołanie API do tabeli `sellers` lub na podstawie tokena JWT). Jeśli tak, przekieruje go do `/admin/dashboard`.
- **Typy**: Nie są wymagane dodatkowe typy DTO dla tego widoku, ponieważ proces opiera się na przekierowaniach.

## 8. Interakcje użytkownika
- **Użytkownik klika "Zaloguj się z Google"**: 
  - `AdminLoginPageComponent` ustawia `isLoading` na `true`.
  - Wywoływana jest metoda `authService.signInWithGoogle()`.
  - Użytkownik jest przekierowywany do zewnętrznej strony uwierzytelniania.
- **Błąd podczas inicjowania logowania**: 
  - `AuthService` zgłasza błąd.
  - `AdminLoginPageComponent` przechwytuje błąd, ustawia `isLoading` na `false` i aktualizuje pole `error` w stanie, co powoduje wyświetlenie komunikatu w `AlertComponent`.

## 9. Warunki i walidacja
- **Warunek dostępu**: Widok `/admin/login` jest dostępny tylko dla niezalogowanych użytkowników. `noAuthGuard` zapewni, że zalogowani sprzedawcy zostaną automatycznie przekierowani do `/admin/dashboard`.
- **Walidacja uprawnień**: Po stronie backendu (lub w `AuthCallbackComponent`) nastąpi weryfikacja, czy uwierzytelniony użytkownik posiada rolę `Seller`. Jeśli nie, dostęp do panelu `/admin/*` zostanie zablokowany, a użytkownik może zostać przekierowany z powrotem do `/admin/login` z komunikatem o błędzie.

## 10. Obsługa błędów
- **Błąd inicjacji OAuth**: Jeśli `AuthService` nie będzie w stanie zainicjować procesu logowania (np. z powodu problemów z konfiguracją Supabase), błąd zostanie przechwycony, a w interfejsie użytkownika pojawi się komunikat, np. "Wystąpił błąd podczas próby logowania. Spróbuj ponownie później."
- **Brak uprawnień (rola inna niż `Seller`)**: Po powrocie z Google, jeśli użytkownik nie ma wymaganej roli, `AuthCallbackComponent` powinien przekierować go z powrotem do `/admin/login` z parametrem zapytania, np. `?error=unauthorized`. `AdminLoginPageComponent` odczyta ten parametr i wyświetli odpowiedni komunikat, np. "Nie masz uprawnień, aby uzyskać dostęp do tego panelu."
- **Inne błędy OAuth**: Wszelkie błędy zwrócone przez dostawcę OAuth w URL-u zwrotnym (np. `access_denied`) będą obsługiwane w `AuthCallbackComponent` i mogą skutkować wyświetleniem stosownego komunikatu na stronie logowania.

## 11. Kroki implementacji
1.  **Utworzenie modułu i routingu**: Stwórz `AdminModule` i `AdminRoutingModule`. Zdefiniuj w nim ścieżkę `/login`, która ładuje `AdminLoginPageComponent`.
2.  **Utworzenie komponentów**: Wygeneruj `AdminLoginPageComponent` (smart) i `AdminLoginFormComponent` (dumb) za pomocą Angular CLI.
3.  **Implementacja `AdminLoginFormComponent`**: Zbuduj szablon HTML z nagłówkiem, przyciskiem logowania Google oraz miejscami na komponenty `Spinner` i `Alert`. Zdefiniuj wejście `@Input() vm` i wyjście `@Output() login`.
4.  **Implementacja `AdminLoginPageComponent`**: 
    - Zainicjuj zarządzanie stanem za pomocą `BehaviorSubject<AdminLoginViewModel>`.
    - Wstrzyknij `AuthService`.
    - Zaimplementuj metodę, która będzie wywoływana w odpowiedzi na zdarzenie `(login)` z komponentu dziecka. Metoda ta wywoła `authService.signInWithGoogle()` i obsłuży ewentualne błędy.
    - Połącz stan z szablonem za pomocą potoku `async`.
5.  **Aktualizacja `AuthService`**: Upewnij się, że metoda `signInWithGoogle` jest poprawnie zaimplementowana i obsługuje przekierowanie.
6.  **Konfiguracja `noAuthGuard`**: Zastosuj `noAuthGuard` do ścieżki `/admin/login`, aby uniemożliwić dostęp zalogowanym użytkownikom.
7.  **Styling**: Użyj Tailwind CSS, aby ostylować komponenty zgodnie z designem aplikacji.
8.  **Testowanie**: Przetestuj ręcznie cały przepływ logowania, włączając w to obsługę błędów i przekierowania.
