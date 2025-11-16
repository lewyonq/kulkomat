Chắc chắn rồi, đây là một phức hợp kế hoạch kiểm thử cho dự án Kulkomat.

---

# Plan Testów Aplikacji Lojalnościowej "Kulkomat"

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji "Kulkomat" – systemu lojalnościowego dla lodziarni, zbudowanego w oparciu o framework Angular i platformę Supabase. Plan ten ma na celu zapewnienie, że finalny produkt będzie spełniał najwyższe standardy jakości, funkcjonalności, bezpieczeństwa i użyteczności.

### 1.2. Cele Testowania

Głównymi celami procesu testowania są:

- **Weryfikacja Funkcjonalności:** Upewnienie się, że wszystkie funkcje aplikacji, zarówno po stronie klienta, jak i panelu administracyjnego, działają zgodnie ze specyfikacją.
- **Zapewnienie Bezpieczeństwa:** Sprawdzenie, czy mechanizmy uwierzytelniania i autoryzacji skutecznie chronią dane użytkowników i zasoby systemowe.
- **Gwarancja Jakości Danych:** Potwierdzenie integralności i spójności danych w bazie Supabase, zwłaszcza w kontekście operacji w czasie rzeczywistym.
- **Ocena Użyteczności i Doświadczenia Użytkownika (UX):** Zapewnienie, że interfejs jest intuicyjny, responsywny i spójny wizualnie na różnych urządzeniach.
- **Identyfikacja i Raportowanie Błędów:** Wczesne wykrywanie defektów w celu minimalizacji kosztów i ryzyka związanego z ich naprawą.
- **Walidacja Gotowości do Wdrożenia:** Ostateczne potwierdzenie, że aplikacja jest stabilna, wydajna i gotowa do udostępnienia użytkownikom końcowym.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami (In-Scope)

- **Moduł Uwierzytelniania:**
  - Logowanie i wylogowywanie użytkowników za pomocą dostawcy OAuth (Google).
  - Logowanie i wylogowywanie administratorów (sprzedawców).
  - Obsługa sesji użytkownika i tokenów.
  - Mechanizmy `AuthGuard`, `AdminGuard` i `LoginRedirectGuard`.
- **Panel Użytkownika:**
  - Dashboard: Wyświetlanie postępu zbierania pieczątek, nawigacja do kuponów, lista smaków lodów.
  - Strona Kuponów: Wyświetlanie listy aktywnych i wykorzystanych kuponów, mechanizm "użycia" kuponu, aktualizacje w czasie rzeczywistym.
  - Profil Użytkownika: Wyświetlanie danych (e-mail, data dołączenia), unikalnego kodu QR i ID klienta.
  - Historia Aktywności: Chronologiczna lista wszystkich zdarzeń (otrzymanie pieczątki, wygenerowanie/użycie kuponu).
  - Formularz Kontaktowy: Możliwość wysłania wiadomości przez zalogowanego użytkownika.
- **Panel Administracyjny (Sprzedawcy):**
  - Wyszukiwanie klienta po jego unikalnym ID.
  - Zarządzanie pieczątkami klienta (dodawanie).
  - Zarządzanie kuponami klienta (ręczne dodawanie kuponów rabatowych).
  - Podgląd szczegółowej historii aktywności wybranego klienta.
- **Aspekty Niefunkcjonalne:**
  - Responsywność interfejsu użytkownika (mobile, tablet, desktop).
  - Podstawowa walidacja pod kątem dostępności (ARIA attributes).
  - Spójność wizualna i zgodność z definicjami stylów (CSS variables, Tailwind CSS).

### 2.2. Funkcjonalności wyłączone z testów (Out-of-Scope)

- Testowanie infrastruktury i usług platformy Supabase (np. wydajność bazy danych, działanie serwerów).
- Testowanie mechanizmów logowania po stronie dostawcy OAuth (Google).
- Testy penetracyjne i zaawansowane testy bezpieczeństwa wykraczające poza weryfikację logiki aplikacji.
- Testy wydajnościowe pod dużym obciążeniem (Load/Stress Testing), chyba że zostaną zdefiniowane jako oddzielne wymaganie.

