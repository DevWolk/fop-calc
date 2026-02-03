import { useState, useReducer, useMemo, useCallback, useEffect } from "react";

// ─── Fee Configuration ───
const TOP_UP_FEES = {
  googlepay_mc:   { label: "Google/Apple Pay (Mastercard)", fee: 0.01,  feeModel: "additive",    note: "~1% сверху (проверено)" },
  googlepay_visa: { label: "Google/Apple Pay (Visa)",       fee: 0.025, feeModel: "additive",    note: "~2.5% сверху" },
  card_mc:        { label: "Карта напрямую (Mastercard)",    fee: 0.013, feeModel: "subtractive", note: "~1.3% удерживает Revolut" },
  card_visa:      { label: "Карта напрямую (Visa)",          fee: 0.025, feeModel: "subtractive", note: "~2.5% удерживает Revolut" },
  p2p:            { label: "P2P (карта→карта Revolut)",      fee: 0,     feeModel: "none",        note: "Только комиссия банка" },
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
    label: "ПриватБанк",
    desc: "Безналичный курс (coursid=11)",
    hasCors: false,
  },
  monobank: {
    label: "Monobank", 
    desc: "Карточный курс",
    hasCors: true,
  },
  nbu: {
    label: "НБУ",
    desc: "Официальный курс (справочный)",
    hasCors: true,
  },
};

const PLN_PROVIDERS = {
  exchangerate: {
    label: "ExchangeRate-API",
    desc: "Межбанковский курс (бесплатно)",
    hasCors: true,
  },
  nbu_pln: {
    label: "НБУ",
    desc: "Кросс-курс через EUR",
    hasCors: true,
  },
};

