# Dokument wymagań produktu (PRD) - Kulkomat (MVP)
## 1. Przegląd produktu

Kulkomat (MVP) to aplikacja webowa zaprojektowana w celu cyfryzacji i ulepszenia programu lojalnościowego dla lodziarni. Głównym celem jest zastąpienie tradycyjnych, fizycznych kart stałego klienta wirtualnym systemem zbierania pieczątek i kuponów rabatowych. Projekt ma na celu rozwiązanie problemu klientów, którzy często zapominają lub gubią swoje fizyczne karty, co prowadzi do frustracji i utraty zgromadzonych korzyści. Aplikacja skupia się na zapewnieniu prostego, intuicyjnego interfejsu zarówno dla klientów, jak i właścicieli lodziarni, umożliwiając łatwe zarządzanie punktami lojalnościowymi.

## 2. Problem użytkownika

Klienci lodziarni często doświadczają niedogodności związanych z programami lojalnościowymi opartymi na fizycznych kartach. Najczęściej zapominają zabrać ze sobą karty z domu lub, co gorsza, gubią je, co skutkuje utratą już zebranych pieczątek i niemożnością skorzystania z przysługujących im nagród, takich jak darmowa gałka lodów. Ta sytuacja prowadzi do frustracji, obniżenia satysfakcji klienta oraz potencjalnie zmniejszenia częstotliwości odwiedzin lodziarni, ponieważ system lojalnościowy staje się dla nich bardziej obciążeniem niż korzyścią. W dzisiejszych czasach, gdy telefony komórkowe są zawsze pod ręką, fizyczna karta stanowi anachronizm, który można łatwo zastąpić wygodniejszym rozwiązaniem cyfrowym.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników
*   Użytkownicy mogą założyć konto w aplikacji webowej za pomocą adresu e-mail lub numeru telefonu.
*   Użytkownicy mogą zalogować się na swoje istniejące konto.
*   Użytkownicy mogą przeglądać swój unikalny identyfikator `user_id`.
*   Użytkownicy mogą resetować swoje hasło.
*   System przechowuje bezpiecznie dane użytkowników (e-mail/numer telefonu).

### 3.2. Zbieranie pieczątek i kuponów
*   Użytkownicy mogą przeglądać aktualną liczbę zebranych pieczątek.
*   Po osiągnięciu 10 pieczątek, system automatycznie generuje kupon na darmową gałkę lodów.
*   Konto użytkownika (liczba pieczątek) jest resetowane po wykorzystaniu kuponu na darmową gałkę.
*   Użytkownicy mogą przeglądać listę dostępnych kuponów rabatowych (procentowych i kwotowych).
*   Kupony rabatowe są widoczne dla sprzedawcy w panelu administracyjnym po wprowadzeniu `user_id` klienta.

### 3.3. Panel administracyjny (dla właściciela/sprzedawcy)
*   Właściciel/sprzedawca może zalogować się do panelu administracyjnego.
*   Właściciel/sprzedawca może dodawać pieczątki do konta użytkownika poprzez wprowadzenie `user_id` klienta.
*   Właściciel/sprzedawca może dodawać kupony rabatowe (procentowe i kwotowe) do konta użytkownika poprzez wprowadzenie `user_id` klienta.
*   Panel administracyjny zawiera zakładkę "Stali klienci" z listą użytkowników i ich aktywnością.
*   Właściciel/sprzedawca może przeglądać historię doładowań pieczątek i kuponów dla konkretnego `user_id`.
*   Właściciel/sprzedawca może generować jednorazowe kody dla nagród.
*   Panel administracyjny będzie prosty, zminimalizowany, zawierał listę użytkowników i formularz do dodawania pieczątek/kuponów.

### 3.4. Strony informacyjne
*   Strona główna wyświetla aktualne smaki lodów.
*   Strona "Historia" wyświetla historię doładowań pieczątek i otrzymanych kuponów dla zalogowanego użytkownika.
*   Dostępny jest prosty formularz kontaktowy w aplikacji dla użytkowników do zbierania opinii i zgłaszania problemów.

