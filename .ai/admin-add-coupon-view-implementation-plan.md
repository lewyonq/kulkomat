# Plan implementacji widoku: Dodawanie Kuponu przez Sprzedawcę

## 1. Przegląd

Widok ten stanowi część panelu administracyjnego i jest przeznaczony dla sprzedawców. Jego głównym celem jest umożliwienie szybkiego i bezbłędnego dodawania kuponów rabatowych (procentowych lub kwotowych) do konta wybranego klienta. Proces inicjowany jest poprzez wyszukanie klienta na podstawie jego unikalnego `short_id`. Widok składa się z formularza, który pozwala na zdefiniowanie typu i wartości kuponu oraz jego daty ważności.

## 2. Routing widoku

Widok powinien być dostępny po wyszukaniu klienta, wewnątrz panelu administracyjnego, jako zagnieżdżona ścieżka.

- **Ścieżka**: `/admin/customer/:id/add-coupon`
- **Ochrona**: Dostęp do tej ścieżki musi być chroniony przez `AdminGuard`, aby zapewnić, że tylko zalogowani sprzedawcy mogą z niej korzystać.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane jako samodzielne komponenty Angular (`standalone: true`), zgodnie z najlepszymi praktykami nowoczesnego Angulara.

```
AdminAddCouponPage (Komponent-strona, /admin/add-coupon)
└── AddCouponFormComponent (Komponent-formularz)
    ├── Input (dla short_id)
    ├── Select (dla typu kuponu)
    ├── Input (dla wartości kuponu)
    ├── Input (dla daty ważności)
    └── Button (do wysłania formularza)
```

## 4. Szczegóły komponentów

### `AdminAddCouponPage`

- **Opis komponentu**: Jest to główny komponent strony, który zarządza stanem i logiką biznesową. Odpowiada za komunikację z `AddCouponFormComponent`, obsługę wywołań API (za pośrednictwem serwisu) oraz zarządzanie stanem ładowania i błędów.
- **Główne elementy**: Zawiera komponent `AddCouponFormComponent` oraz wyświetla komunikaty o stanie operacji (np. sukces, błąd, ładowanie).
- **Obsługiwane interakcje**: Odbiera zdarzenie `formSubmit` z formularza i inicjuje proces dodawania kuponu.
- **Typy**: `AddCouponFormViewModel`, `ApiErrorResponse`.
- **Propsy**: Brak.

### `AddCouponFormComponent`

- **Opis komponentu**: Prezentacyjny komponent formularza, który zbiera od sprzedawcy wszystkie niezbędne dane do utworzenia kuponu. Odpowiada za walidację pól i emitowanie danych do komponentu nadrzędnego.
- **Główne elementy**: Pola formularza (`input` dla `short_id`, wartości i daty ważności; `select` dla typu kuponu) oraz przycisk `submit`.
- **Obsługiwane interakcje**: Emituje zdarzenie `formSubmit` z danymi z formularza (`AddCouponFormViewModel`), gdy formularz jest poprawnie wypełniony i zatwierdzony.
- **Obsługiwana walidacja**:
  - `short_id`: Wymagane, 6 znaków alfanumerycznych (`^[a-zA-Z0-9]{6}$`).
  - `type`: Wymagane, musi być jedną z wartości: `percentage` lub `amount`.
  - `value`: Wymagane, liczba dodatnia. Jeśli typ to `percentage`, wartość musi być w zakresie 1-100.
  - `expires_at`: Wymagane, musi być datą w przyszłości.
- **Typy**: `AddCouponFormViewModel`, `CouponType`.
- **Propsy**: Komponent przyjmuje stan ładowania (`isLoading: boolean`) w celu wyłączenia przycisku `submit` podczas przetwarzania żądania.

## 5. Typy

Do implementacji widoku wymagane będą następujące typy:

- **`CreateCouponCommand` (DTO)**: Obiekt transferu danych używany w żądaniu API do utworzenia kuponu. Zgodny z definicją w `src/app/types/index.ts`.
  ```typescript
  export interface CreateCouponCommand {
    user_id: string; // UUID klienta, pobrane na podstawie short_id
    type: CouponType; // 'percentage' | 'amount'
    value: number | null;
    expires_at: string; // Data w formacie ISO 8601
  }
  ```

