# Техническое задание: Currency Calculator v3 — API Integration

## Обзор проекта

**Цель:** React-калькулятор для расчёта конвертации валют по цепочке:
```
ФОП USD → UAH (ПриватБанк) → USD (физлицо) → Revolut → PLN
```

**Текущее состояние:** Калькулятор работает с ручным вводом курсов. API интеграция написана, но не функционирует в артефакте Claude.ai (вероятно, CORS/sandbox ограничения).

**Файл:** `calculator-v3.jsx` (React компонент)

---

## Что нужно исправить

### Проблема 1: API запросы не выполняются

**Симптомы:**
- При нажатии "Обновить курсы" ничего не происходит
- Курсы остаются дефолтными
- Нет ошибок в UI (или не отображаются)

**Вероятные причины:**
1. CORS блокировка в sandbox-среде артефактов
2. Fetch не работает / блокируется CSP
3. Ошибки в async логике не отлавливаются
4. useEffect не срабатывает

**Задача:** Отладить и исправить загрузку курсов через API.

---

## API Endpoints (проверенные)

### 1. Monobank (UAH) — CORS ✅

```
GET https://api.monobank.ua/bank/currency
```

**Ответ:**
```json
[
  {
    "currencyCodeA": 840,
    "currencyCodeB": 980,
    "date": 1706745607,
    "rateBuy": 37.45,
    "rateSell": 38.05
  }
]
```

**Нужные поля:**
- `currencyCodeA: 840` = USD
- `currencyCodeB: 980` = UAH
- `rateBuy` → курс покупки банком (ФОП продаёт $) → поле `usdToUahBuy`
- `rateSell` → курс продажи банком (физлицо покупает $) → поле `uahToUsdSell`

**Rate limit:** Кеш 5 минут на стороне API.

---

### 2. ПриватБанк (UAH) — CORS ❌ нужен прокси

```
GET https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=11
```

**Ответ:**
```json
[
  {
    "ccy": "USD",
    "base_ccy": "UAH", 
    "buy": "37.50000",
    "sale": "38.10000"
  }
]
```

**Нужные поля:**
- Найти объект где `ccy === "USD"`
- `buy` (string → float) → `usdToUahBuy`
- `sale` (string → float) → `uahToUsdSell`

**CORS решение:**
```javascript
const proxy = "https://corsproxy.io/?";
const url = proxy + encodeURIComponent("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=11");
```

---

### 3. ExchangeRate-API (PLN) — CORS ✅

```
GET https://open.er-api.com/v6/latest/USD
```

**Ответ:**
```json
{
  "result": "success",
  "base_code": "USD",
  "rates": {
    "PLN": 3.9542,
    "UAH": 41.25,
    "EUR": 0.92
  }
}
```

**Нужные поля:**
- Проверить `result === "success"`
- `rates.PLN` → `usdToPlnRate`

**Rate limit:** ~1 запрос/сек, обновление раз в сутки.

---

### 4. НБУ (UAH, backup) — CORS вероятно ✅

```
GET https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json
```

**Ответ:**
```json
[
  {
    "r030": 840,
    "txt": "Долар США",
    "rate": 41.2549,
    "cc": "USD",
    "exchangedate": "03.02.2025"
  }
]
```

**Особенность:** Один официальный курс (не buy/sell). Использовать для обоих полей как fallback.

---

## Требования к реализации

### Функциональные требования

| ID | Требование |
|----|------------|
| F1 | Кнопка "Обновить курсы" загружает актуальные курсы из выбранных API |
| F2 | Dropdown для выбора UAH провайдера: Monobank / ПриватБанк / НБУ |
| F3 | Dropdown для выбора PLN провайдера: ExchangeRate-API / НБУ |
| F4 | Dropdown для выбора CORS прокси (для ПриватБанка) |
| F5 | Чекбокс "Авто-fallback" — при ошибке пробует следующий провайдер |
| F6 | Чекбокс "Загружать при старте" — автозагрузка при mount |
| F7 | Отображение статуса: источник, время, fallback-индикатор |
| F8 | Отображение ошибок если API недоступен |
| F9 | Спиннер во время загрузки |
| F10 | Загруженные курсы автоматически заполняют поля ввода |

### Порядок fallback

**UAH:**
1. Monobank (по умолчанию, есть CORS)
2. ПриватБанк (через прокси)
3. НБУ (официальный курс)

**PLN:**
1. ExchangeRate-API (по умолчанию)
2. НБУ кросс-курс (USD/UAH ÷ PLN/UAH)

---

## Архитектура кода

### State для API