### 3.5. Weryfikacja i bezpieczeństwo
*   System zapewnia bezpieczne przechowywanie danych użytkowników (e-mail/numer telefonu).
*   Mechanizm uwierzytelniania sprzedawcy w panelu administracyjnym jest bezpieczny.
*   Tylko autoryzowany personel (właściciel/sprzedawca) ma dostęp do panelu administracyjnego i możliwość dodawania pieczątek/kuponów.
*   Przy dodawaniu pieczątek przez `user_id`, sprzedawca jest zobligowany do wizualnej weryfikacji tożsamości klienta (np. prośba o pokazanie `user_id` na ekranie telefonu).

## 4. Granice produktu

### 4.1. Zakres MVP
*   Aplikacja będzie dostępna wyłącznie jako aplikacja webowa (brak dedykowanych aplikacji mobilnych na iOS/Android).
*   System skupia się tylko na zarządzaniu programem lojalnościowym (pieczątki na lody, kupony procentowe/kwotowe).
*   Dane osobowe ograniczają się do e-maila lub numeru telefonu.
*   System pieczątek dotyczy wyłącznie zakupu lodów.
*   Kupony rabatowe są naliczane ręcznie przez sprzedawcę.
*   Panel administracyjny jest przeznaczony dla jednego właściciela/pracownika (brak zaawansowanego systemu ról i uprawnień).
*   Weryfikacja dodania pieczątek odbywa się poprzez wprowadzenie `user_id` (w przyszłości planowane skanowanie kodów QR).
*   Jednorazowe kody są przeznaczone tylko do rozdawania nagród, nie do zbierania pieczątek.
*   Prosty formularz kontaktowy jest jedynym kanałem zbierania opinii w ramach aplikacji.

### 4.2. Poza zakresem MVP
*   Aplikacje mobilne (iOS, Android).
*   System do obsługi zamówień online.
*   System do obsługi płatności.
*   System do obsługi rezerwacji.
*   Rozbudowane funkcje skalowalności i obsługi wielu lokalizacji.
*   Zaawansowany marketing w aplikacji lub integracje z platformami marketingowymi.
*   Automatyczne naliczanie rabatów na podstawie kuponów.
*   Skanowanie QR kodów w celu zbierania pieczątek (funkcjonalność na przyszłość, poza MVP).

## 5. Historyjki użytkowników

### 5.1. Historyjki użytkownika - Klient

- ID: US-001
  Tytuł: Rejestracja nowego konta
  Opis: Jako nowy klient chcę zarejestrować konto w aplikacji, aby móc zbierać pieczątki.
  Kryteria akceptacji:
    - Użytkownik wchodzi na stronę rejestracji.
    - Użytkownik wprowadza poprawny adres e-mail lub numer telefonu.
    - Użytkownik wprowadza i potwierdza hasło.
    - Użytkownik akceptuje politykę prywatności.
    - System tworzy nowe konto i przekierowuje użytkownika na stronę główną.
    - Użytkownik otrzymuje potwierdzenie rejestracji (np. e-mail/SMS).

- ID: US-002
  Tytuł: Logowanie do istniejącego konta
  Opis: Jako zarejestrowany klient chcę zalogować się do aplikacji, aby uzyskać dostęp do moich pieczątek i kuponów.
  Kryteria akceptacji:
    - Użytkownik wchodzi na stronę logowania.
    - Użytkownik wprowadza poprawny adres e-mail/numer telefonu i hasło.
    - System autoryzuje użytkownika i przekierowuje go na stronę główną.

- ID: US-003
  Tytuł: Wyświetlanie aktualnych pieczątek
  Opis: Jako zalogowany klient chcę zobaczyć, ile mam zebranych pieczątek, aby wiedzieć, ile brakuje mi do darmowej gałki.
  Kryteria akceptacji:
    - Po zalogowaniu, na stronie głównej lub dedykowanej zakładce wyświetlana jest aktualna liczba pieczątek.
    - Liczba pieczątek jest czytelna i łatwo dostępna.

