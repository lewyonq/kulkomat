<conversation_summary>
<decisions>

1.  Zostanie stworzona oddzielna tabela `stamps` do śledzenia poszczególnych pieczątek oraz kolumna `stamp_count` w tabeli `profiles` dla szybkiego dostępu.
2.  Zostaną utworzone dwie oddzielne tabele: `profiles` dla klientów i `sellers` dla personelu, obie powiązane z tabelą `auth.users` Supabase.
3.  Zostanie zaimplementowana funkcja bazodanowa PostgreSQL (trigger), która po dodaniu 10-tej pieczątki automatycznie wygeneruje kupon na darmową gałkę i zaktualizuje status wykorzystanych pieczątek.
4.  Tabela `coupons` będzie zawierać kolumny: `id`, `user_id`, `type` (enum), `value`, `status` (enum), `created_at`, `used_at` oraz `expires_at`. Kupony dodawane ręcznie będą miały domyślną 30-dniową datę ważności.
5.  Historia aktywności użytkownika (`activity_history`) zostanie zaimplementowana jako dynamiczny widok (`VIEW`), a nie fizyczna tabela.
6.  Zostaną zastosowane ścisłe typy danych i ograniczenia: `UUID` jako klucz obcy do `auth.users.id`, `ENUM` dla statusów i typów, `CHECK` dla wartości rabatów oraz `NUMERIC` dla kwot.
7.  Zostaną założone indeksy na wszystkich kluczach obcych oraz na nowej, czytelnej dla człowieka kolumnie `short_id` w tabeli `profiles`.
8.  Zostaną wdrożone zasady bezpieczeństwa na poziomie wierszy (RLS), aby klienci widzieli tylko swoje dane.
9.  Rola sprzedawcy (`seller_role`) będzie miała ograniczone uprawnienia, wykonując operacje zapisu wyłącznie poprzez funkcje bazodanowe z `SECURITY DEFINER`.
10. Tabela `stamps` będzie zawierać kolumnę `status` (`ENUM('active', 'redeemed')`) oraz `redeemed_for_coupon_id`, aby śledzić, które pieczątki zostały zamienione na kupon.
11. Proces realizacji jednorazowych kodów nagród będzie obsługiwany przez sprzedawcę w panelu administracyjnym.
    </decisions>

<matched_recommendations>

1.  **Rekomendacja dotycząca śledzenia pieczątek:** Stworzenie osobnej tabeli `stamps` w celu audytu i utrzymywanie zdenormalizowanej kolumny `stamp_count` w tabeli `profiles` dla wydajności.
2.  **Rekomendacja dotycząca ról:** Użycie oddzielnych tabel `profiles` i `sellers` dla klarownego rozdzielenia ról klienta i personelu w MVP.
3.  **Rekomendacja dotycząca automatyzacji kuponów:** Wykorzystanie triggera bazodanowego do automatycznego generowania kuponu po zebraniu 10 pieczątek i aktualizacji ich statusu na "wykorzystane" (`redeemed`).
4.  **Rekomendacja dotycząca atrybutów kuponów:** Zdefiniowanie kompleksowej struktury tabeli `coupons` z uwzględnieniem typu, wartości, statusu i daty ważności.
5.  **Rekomendacja dotycząca historii aktywności:** Użycie widoku (`VIEW`) zamiast fizycznej tabeli do generowania historii aktywności, co zapewnia spójność danych (Single Source of Truth).
6.  **Rekomendacja dotycząca `user_id`:** Wprowadzenie dodatkowej, krótkiej i czytelnej dla człowieka kolumny `short_id` do identyfikacji klienta przez sprzedawcę.
7.  **Rekomendacja dotycząca bezpieczeństwa sprzedawcy:** Ograniczenie uprawnień roli sprzedawcy i hermetyzacja logiki biznesowej w funkcjach `SECURITY DEFINER`.
    </matched_recommendations>

<database_planning_summary>
Na podstawie przeprowadzonych konsultacji, schemat bazy danych PostgreSQL dla MVP aplikacji "Kulkomat" został zaplanowany w następujący sposób:

**Główne wymagania dotyczące schematu:**
Schemat ma na celu cyfryzację programu lojalnościowego. Musi obsługiwać rejestrację użytkowników, zbieranie pieczątek, automatyczne generowanie kuponów za pieczątki, ręczne dodawanie kuponów rabatowych przez personel oraz przeglądanie historii aktywności.

**Kluczowe encje i ich relacje:**

1.  **`profiles`**: Przechowuje dane klientów. Każdy profil jest powiązany 1-do-1 z użytkownikiem w `auth.users` (przez `id` typu `UUID`). Zawiera kolumnę `stamp_count` (do szybkiego odczytu) oraz unikalny, czytelny `short_id` do identyfikacji klienta.
2.  **`sellers`**: Przechowuje dane personelu. Każdy sprzedawca jest powiązany 1-do-1 z użytkownikiem w `auth.users`.
3.  **`stamps`**: Rejestruje każdą dodaną pieczątkę. Posiada relację wiele-do-jednego z `profiles` (`user_id`). Zawiera status (`active`, `redeemed`) oraz opcjonalne powiązanie z kuponem, na który została wymieniona (`redeemed_for_coupon_id`).
4.  **`coupons`**: Przechowuje wszystkie kupony (automatyczne i ręczne). Posiada relację wiele-do-jednego z `profiles` (`user_id`). Zawiera typ, wartość, status (`active`, `used`, `expired`) oraz daty `created_at`, `used_at`, `expires_at`.
5.  **`reward_codes`**: Tabela na jednorazowe kody promocyjne generowane przez właściciela.
6.  **`ice_cream_flavors`**: Prosta tabela do zarządzania listą dostępnych smaków lodów.
7.  **`activity_history` (VIEW)**: Dynamiczny widok łączący dane z `stamps` i `coupons` w celu prezentacji pełnej historii aktywności użytkownika.

**Kwestie bezpieczeństwa i skalowalności:**

- **Bezpieczeństwo:** Dostęp do danych będzie chroniony przez RLS (Row-Level Security) w Supabase. Klienci będą mieli dostęp wyłącznie do swoich danych (`WHERE user_id = auth.uid()`). Dostęp dla sprzedawców będzie realizowany przez specjalną rolę (`seller_role`) z uprawnieniami do wywoływania funkcji `SECURITY DEFINER`, co zapobiega bezpośredniej manipulacji danymi.
- **Skalowalność i wydajność:** Wydajność zapytań zostanie zapewniona przez indeksowanie wszystkich kluczy obcych oraz kolumny `short_id`. Użycie zdenormalizowanej kolumny `stamp_count` przyspieszy odczyt liczby pieczątek w głównym widoku aplikacji klienta.

</database_planning_summary>

<unresolved_issues>
Brak nierozwiązanych kwestii. Wszystkie początkowe zapytania zostały wyjaśnione, a plan bazy danych jest gotowy do implementacji w następnym etapie.
</unresolved_issues>
</conversation_summary>
