import { useState, useReducer, useMemo, useCallback, useEffect } from "react";

// ─── i18n Configuration ───
const SUPPORTED_LANGUAGES = ["en", "uk", "ru"];
const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "fop-calc-lang";

const TRANSLATIONS = {
  en: {
    // API Panel
    "api.title": "📡 rate sources",
    "api.refresh": "🔄 Refresh rates",
    "api.loading": "Loading...",
    "api.uahProvider": "UAH provider",
    "api.plnProvider": "PLN provider",
    "api.corsProxy": "CORS proxy",
    "api.autoFallback": "Auto-fallback on error",
    "api.autoLoad": "Load on start",
    "api.forPrivatBank": "For PrivatBank",
    "api.needsProxy": "⚠️ needs proxy",
    "api.status.uah": "UAH:",
    "api.status.pln": "PLN:",
    "api.status.fallback": "(fallback from {provider})",
    "api.status.official": "[official]",
    "api.error.allUnavailable": "All providers unavailable: {details}",
    "api.error.plnUnavailable": "PLN providers unavailable: {details}",

    // Mode & Inputs
    "mode.forward": "$ → zł  How much will I get?",
    "mode.reverse": "zł → $  How much do I need?",
    "input.fopUsd": "💵 FOP amount (USD)",
    "input.targetPln": "🎯 Target amount (PLN)",
    "input.placeholder": "e.g. 4000",
    "input.usdToUahBuy": "🏦 PrivatBank: $ → ₴",
    "input.uahToUsdSell": "🏦 PrivatBank: ₴ → $",
    "input.bankBuys": "bank buys",
    "input.bankSells": "bank sells",
    "input.privatFee": "💸 PrivatBank fee (USD)",
    "input.usdToPlnRate": "💱 USD/PLN rate",
    "input.revolutInterbank": "Revolut interbank",
    "input.topUpMethod": "📱 Revolut top-up method",
    "input.revolutPlan": "⭐ Revolut plan",
    "input.conversionTime": "📅 When converting?",
    "input.weekday": "🟢 Weekday",
    "input.weekend": "🔴 Weekend",
    "input.existingPln": "💰 Already on account (PLN)",
    "input.reset": "↺ Reset",

    // Calculations
    "calc.breakdown": "pipeline breakdown",
    "calc.step1.title": "FOP → ₴",
    "calc.step1.desc": "Bank buys your dollars",
    "calc.step2.title": "₴ → $ (individual)",
    "calc.step2.desc": "You buy dollars back",
    "calc.step3.title": "$ → Revolut",
    "calc.step4.title": "$ → zł (Revolut)",
    "calc.step4.weekend": "Weekend — {fee}% fee",
    "calc.step4.weekendFree": "Weekend — no extra fee (plan includes)",
    "calc.step4.weekday": "Weekday — no extra fee",

    // Results
    "result.total": "total on account",
    "result.existing": "{existing} was + {new} new",
    "result.needed": "needed from fop",
    "result.chain": "→ {uah} → {usd} → {pln}",

    // Fees
    "fees.title": "fee losses",
    "fees.spread": "PrivatBank spread",
    "fees.topup": "Top-up fee",
    "fees.weekend": "Weekend fee",
    "fees.fairUse": "Fair use fee",
    "fees.total": "Total:",

    // Reverse
    "reverse.title": "reverse calculation",
    "reverse.step1.title": "Need zloty",
    "reverse.step1.desc": "Target minus existing",
    "reverse.step2.title": "USD on Revolut",
    "reverse.step2.desc": "With Revolut fees",
    "reverse.step3.title": "USD on card",
    "reverse.step4.title": "Buy at PrivatBank",
    "reverse.step4.desc": "+ {fee} fee",
    "reverse.step5.title": "Need hryvnia",
    "reverse.step5.desc": "× {rate}",
    "reverse.step6.title": "Need USD from FOP",
    "reverse.step6.desc": "÷ {rate}",
    "reverse.empty.enterTarget": "Enter target amount in zloty",
    "reverse.empty.achieved": "Target already achieved ✓",

    // Top-up methods
    "topup.googlepay_mc": "Google/Apple Pay (Mastercard)",
    "topup.googlepay_mc.note": "~1% on top (verified)",
    "topup.googlepay_visa": "Google/Apple Pay (Visa)",
    "topup.googlepay_visa.note": "~2.5% on top",
    "topup.card_mc": "Card directly (Mastercard)",
    "topup.card_mc.note": "~1.3% Revolut deducts",
    "topup.card_visa": "Card directly (Visa)",
    "topup.card_visa.note": "~2.5% Revolut deducts",
    "topup.p2p": "P2P (card→card Revolut)",
    "topup.p2p.note": "Only bank fee",

    // Providers
    "provider.privatbank": "PrivatBank",
    "provider.privatbank.desc": "Non-cash rate (coursid=11)",
    "provider.monobank": "Monobank",
    "provider.monobank.desc": "Card rate",
    "provider.nbu": "NBU",
    "provider.nbu.desc": "Official rate (reference)",
    "provider.exchangerate": "ExchangeRate-API",
    "provider.exchangerate.desc": "Interbank rate (free)",
    "provider.nbu_pln": "NBU",
    "provider.nbu_pln.desc": "Cross-rate via EUR",

    // Proxies
    "proxy.direct": "Direct (no proxy)",
    "proxy.corsproxy": "corsproxy.io",
    "proxy.allorigins": "allorigins.win",

    // Footer & Update
    "footer.disclaimer": "⚠️ Rates are approximate. Check actual values before transaction.",
    "update.available": "🔄 Update available",
    "update.button": "Update",
  },

  uk: {
    // API Panel
    "api.title": "📡 джерела курсів",
    "api.refresh": "🔄 Оновити курси",
    "api.loading": "Завантаження...",
    "api.uahProvider": "UAH провайдер",
    "api.plnProvider": "PLN провайдер",
    "api.corsProxy": "CORS проксі",
    "api.autoFallback": "Авто-fallback при помилці",
    "api.autoLoad": "Завантажувати при старті",
    "api.forPrivatBank": "Для ПриватБанку",
    "api.needsProxy": "⚠️ потрібен проксі",
    "api.status.uah": "UAH:",
    "api.status.pln": "PLN:",
    "api.status.fallback": "(fallback від {provider})",
    "api.status.official": "[офіц.]",
    "api.error.allUnavailable": "Всі провайдери недоступні: {details}",
    "api.error.plnUnavailable": "PLN провайдери недоступні: {details}",

    // Mode & Inputs
    "mode.forward": "$ → zł  Скільки отримаю?",
    "mode.reverse": "zł → $  Скільки потрібно?",
    "input.fopUsd": "💵 Сума з ФОП (USD)",
    "input.targetPln": "🎯 Цільова сума (PLN)",
    "input.placeholder": "наприклад 4000",
    "input.usdToUahBuy": "🏦 ПриватБанк: $ → ₴",
    "input.uahToUsdSell": "🏦 ПриватБанк: ₴ → $",
    "input.bankBuys": "банк купує",
    "input.bankSells": "банк продає",
    "input.privatFee": "💸 Комісія ПриватБанку (USD)",
    "input.usdToPlnRate": "💱 Курс USD/PLN",
    "input.revolutInterbank": "Revolut міжбанк",
    "input.topUpMethod": "📱 Спосіб поповнення Revolut",
    "input.revolutPlan": "⭐ План Revolut",
    "input.conversionTime": "📅 Коли конвертуєте?",
    "input.weekday": "🟢 Будні",
    "input.weekend": "🔴 Вихідні",
    "input.existingPln": "💰 Вже є на рахунку (PLN)",
    "input.reset": "↺ Скинути",

    // Calculations
    "calc.breakdown": "pipeline breakdown",
    "calc.step1.title": "ФОП → ₴",
    "calc.step1.desc": "Банк купує ваші долари",
    "calc.step2.title": "₴ → $ (фіз.особа)",
    "calc.step2.desc": "Купуєте долари назад",
    "calc.step3.title": "$ → Revolut",
    "calc.step4.title": "$ → zł (Revolut)",
    "calc.step4.weekend": "Вихідні — комісія {fee}%",
    "calc.step4.weekendFree": "Вихідні — без дод. комісії (план включає)",
    "calc.step4.weekday": "Будні — без дод. комісії",

    // Results
    "result.total": "всього на рахунку",
    "result.existing": "{existing} було + {new} нових",
    "result.needed": "потрібно з фоп",
    "result.chain": "→ {uah} → {usd} → {pln}",

    // Fees
    "fees.title": "втрати на комісіях",
    "fees.spread": "Спред ПриватБанку",
    "fees.topup": "Комісія поповнення",
    "fees.weekend": "Weekend fee",
    "fees.fairUse": "Fair use fee",
    "fees.total": "Всього:",

    // Reverse
    "reverse.title": "зворотній розрахунок",
    "reverse.step1.title": "Потрібно злотих",
    "reverse.step1.desc": "Ціль мінус наявні",
    "reverse.step2.title": "USD на Revolut",
    "reverse.step2.desc": "З урахуванням комісій Revolut",
    "reverse.step3.title": "USD на картці",
    "reverse.step4.title": "Купити в ПриватБанку",
    "reverse.step4.desc": "+ {fee} комісія",
    "reverse.step5.title": "Потрібно гривень",
    "reverse.step5.desc": "× {rate}",
    "reverse.step6.title": "Потрібно USD з ФОП",
    "reverse.step6.desc": "÷ {rate}",
    "reverse.empty.enterTarget": "Введіть цільову суму в злотих",
    "reverse.empty.achieved": "Ціль вже досягнута ✓",

    // Top-up methods
    "topup.googlepay_mc": "Google/Apple Pay (Mastercard)",
    "topup.googlepay_mc.note": "~1% зверху (перевірено)",
    "topup.googlepay_visa": "Google/Apple Pay (Visa)",
    "topup.googlepay_visa.note": "~2.5% зверху",
    "topup.card_mc": "Картка напряму (Mastercard)",
    "topup.card_mc.note": "~1.3% утримує Revolut",
    "topup.card_visa": "Картка напряму (Visa)",
    "topup.card_visa.note": "~2.5% утримує Revolut",
    "topup.p2p": "P2P (картка→картка Revolut)",
    "topup.p2p.note": "Тільки комісія банку",

    // Providers
    "provider.privatbank": "ПриватБанк",
    "provider.privatbank.desc": "Безготівковий курс (coursid=11)",
    "provider.monobank": "Monobank",
    "provider.monobank.desc": "Картковий курс",
    "provider.nbu": "НБУ",
    "provider.nbu.desc": "Офіційний курс (довідковий)",
    "provider.exchangerate": "ExchangeRate-API",
    "provider.exchangerate.desc": "Міжбанківський курс (безкоштовно)",
    "provider.nbu_pln": "НБУ",
    "provider.nbu_pln.desc": "Крос-курс через EUR",

    // Proxies
    "proxy.direct": "Напряму (без проксі)",
    "proxy.corsproxy": "corsproxy.io",
    "proxy.allorigins": "allorigins.win",

    // Footer & Update
    "footer.disclaimer": "⚠️ Курси приблизні. Перевіряйте актуальні значення перед операцією.",
    "update.available": "🔄 Доступне оновлення",
    "update.button": "Оновити",
  },

  ru: {
    // API Panel
    "api.title": "📡 источники курсов",
    "api.refresh": "🔄 Обновить курсы",
    "api.loading": "Загрузка...",
    "api.uahProvider": "UAH провайдер",
    "api.plnProvider": "PLN провайдер",
    "api.corsProxy": "CORS прокси",
    "api.autoFallback": "Авто-fallback при ошибке",
    "api.autoLoad": "Загружать при старте",
    "api.forPrivatBank": "Для ПриватБанка",
    "api.needsProxy": "⚠️ нужен прокси",
    "api.status.uah": "UAH:",
    "api.status.pln": "PLN:",
    "api.status.fallback": "(fallback от {provider})",
    "api.status.official": "[офиц.]",
    "api.error.allUnavailable": "Все провайдеры недоступны: {details}",
    "api.error.plnUnavailable": "PLN провайдеры недоступны: {details}",

    // Mode & Inputs
    "mode.forward": "$ → zł  Сколько получу?",
    "mode.reverse": "zł → $  Сколько нужно?",
    "input.fopUsd": "💵 Сумма с ФОП (USD)",
    "input.targetPln": "🎯 Целевая сумма (PLN)",
    "input.placeholder": "например 4000",
    "input.usdToUahBuy": "🏦 ПриватБанк: $ → ₴",
    "input.uahToUsdSell": "🏦 ПриватБанк: ₴ → $",
    "input.bankBuys": "банк покупает",
    "input.bankSells": "банк продаёт",
    "input.privatFee": "💸 Комиссия ПриватБанка (USD)",
    "input.usdToPlnRate": "💱 Курс USD/PLN",
    "input.revolutInterbank": "Revolut межбанк",
    "input.topUpMethod": "📱 Способ пополнения Revolut",
    "input.revolutPlan": "⭐ План Revolut",
    "input.conversionTime": "📅 Когда конвертируете?",
    "input.weekday": "🟢 Будни",
    "input.weekend": "🔴 Выходные",
    "input.existingPln": "💰 Уже есть на счету (PLN)",
    "input.reset": "↺ Сброс",

    // Calculations
    "calc.breakdown": "pipeline breakdown",
    "calc.step1.title": "ФОП → ₴",
    "calc.step1.desc": "Банк покупает ваши доллары",
    "calc.step2.title": "₴ → $ (физ.лицо)",
    "calc.step2.desc": "Покупаете доллары обратно",
    "calc.step3.title": "$ → Revolut",
    "calc.step4.title": "$ → zł (Revolut)",
    "calc.step4.weekend": "Выходные — комиссия {fee}%",
    "calc.step4.weekendFree": "Выходные — без доп. комиссии (план включает)",
    "calc.step4.weekday": "Будни — без доп. комиссии",

    // Results
    "result.total": "итого на счету",
    "result.existing": "{existing} было + {new} новых",
    "result.needed": "нужно с фоп",
    "result.chain": "→ {uah} → {usd} → {pln}",

    // Fees
    "fees.title": "потери на комиссиях",
    "fees.spread": "Спред ПриватБанка",
    "fees.topup": "Комиссия пополнения",
    "fees.weekend": "Weekend fee",
    "fees.fairUse": "Fair use fee",
    "fees.total": "Всего:",

    // Reverse
    "reverse.title": "обратный расчёт",
    "reverse.step1.title": "Нужно злотых",
    "reverse.step1.desc": "Цель минус имеющиеся",
    "reverse.step2.title": "USD на Revolut",
    "reverse.step2.desc": "С учётом комиссий Revolut",
    "reverse.step3.title": "USD на карте",
    "reverse.step4.title": "Купить в ПриватБанке",
    "reverse.step4.desc": "+ {fee} комиссия",
    "reverse.step5.title": "Нужно гривен",
    "reverse.step5.desc": "× {rate}",
    "reverse.step6.title": "Нужно USD с ФОП",
    "reverse.step6.desc": "÷ {rate}",
    "reverse.empty.enterTarget": "Введите целевую сумму в злотых",
    "reverse.empty.achieved": "Цель уже достигнута ✓",

    // Top-up methods
    "topup.googlepay_mc": "Google/Apple Pay (Mastercard)",
    "topup.googlepay_mc.note": "~1% сверху (проверено)",
    "topup.googlepay_visa": "Google/Apple Pay (Visa)",
    "topup.googlepay_visa.note": "~2.5% сверху",
    "topup.card_mc": "Карта напрямую (Mastercard)",
    "topup.card_mc.note": "~1.3% удерживает Revolut",
    "topup.card_visa": "Карта напрямую (Visa)",
    "topup.card_visa.note": "~2.5% удерживает Revolut",
    "topup.p2p": "P2P (карта→карта Revolut)",
    "topup.p2p.note": "Только комиссия банка",

    // Providers
    "provider.privatbank": "ПриватБанк",
    "provider.privatbank.desc": "Безналичный курс (coursid=11)",
    "provider.monobank": "Monobank",
    "provider.monobank.desc": "Карточный курс",
    "provider.nbu": "НБУ",
    "provider.nbu.desc": "Официальный курс (справочный)",
    "provider.exchangerate": "ExchangeRate-API",
    "provider.exchangerate.desc": "Межбанковский курс (бесплатно)",
    "provider.nbu_pln": "НБУ",
    "provider.nbu_pln.desc": "Кросс-курс через EUR",

    // Proxies
    "proxy.direct": "Напрямую (без прокси)",
    "proxy.corsproxy": "corsproxy.io",
    "proxy.allorigins": "allorigins.win",

    // Footer & Update
    "footer.disclaimer": "⚠️ Курсы приблизительные. Проверяйте актуальные значения перед операцией.",
    "update.available": "🔄 Доступно обновление",
    "update.button": "Обновить",
  },
};