- ID: US-004
  Tytuł: Wyświetlanie unikalnego ID użytkownika
  Opis: Jako zalogowany klient chcę szybko znaleźć i pokazać swój unikalny `user_id` sprzedawcy, aby otrzymać pieczątkę.
  Kryteria akceptacji:
    - Na stronie głównej lub w profilu użytkownika wyświetlany jest unikalny `user_id` w czytelny sposób.
    - Sprzedawca jest w stanie łatwo odczytać `user_id` z ekranu telefonu klienta.

- ID: US-005
  Tytuł: Otrzymywanie kuponu na darmową gałkę
  Opis: Jako klient, po zebraniu 10 pieczątek, chcę automatycznie otrzymać kupon na darmową gałkę lodów.
  Kryteria akceptacji:
    - Po dodaniu dziesiątej pieczątki, system automatycznie generuje kupon na darmową gałkę.
    - Na koncie użytkownika pojawia się nowy kupon na darmową gałkę.
    - Liczba pieczątek na koncie użytkownika zostaje zresetowana do zera.

- ID: US-006
  Tytuł: Przeglądanie dostępnych kuponów
  Opis: Jako zalogowany klient chcę przeglądać moje dostępne kupony rabatowe, aby wiedzieć, z czego mogę skorzystać.
  Kryteria akceptacji:
    - Na dedykowanej zakładce wyświetlana jest lista wszystkich aktywnych kuponów (darmowa gałka, procentowe, kwotowe).
    - Kupony są opisane w czytelny sposób (np. rodzaj, wartość, warunki).

- ID: US-007
  Tytuł: Wykorzystanie kuponu
  Opis: Jako zalogowany klient chcę wykorzystać kupon, informując o tym sprzedawcę.
  Kryteria akceptacji:
    - Klient informuje sprzedawcę o chęci wykorzystania konkretnego kuponu.
    - Sprzedawca weryfikuje dostępność kuponu w panelu administracyjnym po wprowadzeniu `user_id`.
    - Sprzedawca ręcznie nalicza rabat.
    - Kupon zostaje oznaczony jako wykorzystany w systemie.

- ID: US-008
  Tytuł: Przeglądanie historii doładowań pieczątek i kuponów
  Opis: Jako zalogowany klient chcę widzieć historię moich doładowań pieczątek i otrzymanych kuponów, aby śledzić moją aktywność.
  Kryteria akceptacji:
    - Na zakładce "Historia" wyświetlana jest chronologiczna lista wszystkich dodanych pieczątek.
    - Na zakładce "Historia" wyświetlana jest chronologiczna lista wszystkich otrzymanych i wykorzystanych kuponów.
    - Każdy wpis w historii zawiera datę i typ zdarzenia.

- ID: US-009
  Tytuł: Wyświetlanie aktualnych smaków lodów
  Opis: Jako klient chcę widzieć aktualne smaki lodów na stronie głównej, aby ułatwić sobie wybór.
  Kryteria akceptacji:
    - Na stronie głównej aplikacji wyświetlana jest aktualna lista smaków lodów.
    - Lista smaków jest czytelna i aktualizowana.

- ID: US-010
  Tytuł: Wysyłanie opinii przez formularz kontaktowy
  Opis: Jako klient chcę móc wysłać opinię lub zgłosić problem za pomocą prostego formularza kontaktowego w aplikacji.
  Kryteria akceptacji:
    - W aplikacji dostępny jest formularz kontaktowy.
    - Formularz umożliwia wpisanie wiadomości i (opcjonalnie) danych kontaktowych.
    - Po wysłaniu formularza użytkownik otrzymuje potwierdzenie.
    - Wiadomość trafia do systemu zarządzania feedbackiem.

- ID: US-011
  Tytuł: Resetowanie hasła
  Opis: Jako klient, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby ponownie uzyskać dostęp do konta.
  Kryteria akceptacji:
    - Na stronie logowania dostępna jest opcja "Nie pamiętam hasła".
    - Użytkownik wprowadza swój adres e-mail/numer telefonu.
    - System wysyła link/kod do resetowania hasła na podany adres/numer.
    - Użytkownik może ustawić nowe hasło.

