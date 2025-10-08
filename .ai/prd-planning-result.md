<conversation_summary>
<decisions>
1.  Klienci często zapominają lub gubią karty stałego klienta w domu, ale zawsze mają przy sobie telefon.
2.  Na początek nie będzie zbierania danych osobowych poza e-mailem lub numerem telefonu.
3.  Dodawanie pieczątek będzie odbywać się początkowo przez `user_id`, a w przyszłości przez kod QR. Możliwe będzie posiadanie jednego konta/karty przez wiele osób (np. rodzinę).
4.  Pieczątki będą tylko na lody (po 10 pieczątkach kupon na darmową gałkę). Kupony będą procentowe i kwotowe, a sprzedawca będzie je naliczał ręcznie.
5.  UX/UI skupi się na minimalizmie, intuicyjnej nawigacji i dużych, czytelnych elementach interfejsu. Pomiar UX będzie odbywał się poprzez obserwacje i krótkie ankiety.
6.  Brak rozbudowanego planu marketingowego – klienci będą informowani przy kasie.
7.  Jednorazowe kody generowane po stronie sprzedawcy będą służyć do rozdawania nagród, ale nie do zbierania pieczątek.
8.  Panel administracyjny będzie dla jednego właściciela/pracownika. Będzie zawierał zakładkę "stali klienci" z listą i prostym formularzem do dodawania pieczątek (`user_id`, ilość pieczątek). W przyszłości skanowanie QR kodu z ekranu użytkownika.
9.  Skalowalność systemu nie jest priorytetem, ale kod ma spełniać najlepsze standardy (czystość, testowalność, dokumentacja, modułowa architektura).
10. Dodany zostanie prosty formularz kontaktowy w aplikacji dla użytkowników.
</decisions>

<matched_recommendations>
1.  Wcześnie określ dokładne wymogi prawne i techniczne dotyczące prywatności i bezpieczeństwa danych, aby uniknąć późniejszych kosztownych zmian w architekturze systemu.
2.  Zaproponuj prosty i szybki proces weryfikacji dla właściciela, który minimalizuje czas obsługi klienta, np. skanowanie unikalnego kodu QR użytkownika, który zmienia się co X sekund.
3.  Zdefiniuj mierzalne wskaźniki, takie jak czas potrzebny na założenie konta, czas dodania pieczątki przez właściciela, czy wskaźnik porzuceń w kluczowych ścieżkach użytkownika.
4.  Należy przygotować podstawowe materiały promocyjne w lodziarni (np. plakaty, ulotki przy kasie) oraz instrukcje dla sprzedawców, jak informować klientów o nowej możliwości.
5.  Zaprojektuj, aby kupony były widoczne dla sprzedawcy w panelu administracyjnym po wprowadzeniu `user_id` klienta, co uprości proces naliczania rabatów i ograniczy błędy.
6.  Określ szczegółowy zakres funkcji dla właściciela, np. lista użytkowników, możliwość dodawania/edycji kuponów, zarządzanie listą smaków, podgląd historii transakcji, aby upewnić się, że panel jest kompletny, ale nieprzeładowany.
7.  Skup się na czystości kodu, testowalności, dokumentacji i modułowej architekturze, co ułatwi ewentualne przyszłe rozszerzenia, nawet jeśli skalowanie nie jest priorytetem na początku.
8.  Rozważ dodanie prostego formularza kontaktowego w aplikacji lub dedykowanego adresu e-mail do zbierania opinii. To minimalny wysiłek, który może dostarczyć cennych informacji o użyteczności i błędach.
</matched_recommendations>

<prd_planning_summary>
Produkt "Kulkomat (MVP)" ma na celu zastąpienie fizycznych kart stałego klienta w lodziarniach, umożliwiając zbieranie wirtualnych pieczątek i kuponów rabatowych. Głównym problemem jest częste zapominanie lub gubienie fizycznych kart przez klientów.