## 3. Typy Testów do Przeprowadzenia

Proces testowania zostanie podzielony na kilka kluczowych typów, aby zapewnić kompleksowe pokrycie aplikacji.

| Typ Testu                                            | Opis                                                                                                                                                                                                                           | Narzędzia/Metody                                                                          |
| :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Testy Jednostkowe**                                | Weryfikacja poprawności działania pojedynczych, izolowanych fragmentów kodu – głównie logiki w serwisach (np. `CouponService`, `StampService`) i złożonych funkcji pomocniczych.                                               | Jasmine, Jest, `TestBed`                                                                  |
| **Testy Komponentów**                                | Testowanie pojedynczych komponentów Angular w izolacji w celu weryfikacji ich renderowania, interakcji z `@Input`/`@Output` oraz logiki wewnętrznej.                                                                           | Angular `TestBed`, Storybook, Cypress/Playwright Component Testing                        |
| **Testy Integracyjne**                               | Weryfikacja współpracy pomiędzy różnymi częściami systemu, np. interakcji między komponentem-stroną, serwisem, a mockowanym API Supabase.                                                                                      | Angular `TestBed` (z mockowanymi serwisami), Cypress/Playwright                           |
| **Testy End-to-End (E2E)**                           | Symulacja kompletnych przepływów użytkownika w aplikacji działającej w środowisku zbliżonym do produkcyjnego. Weryfikacja kluczowych ścieżek z perspektywy użytkownika i administratora.                                       | Cypress, Playwright                                                                       |
| **Testy Bezpieczeństwa**                             | Skupienie się na weryfikacji mechanizmów autoryzacji. Testowanie `guards` poprzez próby dostępu do chronionych ścieżek bez uprawnień oraz weryfikacja logiki filtrowania danych (np. czy użytkownik widzi tylko swoje kupony). | Testy E2E, manualna weryfikacja                                                           |
| **Testy Interfejsu Użytkownika (UI) i Użyteczności** | Weryfikacja wizualnej spójności, responsywności na różnych rozdzielczościach oraz podstawowej dostępności (testy manualne i automatyczne testy regresji wizualnej).                                                            | Manualne przeglądy, narzędzia deweloperskie w przeglądarce, opcjonalnie: Percy, Chromatic |

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej przedstawiono przykładowe, wysokopoziomowe scenariusze testowe dla najważniejszych modułów aplikacji.

### 4.1. Uwierzytelnianie i Autoryzacja

- **TC-AUTH-01:** Użytkownik może pomyślnie zalogować się za pomocą konta Google.
- **TC-AUTH-02:** Użytkownik jest poprawnie przekierowywany na stronę docelową po zalogowaniu.
- **TC-AUTH-03:** Użytkownik może się pomyślnie wylogować i zostaje przekierowany na stronę logowania.
- **TC-AUTH-04:** Niezalogowany użytkownik, próbując uzyskać dostęp do chronionej strony (np. `/dashboard`), jest przekierowywany na `/login`.
- **TC-AUTH-05:** Zalogowany użytkownik, próbując uzyskać dostęp do strony logowania (`/login`), jest przekierowywany na stronę główną (`/`).
- **TC-AUTH-06:** Zalogowany użytkownik bez uprawnień sprzedawcy, próbując uzyskać dostęp do panelu admina (np. `/admin/dashboard`), jest przekierowywany na stronę główną (`/`).
- **TC-AUTH-07:** Użytkownik z uprawnieniami sprzedawcy może pomyślnie uzyskać dostęp do `/admin/dashboard`.

### 4.2. Panel Użytkownika