```javascript
// Выбранные провайдеры
const [uahProvider, setUahProvider] = useState("monobank");
const [plnProvider, setPlnProvider] = useState("exchangerate");
const [corsProxy, setCorsProxy] = useState("https://corsproxy.io/?");

// Настройки
const [autoFallback, setAutoFallback] = useState(true);
const [autoLoad, setAutoLoad] = useState(true);

// Статус
const [loading, setLoading] = useState(false);
const [ratesInfo, setRatesInfo] = useState(null); // { uahSource, plnSource, timestamp }
const [errors, setErrors] = useState([]);
```

### Fetch функции

```javascript
// Универсальный fetch с таймаутом
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Monobank
async function fetchMonobank() {
  const data = await fetchWithTimeout("https://api.monobank.ua/bank/currency");
  const usd = data.find(r => r.currencyCodeA === 840 && r.currencyCodeB === 980);
  if (!usd) throw new Error("USD/UAH not found");
  return { buy: usd.rateBuy, sell: usd.rateSell, source: "Monobank" };
}

// ПриватБанк
async function fetchPrivatBank(proxy) {
  const base = "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=11";
  const url = proxy ? proxy + encodeURIComponent(base) : base;
  const data = await fetchWithTimeout(url);
  const usd = data.find(r => r.ccy === "USD");
  if (!usd) throw new Error("USD not found");
  return { buy: parseFloat(usd.buy), sell: parseFloat(usd.sale), source: "ПриватБанк" };
}

// ExchangeRate-API
async function fetchExchangeRate() {
  const data = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD");
  if (data.result !== "success") throw new Error("API error");
  return { rate: data.rates.PLN, source: "ExchangeRate-API" };
}
```

### Главная функция загрузки

```javascript
const loadRates = useCallback(async () => {
  setLoading(true);
  setErrors([]);
  const info = { timestamp: new Date() };
  const newErrors = [];

  // === UAH ===
  const uahProviders = autoFallback 
    ? ["monobank", "privatbank", "nbu"].filter(p => true) // порядок fallback
    : [uahProvider];
  
  let uahSuccess = false;
  for (const provider of uahProviders) {
    if (uahSuccess) break;
    try {
      let result;
      switch (provider) {
        case "monobank": result = await fetchMonobank(); break;
        case "privatbank": result = await fetchPrivatBank(corsProxy); break;
        case "nbu": result = await fetchNBU(); break;
      }
      dispatch({ type: "setMultiple", values: {
        usdToUahBuy: result.buy,
        uahToUsdSell: result.sell,
      }});
      info.uahSource = result.source;
      if (provider !== uahProvider) info.uahFallback = true;
      uahSuccess = true;
    } catch (e) {
      console.error(`${provider} failed:`, e);
      if (!autoFallback || provider === uahProviders[uahProviders.length - 1]) {
        newErrors.push(`UAH: ${e.message}`);
      }
    }
  }

  // === PLN === (аналогично)
  // ...

  setRatesInfo(info);
  setErrors(newErrors);
  setLoading(false);
}, [uahProvider, plnProvider, corsProxy, autoFallback]);
```

### Автозагрузка при mount

```javascript
useEffect(() => {
  if (autoLoad) {
    loadRates();
  }
}, []); // пустой deps = только при mount
```

---

## UI компоненты

### Панель API (JSX структура)

```jsx
<div className="api-panel">
  {/* Заголовок + кнопка */}
  <div className="api-header">
    <span>📡 Источники курсов</span>
    <button onClick={loadRates} disabled={loading}>
      {loading ? <Spinner /> : "🔄 Обновить курсы"}
    </button>
  </div>

  {/* Selects в ряд */}
  <div className="api-selects">
    <div>
      <label>UAH провайдер</label>
      <select value={uahProvider} onChange={e => setUahProvider(e.target.value)}>
        <option value="monobank">Monobank</option>
        <option value="privatbank">ПриватБанк</option>
        <option value="nbu">НБУ</option>
      </select>
    </div>
    <div>
      <label>PLN провайдер</label>
      <select value={plnProvider} onChange={...}>
        <option value="exchangerate">ExchangeRate-API</option>
        <option value="nbu_pln">НБУ (кросс)</option>
      </select>
    </div>
    <div>
      <label>CORS прокси</label>
      <select value={corsProxy} onChange={...}>
        <option value="">Напрямую</option>
        <option value="https://corsproxy.io/?">corsproxy.io</option>
        <option value="https://api.allorigins.win/raw?url=">allorigins.win</option>
      </select>
    </div>
  </div>

  {/* Чекбоксы */}
  <div className="api-options">
    <label>
      <input type="checkbox" checked={autoFallback} onChange={...} />
      Авто-fallback при ошибке
    </label>
    <label>
      <input type="checkbox" checked={autoLoad} onChange={...} />
      Загружать при старте
    </label>
  </div>

  {/* Статус */}
  {ratesInfo && (
    <div className="api-status success">
      UAH: {ratesInfo.uahSource} {ratesInfo.uahFallback && "(fallback)"}
      • PLN: {ratesInfo.plnSource}
      • {ratesInfo.timestamp.toLocaleTimeString()}
    </div>
  )}

  {/* Ошибки */}
  {errors.length > 0 && (
    <div className="api-status error">
      {errors.map(e => <div key={e}>⚠️ {e}</div>)}
    </div>
  )}
</div>
```

