# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PWA-enabled React calculator for Ukrainian ФОП (sole proprietor) currency conversion pipeline:
```
ФОП USD → UAH (PrivatBank/Monobank/NBU) → USD (individual) → Revolut → PLN
```

Live at: GitHub Pages (`/fop-calc/`)

## Project Structure

```
src/
  main.jsx          - React 18 entry point
  App.jsx           - Root component with PWA update notifications
  calculator-v3.jsx - Main calculator component (~1385 lines, includes i18n)
tests/
  calculator.spec.ts - Playwright test suite (10 tests)
public/
  *.png, favicon.svg - PWA icons and favicon
vite.config.js      - Vite + PWA plugin configuration
playwright.config.ts - Test configuration
calculator-v3-spec.md - Detailed technical specification
```

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173/fop-calc/)
npm run build    # Production build to ./dist
npm run preview  # Preview production build
npm run test     # Run Playwright tests
npm run test:ui  # Run tests with interactive UI
```

## Architecture

**State Management**: `useReducer` for calculator inputs, `useState` for API state.

**Calculation Pipeline** (5 steps):
1. FOP receives USD → converts to UAH at bank's buy rate
2. Individual sells UAH → gets USD at bank's sell rate (+ PrivatBank 1% fee)
3. Top-up Revolut with USD (method-specific fee)
4. Convert USD → PLN at Revolut rate
5. Apply Revolut fees (weekend markup, fair-use threshold)

**Modes**:
- Forward: USD amount → final PLN
- Reverse: Target PLN → required USD

## Configuration Objects

**`TOP_UP_FEES`** - 5 methods:
| Method | Fee | Model |
|--------|-----|-------|
| Google Pay MC | 0.0% | additive |
| Google Pay Visa | 1.5% | additive |
| Apple Pay | 1.0% | additive |
| Direct Card | 1.49% | subtractive |
| P2P | 0.0% | none |

**`REVOLUT_PLANS`** - 5 tiers:
| Plan | Weekend Fee | Fair-use Threshold |
|------|-------------|-------------------|
| Standard | 1.0% | $1,000/mo |
| Plus | 1.0% | $3,000/mo |
| Premium | 0.5% | unlimited |
| Metal | 0.5% | unlimited |
| Ultra | 0.0% | unlimited |

**`UAH_PROVIDERS`**: Monobank (CORS ✓), PrivatBank (CORS ✗), NBU
**`PLN_PROVIDERS`**: ExchangeRate-API (CORS ✓), NBU cross-rate

## API Endpoints

| Provider | Endpoint | CORS | Notes |
|----------|----------|------|-------|
| Monobank | `api.monobank.ua/bank/currency` | ✓ | Returns buy/sell rates |
| PrivatBank | `api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=11` | ✗ | Needs proxy |
| NBU | `bank.gov.ua/NBUStatService/v1/statdirectory/exchange` | ✓ | Official rate only |
| ExchangeRate | `open.er-api.com/v6/latest/USD` | ✓ | USD/PLN rate |

**CORS Proxies**: corsproxy.io, allorigins.win (configurable in UI)

## Key Functions

- `fetchWithTimeout()` - 8s timeout wrapper using AbortController
- `fetchMonobank()` / `fetchPrivatBank()` / `fetchNBU()` - UAH rate fetchers
- `fetchExchangeRateAPI()` / `fetchNBU_PLN()` - PLN rate fetchers
- `calcTopUp()` / `reverseTopUp()` - bidirectional top-up fee calculation
- `calcRevolutFees()` / `reverseRevolutFees()` - weekend/fair-use fee calculation
- `round2()` / `ceil2()` / `safeDivide()` - monetary math helpers

## PWA Features

- Service worker with Workbox caching:
  - API responses: NetworkFirst (5 min - 1 hour TTL)
  - Google Fonts: CacheFirst (1 year)
- Update notification toast in App.jsx
- Manifest with icons (192, 512, maskable)

## Testing

Playwright tests in `tests/calculator.spec.ts` cover:
- UI loads correctly
- Rate refresh with loading spinner
- Mode toggle (forward/reverse)
- Forward and reverse calculations
- Fee breakdown display
- Top-up method selection
- Weekend mode toggle
- Reset functionality

## Internationalization (i18n)

**Languages**: English (default), Ukrainian (`uk`), Russian (`ru`)

**Implementation** (no external libraries, compatible with Claude.ai artifacts):
```javascript
// In calculator-v3.jsx:
const TRANSLATIONS = { en: {...}, uk: {...}, ru: {...} };
export function useTranslation() { ... }  // returns { t, lang, setLang }
function LanguageSelector({ lang, setLang }) { ... }
```

**Translation Pattern**:
- Translation keys use dot notation: `"api.refresh"`, `"calc.step1.title"`
- Interpolation via `{variable}`: `t("result.existing", { existing: "100 zł", new: "50 zł" })`
- Config objects use `labelKey`/`descKey`/`noteKey` instead of inline strings
- Fallback chain: selected language → English → raw key

**Adding New Language**:
1. Add language code to `SUPPORTED_LANGUAGES` array
2. Add translation object to `TRANSLATIONS`
3. Add button to `LanguageSelector` component

**Storage**: Language preference stored in localStorage (`fop-calc-lang`), auto-detects browser language on first visit.

## Development Notes

- Inline styles only; no external CSS
- Dark theme: background `#0a0e17`, text `#e2e8f0`
- Currency codes: ISO 4217 (USD=840, UAH=980, EUR=978, PLN=985)
- Default UI language: English (configurable via language selector)
- Auto-fallback: tries next provider on failure (configurable)
- Auto-load: fetches rates on mount (configurable)