- **TC-DASH-01:** Na dashboardzie poprawnie wyświetla się aktualna liczba zebranych pieczątek.
- **TC-DASH-02:** Liczba aktywnych kuponów na karcie nawigacyjnej zgadza się z rzeczywistą liczbą.
- **TC-COUP-01:** Strona `/coupons` wyświetla wszystkie kupony użytkownika, z aktywnymi na górze listy.
- **TC-COUP-02:** Użytkownik może pomyślnie "użyć" aktywnego kuponu, co zmienia jego status na "wykorzystany".
- **TC-COUP-03:** Interfejs użytkownika na stronie `/coupons` aktualizuje się w czasie rzeczywistym, gdy administrator doda nowy kupon.
- **TC-PROF-01:** Strona `/profile` poprawnie wyświetla e-mail, datę dołączenia oraz unikalne ID i kod QR użytkownika.
- **TC-HIST-01:** Strona `/history` wyświetla chronologiczną i kompletną listę aktywności użytkownika.
- **TC-CONTACT-01:** Zalogowany użytkownik może pomyślnie wysłać wiadomość przez formularz kontaktowy.

### 4.3. Panel Administracyjny

- **TC-ADMIN-01:** Administrator może wyszukać klienta po jego 6-znakowym ID. Wyszukiwanie jest niewrażliwe na wielkość liter.
- **TC-ADMIN-02:** Wyświetlenie komunikatu o błędzie, gdy klient o podanym ID nie istnieje.
- **TC-ADMIN-03:** Po znalezieniu klienta, administrator widzi poprawne dane, w tym aktualną liczbę pieczątek.
- **TC-ADMIN-04:** Administrator może pomyślnie dodać określoną liczbę pieczątek klientowi.
- **TC-ADMIN-05:** Po dodaniu pieczątek, ich liczba na ekranie administratora jest natychmiast aktualizowana.
- **TC-ADMIN-06:** Administrator może pomyślnie dodać nowy kupon (procentowy lub kwotowy) dla klienta, poprawnie walidując dane wejściowe (np. zakres procentowy 1-100).
- **TC-ADMIN-07:** Administrator może wyświetlić pełną historię aktywności wybranego klienta.

## 5. Środowisko Testowe

- **Środowisko Frontend:** Aplikacja uruchamiana lokalnie lub w dedykowanym środowisku stagingowym (np. Vercel, Netlify).
- **Środowisko Backend:** Dedykowany, oddzielny projekt Supabase przeznaczony wyłącznie do celów testowych. Musi on być regularnie synchronizowany ze schematem bazy produkcyjnej (migracje).
- **Dane Testowe:** Przygotowany zestaw danych (seed data) w testowej bazie Supabase, zawierający:
  - Użytkowników testowych (zwykłych i z uprawnieniami sprzedawcy).
  - Użytkowników z różną liczbą pieczątek i kuponów.
  - Kupony o różnych statusach (aktywne, wykorzystane, przeterminowane).
- **Przeglądarki:** Testy będą przeprowadzane na najnowszych wersjach przeglądarek:
  - Google Chrome (główna platforma testowa)
  - Mozilla Firefox
  - Safari (opcjonalnie, w zależności od grupy docelowej)
- **Urządzenia:** Symulacja urządzeń mobilnych i tabletów za pomocą narzędzi deweloperskich przeglądarki oraz testy na co najmniej jednym fizycznym urządzeniu mobilnym (iOS/Android).

## 6. Narzędzia do Testowania

| Kategoria                                              | Narzędzie                                              | Zastosowanie                                                                                                |
| :----------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Framework do testów jednostkowych i komponentowych** | **Jasmine / Jest**                                     | Pisanie i uruchamianie testów jednostkowych dla logiki w serwisach Angulara.                                |
| **Framework do testów E2E i integracyjnych**           | **Cypress** lub **Playwright**                         | Automatyzacja scenariuszy End-to-End, testowanie integracji komponentów, obsługa mockowania API.            |
| **Biblioteka do testowania komponentów UI**            | **Storybook**                                          | Izolacja, rozwój i wizualne testowanie komponentów UI w różnych stanach.                                    |
| **Zarządzanie testami i raportowanie błędów**          | **Jira**, **ClickUp**, **Asana** lub **GitHub Issues** | Tworzenie i zarządzanie przypadkami testowymi, planowanie cykli testowych, raportowanie i śledzenie błędów. |
| **Automatyzacja i CI/CD**                              | **GitHub Actions**, **GitLab CI**                      | Automatyczne uruchamianie testów (jednostkowych, E2E) po każdym pushu do repozytorium.                      |
| **Testy regresji wizualnej (opcjonalnie)**             | **Percy**, **Chromatic**                               | Automatyczne wykrywanie niezamierzonych zmian wizualnych w interfejsie użytkownika.                         |

