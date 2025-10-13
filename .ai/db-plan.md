````markdown
# Schemat Bazy Danych PostgreSQL dla Aplikacji Kulkomat

## 1. Lista Tabel

### Typy niestandardowe (ENUMs)

```sql
CREATE TYPE coupon_type AS ENUM ('free_scoop', 'percentage', 'amount');
CREATE TYPE coupon_status AS ENUM ('active', 'used', 'expired');
CREATE TYPE stamp_status AS ENUM ('active', 'redeemed');
```
````

### Tabela: `profiles` (Klienci)

Przechowuje publiczne dane klientów, rozszerzając tabelę `auth.users` z Supabase.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  short_id TEXT UNIQUE NOT NULL, -- Krótki, czytelny identyfikator dla sprzedawcy
  stamp_count INT NOT NULL DEFAULT 0 CHECK (stamp_count >= 0 AND stamp_count < 10), -- Zdenormalizowana liczba aktywnych pieczątek dla szybkiego odczytu
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `sellers` (Sprzedawcy)

Przechowuje dane personelu, rozszerzając tabelę `auth.users`.

```sql
CREATE TABLE sellers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `stamps` (Pieczątki)

Rejestruje każdą pojedynczą pieczątkę dodaną do konta klienta.

```sql
CREATE TABLE stamps (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT, -- Kto dodał pieczątkę
  status stamp_status NOT NULL DEFAULT 'active',
  redeemed_for_coupon_id BIGINT REFERENCES coupons(id) ON DELETE SET NULL, -- Na który kupon została wymieniona
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `coupons` (Kupony)

Przechowuje wszystkie kupony, zarówno te wygenerowane automatycznie, jak i dodane ręcznie.

```sql
CREATE TABLE coupons (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type coupon_type NOT NULL,
  value NUMERIC(10, 2), -- Wartość procentowa lub kwotowa; NULL dla 'free_scoop'
  status coupon_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ, -- Kiedy został wykorzystany
  expires_at TIMESTAMPTZ NOT NULL -- Data ważności
);
```

### Tabela: `reward_codes` (Jednorazowe kody)

Przechowuje jednorazowe kody promocyjne generowane przez właściciela.

```sql
CREATE TABLE reward_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### Tabela: `ice_cream_flavors` (Smaki lodów)

Przechowuje listę dostępnych smaków lodów.

```sql
CREATE TABLE ice_cream_flavors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `contact_submissions` (Zgłoszenia kontaktowe)

Przechowuje wiadomości wysłane przez formularz kontaktowy.

```sql
CREATE TABLE contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Opcjonalnie, jeśli użytkownik był zalogowany
  email TEXT, -- Jeśli użytkownik nie był zalogowany
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 2. Relacje Między Tabelami

- **`profiles` <-> `auth.users`**: Relacja jeden-do-jednego. Każdy profil klienta musi być powiązany z użytkownikiem w systemie autentykacji Supabase.
- **`sellers` <-> `auth.users`**: Relacja jeden-do-jednego. Każdy sprzedawca musi być powiązany z użytkownikiem w systemie autentykacji.
- **`stamps` -> `profiles`**: Relacja wiele-do-jednego. Jeden klient może mieć wiele pieczątek.
- **`stamps` -> `sellers`**: Relacja wiele-do-jednego. Jeden sprzedawca może dodać wiele pieczątek.
- **`coupons` -> `profiles`**: Relacja wiele-do-jednego. Jeden klient może mieć wiele kuponów.
- **`stamps` <-> `coupons`**: Relacja wiele-do-jednego (opcjonalna). Dziesięć pieczątek (`stamps`) jest wymienianych na jeden kupon (`coupons`). Kolumna `redeemed_for_coupon_id` w tabeli `stamps` śledzi to powiązanie.

## 3. Indeksy

Indeksy są kluczowe dla wydajności zapytań, zwłaszcza przy operacjach wyszukiwania i łączenia tabel.

```sql
-- Indeks na short_id dla szybkiego wyszukiwania klienta przez sprzedawcę
CREATE INDEX idx_profiles_short_id ON profiles(short_id);

-- Indeksy na kluczach obcych dla optymalizacji złączeń (JOIN)
CREATE INDEX idx_stamps_user_id ON stamps(user_id);
CREATE INDEX idx_stamps_seller_id ON stamps(seller_id);
CREATE INDEX idx_coupons_user_id ON coupons(user_id);
CREATE INDEX idx_contact_submissions_user_id ON contact_submissions(user_id);
```

## 4. Zasady PostgreSQL (Row-Level Security)

Zasady RLS zapewniają, że użytkownicy mają dostęp wyłącznie do swoich własnych danych.

```sql
-- Włączenie RLS dla tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Zasada dla klientów: Mogą widzieć i modyfikować tylko swój własny profil
CREATE POLICY "Users can view and update their own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- Zasada dla klientów: Mogą widzieć tylko swoje własne pieczątki
CREATE POLICY "Users can view their own stamps" ON stamps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Zasada dla klientów: Mogą widzieć tylko swoje własne kupony
CREATE POLICY "Users can view their own coupons" ON coupons
  FOR SELECT
  USING (auth.uid() = user_id);
```

## 5. Dodatkowe Uwagi i Decyzje Projektowe

- **Automatyzacja generowania kuponów**: Logika biznesowa odpowiedzialna za automatyczne generowanie kuponu `free_scoop` po zebraniu 10 pieczątek oraz resetowanie licznika `stamp_count` zostanie zaimplementowana za pomocą **funkcji bazodanowej PostgreSQL i triggera**. Trigger będzie uruchamiany po każdej operacji wstawienia (`INSERT`) do tabeli `stamps`.
- **Denormalizacja `stamp_count`**: Kolumna `stamp_count` w tabeli `profiles` jest celowo zdenormalizowana. Przechowuje ona aktualną liczbę aktywnych pieczątek, co eliminuje potrzebę kosztownego obliczania `COUNT(*)` przy każdym wyświetleniu głównego ekranu aplikacji klienta. Jej wartość będzie aktualizowana przez ten sam trigger, który zarządza kuponami.
- **Widok `activity_history`**: Zgodnie z notatkami z planowania, historia aktywności użytkownika nie będzie fizyczną tabelą, lecz zostanie zaimplementowana jako **widok (`VIEW`)** w bazie danych. Widok ten będzie łączyć dane z tabel `stamps` i `coupons`, aby dynamicznie tworzyć chronologiczną listę zdarzeń dla danego użytkownika. Zapewnia to spójność danych (Single Source of Truth).
- **Rola `seller_role`**: Dostęp dla sprzedawców do modyfikacji danych (np. dodawania pieczątek) będzie realizowany nie przez bezpośrednie uprawnienia `INSERT`/`UPDATE`, ale przez wywoływanie dedykowanych funkcji bazodanowych z opcją `SECURITY DEFINER`. Takie podejście hermetyzuje logikę biznesową i zwiększa bezpieczeństwo, uniemożliwiając sprzedawcom dowolną manipulację danymi.

```

```
