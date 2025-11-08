# Plan implementacji widoku: Kontakt

## 1. Przegląd

Widok "Kontakt" ma na celu umożliwienie zalogowanym użytkownikom wysyłanie wiadomości, opinii lub zgłoszeń problemów do obsługi aplikacji. Składa się z prostego formularza, który po pomyślnym wysłaniu wyświetla użytkownikowi potwierdzenie. Widok jest chroniony i dostępny tylko dla uwierzytelnionych użytkowników.

## 2. Routing widoku

- **Ścieżka**: `/contact`
- **Ochrona**: Widok powinien być chroniony przez `AuthGuard`, aby zapewnić, że tylko zalogowani użytkownicy mają do niego dostęp.

## 3. Struktura komponentów

Widok będzie zaimplementowany jako pojedynczy, inteligentny komponent (`ContactPageComponent`), który zarządza stanem formularza i komunikacją z API.

```
ContactPageComponent
└── Reactive Form (obsługiwany wewnątrz komponentu)
    ├── Input (Email) - pole tylko do odczytu
    ├── Textarea (Wiadomość)
    └── Button (Wyślij)
```

## 4. Szczegóły komponentu

### `ContactPageComponent`

- **Opis komponentu**: Jest to inteligentny komponent strony, który renderuje formularz kontaktowy. Odpowiada za pobranie danych zalogowanego użytkownika, zarządzanie stanem formularza, walidację wprowadzanych danych oraz obsługę komunikacji z API w celu wysłania wiadomości.

- **Główne elementy**: Komponent będzie zbudowany przy użyciu `ReactiveFormsModule` z Angulara.
  - `form` z `FormGroup`.
  - `input` dla adresu e-mail użytkownika (pole `readonly`).
  - `textarea` dla treści wiadomości.
  - `button` typu `submit` do wysłania formularza.
  - Elementy do wyświetlania komunikatów walidacyjnych.
  - Element do wyświetlania komunikatu o sukcesie lub błędzie po próbie wysłania.

- **Obsługiwane interakcje**:
  - `ngSubmit`: Uruchamia proces wysyłania formularza.

- **Obsługiwana walidacja**:
  - **Wiadomość (`message`)**: 
    - `Validators.required`: Pole jest wymagane.
    - `Validators.minLength(10)`: Wiadomość musi mieć co najmniej 10 znaków.

- **Typy**:
  - `ContactFormViewModel`: `{ email: FormControl<string>; message: FormControl<string>; }`
  - `CreateContactSubmissionCommand`: `{ email?: string | null; message: string; }`
  - `CreateContactSubmissionResponseDTO`: `{ id: number; message: string; created_at: string; }`

- **Propsy**: Komponent nie przyjmuje żadnych propsów (`@Input`). Dane użytkownika pobiera z `AuthService`.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy DTO oraz jeden nowy typ dla modelu formularza:

- **`CreateContactSubmissionCommand`** (istniejący w `src/app/types/index.ts`)
  - `email?: string | null`: Opcjonalny adres email. W przypadku zalogowanego użytkownika będzie on pobrany z sesji i może być pominięty w żądaniu.
  - `message: string`: Treść wiadomości, wymagana.

- **`CreateContactSubmissionResponseDTO`** (istniejący)
  - `id: number`: ID utworzonego zgłoszenia.
  - `message: string`: Potwierdzenie treści wiadomości.
  - `created_at: string`: Data utworzenia zgłoszenia.

- **`ContactFormViewModel`** (nowy, do zdefiniowania w komponencie)
  - `email: FormControl<string>`: Kontrolka formularza dla adresu email (wartość ustawiona na stałe, pole zablokowane).
  - `message: FormControl<string>`: Kontrolka formularza dla treści wiadomości.

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany lokalnie w `ContactPageComponent`.

- **Formularz reaktywny**: `FormGroup` będzie przechowywać stan pól formularza (wartości, status walidacji).
- **Stan ładowania**: Zmienna `isLoading: boolean` będzie śledzić stan komunikacji z API, aby zablokować przycisk wysyłania i pokazać wskaźnik ładowania.
- **Stan odpowiedzi API**: Zmienne `isSuccess: boolean` i `error: string | null` będą przechowywać wynik operacji wysyłania, aby wyświetlić odpowiedni komunikat użytkownikowi.

Nie ma potrzeby tworzenia dedykowanego serwisu stanu (np. NgRx) ani customowego hooka dla tak prostego widoku.

## 7. Integracja API