- ID: US-012
  Tytuł: Bezpieczne przechowywanie danych
  Opis: Jako klient oczekuję, że moje dane (e-mail/numer telefonu) będą bezpiecznie przechowywane w aplikacji.
  Kryteria akceptacji:
    - Dane użytkowników są przechowywane zgodnie ze standardami bezpieczeństwa (szyfrowanie, polityka prywatności).
    - Brak incydentów bezpieczeństwa związanych z danymi użytkowników.

### 5.2. Historyjki użytkownika - Właściciel/Sprzedawca

- ID: US-013
  Tytuł: Logowanie do panelu administracyjnego
  Opis: Jako sprzedawca chcę zalogować się do panelu administracyjnego, aby zarządzać pieczątkami i kuponami klientów.
  Kryteria akceptacji:
    - Sprzedawca wchodzi na stronę logowania do panelu administracyjnego.
    - Sprzedawca wprowadza poprawne dane logowania (login, hasło).
    - System autoryzuje sprzedawcę i przekierowuje go do panelu administracyjnego.

- ID: US-014
  Tytuł: Dodawanie pieczątek klientowi
  Opis: Jako sprzedawca chcę dodać pieczątkę do konta klienta po dokonaniu zakupu.
  Kryteria akceptacji:
    - Sprzedawca loguje się do panelu administracyjnego.
    - Sprzedawca przechodzi do zakładki "Stali klienci" lub formularza dodawania pieczątek.
    - Sprzedawca wprowadza `user_id` klienta.
    - Sprzedawca wizualnie weryfikuje `user_id` z ekranu klienta.
    - Sprzedawca wprowadza liczbę pieczątek do dodania (domyślnie 1).
    - System pomyślnie dodaje pieczątki do konta klienta.
    - Klient widzi zaktualizowaną liczbę pieczątek w swojej aplikacji.

- ID: US-015
  Tytuł: Dodawanie kuponów rabatowych klientowi
  Opis: Jako sprzedawca chcę dodać kupon rabatowy (procentowy/kwotowy) do konta klienta.
  Kryteria akceptacji:
    - Sprzedawca loguje się do panelu administracyjnego.
    - Sprzedawca przechodzi do zakładki "Stali klienci" lub formularza dodawania kuponów.
    - Sprzedawca wprowadza `user_id` klienta.
    - Sprzedawca wybiera rodzaj kuponu (procentowy/kwotowy) i jego wartość.
    - System pomyślnie dodaje kupon do konta klienta.
    - Klient widzi nowy kupon w swojej aplikacji.

- ID: US-016
  Tytuł: Przeglądanie listy stałych klientów
  Opis: Jako sprzedawca chcę mieć dostęp do listy stałych klientów i ich podstawowych danych (np. `user_id`), aby szybko ich identyfikować.
  Kryteria akceptacji:
    - W panelu administracyjnym dostępna jest zakładka "Stali klienci".
    - Zakładka wyświetla listę zarejestrowanych klientów.
    - Dla każdego klienta widoczne są podstawowe informacje (np. `user_id`, liczba pieczątek, dostępne kupony).

- ID: US-017
  Tytuł: Przeglądanie historii klienta
  Opis: Jako sprzedawca chcę móc zobaczyć historię doładowań pieczątek i kuponów dla konkretnego klienta, aby lepiej zrozumieć jego aktywność.
  Kryteria akceptacji:
    - Z poziomu listy "Stali klienci" lub po wprowadzeniu `user_id` sprzedawca może wyświetlić szczegółową historię danego klienta.
    - Historia zawiera daty i szczegóły dodanych pieczątek oraz otrzymanych/wykorzystanych kuponów.

- ID: US-018
  Tytuł: Weryfikacja kuponów klienta
  Opis: Jako sprzedawca chcę mieć możliwość szybkiego sprawdzenia, jakie kupony są dostępne dla danego klienta, aby prawidłowo naliczyć rabat.
  Kryteria akceptacji:
    - Po wprowadzeniu `user_id` klienta w panelu administracyjnym, wyświetlana jest lista jego aktywnych kuponów.
    - Sprzedawca może oznaczyć kupon jako wykorzystany po jego użyciu.