**Główne wymagania funkcjonalne produktu:**
*   **System kont użytkowników:** Użytkownicy będą mogli zakładać konta (za pomocą e-maila lub numeru telefonu) do zbierania pieczątek i kuponów.
*   **Zbieranie pieczątek:** Po 10 zebranych pieczątkach konto zostanie zresetowane, a użytkownik otrzyma kupon na darmową gałkę lodów. Pieczątki są tylko na lody.
*   **Kupony rabatowe:** Będą dostępne kupony procentowe i kwotowe.
*   **Panel administracyjny dla właściciela:** Umożliwi dodawanie pieczątek (poprzez `user_id`, w przyszłości QR kod) i kuponów rabatowych dla użytkowników. Będzie zawierał zakładkę "stali klienci" z listą najczęściej uczęszczanych i możliwością przeglądania historii.
*   **Strona główna:** Z aktualnymi smakami lodów.
*   **Strona z historią:** Doładowań pieczątek i kuponów dla użytkownika.
*   **Formularz kontaktowy:** Prosty formularz w aplikacji do zbierania opinii.

**Kluczowe historie użytkownika i ścieżki korzystania:**
*   **Użytkownik:** Rejestracja konta -> pokazanie `user_id` przy kasie -> otrzymanie pieczątki/kuponu -> przeglądanie pieczątek/kuponów -> wykorzystanie kuponu -> wysłanie opinii przez formularz.
*   **Właściciel/Sprzedawca:** Logowanie do panelu admina -> wprowadzenie `user_id` klienta -> dodanie pieczątki/kuponu -> przeglądanie listy stałych klientów i ich historii -> ewentualne generowanie kodów nagród.
*   **Proces przyznawania pieczątek/kuponów:** Klient podaje `user_id` (lub w przyszłości skanuje QR), sprzedawca w panelu admina wprowadza `user_id` (lub skanuje QR), przyznaje pieczątki/kupony. Sprzedawca ręcznie nalicza rabat na podstawie kuponu.

**Ważne kryteria sukcesu i sposoby ich mierzenia:**
*   **Rejestracja i zbieranie:** Użytkownicy mogą zakładać konta, zbierać pieczątki i kupony rabatowe. Mierzone przez liczbę zarejestrowanych użytkowników i liczbę zebranych pieczątek/kuponów.
*   **Dodawanie pieczątek przez właściciela:** Właściciel lodziarni jest w stanie dodawać pieczątki użytkownikom. Mierzone przez skuteczność i szybkość operacji dodawania.
*   **Bezpieczeństwo danych:** Zapewnione jest bezpieczne przechowywanie danych (e-mail, numer telefonu). Mierzone przez brak incydentów bezpieczeństwa.
*   **Łatwość użycia i zrozumiałość (UX/UI):** System jest łatwy w użyciu dla obu grup. Mierzone poprzez obserwacje użytkowników, ankiety oraz wskaźniki takie jak czas potrzebny na założenie konta czy dodanie pieczątki.
*   **Kontrola dostępu:** Tylko właściciel lodziarni może dodawać pieczątki i kupony. Mierzone przez brak nieautoryzowanych operacji.
*   **Jakość kodu:** Kod spełnia najlepsze standardy tworzenia oprogramowania (czystość, testowalność, dokumentacja, modułowa architektura). Mierzone poprzez przeglądy kodu i wyniki testów.

**Ograniczenia MVP:**
*   Tylko aplikacja webowa.
*   Brak systemu zamówień, płatności, rezerwacji.
*   Brak zaawansowanej skalowalności na początku.
*   Brak rozbudowanego planu marketingowego (informowanie tylko przy kasie).
*   Brak rozbudowanego systemu ról i uprawnień (jeden właściciel).
</prd_planning_summary>

<unresolved_issues>
1.  **Polityka prywatności:** Mimo decyzji o pominięciu tematu ochrony danych osobowych (dla e-maila/numeru telefonu), nadal istnieje ryzyko prawne. Konieczne jest minimalne oświadczenie o przetwarzaniu danych, zgodne z obowiązującymi przepisami.
2.  **Weryfikacja tożsamości użytkownika:** W jaki sposób sprzedawca będzie weryfikował, czy `user_id` podany przez klienta należy do właściwej osoby, szczególnie w kontekście rodzinnych kont? Potrzebny jest mechanizm wizualnej weryfikacji.
3.  **Zarządzanie feedbackiem:** Kto dokładnie będzie monitorował zgłoszenia z formularza kontaktowego, jak często i jaki będzie proces reagowania na błędy lub sugestie?
4.  **Kody nagród:** Dokładny proces generowania, przekazywania (np. na paragonie/ustnie) i aktywowania w aplikacji przez użytkownika dla kodów rozdawanych jako nagrody.
</unresolved_issues>