// ─── i18n Helper Functions ───
function getInitialLanguage() {
  // 1. Check localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {}

  // 2. Check browser language
  const browserLang = navigator.language?.toLowerCase() || "";
  if (browserLang.startsWith("uk")) return "uk";
  if (browserLang.startsWith("ru")) return "ru";

  return DEFAULT_LANGUAGE;
}

function interpolate(str, vars = {}) {
  if (!str) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function useTranslation() {
  const [lang, setLangState] = useState(getInitialLanguage);

  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGUAGES.includes(newLang)) {
      setLangState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {}
    }
  }, []);

  const t = useCallback((key, vars) => {
    const translation = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE]?.[key] ?? key;
    return interpolate(translation, vars);
  }, [lang]);

  return { t, lang, setLang };
}

// ─── Language Selector Component ───
function LanguageSelector({ lang, setLang }) {
  const languages = [
    { code: "en", flag: "🇬🇧", label: "EN" },
    { code: "uk", flag: "🇺🇦", label: "UA" },
    { code: "ru", flag: "🇷🇺", label: "RU" },
  ];

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {languages.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            background: lang === code ? "rgba(99, 102, 241, 0.3)" : "transparent",
            border: lang === code ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid transparent",
            color: lang === code ? "#e2e8f0" : "#64748b",
            padding: "4px 8px",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s",
          }}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Fee Configuration ───