---

## Тестовые сценарии (для Playwright)

### Сценарий 1: Успешная загрузка курсов

```javascript
test('loads rates on button click', async ({ page }) => {
  await page.goto('/calculator');
  
  // Клик по кнопке
  await page.click('button:has-text("Обновить курсы")');
  
  // Ждём появления статуса
  await expect(page.locator('.api-status.success')).toBeVisible({ timeout: 10000 });
  
  // Проверяем что курсы заполнились (не дефолтные)
  const uahBuy = await page.inputValue('input[name="usdToUahBuy"]');
  expect(parseFloat(uahBuy)).toBeGreaterThan(35); // реалистичный курс
  expect(parseFloat(uahBuy)).toBeLessThan(50);
});
```

### Сценарий 2: Автозагрузка при старте

```javascript
test('auto-loads rates on mount when enabled', async ({ page }) => {
  await page.goto('/calculator');
  
  // Ждём автозагрузки
  await expect(page.locator('.api-status.success')).toBeVisible({ timeout: 10000 });
});
```

### Сценарий 3: Fallback при ошибке провайдера

```javascript
test('falls back to next provider on error', async ({ page }) => {
  // Мокаем ПриватБанк чтобы он упал
  await page.route('**/api.privatbank.ua/**', route => route.abort());
  
  await page.goto('/calculator');
  await page.selectOption('select[name="uahProvider"]', 'privatbank');
  await page.click('button:has-text("Обновить курсы")');
  
  // Должен сработать fallback на Monobank
  await expect(page.locator('text=Monobank')).toBeVisible();
  await expect(page.locator('text=(fallback)')).toBeVisible();
});
```

### Сценарий 4: Отображение ошибки когда все API недоступны

```javascript
test('shows error when all providers fail', async ({ page }) => {
  // Блокируем все API
  await page.route('**/api.monobank.ua/**', route => route.abort());
  await page.route('**/api.privatbank.ua/**', route => route.abort());
  await page.route('**/bank.gov.ua/**', route => route.abort());
  
  await page.goto('/calculator');
  await page.click('button:has-text("Обновить курсы")');
  
  await expect(page.locator('.api-status.error')).toBeVisible();
  await expect(page.locator('text=UAH')).toBeVisible();
});
```

### Сценарий 5: Спиннер во время загрузки

```javascript
test('shows spinner while loading', async ({ page }) => {
  // Замедляем ответ
  await page.route('**/api.monobank.ua/**', async route => {
    await new Promise(r => setTimeout(r, 2000));
    await route.continue();
  });
  
  await page.goto('/calculator');
  await page.click('button:has-text("Обновить курсы")');
  
  // Спиннер должен появиться
  await expect(page.locator('.spinner')).toBeVisible();
  
  // И исчезнуть после загрузки
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10000 });
});
```

---

## Чеклист готовности

- [ ] Monobank API работает (прямой запрос, без прокси)
- [ ] ExchangeRate-API работает (прямой запрос)
- [ ] ПриватБанк работает через corsproxy.io
- [ ] НБУ работает как fallback
- [ ] Кнопка "Обновить" показывает спиннер
- [ ] После загрузки курсы появляются в полях ввода
- [ ] Статус показывает источник и время
- [ ] Ошибки отображаются в красном блоке
- [ ] Fallback срабатывает при недоступности провайдера
- [ ] Автозагрузка при mount (если включена)
- [ ] Все селекты работают и сохраняют выбор

---

## Дополнительные заметки

1. **Console.log везде** — для отладки добавь логи в каждый fetch и обработчик
2. **Try/catch обязательно** — каждый fetch должен быть обёрнут
3. **Таймаут 8 сек** — не ждать вечно если API завис
4. **Проверяй Network tab** — смотри реально ли уходят запросы
5. **CORS ошибки** — будут в консоли, не в catch (иногда)

---

## Контакты

Если будут вопросы по логике расчётов (не API) — возвращайся в этот чат, там есть вся история с формулами и code review.