- ID: US-019
  Tytuł: Generowanie jednorazowych kodów nagród
  Opis: Jako właściciel chcę mieć możliwość generowania jednorazowych kodów, które mogę rozdawać jako dodatkowe nagrody.
  Kryteria akceptacji:
    - W panelu administracyjnym dostępna jest funkcja generowania jednorazowych kodów.
    - Wygenerowany kod jest unikalny i ma określony termin ważności/cel.
    - Kod może być ręcznie przekazany klientowi.

- ID: US-020
  Tytuł: Bezpieczny dostęp do panelu administracyjnego
  Opis: Jako sprzedawca chcę mieć pewność, że tylko ja (lub autoryzowany pracownik) mam dostęp do panelu administracyjnego.
  Kryteria akceptacji:
    - Logowanie do panelu administracyjnego wymaga unikalnych danych uwierzytelniających.
    - Połączenie z panelem administracyjnym jest szyfrowane (HTTPS).
    - Brak nieautoryzowanych prób logowania do panelu administracyjnego.

## 6. Metryki sukcesu

*   **Liczba zarejestrowanych użytkowników:**
    *   Miernik: Liczba unikalnych kont założonych w aplikacji w ciągu miesiąca.
    *   Cel: Osiągnięcie 50 nowych rejestracji w pierwszym miesiącu po uruchomieniu.
    *   Dlaczego to jest ważne: Wskazuje na przyjęcie aplikacji przez klientów i skuteczność informowania o niej.

*   **Wskaźnik aktywacji pieczątek:**
    *   Miernik: Procent transakcji, w których klient poprosił o dodanie pieczątki, spośród wszystkich kwalifikujących się transakcji.
    *   Cel: 60% transakcji zakończonych dodaniem pieczątki.
    *   Dlaczego to jest ważne: Pokazuje, jak często klienci korzystają z aplikacji i jak efektywnie sprzedawcy promują program.

*   **Czas dodania pieczątki przez sprzedawcę:**
    *   Miernik: Średni czas od momentu podania `user_id` przez klienta do pomyślnego dodania pieczątki w panelu administracyjnym.
    *   Cel: Poniżej 10 sekund.
    *   Dlaczego to jest ważne: Krótki czas operacji zapewnia płynność obsługi klienta i minimalizuje kolejki.

*   **Wskaźnik wykorzystania kuponów na darmową gałkę:**
    *   Miernik: Procent wygenerowanych kuponów na darmową gałkę, które zostały faktycznie wykorzystane przez klientów.
    *   Cel: Minimum 70% wykorzystania w ciągu 30 dni od wygenerowania.
    *   Dlaczego to jest ważne: Wskazuje na atrakcyjność nagród i motywację klientów do dalszego zbierania.

*   **Feedback od użytkowników (ankiety i formularz kontaktowy):**
    *   Miernik: Ocena ogólnej satysfakcji i łatwości użycia w ankietach (skala 1-5), liczba zgłoszonych błędów/sugestii przez formularz.
    *   Cel: Średnia ocena satysfakcji > 4; mniej niż 5 krytycznych błędów zgłoszonych w miesiącu.
    *   Dlaczego to jest ważne: Bezpośrednio mierzy użyteczność i zadowolenie użytkowników.

*   **Wskaźnik bezpieczeństwa danych:**
    *   Miernik: Brak zgłoszonych incydentów naruszenia bezpieczeństwa danych (e-mail, numer telefonu).
    *   Cel: 0 incydentów.
    *   Dlaczego to jest ważne: Krytyczne dla zaufania użytkowników i zgodności z przepisami.

*   **Jakość kodu i testowalność:**
    *   Miernik: Wyniki przeglądów kodu (np. ocena czystości kodu, pokrycie testami jednostkowymi).
    *   Cel: Pokrycie testami jednostkowymi na poziomie > 80%; brak dużej liczby zgłoszonych "code smells" w narzędziach analitycznych.
    *   Dlaczego to jest ważne: Zapewnia stabilność, łatwość utrzymania i przyszłej rozbudowy systemu.