const TOP_UP_FEES = {
  googlepay_mc:   { labelKey: "topup.googlepay_mc",   fee: 0.01,  feeModel: "additive",    noteKey: "topup.googlepay_mc.note" },
  googlepay_visa: { labelKey: "topup.googlepay_visa", fee: 0.025, feeModel: "additive",    noteKey: "topup.googlepay_visa.note" },
  card_mc:        { labelKey: "topup.card_mc",        fee: 0.013, feeModel: "subtractive", noteKey: "topup.card_mc.note" },
  card_visa:      { labelKey: "topup.card_visa",      fee: 0.025, feeModel: "subtractive", noteKey: "topup.card_visa.note" },
  p2p:            { labelKey: "topup.p2p",            fee: 0,     feeModel: "none",        noteKey: "topup.p2p.note" },
};

const REVOLUT_PLANS = {
  standard: { label: "Standard", weekendFee: 0.01,  fairUseFee: 0.005, fairUseLimitUsd: 1000 },
  plus:     { label: "Plus",     weekendFee: 0.005, fairUseFee: 0.005, fairUseLimitUsd: 3000 },
  premium:  { label: "Premium",  weekendFee: 0,     fairUseFee: 0.005, fairUseLimitUsd: 10000 },
  metal:    { label: "Metal",    weekendFee: 0,     fairUseFee: 0,     fairUseLimitUsd: Infinity },
  ultra:    { label: "Ultra",    weekendFee: 0,     fairUseFee: 0,     fairUseLimitUsd: Infinity },
};

