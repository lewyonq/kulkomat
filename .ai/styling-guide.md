# Przewodnik po stylach aplikacji

## Spis treści
1. [Wprowadzenie](#wprowadzenie)
2. [System kolorów](#system-kolorów)
3. [Zmienne CSS](#zmienne-css)
4. [Najlepsze praktyki](#najlepsze-praktyki)
5. [Przykłady użycia](#przykłady-użycia)

---

## Wprowadzenie

Aplikacja wykorzystuje **różową paletę kolorów** jako główny motyw wizualny. Wszystkie kolory są zdefiniowane jako zmienne CSS w pliku `src/styles.scss`, co zapewnia:

- ✅ **Spójność** - jednolity wygląd w całej aplikacji
- ✅ **Łatwość utrzymania** - zmiana koloru w jednym miejscu
- ✅ **Semantyczność** - nazwy zmiennych opisują ich przeznaczenie
- ✅ **Kompatybilność** - wsparcie dla Material Design 3

---

## System kolorów

### Główne kolory różowe

```scss
// Podstawowe odcienie różu
--color-primary: 219 39 119;        // Pink 600 - główny kolor marki
--color-primary-light: 236 72 153;  // Pink 500 - jaśniejszy odcień
--color-primary-lighter: 244 114 182; // Pink 400 - najjaśniejszy
--color-primary-dark: 190 24 93;    // Pink 700 - ciemniejszy
--color-primary-darker: 154 63 96;  // Pink 800 - najciemniejszy

// Kolory z przezroczystością (dla nakładek)
--color-primary-alpha-10: rgba(219, 39, 119, 0.1);
--color-primary-alpha-20: rgba(219, 39, 119, 0.2);
--color-primary-alpha-30: rgba(219, 39, 119, 0.3);
--color-primary-alpha-95: rgba(219, 39, 119, 0.95);
```

### Kolory powierzchni i tła

```scss
--color-surface: 255 255 255;              // Biały
--color-surface-variant: 246 220 225;      // Jasny różowy odcień
--color-background: 255 248 248;           // Bardzo jasny różowy
--color-background-gradient-start: 245 245 245;
--color-background-gradient-mid: 232 232 232;
```

### Kolory tekstu

```scss
--color-text-primary: 26 26 26;       // Prawie czarny
--color-text-secondary: 102 102 102;  // Szary 600
--color-text-tertiary: 158 158 158;   // Szary 400
--color-text-on-primary: 255 255 255; // Biały (na różowym tle)
--color-text-on-surface: 34 25 27;    // Ciemny brązowo-szary
```

### Kolory stanów

```scss
// Sukces (zielony)
--color-success: 46 125 50;
--color-success-light: 76 175 80;

// Błąd (czerwony)
--color-error: 211 47 47;
--color-error-light: 244 67 54;

// Ostrzeżenie (pomarańczowy)
--color-warning: 245 124 0;

// Informacja (niebieski)
--color-info: 2 136 209;
```

### Cienie i efekty

```scss
// Predefiniowane cienie
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

// Różowe cienie (dla efektu glow)
--shadow-pink: 0 8px 32px rgba(219, 39, 119, 0.3);
--shadow-pink-glow: 0 0 60px rgba(236, 72, 153, 0.2);
```

---

## Zmienne CSS

### Format zmiennych

Zmienne są definiowane w formacie RGB bez `rgb()`, co pozwala na elastyczne użycie:

```scss
// Definicja
--color-primary: 219 39 119;

// Użycie - pełny kolor
color: rgb(var(--color-primary));

// Użycie - z przezroczystością
background: rgba(var(--color-primary), 0.5);
```

### Hierarchia zmiennych

1. **Zmienne aplikacji** (`--color-*`) - używaj ich w pierwszej kolejności
2. **Zmienne Material Design** (`--md-sys-color-*`) - dla komponentów Material
3. **Hardcoded kolory** - unikaj, używaj tylko w wyjątkowych przypadkach

---

## Najlepsze praktyki

### ✅ DOBRZE

```scss
// Używaj zmiennych CSS
.button {
  background: rgb(var(--color-primary));
  color: rgb(var(--color-text-on-primary));
  box-shadow: var(--shadow-pink);
}

// Używaj rgba() dla przezroczystości
.overlay {
  background: rgba(var(--color-primary), 0.8);
}

// Używaj predefiniowanych cieni
.card {
  box-shadow: var(--shadow-lg);
}
```

### ❌ ŹLE

```scss
// Nie hardcoduj kolorów
.button {
  background: #db2777;
  color: white;
  box-shadow: 0 8px 32px rgba(219, 39, 119, 0.3);
}

// Nie używaj kolorów bez zmiennych
.overlay {
  background: rgba(219, 39, 119, 0.8);
}
```

### Konwencje nazewnictwa

- **Kolory podstawowe**: `--color-{nazwa}`
- **Kolory z przezroczystością**: `--color-{nazwa}-alpha-{procent}`
- **Odcienie**: `--color-{nazwa}-{light|lighter|dark|darker}`
- **Cienie**: `--shadow-{rozmiar|nazwa}`
- **Kolory tekstu**: `--color-text-{kontekst}`

---

## Przykłady użycia

### Komponent z różowym tłem

```typescript
@Component({
  selector: 'app-example',
  template: `
    <div class="container">
      <h1>Tytuł</h1>
      <p>Treść</p>
    </div>
  `,
  styles: [`
    .container {
      background: rgb(var(--color-primary));
      color: rgb(var(--color-text-on-primary));
      padding: 2rem;
      border-radius: 12px;
      box-shadow: var(--shadow-pink);
    }
    
    h1 {
      margin: 0 0 1rem 0;
    }
  `]
})
```

### Przycisk z efektem hover

```scss
.button {
  background: rgb(var(--color-primary));
  color: rgb(var(--color-text-on-primary));
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.button:hover {
  background: rgb(var(--color-primary-light));
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.button:active {
  background: rgb(var(--color-primary-dark));
  transform: translateY(0);
}

.button:disabled {
  background: rgb(var(--color-disabled-bg));
  color: rgb(var(--color-disabled-text));
  cursor: not-allowed;
}
```

### Karta z gradientem

```scss
.card {
  background: linear-gradient(
    135deg,
    var(--color-primary-alpha-95) 0%,
    rgba(var(--color-primary-light), 0.95) 50%,
    rgba(var(--color-primary-lighter), 0.95) 100%
  );
  color: rgb(var(--color-text-on-primary));
  padding: 2rem;
  border-radius: 16px;
  box-shadow: var(--shadow-pink), var(--shadow-pink-glow);
}
```

### Nakładka z przezroczystością

```scss
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--color-primary), 0.2);
  backdrop-filter: blur(8px);
}
```

### Tekst z różnymi kolorami

```scss
.title {
  color: rgb(var(--color-text-primary));
  font-weight: 700;
}

.subtitle {
  color: rgb(var(--color-text-secondary));
  font-size: 0.875rem;
}

.caption {
  color: rgb(var(--color-text-tertiary));
  font-size: 0.75rem;
}
```

---

## Klasy użytkowe

W `styles.scss` dostępne są gotowe klasy użytkowe:

### Kolory tekstu

```html
<p class="text-primary">Tekst w kolorze różowym</p>
<p class="text-secondary">Tekst w kolorze szarym</p>
<p class="text-on-primary">Tekst na różowym tle</p>
```

### Kolory tła

```html
<div class="bg-primary">Różowe tło</div>
<div class="bg-primary-light">Jasne różowe tło</div>
<div class="bg-surface">Białe tło</div>
```

### Obramowania

```html
<div class="border-primary">Różowe obramowanie</div>
<div class="border-light">Jasne obramowanie</div>
```

### Cienie

```html
<div class="shadow-pink">Różowy cień</div>
<div class="shadow-pink-glow">Różowy efekt glow</div>
```

---

## Integracja z Tailwind CSS

Aplikacja używa Tailwind CSS 4.x. Możesz rozszerzyć konfigurację o własne kolory:

```css
@theme {
  --color-primary: rgb(219, 39, 119);
  --color-primary-light: rgb(236, 72, 153);
}
```

Następnie używaj w klasach Tailwind:

```html
<div class="bg-[rgb(var(--color-primary))] text-white">
  Treść
</div>
```

---

## Kompatybilność z Material Design 3

Wszystkie zmienne Material Design (`--md-sys-color-*`) są mapowane do naszych zmiennych aplikacji:

```scss
// Automatyczne mapowanie
--md-sys-color-primary: rgb(var(--color-primary-darker));
--md-sys-color-on-primary: rgb(var(--color-text-on-primary));
--md-sys-color-background: rgb(var(--color-background));
```

Dzięki temu komponenty Angular Material automatycznie używają naszej palety kolorów.

---

## Wsparcie dla trybu ciemnego (przyszłość)

Struktura zmiennych CSS jest przygotowana na łatwe dodanie trybu ciemnego:

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: 18 18 18;
    --color-text-primary: 255 255 255;
    // ... inne zmienne
  }
}
```

---

## Podsumowanie

- ✅ Zawsze używaj zmiennych CSS zamiast hardcoded kolorów
- ✅ Preferuj semantyczne nazwy (`--color-primary`) nad konkretne (`--color-pink-600`)
- ✅ Używaj `rgb(var(--color-*))` dla pełnych kolorów
- ✅ Używaj `rgba(var(--color-*), opacity)` dla przezroczystości
- ✅ Wykorzystuj predefiniowane cienie i efekty
- ✅ Dokumentuj niestandardowe kolory w komentarzach
- ✅ Testuj kontrast tekstu dla dostępności (WCAG 2.1)

---

**Ostatnia aktualizacja**: 2025-01-13
**Wersja**: 1.0.0