Integracja z backendem (Supabase) odbędzie się poprzez dedykowany serwis, np. `ContactService`.

1.  **Utworzenie serwisu**: Należy stworzyć `ContactService`, który będzie zawierał metodę `submit(command: CreateContactSubmissionCommand)`.
2.  **Wywołanie API**: Metoda `submit` będzie korzystać z klienta Supabase do wywołania funkcji RPC lub bezpośredniego wstawienia rekordu do tabeli `contact_submissions`.
    - **Żądanie**: `POST /rest/v1/contact_submissions` z ciałem typu `CreateContactSubmissionCommand`.
    - **Odpowiedź (sukces)**: Obiekt typu `CreateContactSubmissionResponseDTO` (lub `void`, jeśli API nie zwraca ciała odpowiedzi).
    - **Odpowiedź (błąd)**: Obiekt błędu z Supabase.
3.  **Wstrzyknięcie serwisu**: `ContactService` oraz `AuthService` zostaną wstrzyknięte do `ContactPageComponent`.

## 8. Interakcje użytkownika

- **Wpisywanie wiadomości**: Użytkownik wpisuje treść w pole `textarea`. Walidacja `minLength` jest sprawdzana na bieżąco.
- **Wysyłanie formularza**: 
  - Użytkownik klika przycisk "Wyślij".
  - Przycisk jest nieaktywny, jeśli formularz jest nieprawidłowy lub trwa wysyłanie.
  - Po kliknięciu komponent pokazuje stan ładowania.
- **Potwierdzenie wysłania**: Po pomyślnym wysłaniu formularz jest resetowany, a na ekranie pojawia się komunikat o sukcesie (np. "Dziękujemy za wiadomość!").
- **Obsługa błędu**: W razie błędu API, pod formularzem wyświetlany jest komunikat błędu (np. "Wystąpił błąd. Spróbuj ponownie później.").

## 9. Warunki i walidacja

- **Przycisk "Wyślij"**: Jest aktywny (`disabled="false"`) tylko wtedy, gdy `form.valid` jest `true` oraz `isLoading` jest `false`.
- **Pole `message`**: Komunikat o błędzie walidacji (`minLength`) jest wyświetlany, gdy pole zostało dotknięte (`touched`) i jest nieprawidłowe (`invalid`).

## 10. Obsługa błędów

- **Błędy walidacji formularza**: Obsługiwane po stronie klienta przez Angular Reactive Forms. Użytkownik jest informowany o wymaganiach (np. minimalna długość wiadomości).
- **Błędy sieciowe/API**: Wszelkie błędy zwracane przez `ContactService` podczas wywołania API zostaną przechwycone w bloku `catchError`. Komponent ustawi stan błędu (`error = '...'`), co spowoduje wyświetlenie generycznego komunikatu dla użytkownika.
- **Przypadki brzegowe**: Jeśli `AuthService` nie zwróci zalogowanego użytkownika (mimo przejścia przez `AuthGuard`), formularz nie powinien być wyświetlany lub powinien pokazywać błąd.

## 11. Kroki implementacji

1.  **Utworzenie komponentu**: Wygeneruj nowy komponent strony za pomocą Angular CLI: `ng generate component pages/contact --standalone`.
2.  **Routing**: Dodaj nową ścieżkę `/contact` w głównym pliku routingowym (`app.routes.ts`), przypisując do niej `ContactPageComponent` i zabezpieczając ją za pomocą `AuthGuard`.
3.  **Budowa formularza**: W `ContactPageComponent` zaimplementuj formularz reaktywny z polami `email` (tylko do odczytu) i `message`.
4.  **Pobranie danych użytkownika**: Wstrzyknij `AuthService` i w `ngOnInit` pobierz email zalogowanego użytkownika, aby ustawić go w formularzu.
5.  **Walidacja**: Dodaj walidatory `required` i `minLength` do kontrolki `message`.
6.  **Utworzenie serwisu**: Stwórz `ContactService` z metodą `submit(command: CreateContactSubmissionCommand)`.
7.  **Implementacja logiki wysyłania**: W `ContactPageComponent` zaimplementuj metodę `onSubmit()`, która wywołuje `contactService.submit()` i obsługuje stany `isLoading`, `isSuccess` oraz `error`.
8.  **UI i style**: Ostyluj formularz i komunikaty (sukcesu, błędu, walidacji) zgodnie z systemem designu aplikacji (Tailwind CSS).
9.  **Testowanie**: Sprawdź ręcznie działanie formularza, walidacji, komunikacji z API oraz obsługi błędów.