// ─── API Providers Configuration ───
const UAH_PROVIDERS = {
  privatbank: {
    labelKey: "provider.privatbank",
    descKey: "provider.privatbank.desc",
    hasCors: false,
  },
  monobank: {
    labelKey: "provider.monobank",
    descKey: "provider.monobank.desc",
    hasCors: true,
  },
  nbu: {
    labelKey: "provider.nbu",
    descKey: "provider.nbu.desc",
    hasCors: true,
  },
};

const PLN_PROVIDERS = {
  exchangerate: {
    labelKey: "provider.exchangerate",
    descKey: "provider.exchangerate.desc",
    hasCors: true,
  },
  nbu_pln: {
    labelKey: "provider.nbu_pln",
    descKey: "provider.nbu_pln.desc",
    hasCors: true,
  },
};

const CORS_PROXIES = [
  { url: "", labelKey: "proxy.direct" },
  { url: "https://corsproxy.io/?", labelKey: "proxy.corsproxy" },
  { url: "https://api.allorigins.win/raw?url=", labelKey: "proxy.allorigins" },
];

// ISO 4217 currency codes
const CURRENCY_CODES = { USD: 840, UAH: 980, EUR: 978, PLN: 985 };

const INITIAL_STATE = {
  fopUsd: 1000,
  usdToUahBuy: 42.50,
  uahToUsdSell: 43.10,
  privatFee: 1.17,
  topUpMethod: "googlepay_mc",
  revolutPlan: "standard",
  isWeekend: false,
  usdToPlnRate: 3.95,
  existingPln: 0,
  targetPln: 0,
  mode: "forward",
};

function reducer(state, action) {
  if (action.type === "reset") return INITIAL_STATE;
  if (action.type === "set") return { ...state, [action.field]: action.value };
  if (action.type === "setMultiple") return { ...state, ...action.values };
  return state;
}

// ─── Helpers ───
const fmt = (n, dec = 2) => Number(n).toFixed(dec);
const fmtPln = (n) => `${fmt(n)} zł`;
const fmtUsd = (n) => `$${fmt(n)}`;
const fmtUah = (n) => `${fmt(n)} ₴`;
const safeDivide = (a, b) => (b === 0 ? 0 : a / b);
const round2 = (n) => Math.round(n * 100) / 100;
const ceil2 = (n) => Math.ceil(n * 100) / 100;

// ─── Calculation Functions ───
function calcTopUp(usdOnCard, topUpInfo) {
  const { fee, feeModel } = topUpInfo;
  if (feeModel === "none" || fee === 0) {
    return { usdOnRevolut: usdOnCard, usdDeducted: usdOnCard, topUpFee: 0 };
  }
  if (feeModel === "additive") {
    const usdSent = usdOnCard / (1 + fee);
    return { usdOnRevolut: usdSent, usdDeducted: usdOnCard, topUpFee: usdOnCard - usdSent };
  }
  const credited = usdOnCard * (1 - fee);
  return { usdOnRevolut: credited, usdDeducted: usdOnCard, topUpFee: usdOnCard - credited };
}

function reverseTopUp(usdNeededOnRevolut, topUpInfo) {
  const { fee, feeModel } = topUpInfo;
  if (feeModel === "none" || fee === 0) return usdNeededOnRevolut;
  if (feeModel === "additive") return usdNeededOnRevolut * (1 + fee);
  return safeDivide(usdNeededOnRevolut, 1 - fee);
}

function calcRevolutFees(usdOnRevolut, planInfo, isWeekend) {
  let effectiveUsd = usdOnRevolut;
  let weekendFeeAmt = 0;
  let fairUseFeeAmt = 0;

  if (isWeekend && planInfo.weekendFee > 0) {
    weekendFeeAmt = effectiveUsd * planInfo.weekendFee;
    effectiveUsd -= weekendFeeAmt;
  }

  if (planInfo.fairUseFee > 0 && usdOnRevolut > planInfo.fairUseLimitUsd) {
    const overLimit = usdOnRevolut - planInfo.fairUseLimitUsd;
    fairUseFeeAmt = overLimit * planInfo.fairUseFee;
    effectiveUsd -= fairUseFeeAmt;
  }

  return { effectiveUsd, weekendFeeAmt, fairUseFeeAmt };
}

function reverseRevolutFees(plnNeeded, usdToPlnRate, planInfo, isWeekend) {
  let usdNeeded = safeDivide(plnNeeded, usdToPlnRate);

  if (planInfo.fairUseFee > 0 && usdNeeded > planInfo.fairUseLimitUsd) {
    const corrected = safeDivide(
      usdNeeded - planInfo.fairUseLimitUsd * planInfo.fairUseFee,
      1 - planInfo.fairUseFee
    );
    if (corrected > planInfo.fairUseLimitUsd) {
      usdNeeded = corrected;
    }
  }

  if (isWeekend && planInfo.weekendFee > 0) {
    usdNeeded = safeDivide(usdNeeded, 1 - planInfo.weekendFee);
  }

  return usdNeeded;
}

// ─── API Fetchers ───
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPrivatBank(corsProxy = "") {
  const baseUrl = "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=11";
  const url = corsProxy ? corsProxy + encodeURIComponent(baseUrl) : baseUrl;
  
  const data = await fetchWithTimeout(url);
  const usd = data.find(r => r.ccy === "USD");
  if (!usd) throw new Error("USD not found");
  
  return {
    buy: parseFloat(usd.buy),
    sell: parseFloat(usd.sale),
  };
}