- **`AddCouponFormViewModel` (ViewModel)**: Niestandardowy typ reprezentujący dane zebrane z formularza w komponencie `AddCouponFormComponent`. Służy jako pośrednik między formularzem a logiką biznesową.
  ```typescript
  export interface AddCouponFormViewModel {
    short_id: string;
    type: CouponType;
    value: number;
    expires_at: string; // Data w formacie YYYY-MM-DD
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w komponencie `AdminAddCouponPage` przy użyciu `Signal` z Angulara. Nie ma potrzeby tworzenia dedykowanego serwisu stanu (np. NgRx) dla tego widoku.

- **`isLoading = signal<boolean>(false)`**: Przechowuje stan ładowania operacji API. Używany do wyświetlania wskaźnika ładowania i blokowania formularza.
- **`error = signal<ApiErrorResponse | null>(null)`**: Przechowuje informacje o błędach zwróconych przez API.
- **`success = signal<boolean>(false)`**: Flaga informująca o pomyślnym dodaniu kuponu, używana do wyświetlenia komunikatu o sukcesie.

## 7. Integracja API

Integracja z API Supabase będzie realizowana poprzez dedykowany serwis, np. `CouponService`. Proces składa się z dwóch kroków:

1.  **Pobranie `user_id` klienta**: Na podstawie `short_id` wprowadzonego w formularzu, serwis musi wykonać zapytanie do tabeli `profiles`, aby znaleźć pasującego użytkownika i uzyskać jego `id` (UUID).
    - **Zapytanie**: `supabase.from('profiles').select('id').eq('short_id', shortId).single()`

2.  **Utworzenie kuponu**: Po uzyskaniu `user_id`, serwis wykonuje operację wstawienia nowego rekordu do tabeli `coupons` z danymi z formularza.
    - **Zapytanie**: `supabase.from('coupons').insert(createCouponCommand)`
    - **Typ żądania**: `CreateCouponCommand`
    - **Typ odpowiedzi**: Odpowiedź Supabase z danymi wstawionego kuponu lub błędem.

## 8. Interakcje użytkownika

- **Wprowadzanie danych**: Sprzedawca wypełnia pola formularza (`short_id`, typ, wartość, data ważności).
- **Walidacja na żywo**: Pola formularza są walidowane w czasie rzeczywistym, a komunikaty o błędach pojawiają się pod niepoprawnie wypełnionymi polami.
- **Zatwierdzenie formularza**: Sprzedawca klika przycisk "Dodaj kupon". Przycisk jest nieaktywny, jeśli formularz jest niepoprawny lub trwa operacja API.
- **Informacja zwrotna**: Po zatwierdzeniu, interfejs wyświetla stan operacji:
  - **Ładowanie**: Przycisk jest zablokowany, widoczny jest wskaźnik ładowania.
  - **Sukces**: Wyświetlany jest komunikat "Kupon został pomyślnie dodany", a formularz jest resetowany.
  - **Błąd**: Wyświetlany jest komunikat o błędzie, np. "Nie znaleziono klienta o podanym ID" lub "Wystąpił błąd serwera".

## 9. Warunki i walidacja

- **`short_id`**: Musi istnieć w bazie danych. Weryfikacja odbywa się po stronie serwisu (`CouponService`) podczas próby pobrania `user_id`.
- **`type` i `value`**: Jeśli `type` to `percentage`, `value` musi być w przedziale 1-100. Walidacja po stronie `AddCouponFormComponent`.
- **`expires_at`**: Data musi być w przyszłości. Walidacja po stronie `AddCouponFormComponent`.

## 10. Obsługa błędów

- **Klient nie znaleziony**: Jeśli `short_id` nie odpowiada żadnemu klientowi, `AdminAddCouponPage` otrzymuje błąd i wyświetla stosowny komunikat.
- **Błąd serwera**: W przypadku problemów z API (np. błąd 500), wyświetlany jest ogólny komunikat o błędzie.
- **Błąd walidacji API**: Jeśli API zwróci błąd walidacji (np. nieprawidłowy `user_id`), komunikat o błędzie jest wyświetlany użytkownikowi.

## 11. Kroki implementacji

1.  **Utworzenie komponentów**: Wygenerowanie `AdminAddCouponPage` i `AddCouponFormComponent` za pomocą Angular CLI (`ng g c admin/pages/add-coupon --standalone`, `ng g c admin/components/add-coupon-form --standalone`).
2.  **Implementacja formularza**: Zbudowanie formularza w `AddCouponFormComponent` przy użyciu `ReactiveFormsModule` i zaimplementowanie logiki walidacji.
3.  **Stworzenie/aktualizacja serwisu**: Dodanie w `CouponService` metody `addCoupon(command: AddCouponFormViewModel)`, która będzie obsługiwać logikę pobierania `user_id` i wstawiania kuponu.
4.  **Implementacja logiki strony**: W `AdminAddCouponPage` zaimplementowanie obsługi zdarzenia `formSubmit`, wywołanie serwisu i zarządzanie stanami `isLoading`, `error` i `success`.
5.  **Routing**: Dodanie nowej ścieżki `/admin/add-coupon` w konfiguracji routingu panelu administracyjnego, zabezpieczonej przez `AdminGuard`.
6.  **Stylizowanie**: Ostylowanie komponentów zgodnie z systemem projektowym aplikacji (Tailwind CSS).
7.  **Testowanie**: Utworzenie testów jednostkowych dla logiki walidacji w formularzu oraz dla logiki biznesowej w komponencie strony i serwisie.