const CORS_PROXIES = [
  { url: "", label: "Напрямую (без прокси)" },
  { url: "https://corsproxy.io/?", label: "corsproxy.io" },
  { url: "https://api.allorigins.win/raw?url=", label: "allorigins.win" },
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
          return { ...(await fetchPrivatBank(proxy)), source: "ПриватБанк" };
        case "monobank":
          return { ...(await fetchMonobank()), source: "Monobank" };
        case "nbu":
          return { ...(await fetchNBU()), source: "НБУ" };
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
    
    throw new Error(`Все провайдеры недоступны: ${attempts.map(a => `${a.provider}: ${a.error}`).join("; ")}`);
  }, [autoFallback]);

  // ─── Fetch PLN rate ───
  const fetchPlnRate = useCallback(async (provider) => {
    const attempts = [];
    
    const tryProvider = async (p) => {
      switch (p) {
        case "exchangerate":
          return { ...(await fetchExchangeRateAPI()), source: "ExchangeRate-API" };
        case "nbu_pln":
          return { ...(await fetchNBU_PLN()), source: "НБУ (кросс-курс)" };
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
    
    throw new Error(`PLN провайдеры недоступны: ${attempts.map(a => `${a.provider}: ${a.error}`).join("; ")}`);
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
        source: uah.source,
        fallback: uah.fallback,
        originalProvider: uah.originalProvider,
        isOfficial: uah.isOfficial,
      };
    } catch (e) {
      newErrors.push(`UAH: ${e.message}`);
    }
    
    // Fetch PLN
    try {
      const pln = await fetchPlnRate(plnProvider);
      dispatch({ type: "set", field: "usdToPlnRate", value: pln.rate });
      info.pln = {
        source: pln.source,
        fallback: pln.fallback,
        originalProvider: pln.originalProvider,
        isOfficial: pln.isOfficial,
      };
    } catch (e) {
      newErrors.push(`PLN: ${e.message}`);
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
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#6366f1", marginBottom: 8,
          }}>currency pipeline calculator v3</div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, margin: 0,
            background: "linear-gradient(90deg, #818cf8, #6366f1, #a78bfa)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent", color: "transparent",
          }}>ФОП $ → ₴ → $ → Revolut → zł</h1>
        </div>

        {/* ── API Panel ── */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: 12, padding: 16, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#6366f1" }}>
              📡 источники курсов
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
                  Загрузка...
                </>
              ) : (
                <>🔄 Обновить курсы</>
              )}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <Label>UAH провайдер</Label>
              <select value={uahProvider} onChange={e => setUahProvider(e.target.value)}>
                {Object.entries(UAH_PROVIDERS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                {UAH_PROVIDERS[uahProvider].desc}
                {!UAH_PROVIDERS[uahProvider].hasCors && " ⚠️ нужен прокси"}
              </div>
            </div>
            
            <div>
              <Label>PLN провайдер</Label>
              <select value={plnProvider} onChange={e => setPlnProvider(e.target.value)}>
                {Object.entries(PLN_PROVIDERS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                {PLN_PROVIDERS[plnProvider].desc}
              </div>
            </div>
            
            <div>
              <Label>CORS прокси</Label>
              <select value={corsProxy} onChange={e => setCorsProxy(e.target.value)}>
                {CORS_PROXIES.map((p, i) => (
                  <option key={i} value={p.url}>{p.label}</option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                Для ПриватБанка
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
              Авто-fallback при ошибке
            </label>
            <label className="checkbox-wrapper" style={{ fontSize: 12, color: "#94a3b8" }}>
              <input
                type="checkbox"
                checked={autoLoad}
                onChange={e => setAutoLoad(e.target.checked)}
              />
              Загружать при старте
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
                    <span style={{ color: "#64748b" }}>UAH:</span>{" "}
                    <span style={{ color: "#22c55e" }}>{ratesInfo.uah.source}</span>
                    {ratesInfo.uah.fallback && (
                      <span style={{ color: "#f59e0b" }}> (fallback от {UAH_PROVIDERS[ratesInfo.uah.originalProvider]?.label})</span>
                    )}
                    {ratesInfo.uah.isOfficial && (
                      <span style={{ color: "#64748b" }}> [офиц.]</span>
                    )}
                  </span>
                )}
                {ratesInfo.pln && (
                  <span>
                    <span style={{ color: "#64748b" }}>PLN:</span>{" "}
                    <span style={{ color: "#22c55e" }}>{ratesInfo.pln.source}</span>
                    {ratesInfo.pln.fallback && (
                      <span style={{ color: "#f59e0b" }}> (fallback)</span>
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
              {errors.map((e, i) => <div key={i}>⚠️ {e}</div>)}
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
            { key: "forward", label: "$ → zł  Сколько получу?" },
            { key: "reverse", label: "zł → $  Сколько нужно?" },
          ].map((m) => (
            <button key={m.key} onClick={() => set("mode", m.key)} style={{
              flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              fontWeight: s.mode === m.key ? 600 : 400,
              background: s.mode === m.key ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
              color: s.mode === m.key ? "#fff" : "#64748b", transition: "all 0.2s",
            }}>{m.label}</button>
          ))}
        </div>

        {/* ── Input Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>{s.mode === "forward" ? "💵 Сумма с ФОП (USD)" : "🎯 Целевая сумма (PLN)"}</Label>
            {s.mode === "forward" ? (
              <NumInput value={s.fopUsd} onChange={v => set("fopUsd", v)} step="100" min={0} />
            ) : (
              <NumInput value={s.targetPln} onChange={v => set("targetPln", v)} step="100" min={0} placeholder="например 4000" />
            )}
          </div>

          <div>
            <Label>
              🏦 ПриватБанк: $ → ₴
              <LabelHint>банк покупает</LabelHint>
            </Label>
            <NumInput value={s.usdToUahBuy} onChange={v => set("usdToUahBuy", v)} step="0.01" min={0.01} />
          </div>
          <div>
            <Label>
              🏦 ПриватБанк: ₴ → $
              <LabelHint>банк продаёт</LabelHint>
            </Label>
            <NumInput value={s.uahToUsdSell} onChange={v => set("uahToUsdSell", v)} step="0.01" min={0.01} />
          </div>
          <div>
            <Label>💸 Комиссия ПриватБанка (USD)</Label>
            <NumInput value={s.privatFee} onChange={v => set("privatFee", v)} step="0.01" min={0} />
          </div>
          <div>
            <Label>
              💱 Курс USD/PLN
              <LabelHint>Revolut межбанк</LabelHint>
            </Label>
            <NumInput value={s.usdToPlnRate} onChange={v => set("usdToPlnRate", v)} step="0.0001" min={0.01} />
          </div>
          <div>
            <Label>📱 Способ пополнения Revolut</Label>
            <select value={s.topUpMethod} onChange={e => set("topUpMethod", e.target.value)}>
              {Object.entries(TOP_UP_FEES).map(([k, v]) => (
                <option key={k} value={k}>{v.label} ({(v.fee * 100).toFixed(1)}%)</option>
              ))}
            </select>
          </div>
          <div>
            <Label>⭐ План Revolut</Label>
            <select value={s.revolutPlan} onChange={e => set("revolutPlan", e.target.value)}>
              {Object.entries(REVOLUT_PLANS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>📅 Когда конвертируете?</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {[false, true].map(v => (
                <button key={String(v)} onClick={() => set("isWeekend", v)} style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  fontWeight: s.isWeekend === v ? 600 : 400,
                  background: s.isWeekend === v ? (v ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)") : "rgba(15,23,42,0.8)",
                  color: s.isWeekend === v ? "#fff" : "#64748b", transition: "all 0.2s",
                }}>{v ? "🔴 Выходные" : "🟢 Будни"}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>💰 Уже есть на счету (PLN)</Label>
            <NumInput value={s.existingPln} onChange={v => set("existingPln", v)} step="0.01" min={0} />
          </div>

          <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
            <button onClick={() => dispatch({ type: "reset" })} style={{
              background: "transparent", border: "1px solid rgba(100,116,139,0.3)", color: "#64748b",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}>↺ Сброс</button>
          </div>
        </div>

        {/* ── Results ── */}
        {s.mode === "forward" ? (
          <div>
            <div style={{
              background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <SectionHeader color="#6366f1">pipeline breakdown</SectionHeader>

              <Step n="1" title="ФОП → ₴" desc="Банк покупает ваши доллары">
                {fmtUsd(s.fopUsd)} × {s.usdToUahBuy} = <Hl>{fmtUah(calc.uahFromFop)}</Hl>
              </Step>

              <Step n="2" title="₴ → $ (физ.лицо)" desc="Покупаете доллары обратно">
                {fmtUah(calc.uahFromFop)} ÷ {s.uahToUsdSell} − {fmtUsd(s.privatFee)} = <Hl>{fmtUsd(calc.usdAfterPrivatFee)}</Hl>
              </Step>

              <Step n="3" title="$ → Revolut" desc={TOP_UP_FEES[s.topUpMethod].note}>
                Списалось: {fmtUsd(calc.usdDeducted)} → На Revolut: <Hl>{fmtUsd(calc.usdOnRevolut)}</Hl>
                {calc.topUpFee > 0 && <><br/><Red>Комиссия: −{fmtUsd(calc.topUpFee)}</Red></>}
              </Step>

              <Step n="4" title="$ → zł (Revolut)" desc={s.isWeekend ? "Выходные — комиссия 1%" : "Будни — без доп. комиссии"}>
                {fmtUsd(calc.effectiveUsd)} × {s.usdToPlnRate} = <Hl>{fmtPln(calc.plnResult)}</Hl>
                {calc.weekendFeeAmt > 0 && <><br/><Red>Weekend fee: −{fmtUsd(calc.weekendFeeAmt)}</Red></>}
                {calc.fairUseFeeAmt > 0 && <><br/><Red>Fair use fee: −{fmtUsd(calc.fairUseFeeAmt)}</Red></>}
              </Step>
            </div>

            <ResultCard label="итого на счету" value={fmtPln(calc.totalPln)}>
              {s.existingPln > 0 && (
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  {fmtPln(s.existingPln)} было + {fmtPln(calc.plnResult)} новых
                </div>
              )}
            </ResultCard>

            <div style={{
              background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: 12, padding: 16, marginTop: 16,
            }}>
              <SectionHeader color="#f87171">потери на комиссиях</SectionHeader>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 16px", fontSize: 13 }}>
                <FeeRow label="Спред ПриватБанка" value={calc.spreadLoss} />
                <FeeRow label="Комиссия пополнения" value={calc.topUpFee} />
                {calc.weekendFeeAmt > 0 && <FeeRow label="Weekend fee" value={calc.weekendFeeAmt} />}
                {calc.fairUseFeeAmt > 0 && <FeeRow label="Fair use fee" value={calc.fairUseFeeAmt} />}
                <div style={{
                  gridColumn: "1/-1", borderTop: "1px solid rgba(239,68,68,0.2)",
                  marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 600,
                }}>
                  <span>Всего:</span>
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
                  <SectionHeader color="#6366f1">обратный расчёт</SectionHeader>

                  <Step n="1" title="Нужно злотых" desc="Цель минус имеющиеся">
                    {fmtPln(s.targetPln)} − {fmtPln(s.existingPln)} = <Hl>{fmtPln(reverseCalc.plnNeeded)}</Hl>
                  </Step>
                  <Step n="2" title="USD на Revolut" desc="С учётом комиссий Revolut">
                    <Hl>{fmtUsd(reverseCalc.usdOnRevolut)}</Hl>
                  </Step>
                  <Step n="3" title="USD на карте" desc={TOP_UP_FEES[s.topUpMethod].note}>
                    <Hl>{fmtUsd(reverseCalc.usdFromCard)}</Hl>
                  </Step>
                  <Step n="4" title="Купить в ПриватБанке" desc={`+ ${fmtUsd(s.privatFee)} комиссия`}>
                    <Hl>{fmtUsd(reverseCalc.usdToBuy)}</Hl>
                  </Step>
                  <Step n="5" title="Нужно гривен" desc={`× ${s.uahToUsdSell}`}>
                    <Hl>{fmtUah(reverseCalc.uahNeeded)}</Hl>
                  </Step>
                  <Step n="6" title="Нужно USD с ФОП" desc={`÷ ${s.usdToUahBuy}`}>
                    <Hl>{fmtUsd(reverseCalc.fopUsdNeeded)}</Hl>
                  </Step>
                </div>

                <ResultCard label="нужно с фоп" value={fmtUsd(reverseCalc.fopUsdNeeded)}>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    → {fmtUah(reverseCalc.uahNeeded)} → {fmtUsd(reverseCalc.usdToBuy)} → {fmtPln(s.targetPln)}
                  </div>
                </ResultCard>
              </>
            ) : (
              <div style={{
                background: "rgba(15, 23, 42, 0.6)", border: "1px dashed rgba(99, 102, 241, 0.3)",
                borderRadius: 12, padding: 40, textAlign: "center", color: "#64748b",
              }}>
                {s.targetPln <= 0 ? "Введите целевую сумму в злотых" : "Цель уже достигнута ✓"}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          textAlign: "center", marginTop: 24, padding: 16,
          color: "#475569", fontSize: 11, lineHeight: 1.6,
        }}>
          ⚠️ Курсы приблизительные. Проверяйте актуальные значения перед операцией.
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