async function fetchMonobank() {
  const data = await fetchWithTimeout("https://api.monobank.ua/bank/currency");
  const usdUah = data.find(
    r => r.currencyCodeA === CURRENCY_CODES.USD && r.currencyCodeB === CURRENCY_CODES.UAH
  );
  if (!usdUah) throw new Error("USD/UAH not found");
  
  return {
    buy: usdUah.rateBuy,
    sell: usdUah.rateSell,
  };
}

async function fetchNBU() {
  const data = await fetchWithTimeout(
    "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json"
  );
  if (!data?.[0]?.rate) throw new Error("Rate not found");
  
  // НБУ даёт один официальный курс
  const rate = data[0].rate;
  return {
    buy: rate,
    sell: rate,
    isOfficial: true,
  };
}

async function fetchExchangeRateAPI() {
  const data = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD");
  if (data.result !== "success" || !data.rates?.PLN) {
    throw new Error("PLN rate not found");
  }
  return { rate: data.rates.PLN };
}

async function fetchNBU_PLN() {
  // НБУ публикует курсы к гривне, нужно посчитать кросс-курс
  const data = await fetchWithTimeout(
    "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"
  );
  const usd = data.find(r => r.cc === "USD");
  const pln = data.find(r => r.cc === "PLN");
  
  if (!usd?.rate || !pln?.rate) throw new Error("Rates not found");
  
  // USD/PLN = (USD/UAH) / (PLN/UAH)
  const rate = usd.rate / pln.rate;
  return { rate, isOfficial: true };
}