## 7. Harmonogram Testów

Harmonogram testów powinien być ściśle zintegrowany z cyklem rozwoju oprogramowania (agile/scrum).

- **Testy jednostkowe i komponentowe:** Pisane na bieżąco przez deweloperów w trakcie implementacji nowych funkcji.
- **Testy integracyjne i E2E:** Pisane przez inżyniera QA równolegle z rozwojem. Uruchamiane w ramach CI/CD po każdym `merge request`.
- **Manualne testy eksploracyjne:** Przeprowadzane przed każdym wydaniem nowej wersji (np. na koniec sprintu) w środowisku stagingowym.
- **Testy regresji:** Pełny zestaw zautomatyzowanych testów E2E uruchamiany przed wdrożeniem na produkcję.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria wejścia

- Dostępna jest stabilna wersja aplikacji w środowisku testowym.
- Wszystkie kluczowe funkcjonalności zostały zaimplementowane.
- Dokumentacja techniczna jest dostępna.

### 8.2. Kryteria wyjścia (Definition of Done)

- **100%** krytycznych scenariuszy testowych (E2E) kończy się sukcesem.
- **>95%** wszystkich zautomatyzowanych testów (jednostkowych, integracyjnych, E2E) kończy się sukcesem.
- Brak otwartych błędów o priorytecie krytycznym (`blocker`) lub wysokim (`critical`).
- Wszystkie zidentyfikowane błędy zostały zaraportowane i ocenione przez zespół.
- Raport z testów został przygotowany i zaakceptowany przez interesariuszy projektu.

## 9. Role i Odpowiedzialności

| Rola                                 | Odpowiedzialności                                                                                                                                                                                                                                                                            |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deweloper**                        | - Tworzenie i utrzymanie testów jednostkowych i komponentowych.<br>- Naprawa błędów zgłoszonych przez zespół QA.<br>- Uczestnictwo w procesie `code review` pod kątem testowalności kodu.                                                                                                    |
| **Inżynier QA**                      | - Projektowanie i tworzenie planu testów.<br>- Tworzenie, utrzymanie i uruchamianie zautomatyzowanych testów E2E i integracyjnych.<br>- Przeprowadzanie manualnych testów eksploracyjnych.<br>- Raportowanie i weryfikacja błędów.<br>- Przygotowywanie raportów z postępu i wyników testów. |
| **Product Owner / Manager Projektu** | - Definiowanie priorytetów dla testowanych funkcjonalności.<br>- Akceptacja wyników testów i podejmowanie decyzji o wdrożeniu.<br>- Uczestnictwo w procesie triażu błędów.                                                                                                                   |

## 10. Procedury Raportowania Błędów

Każdy zidentyfikowany błąd musi zostać zaraportowany w systemie śledzenia błędów (np. Jira) i powinien zawierać następujące informacje:

- **Tytuł:** Zwięzły i jednoznaczny opis problemu.
- **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
- **Kroki do odtworzenia:** Szczegółowa, ponumerowana lista kroków prowadzących do wystąpienia błędu.
- **Oczekiwany rezultat:** Opis, jak aplikacja powinna się zachować.
- **Rzeczywisty rezultat:** Opis, jak aplikacja faktycznie się zachowała.
- **Priorytet/Waga:** Określenie wpływu błędu na działanie systemu (np. Blocker, Critical, Major, Minor).
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli, które mogą pomóc w diagnozie problemu.

Po zgłoszeniu, błąd przechodzi przez standardowy cykl życia: `New` -> `In Analysis` -> `In Progress` -> `Ready for QA` -> `Closed` / `Reopened`.
