# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-file React calculator for currency conversion pipeline:
```
ФОП USD → UAH (PrivatBank/Monobank/NBU) → USD (individual) → Revolut → PLN
```

The component (`calculator-v3.jsx`) is designed to run in Claude.ai artifacts or any React environment.

## Architecture

**State Management**: Uses `useReducer` for calculator inputs and `useState` for API-related state.

**Key Data Flow**:
1. Forward mode: Start with USD amount → calculate final PLN
2. Reverse mode: Start with target PLN → calculate required USD

**API Providers** (defined at top of file):
- UAH rates: Monobank (CORS ✓), PrivatBank (needs CORS proxy), NBU (official rate)
- PLN rates: ExchangeRate-API (CORS ✓), NBU cross-rate

**Fee Models** (`TOP_UP_FEES`):
- `additive`: fee added on top (Google/Apple Pay)
- `subtractive`: fee deducted from credited amount (direct card)
- `none`: no fee (P2P)

## Key Functions

- `fetchWithTimeout()` - 8s timeout wrapper for all API calls
- `fetchUahRates()` / `fetchPlnRate()` - provider-specific fetchers with auto-fallback
- `calcTopUp()` / `reverseTopUp()` - bidirectional top-up fee calculation
- `calcRevolutFees()` / `reverseRevolutFees()` - Revolut weekend/fair-use fee calculation

## API Endpoints

| Provider | Endpoint | CORS |
|----------|----------|------|
| Monobank | `api.monobank.ua/bank/currency` | ✓ |
| PrivatBank | `api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=11` | ✗ |
| NBU | `bank.gov.ua/NBUStatService/v1/statdirectory/exchange` | ✓ |
| ExchangeRate | `open.er-api.com/v6/latest/USD` | ✓ |

PrivatBank requires CORS proxy (corsproxy.io or allorigins.win).

## Development Notes

- Component uses inline styles; no external CSS files
- Currency codes follow ISO 4217 (USD=840, UAH=980, PLN=985)
- All monetary calculations use `round2()` or `ceil2()` for display
- The spec file (`calculator-v3-spec.md`) contains Playwright test scenarios