// ─── Main Component ───
export default function CurrencyCalculator() {
  const { t, lang, setLang } = useTranslation();
  const [s, dispatch] = useReducer(reducer, INITIAL_STATE);

  // API state
  const [uahProvider, setUahProvider] = useState("monobank");
  const [plnProvider, setPlnProvider] = useState("exchangerate");
  const [corsProxy, setCorsProxy] = useState(CORS_PROXIES[1].url);
  const [autoFallback, setAutoFallback] = useState(true);
  const [autoLoad, setAutoLoad] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [ratesInfo, setRatesInfo] = useState(null);
  const [errors, setErrors] = useState([]);
  
  const set = (field, value) => dispatch({ type: "set", field, value });

  // ─── Fetch UAH rates ───
  const fetchUahRates = useCallback(async (provider, proxy) => {
    const attempts = [];

    const tryProvider = async (p) => {
      switch (p) {
        case "privatbank":
          return { ...(await fetchPrivatBank(proxy)), sourceKey: "provider.privatbank" };
        case "monobank":
          return { ...(await fetchMonobank()), sourceKey: "provider.monobank" };
        case "nbu":
          return { ...(await fetchNBU()), sourceKey: "provider.nbu" };
        default:
          throw new Error("Unknown provider");
      }
    };

    // Try selected provider first
    try {
      return await tryProvider(provider);
    } catch (e) {
      attempts.push({ provider, error: e.message });
    }

    // Fallback if enabled
    if (autoFallback) {
      const fallbackOrder = ["monobank", "privatbank", "nbu"].filter(p => p !== provider);
      for (const fb of fallbackOrder) {
        try {
          const result = await tryProvider(fb);
          result.fallback = true;
          result.originalProvider = provider;
          return result;
        } catch (e) {
          attempts.push({ provider: fb, error: e.message });
        }
      }
    }

    // Return error with details for translation
    const details = attempts.map(a => `${a.provider}: ${a.error}`).join("; ");
    throw new Error(details);
  }, [autoFallback]);

  // ─── Fetch PLN rate ───
  const fetchPlnRate = useCallback(async (provider) => {
    const attempts = [];

    const tryProvider = async (p) => {
      switch (p) {
        case "exchangerate":
          return { ...(await fetchExchangeRateAPI()), sourceKey: "provider.exchangerate" };
        case "nbu_pln":
          return { ...(await fetchNBU_PLN()), sourceKey: "provider.nbu_pln" };
        default:
          throw new Error("Unknown provider");
      }
    };

    try {
      return await tryProvider(provider);
    } catch (e) {
      attempts.push({ provider, error: e.message });
    }

    if (autoFallback) {
      const fallbackOrder = ["exchangerate", "nbu_pln"].filter(p => p !== provider);
      for (const fb of fallbackOrder) {
        try {
          const result = await tryProvider(fb);
          result.fallback = true;
          result.originalProvider = provider;
          return result;
        } catch (e) {
          attempts.push({ provider: fb, error: e.message });
        }
      }
    }

    // Return error with details for translation
    const details = attempts.map(a => `${a.provider}: ${a.error}`).join("; ");
    throw new Error(details);
  }, [autoFallback]);

  // ─── Load all rates ───
  const loadRates = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const newErrors = [];
    const info = { timestamp: new Date() };

    // Fetch UAH
    try {
      const uah = await fetchUahRates(uahProvider, corsProxy);
      dispatch({ type: "setMultiple", values: {
        usdToUahBuy: uah.buy,
        uahToUsdSell: uah.sell,
      }});
      info.uah = {
        sourceKey: uah.sourceKey,
        fallback: uah.fallback,
        originalProvider: uah.originalProvider,
        isOfficial: uah.isOfficial,
      };
    } catch (e) {
      newErrors.push({ type: "uah", details: e.message });
    }

    // Fetch PLN
    try {
      const pln = await fetchPlnRate(plnProvider);
      dispatch({ type: "set", field: "usdToPlnRate", value: pln.rate });
      info.pln = {
        sourceKey: pln.sourceKey,
        fallback: pln.fallback,
        originalProvider: pln.originalProvider,
        isOfficial: pln.isOfficial,
      };
    } catch (e) {
      newErrors.push({ type: "pln", details: e.message });
    }

    setRatesInfo(info);
    setErrors(newErrors);
    setLoading(false);
  }, [uahProvider, plnProvider, corsProxy, fetchUahRates, fetchPlnRate]);

  // ─── Auto-load on mount ───
  useEffect(() => {
    if (autoLoad) {
      loadRates();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Forward calculation ───
  const calc = useMemo(() => {
    const topUpInfo = TOP_UP_FEES[s.topUpMethod];
    const planInfo = REVOLUT_PLANS[s.revolutPlan];

    const uahFromFop = s.fopUsd * s.usdToUahBuy;
    const grossUsd = safeDivide(uahFromFop, s.uahToUsdSell);
    const usdAfterPrivatFee = Math.max(grossUsd - s.privatFee, 0);
    const { usdOnRevolut, usdDeducted, topUpFee } = calcTopUp(usdAfterPrivatFee, topUpInfo);
    const { effectiveUsd, weekendFeeAmt, fairUseFeeAmt } = calcRevolutFees(usdOnRevolut, planInfo, s.isWeekend);
    const plnResult = effectiveUsd * s.usdToPlnRate;
    const totalPln = plnResult + s.existingPln;
    const spreadLoss = s.fopUsd - grossUsd + s.privatFee;
    const totalFeesUsd = spreadLoss + topUpFee + weekendFeeAmt + fairUseFeeAmt;
    const totalFeesPercent = s.fopUsd > 0 ? (totalFeesUsd / s.fopUsd) * 100 : 0;

    return {
      uahFromFop: round2(uahFromFop),
      grossUsd: round2(grossUsd),
      usdAfterPrivatFee: round2(usdAfterPrivatFee),
      usdOnRevolut: round2(usdOnRevolut),
      usdDeducted: round2(usdDeducted),
      topUpFee: round2(topUpFee),
      effectiveUsd: round2(effectiveUsd),
      weekendFeeAmt: round2(weekendFeeAmt),
      fairUseFeeAmt: round2(fairUseFeeAmt),
      plnResult: round2(plnResult),
      totalPln: round2(totalPln),
      spreadLoss: round2(spreadLoss),
      totalFeesUsd: round2(totalFeesUsd),
      totalFeesPercent: round2(totalFeesPercent),
    };
  }, [s]);

  // ─── Reverse calculation ───
  const reverseCalc = useMemo(() => {
    if (s.targetPln <= 0) return null;
    const plnNeeded = Math.max(s.targetPln - s.existingPln, 0);
    if (plnNeeded === 0) {
      return { plnNeeded: 0, usdOnRevolut: 0, usdFromCard: 0, usdToBuy: 0, uahNeeded: 0, fopUsdNeeded: 0 };
    }

    const topUpInfo = TOP_UP_FEES[s.topUpMethod];
    const planInfo = REVOLUT_PLANS[s.revolutPlan];
    const usdOnRevolut = reverseRevolutFees(plnNeeded, s.usdToPlnRate, planInfo, s.isWeekend);
    const usdFromCard = reverseTopUp(usdOnRevolut, topUpInfo);
    const usdToBuy = usdFromCard + s.privatFee;
    const uahNeeded = usdToBuy * s.uahToUsdSell;
    const fopUsdNeeded = safeDivide(uahNeeded, s.usdToUahBuy);

    return {
      plnNeeded: round2(plnNeeded),
      usdOnRevolut: ceil2(usdOnRevolut),
      usdFromCard: ceil2(usdFromCard),
      usdToBuy: ceil2(usdToBuy),
      uahNeeded: ceil2(uahNeeded),
      fopUsdNeeded: ceil2(fopUsdNeeded),
    };
  }, [s]);

  // ─── Render ───
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0e17 0%, #111827 50%, #0f172a 100%)",
      color: "#e2e8f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input[type=number], select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #e2e8f0;
          padding: 10px 12px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        input[type=number]:focus, select:focus {
          border-color: rgba(99, 102, 241, 0.8);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        select { cursor: pointer; font-size: 13px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        .checkbox-wrapper {
          display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;
        }
        .checkbox-wrapper input { width: auto; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 24, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0 }}>
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>
          <div style={{
            fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#6366f1", marginBottom: 8,
          }}>currency pipeline calculator v3</div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, margin: 0,
            background: "linear-gradient(90deg, #818cf8, #6366f1, #a78bfa)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent", color: "transparent",
          }}>FOP $ → ₴ → $ → Revolut → zł</h1>
        </div>

        {/* ── API Panel ── */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: 12, padding: 16, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#6366f1" }}>
              {t("api.title")}
            </div>
            <button
              onClick={loadRates}
              disabled={loading}
              style={{
                background: loading ? "rgba(99, 102, 241, 0.3)" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                border: "none",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                  {t("api.loading")}
                </>
              ) : (
                <>{t("api.refresh")}</>
              )}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <Label>{t("api.uahProvider")}</Label>
              <select value={uahProvider} onChange={e => setUahProvider(e.target.value)}>
                {Object.entries(UAH_PROVIDERS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v.labelKey)}</option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                {t(UAH_PROVIDERS[uahProvider].descKey)}
                {!UAH_PROVIDERS[uahProvider].hasCors && ` ${t("api.needsProxy")}`}
              </div>
            </div>

            <div>
              <Label>{t("api.plnProvider")}</Label>
              <select value={plnProvider} onChange={e => setPlnProvider(e.target.value)}>
                {Object.entries(PLN_PROVIDERS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v.labelKey)}</option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                {t(PLN_PROVIDERS[plnProvider].descKey)}
              </div>
            </div>

            <div>
              <Label>{t("api.corsProxy")}</Label>
              <select value={corsProxy} onChange={e => setCorsProxy(e.target.value)}>
                {CORS_PROXIES.map((p, i) => (
                  <option key={i} value={p.url}>{t(p.labelKey)}</option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                {t("api.forPrivatBank")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
            <label className="checkbox-wrapper" style={{ fontSize: 12, color: "#94a3b8" }}>
              <input
                type="checkbox"
                checked={autoFallback}
                onChange={e => setAutoFallback(e.target.checked)}
              />
              {t("api.autoFallback")}
            </label>
            <label className="checkbox-wrapper" style={{ fontSize: 12, color: "#94a3b8" }}>
              <input
                type="checkbox"
                checked={autoLoad}
                onChange={e => setAutoLoad(e.target.checked)}
              />
              {t("api.autoLoad")}
            </label>
          </div>

          {/* Status */}
          {ratesInfo && (
            <div style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 8, padding: 10, fontSize: 11,
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                {ratesInfo.uah && (
                  <span>
                    <span style={{ color: "#64748b" }}>{t("api.status.uah")}</span>{" "}
                    <span style={{ color: "#22c55e" }}>{t(ratesInfo.uah.sourceKey)}</span>
                    {ratesInfo.uah.fallback && (
                      <span style={{ color: "#f59e0b" }}> {t("api.status.fallback", { provider: t(UAH_PROVIDERS[ratesInfo.uah.originalProvider]?.labelKey) })}</span>
                    )}
                    {ratesInfo.uah.isOfficial && (
                      <span style={{ color: "#64748b" }}> {t("api.status.official")}</span>
                    )}
                  </span>
                )}
                {ratesInfo.pln && (
                  <span>
                    <span style={{ color: "#64748b" }}>{t("api.status.pln")}</span>{" "}
                    <span style={{ color: "#22c55e" }}>{t(ratesInfo.pln.sourceKey)}</span>
                    {ratesInfo.pln.fallback && (
                      <span style={{ color: "#f59e0b" }}> {t("api.status.fallback", { provider: t(PLN_PROVIDERS[ratesInfo.pln.originalProvider]?.labelKey) })}</span>
                    )}
                  </span>
                )}
                <span style={{ color: "#64748b" }}>
                  {ratesInfo.timestamp?.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 8, padding: 10, marginTop: 8, fontSize: 11, color: "#f87171",
            }}>
              {errors.map((e, i) => (
                <div key={i}>
                  ⚠️ {e.type === "uah"
                    ? t("api.error.allUnavailable", { details: e.details })
                    : t("api.error.plnUnavailable", { details: e.details })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mode Toggle ── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 20,
          background: "rgba(15, 23, 42, 0.6)", padding: 4, borderRadius: 10,
          border: "1px solid rgba(99, 102, 241, 0.15)",
        }}>
          {[
            { key: "forward", labelKey: "mode.forward" },
            { key: "reverse", labelKey: "mode.reverse" },
          ].map((m) => (
            <button key={m.key} onClick={() => set("mode", m.key)} style={{
              flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              fontWeight: s.mode === m.key ? 600 : 400,
              background: s.mode === m.key ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
              color: s.mode === m.key ? "#fff" : "#64748b", transition: "all 0.2s",
            }}>{t(m.labelKey)}</button>
          ))}
        </div>

        {/* ── Input Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>{s.mode === "forward" ? t("input.fopUsd") : t("input.targetPln")}</Label>
            {s.mode === "forward" ? (
              <NumInput value={s.fopUsd} onChange={v => set("fopUsd", v)} step="100" min={0} />
            ) : (
              <NumInput value={s.targetPln} onChange={v => set("targetPln", v)} step="100" min={0} placeholder={t("input.placeholder")} />
            )}
          </div>

          <div>
            <Label>
              {t("input.usdToUahBuy")}
              <LabelHint>{t("input.bankBuys")}</LabelHint>
            </Label>
            <NumInput value={s.usdToUahBuy} onChange={v => set("usdToUahBuy", v)} step="0.01" min={0.01} />
          </div>
          <div>
            <Label>
              {t("input.uahToUsdSell")}
              <LabelHint>{t("input.bankSells")}</LabelHint>
            </Label>
            <NumInput value={s.uahToUsdSell} onChange={v => set("uahToUsdSell", v)} step="0.01" min={0.01} />
          </div>
          <div>
            <Label>{t("input.privatFee")}</Label>
            <NumInput value={s.privatFee} onChange={v => set("privatFee", v)} step="0.01" min={0} />
          </div>
          <div>
            <Label>
              {t("input.usdToPlnRate")}
              <LabelHint>{t("input.revolutInterbank")}</LabelHint>
            </Label>
            <NumInput value={s.usdToPlnRate} onChange={v => set("usdToPlnRate", v)} step="0.0001" min={0.01} />
          </div>
          <div>
            <Label>{t("input.topUpMethod")}</Label>
            <select value={s.topUpMethod} onChange={e => set("topUpMethod", e.target.value)}>
              {Object.entries(TOP_UP_FEES).map(([k, v]) => (
                <option key={k} value={k}>{t(v.labelKey)} ({(v.fee * 100).toFixed(1)}%)</option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("input.revolutPlan")}</Label>
            <select value={s.revolutPlan} onChange={e => set("revolutPlan", e.target.value)}>
              {Object.entries(REVOLUT_PLANS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("input.conversionTime")}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {[false, true].map(v => (
                <button key={String(v)} onClick={() => set("isWeekend", v)} style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  fontWeight: s.isWeekend === v ? 600 : 400,
                  background: s.isWeekend === v ? (v ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)") : "rgba(15,23,42,0.8)",
                  color: s.isWeekend === v ? "#fff" : "#64748b", transition: "all 0.2s",
                }}>{v ? t("input.weekend") : t("input.weekday")}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>{t("input.existingPln")}</Label>
            <NumInput value={s.existingPln} onChange={v => set("existingPln", v)} step="0.01" min={0} />
          </div>

          <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
            <button onClick={() => dispatch({ type: "reset" })} style={{
              background: "transparent", border: "1px solid rgba(100,116,139,0.3)", color: "#64748b",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{t("input.reset")}</button>
          </div>
        </div>

        {/* ── Results ── */}
        {s.mode === "forward" ? (
          <div>
            <div style={{
              background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <SectionHeader color="#6366f1">{t("calc.breakdown")}</SectionHeader>

              <Step n="1" title={t("calc.step1.title")} desc={t("calc.step1.desc")}>
                {fmtUsd(s.fopUsd)} × {s.usdToUahBuy} = <Hl>{fmtUah(calc.uahFromFop)}</Hl>
              </Step>

              <Step n="2" title={t("calc.step2.title")} desc={t("calc.step2.desc")}>
                {fmtUah(calc.uahFromFop)} ÷ {s.uahToUsdSell} − {fmtUsd(s.privatFee)} = <Hl>{fmtUsd(calc.usdAfterPrivatFee)}</Hl>
              </Step>

              <Step n="3" title={t("calc.step3.title")} desc={t(TOP_UP_FEES[s.topUpMethod].noteKey)}>
                {fmtUsd(calc.usdDeducted)} → <Hl>{fmtUsd(calc.usdOnRevolut)}</Hl>
                {calc.topUpFee > 0 && <><br/><Red>{t("fees.topup")}: −{fmtUsd(calc.topUpFee)}</Red></>}
              </Step>

              <Step n="4" title={t("calc.step4.title")} desc={
                s.isWeekend
                  ? (REVOLUT_PLANS[s.revolutPlan].weekendFee > 0
                      ? t("calc.step4.weekend", { fee: (REVOLUT_PLANS[s.revolutPlan].weekendFee * 100).toFixed(1) })
                      : t("calc.step4.weekendFree"))
                  : t("calc.step4.weekday")
              }>
                {fmtUsd(calc.effectiveUsd)} × {s.usdToPlnRate} = <Hl>{fmtPln(calc.plnResult)}</Hl>
                {calc.weekendFeeAmt > 0 && <><br/><Red>{t("fees.weekend")}: −{fmtUsd(calc.weekendFeeAmt)}</Red></>}
                {calc.fairUseFeeAmt > 0 && <><br/><Red>{t("fees.fairUse")}: −{fmtUsd(calc.fairUseFeeAmt)}</Red></>}
              </Step>
            </div>

            <ResultCard label={t("result.total")} value={fmtPln(calc.totalPln)}>
              {s.existingPln > 0 && (
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  {t("result.existing", { existing: fmtPln(s.existingPln), new: fmtPln(calc.plnResult) })}
                </div>
              )}
            </ResultCard>

            <div style={{
              background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: 12, padding: 16, marginTop: 16,
            }}>
              <SectionHeader color="#f87171">{t("fees.title")}</SectionHeader>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 16px", fontSize: 13 }}>
                <FeeRow label={t("fees.spread")} value={calc.spreadLoss} />
                <FeeRow label={t("fees.topup")} value={calc.topUpFee} />
                {calc.weekendFeeAmt > 0 && <FeeRow label={t("fees.weekend")} value={calc.weekendFeeAmt} />}
                {calc.fairUseFeeAmt > 0 && <FeeRow label={t("fees.fairUse")} value={calc.fairUseFeeAmt} />}
                <div style={{
                  gridColumn: "1/-1", borderTop: "1px solid rgba(239,68,68,0.2)",
                  marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 600,
                }}>
                  <span>{t("fees.total")}</span>
                  <span style={{ color: "#f87171" }}>{fmtUsd(calc.totalFeesUsd)} ({fmt(calc.totalFeesPercent, 1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {reverseCalc && reverseCalc.plnNeeded > 0 ? (
              <>
                <div style={{
                  background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: 12, padding: 20, marginBottom: 16,
                }}>
                  <SectionHeader color="#6366f1">{t("reverse.title")}</SectionHeader>

                  <Step n="1" title={t("reverse.step1.title")} desc={t("reverse.step1.desc")}>
                    {fmtPln(s.targetPln)} − {fmtPln(s.existingPln)} = <Hl>{fmtPln(reverseCalc.plnNeeded)}</Hl>
                  </Step>
                  <Step n="2" title={t("reverse.step2.title")} desc={t("reverse.step2.desc")}>
                    <Hl>{fmtUsd(reverseCalc.usdOnRevolut)}</Hl>
                  </Step>
                  <Step n="3" title={t("reverse.step3.title")} desc={t(TOP_UP_FEES[s.topUpMethod].noteKey)}>
                    <Hl>{fmtUsd(reverseCalc.usdFromCard)}</Hl>
                  </Step>
                  <Step n="4" title={t("reverse.step4.title")} desc={t("reverse.step4.desc", { fee: fmtUsd(s.privatFee) })}>
                    <Hl>{fmtUsd(reverseCalc.usdToBuy)}</Hl>
                  </Step>
                  <Step n="5" title={t("reverse.step5.title")} desc={t("reverse.step5.desc", { rate: s.uahToUsdSell })}>
                    <Hl>{fmtUah(reverseCalc.uahNeeded)}</Hl>
                  </Step>
                  <Step n="6" title={t("reverse.step6.title")} desc={t("reverse.step6.desc", { rate: s.usdToUahBuy })}>
                    <Hl>{fmtUsd(reverseCalc.fopUsdNeeded)}</Hl>
                  </Step>
                </div>

                <ResultCard label={t("result.needed")} value={fmtUsd(reverseCalc.fopUsdNeeded)}>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    {t("result.chain", { uah: fmtUah(reverseCalc.uahNeeded), usd: fmtUsd(reverseCalc.usdToBuy), pln: fmtPln(s.targetPln) })}
                  </div>
                </ResultCard>
              </>
            ) : (
              <div style={{
                background: "rgba(15, 23, 42, 0.6)", border: "1px dashed rgba(99, 102, 241, 0.3)",
                borderRadius: 12, padding: 40, textAlign: "center", color: "#64748b",
              }}>
                {s.targetPln <= 0 ? t("reverse.empty.enterTarget") : t("reverse.empty.achieved")}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          textAlign: "center", marginTop: 24, padding: 16,
          color: "#475569", fontSize: 11, lineHeight: 1.6,
        }}>
          {t("footer.disclaimer")}
        </div>
      </div>
    </div>
  );
}

// ─── UI Components ───

function NumInput({ value, onChange, min, ...rest }) {
  return (
    <input
      type="number"
      value={value}
      onFocus={e => e.target.select()}
      onChange={e => {
        const raw = e.target.value;
        if (raw === "" || raw === "-") { onChange(0); return; }
        const parsed = parseFloat(raw);
        if (isNaN(parsed)) return;
        onChange(min !== undefined ? Math.max(parsed, min) : parsed);
      }}
      {...rest}
    />
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 500 }}>{children}</div>;
}

function LabelHint({ children }) {
  return <span style={{ color: "#64748b", fontWeight: 400, marginLeft: 6 }}>({children})</span>;
}

function SectionHeader({ color, children }) {
  return <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color, marginBottom: 16 }}>{children}</div>;
}

function Step({ n, title, desc, children }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#818cf8", flexShrink: 0,
      }}>{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{title}</div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{desc}</div>
        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}

function ResultCard({ label, value, children }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
      border: "1px solid rgba(99,102,241,0.4)", borderRadius: 12, padding: 24, textAlign: "center",
    }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#a78bfa", marginBottom: 8 }}>{label}</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700,
        background: "linear-gradient(90deg, #818cf8, #a78bfa)",
        WebkitBackgroundClip: "text", backgroundClip: "text",
        WebkitTextFillColor: "transparent", color: "transparent",
      }}>{value}</div>
      {children}
    </div>
  );
}

function Hl({ children }) {
  return <span style={{ color: "#818cf8", fontWeight: 600 }}>{children}</span>;
}

function Red({ children }) {
  return <span style={{ color: "#f87171" }}>{children}</span>;
}

function FeeRow({ label, value }) {
  return <>
    <span style={{ color: "#94a3b8" }}>{label}:</span>
    <span style={{ textAlign: "right", color: "#f87171" }}>−{fmtUsd(value)}</span>
  </>;
}
