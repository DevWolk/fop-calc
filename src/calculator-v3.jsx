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
    "provider.monobank": "Monobank",
    "provider.monobank.desc": "Card rate, CORS OK",
    "provider.monobank.tooltip": "Commercial card rate from Monobank. Updates every 5 minutes. Direct access (no proxy needed). Most reliable option.",
    "provider.privatbank": "PrivatBank",
    "provider.privatbank.desc": "Non-cash rate",
    "provider.privatbank.tooltip": "Non-cash commercial rate (coursid=11). Updates every 5 minutes. Requires CORS proxy for browser access.",
    "provider.minfin": "MinFin",
    "provider.minfin.desc": "Aggregated rate",
    "provider.minfin.tooltip": "Aggregated market rate from minfin.com.ua. Real-time updates. Requires CORS proxy.",
    "provider.nbu": "NBU",
    "provider.nbu.desc": "Official rate",
    "provider.nbu.tooltip": "Official National Bank of Ukraine rate. Reference only, not for commercial exchange. Updates daily at 15:00.",
    "provider.exchangerate": "ExchangeRate-API",
    "provider.exchangerate.desc": "Interbank (free)",
    "provider.exchangerate.tooltip": "Free interbank rate API. Daily updates. Direct access (no proxy needed). Good for general reference.",
    "provider.frankfurter": "Frankfurter",
    "provider.frankfurter.desc": "ECB rate (free)",
    "provider.frankfurter.tooltip": "European Central Bank reference rate. Daily updates at 16:00 CET. Direct access (no proxy needed). Free and reliable.",
    "provider.nbu_pln": "NBU",
    "provider.nbu_pln.desc": "Cross-rate via EUR",
    "provider.nbu_pln.tooltip": "Calculated cross-rate USD/PLN via NBU EUR rates. Official reference rate, updates daily.",

    // Proxies
    "proxy.direct": "Direct (no proxy)",
    "proxy.direct.desc": "Direct connection without proxy",
    "proxy.corsproxy": "corsproxy.io",
    "proxy.corsproxy.desc": "Fast and reliable proxy",
    "proxy.allorigins": "allorigins.win",
    "proxy.allorigins.desc": "Alternative proxy service",
    "proxy.corslol": "cors.lol",
    "proxy.corslol.desc": "Simple CORS proxy",
    "proxy.corssh": "cors.sh",
    "proxy.corssh.desc": "Another proxy option",

    // Advanced section
    "api.advanced.title": "Advanced settings",
    "api.advanced.expand": "Show advanced",
    "api.advanced.collapse": "Hide advanced",
    "api.advanced.required": "Advanced (required for this provider)",

    // CORS explanation
    "api.cors.title": "CORS Proxy",
    "api.cors.explanation": "Some APIs block browser requests. A proxy forwards requests with correct headers.",
    "api.cors.neededFor": "Needed for: {providers}",
    "api.cors.status.working": "Working",
    "api.cors.status.failed": "Failed",
    "api.cors.status.untested": "Untested",
    "api.cors.test": "Test",

    // Fallback reasons
    "api.fallback.title": "Fallback chain:",
    "api.fallback.timeout": "Timeout (8s)",
    "api.fallback.cors": "CORS blocked",
    "api.fallback.http": "HTTP {code}",
    "api.fallback.parse": "Parse error",
    "api.fallback.unknown": "Unknown error",

    // Rate display
    "api.rate.buy": "Buy",
    "api.rate.sell": "Sell",
    "api.rate.rate": "Rate",
    "api.rate.updated": "Updated",

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
    "provider.monobank": "Monobank",
    "provider.monobank.desc": "Картковий курс, CORS OK",
    "provider.monobank.tooltip": "Комерційний картковий курс Monobank. Оновлюється кожні 5 хв. Прямий доступ (проксі не потрібен). Найнадійніший варіант.",
    "provider.privatbank": "ПриватБанк",
    "provider.privatbank.desc": "Безготівковий курс",
    "provider.privatbank.tooltip": "Безготівковий комерційний курс (coursid=11). Оновлюється кожні 5 хв. Потребує CORS проксі для браузера.",
    "provider.minfin": "MinFin",
    "provider.minfin.desc": "Агрегований курс",
    "provider.minfin.tooltip": "Агрегований ринковий курс з minfin.com.ua. Оновлюється в реальному часі. Потребує CORS проксі.",
    "provider.nbu": "НБУ",
    "provider.nbu.desc": "Офіційний курс",
    "provider.nbu.tooltip": "Офіційний курс НБУ. Лише для довідки, не для комерційного обміну. Оновлюється щодня о 15:00.",
    "provider.exchangerate": "ExchangeRate-API",
    "provider.exchangerate.desc": "Міжбанк (безкоштовно)",
    "provider.exchangerate.tooltip": "Безкоштовний міжбанківський курс. Оновлюється щодня. Прямий доступ (проксі не потрібен).",
    "provider.frankfurter": "Frankfurter",
    "provider.frankfurter.desc": "Курс ЄЦБ (безкоштовно)",
    "provider.frankfurter.tooltip": "Довідковий курс Європейського центрального банку. Оновлюється щодня о 16:00 CET. Прямий доступ.",
    "provider.nbu_pln": "НБУ",
    "provider.nbu_pln.desc": "Крос-курс через EUR",
    "provider.nbu_pln.tooltip": "Розрахований крос-курс USD/PLN через курси EUR НБУ. Офіційний довідковий курс, оновлюється щодня.",

    // Proxies
    "proxy.direct": "Напряму (без проксі)",
    "proxy.direct.desc": "Пряме з'єднання без проксі",
    "proxy.corsproxy": "corsproxy.io",
    "proxy.corsproxy.desc": "Швидкий та надійний проксі",
    "proxy.allorigins": "allorigins.win",
    "proxy.allorigins.desc": "Альтернативний проксі",
    "proxy.corslol": "cors.lol",
    "proxy.corslol.desc": "Простий CORS проксі",
    "proxy.corssh": "cors.sh",
    "proxy.corssh.desc": "Ще один варіант проксі",

    // Advanced section
    "api.advanced.title": "Розширені налаштування",
    "api.advanced.expand": "Показати розширені",
    "api.advanced.collapse": "Сховати розширені",
    "api.advanced.required": "Розширені (обов'язково для цього провайдера)",

    // CORS explanation
    "api.cors.title": "CORS Проксі",
    "api.cors.explanation": "Деякі API блокують запити з браузера. Проксі перенаправляє запити з правильними заголовками.",
    "api.cors.neededFor": "Потрібен для: {providers}",
    "api.cors.status.working": "Працює",
    "api.cors.status.failed": "Не працює",
    "api.cors.status.untested": "Не перевірено",
    "api.cors.test": "Тест",

    // Fallback reasons
    "api.fallback.title": "Ланцюг fallback:",
    "api.fallback.timeout": "Таймаут (8с)",
    "api.fallback.cors": "CORS заблоковано",
    "api.fallback.http": "HTTP {code}",
    "api.fallback.parse": "Помилка парсингу",
    "api.fallback.unknown": "Невідома помилка",

    // Rate display
    "api.rate.buy": "Купівля",
    "api.rate.sell": "Продаж",
    "api.rate.rate": "Курс",
    "api.rate.updated": "Оновлено",

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
    "provider.monobank": "Monobank",
    "provider.monobank.desc": "Карточный курс, CORS OK",
    "provider.monobank.tooltip": "Коммерческий карточный курс Monobank. Обновляется каждые 5 мин. Прямой доступ (прокси не нужен). Самый надёжный вариант.",
    "provider.privatbank": "ПриватБанк",
    "provider.privatbank.desc": "Безналичный курс",
    "provider.privatbank.tooltip": "Безналичный коммерческий курс (coursid=11). Обновляется каждые 5 мин. Требует CORS прокси для браузера.",
    "provider.minfin": "MinFin",
    "provider.minfin.desc": "Агрегированный курс",
    "provider.minfin.tooltip": "Агрегированный рыночный курс с minfin.com.ua. Обновляется в реальном времени. Требует CORS прокси.",
    "provider.nbu": "НБУ",
    "provider.nbu.desc": "Официальный курс",
    "provider.nbu.tooltip": "Официальный курс НБУ. Только для справки, не для коммерческого обмена. Обновляется ежедневно в 15:00.",
    "provider.exchangerate": "ExchangeRate-API",
    "provider.exchangerate.desc": "Межбанк (бесплатно)",
    "provider.exchangerate.tooltip": "Бесплатный межбанковский курс. Обновляется ежедневно. Прямой доступ (прокси не нужен).",
    "provider.frankfurter": "Frankfurter",
    "provider.frankfurter.desc": "Курс ЕЦБ (бесплатно)",
    "provider.frankfurter.tooltip": "Справочный курс Европейского центрального банка. Обновляется ежедневно в 16:00 CET. Прямой доступ.",
    "provider.nbu_pln": "НБУ",
    "provider.nbu_pln.desc": "Кросс-курс через EUR",
    "provider.nbu_pln.tooltip": "Рассчитанный кросс-курс USD/PLN через курсы EUR НБУ. Официальный справочный курс, обновляется ежедневно.",

    // Proxies
    "proxy.direct": "Напрямую (без прокси)",
    "proxy.direct.desc": "Прямое соединение без прокси",
    "proxy.corsproxy": "corsproxy.io",
    "proxy.corsproxy.desc": "Быстрый и надёжный прокси",
    "proxy.allorigins": "allorigins.win",
    "proxy.allorigins.desc": "Альтернативный прокси",
    "proxy.corslol": "cors.lol",
    "proxy.corslol.desc": "Простой CORS прокси",
    "proxy.corssh": "cors.sh",
    "proxy.corssh.desc": "Ещё один вариант прокси",

    // Advanced section
    "api.advanced.title": "Расширенные настройки",
    "api.advanced.expand": "Показать расширенные",
    "api.advanced.collapse": "Скрыть расширенные",
    "api.advanced.required": "Расширенные (обязательно для этого провайдера)",

    // CORS explanation
    "api.cors.title": "CORS Прокси",
    "api.cors.explanation": "Некоторые API блокируют запросы из браузера. Прокси перенаправляет запросы с правильными заголовками.",
    "api.cors.neededFor": "Нужен для: {providers}",
    "api.cors.status.working": "Работает",
    "api.cors.status.failed": "Не работает",
    "api.cors.status.untested": "Не проверено",
    "api.cors.test": "Тест",

    // Fallback reasons
    "api.fallback.title": "Цепочка fallback:",
    "api.fallback.timeout": "Таймаут (8с)",
    "api.fallback.cors": "CORS заблокировано",
    "api.fallback.http": "HTTP {code}",
    "api.fallback.parse": "Ошибка парсинга",
    "api.fallback.unknown": "Неизвестная ошибка",

    // Rate display
    "api.rate.buy": "Покупка",
    "api.rate.sell": "Продажа",
    "api.rate.rate": "Курс",
    "api.rate.updated": "Обновлено",

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

// ─── Responsive Breakpoint Hook ───
function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 600
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
}

// ─── Language Selector Component ───
function LanguageSelector({ lang, setLang, isMobile }) {
  const languages = [
    { code: "en", flag: "🇬🇧", label: "EN" },
    { code: "uk", flag: "🇺🇦", label: "UA" },
    { code: "ru", flag: "🇷🇺", label: "RU" },
  ];

  return (
    <div style={{ display: "flex", gap: isMobile ? 6 : 4 }}>
      {languages.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            background: lang === code ? "rgba(99, 102, 241, 0.3)" : "transparent",
            border: lang === code ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid transparent",
            color: lang === code ? "#e2e8f0" : "#64748b",
            padding: isMobile ? "10px 14px" : "4px 8px",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isMobile ? 12 : 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s",
            minHeight: isMobile ? 44 : "auto",
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
  monobank: {
    labelKey: "provider.monobank",
    descKey: "provider.monobank.desc",
    tooltipKey: "provider.monobank.tooltip",
    hasCors: true,
    rateType: "commercial",
    updateFrequency: "5min",
  },
  privatbank: {
    labelKey: "provider.privatbank",
    descKey: "provider.privatbank.desc",
    tooltipKey: "provider.privatbank.tooltip",
    hasCors: false,
    rateType: "commercial",
    updateFrequency: "5min",
  },
  minfin: {
    labelKey: "provider.minfin",
    descKey: "provider.minfin.desc",
    tooltipKey: "provider.minfin.tooltip",
    hasCors: false,
    rateType: "commercial",
    updateFrequency: "realtime",
  },
  nbu: {
    labelKey: "provider.nbu",
    descKey: "provider.nbu.desc",
    tooltipKey: "provider.nbu.tooltip",
    hasCors: true,
    rateType: "official",
    updateFrequency: "daily",
  },
};

const PLN_PROVIDERS = {
  exchangerate: {
    labelKey: "provider.exchangerate",
    descKey: "provider.exchangerate.desc",
    tooltipKey: "provider.exchangerate.tooltip",
    hasCors: true,
    rateType: "interbank",
    updateFrequency: "daily",
  },
  frankfurter: {
    labelKey: "provider.frankfurter",
    descKey: "provider.frankfurter.desc",
    tooltipKey: "provider.frankfurter.tooltip",
    hasCors: true,
    rateType: "ecb",
    updateFrequency: "daily",
  },
  nbu_pln: {
    labelKey: "provider.nbu_pln",
    descKey: "provider.nbu_pln.desc",
    tooltipKey: "provider.nbu_pln.tooltip",
    hasCors: true,
    rateType: "official",
    updateFrequency: "daily",
  },
};

const CORS_PROXIES = [
  { url: "", labelKey: "proxy.direct", descKey: "proxy.direct.desc" },
  { url: "https://corsproxy.io/?", labelKey: "proxy.corsproxy", descKey: "proxy.corsproxy.desc" },
  { url: "https://api.allorigins.win/raw?url=", labelKey: "proxy.allorigins", descKey: "proxy.allorigins.desc" },
  { url: "https://api.cors.lol/?url=", labelKey: "proxy.corslol", descKey: "proxy.corslol.desc" },
  { url: "https://proxy.cors.sh/", labelKey: "proxy.corssh", descKey: "proxy.corssh.desc" },
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

// Error classification for fallback display
function classifyError(error) {
  const msg = error?.message || String(error);
  if (msg.includes("aborted") || msg.includes("timeout") || msg.toLowerCase().includes("timeout")) {
    return { type: "timeout", key: "api.fallback.timeout" };
  }
  if (msg.includes("CORS") || msg.includes("cors") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
    return { type: "cors", key: "api.fallback.cors" };
  }
  const httpMatch = msg.match(/HTTP (\d+)/);
  if (httpMatch) {
    return { type: "http", key: "api.fallback.http", code: httpMatch[1] };
  }
  if (msg.includes("parse") || msg.includes("Parse") || msg.includes("JSON") || msg.includes("not found")) {
    return { type: "parse", key: "api.fallback.parse" };
  }
  return { type: "unknown", key: "api.fallback.unknown", message: msg };
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Timeout (8s)");
    }
    throw error;
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

async function fetchMinFin(corsProxy = "") {
  // MinFin API - aggregated market rate
  const baseUrl = "https://api.minfin.com.ua/mb/";
  const url = corsProxy ? corsProxy + encodeURIComponent(baseUrl) : baseUrl;

  const data = await fetchWithTimeout(url);
  const usd = data.find(r => r.currency === "usd");
  if (!usd) throw new Error("USD not found");

  return {
    buy: parseFloat(usd.bid),
    sell: parseFloat(usd.ask),
  };
}

async function fetchFrankfurter() {
  // Frankfurter API - ECB reference rate
  const data = await fetchWithTimeout("https://api.frankfurter.app/latest?from=USD&to=PLN");
  if (!data?.rates?.PLN) {
    throw new Error("PLN rate not found");
  }
  return { rate: data.rates.PLN };
}

// ─── Main Component ───
export default function CurrencyCalculator() {
  const { t, lang, setLang } = useTranslation();
  const { isMobile } = useBreakpoint();
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
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Auto-expand advanced section when provider needs proxy
  const needsProxy = !UAH_PROVIDERS[uahProvider]?.hasCors;
  
  const set = (field, value) => dispatch({ type: "set", field, value });

  // ─── Fetch UAH rates ───
  const fetchUahRates = useCallback(async (provider, proxy) => {
    const fallbackChain = [];

    const tryProvider = async (p) => {
      switch (p) {
        case "monobank":
          return { ...(await fetchMonobank()), sourceKey: "provider.monobank", provider: p };
        case "privatbank":
          return { ...(await fetchPrivatBank(proxy)), sourceKey: "provider.privatbank", provider: p };
        case "minfin":
          return { ...(await fetchMinFin(proxy)), sourceKey: "provider.minfin", provider: p };
        case "nbu":
          return { ...(await fetchNBU()), sourceKey: "provider.nbu", provider: p };
        default:
          throw new Error("Unknown provider");
      }
    };

    // Try selected provider first
    try {
      const result = await tryProvider(provider);
      fallbackChain.push({ provider, success: true });
      result.fallbackChain = fallbackChain;
      return result;
    } catch (e) {
      const errorInfo = classifyError(e);
      fallbackChain.push({ provider, success: false, error: errorInfo });
    }

    // Fallback if enabled
    if (autoFallback) {
      const fallbackOrder = ["monobank", "privatbank", "minfin", "nbu"].filter(p => p !== provider);
      for (const fb of fallbackOrder) {
        try {
          const result = await tryProvider(fb);
          fallbackChain.push({ provider: fb, success: true });
          result.fallback = true;
          result.originalProvider = provider;
          result.fallbackChain = fallbackChain;
          return result;
        } catch (e) {
          const errorInfo = classifyError(e);
          fallbackChain.push({ provider: fb, success: false, error: errorInfo });
        }
      }
    }

    // Return error with details
    const details = fallbackChain.map(a => `${a.provider}: ${a.error?.type || "error"}`).join("; ");
    const error = new Error(details);
    error.fallbackChain = fallbackChain;
    throw error;
  }, [autoFallback]);

  // ─── Fetch PLN rate ───
  const fetchPlnRate = useCallback(async (provider, proxy) => {
    const fallbackChain = [];

    const tryProvider = async (p) => {
      switch (p) {
        case "exchangerate":
          return { ...(await fetchExchangeRateAPI()), sourceKey: "provider.exchangerate", provider: p };
        case "frankfurter":
          return { ...(await fetchFrankfurter()), sourceKey: "provider.frankfurter", provider: p };
        case "nbu_pln":
          return { ...(await fetchNBU_PLN()), sourceKey: "provider.nbu_pln", provider: p };
        default:
          throw new Error("Unknown provider");
      }
    };

    try {
      const result = await tryProvider(provider);
      fallbackChain.push({ provider, success: true });
      result.fallbackChain = fallbackChain;
      return result;
    } catch (e) {
      const errorInfo = classifyError(e);
      fallbackChain.push({ provider, success: false, error: errorInfo });
    }

    if (autoFallback) {
      const fallbackOrder = ["exchangerate", "frankfurter", "nbu_pln"].filter(p => p !== provider);
      for (const fb of fallbackOrder) {
        try {
          const result = await tryProvider(fb);
          fallbackChain.push({ provider: fb, success: true });
          result.fallback = true;
          result.originalProvider = provider;
          result.fallbackChain = fallbackChain;
          return result;
        } catch (e) {
          const errorInfo = classifyError(e);
          fallbackChain.push({ provider: fb, success: false, error: errorInfo });
        }
      }
    }

    // Return error with details
    const details = fallbackChain.map(a => `${a.provider}: ${a.error?.type || "error"}`).join("; ");
    const error = new Error(details);
    error.fallbackChain = fallbackChain;
    throw error;
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
        selected: uahProvider,
        active: uah.provider,
        sourceKey: uah.sourceKey,
        fallback: uah.fallback,
        originalProvider: uah.originalProvider,
        fallbackChain: uah.fallbackChain,
        isOfficial: uah.isOfficial,
        buy: uah.buy,
        sell: uah.sell,
      };
    } catch (e) {
      newErrors.push({ type: "uah", details: e.message, fallbackChain: e.fallbackChain });
    }

    // Fetch PLN
    try {
      const pln = await fetchPlnRate(plnProvider, corsProxy);
      dispatch({ type: "set", field: "usdToPlnRate", value: pln.rate });
      info.pln = {
        selected: plnProvider,
        active: pln.provider,
        sourceKey: pln.sourceKey,
        fallback: pln.fallback,
        originalProvider: pln.originalProvider,
        fallbackChain: pln.fallbackChain,
        isOfficial: pln.isOfficial,
        rate: pln.rate,
      };
    } catch (e) {
      newErrors.push({ type: "pln", details: e.message, fallbackChain: e.fallbackChain });
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
      padding: isMobile ? "12px" : "20px",
      paddingBottom: isMobile ? "max(12px, env(safe-area-inset-bottom))" : "20px",
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
          min-height: 44px;
        }
        input[type=number]:focus, select:focus {
          border-color: rgba(99, 102, 241, 0.8);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        select { cursor: pointer; font-size: 13px; }
        input[type=checkbox] {
          width: 20px;
          height: 20px;
          min-width: 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        .checkbox-wrapper {
          display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;
          min-height: 44px;
        }
        .checkbox-wrapper input { width: auto; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: isMobile ? "100%" : 760, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{
          textAlign: "center",
          marginBottom: isMobile ? 16 : 24,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? 12 : 0,
        }}>
          {isMobile ? (
            <LanguageSelector lang={lang} setLang={setLang} isMobile={isMobile} />
          ) : (
            <div style={{ position: "absolute", top: 0, right: 0 }}>
              <LanguageSelector lang={lang} setLang={setLang} isMobile={isMobile} />
            </div>
          )}
          <div>
            <div style={{
              fontSize: isMobile ? 10 : 11, letterSpacing: isMobile ? 2 : 4, textTransform: "uppercase", color: "#6366f1", marginBottom: 8,
            }}>currency pipeline calculator v3</div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: isMobile ? 20 : 28, fontWeight: 700, margin: 0,
              background: "linear-gradient(90deg, #818cf8, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent", color: "transparent",
            }}>FOP $ → ₴ → $ → Revolut → zł</h1>
          </div>
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
                padding: isMobile ? "12px 20px" : "8px 16px",
                borderRadius: 8,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
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

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{t("api.uahProvider")}</span>
                <HelpIcon tooltip={t(UAH_PROVIDERS[uahProvider].tooltipKey)} isMobile={isMobile} />
              </div>
              <select value={uahProvider} onChange={e => setUahProvider(e.target.value)}>
                {Object.entries(UAH_PROVIDERS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v.labelKey)}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                {UAH_PROVIDERS[uahProvider].hasCors ? (
                  <span style={{ color: "#22c55e" }}>✓</span>
                ) : (
                  <span style={{ color: "#f59e0b" }}>⚠</span>
                )}
                {t(UAH_PROVIDERS[uahProvider].descKey)}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{t("api.plnProvider")}</span>
                <HelpIcon tooltip={t(PLN_PROVIDERS[plnProvider].tooltipKey)} isMobile={isMobile} />
              </div>
              <select value={plnProvider} onChange={e => setPlnProvider(e.target.value)}>
                {Object.entries(PLN_PROVIDERS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v.labelKey)}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#22c55e" }}>✓</span>
                {t(PLN_PROVIDERS[plnProvider].descKey)}
              </div>
            </div>
          </div>

          {/* Advanced Section */}
          <AdvancedSection
            title={needsProxy
              ? t("api.advanced.required")
              : (advancedExpanded ? t("api.advanced.collapse") : t("api.advanced.expand"))
            }
            expanded={advancedExpanded || needsProxy}
            onToggle={() => setAdvancedExpanded(!advancedExpanded)}
            disabled={needsProxy}
          >
            <CorsProxyInfo t={t} corsProxy={corsProxy} needsProxy={needsProxy} />

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{t("api.cors.title")}</span>
              </div>
              <select value={corsProxy} onChange={e => setCorsProxy(e.target.value)}>
                {CORS_PROXIES.map((p, i) => (
                  <option key={i} value={p.url}>{t(p.labelKey)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 20 }}>
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
          </AdvancedSection>

          {/* Status */}
          {ratesInfo && (
            <div style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 8, padding: 12, fontSize: 11, marginTop: 12,
            }}>
              {/* UAH Rate Info */}
              {ratesInfo.uah && (
                <div style={{ marginBottom: ratesInfo.pln ? 10 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#64748b" }}>{t("api.status.uah")}</span>
                      <StatusIndicator status="working" />
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>{t(ratesInfo.uah.sourceKey)}</span>
                      {ratesInfo.uah.isOfficial && (
                        <span style={{ color: "#64748b", fontSize: 10 }}>{t("api.status.official")}</span>
                      )}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 10 }}>
                      {t("api.rate.buy")}: {ratesInfo.uah.buy?.toFixed(2)} / {t("api.rate.sell")}: {ratesInfo.uah.sell?.toFixed(2)}
                    </div>
                  </div>
                  {ratesInfo.uah.fallback && ratesInfo.uah.fallbackChain && (
                    <FallbackChainDisplay chain={ratesInfo.uah.fallbackChain} t={t} providers={UAH_PROVIDERS} />
                  )}
                </div>
              )}

              {/* PLN Rate Info */}
              {ratesInfo.pln && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#64748b" }}>{t("api.status.pln")}</span>
                      <StatusIndicator status="working" />
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>{t(ratesInfo.pln.sourceKey)}</span>
                      {ratesInfo.pln.isOfficial && (
                        <span style={{ color: "#64748b", fontSize: 10 }}>{t("api.status.official")}</span>
                      )}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 10 }}>
                      {t("api.rate.rate")}: {ratesInfo.pln.rate?.toFixed(4)}
                    </div>
                  </div>
                  {ratesInfo.pln.fallback && ratesInfo.pln.fallbackChain && (
                    <FallbackChainDisplay chain={ratesInfo.pln.fallbackChain} t={t} providers={PLN_PROVIDERS} />
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div style={{ color: "#64748b", fontSize: 10, marginTop: 8, textAlign: "right" }}>
                {t("api.rate.updated")}: {ratesInfo.timestamp?.toLocaleTimeString()}
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
                  <div>
                    ⚠️ {e.type === "uah"
                      ? t("api.error.allUnavailable", { details: e.details })
                      : t("api.error.plnUnavailable", { details: e.details })}
                  </div>
                  {e.fallbackChain && (
                    <FallbackChainDisplay
                      chain={e.fallbackChain}
                      t={t}
                      providers={e.type === "uah" ? UAH_PROVIDERS : PLN_PROVIDERS}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mode Toggle ── */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
          marginBottom: 20,
          background: "rgba(15, 23, 42, 0.6)",
          padding: isMobile ? 6 : 4,
          borderRadius: 10,
          border: "1px solid rgba(99, 102, 241, 0.15)",
        }}>
          {[
            { key: "forward", labelKey: "mode.forward" },
            { key: "reverse", labelKey: "mode.reverse" },
          ].map((m) => (
            <button key={m.key} onClick={() => set("mode", m.key)} style={{
              flex: 1,
              padding: isMobile ? "14px 16px" : "10px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: isMobile ? 13 : 12,
              fontWeight: s.mode === m.key ? 600 : 400,
              background: s.mode === m.key ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
              color: s.mode === m.key ? "#fff" : "#64748b",
              transition: "all 0.2s",
              minHeight: 44,
            }}>{t(m.labelKey)}</button>
          ))}
        </div>

        {/* ── Input Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
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
                  flex: 1,
                  padding: isMobile ? "12px" : "10px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: s.isWeekend === v ? 600 : 400,
                  background: s.isWeekend === v ? (v ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)") : "rgba(15,23,42,0.8)",
                  color: s.isWeekend === v ? "#fff" : "#64748b",
                  transition: "all 0.2s",
                  minHeight: 44,
                }}>{v ? t("input.weekend") : t("input.weekday")}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>{t("input.existingPln")}</Label>
            <NumInput value={s.existingPln} onChange={v => set("existingPln", v)} step="0.01" min={0} />
          </div>

          <div style={{ gridColumn: "1 / -1", textAlign: isMobile ? "center" : "right" }}>
            <button onClick={() => dispatch({ type: "reset" })} style={{
              background: "transparent",
              border: "1px solid rgba(100,116,139,0.3)",
              color: "#64748b",
              padding: isMobile ? "12px 24px" : "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: isMobile ? 12 : 11,
              fontFamily: "'JetBrains Mono', monospace",
              width: isMobile ? "100%" : "auto",
              minHeight: isMobile ? 44 : "auto",
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

            <ResultCard label={t("result.total")} value={fmtPln(calc.totalPln)} isMobile={isMobile}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: isMobile ? "8px 12px" : "6px 16px", fontSize: 13 }}>
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

                <ResultCard label={t("result.needed")} value={fmtUsd(reverseCalc.fopUsdNeeded)} isMobile={isMobile}>
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

function ResultCard({ label, value, children, isMobile }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
      border: "1px solid rgba(99,102,241,0.4)",
      borderRadius: 12,
      padding: isMobile ? 20 : 24,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#a78bfa", marginBottom: 8 }}>{label}</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: isMobile ? 32 : 40,
        fontWeight: 700,
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

// ─── New UI Components for Enhanced Provider Section ───

function Tooltip({ text, children, isMobile }) {
  const [show, setShow] = useState(false);

  // Close on outside click for mobile
  useEffect(() => {
    if (!isMobile || !show) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-tooltip]')) {
        setShow(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isMobile, show]);

  const handleInteraction = (e) => {
    if (isMobile) {
      e.stopPropagation();
      setShow(!show);
    }
  };

  return (
    <span
      data-tooltip
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => !isMobile && setShow(true)}
      onMouseLeave={() => !isMobile && setShow(false)}
      onClick={handleInteraction}
    >
      {children}
      {show && text && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(99, 102, 241, 0.4)",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 11,
          color: "#e2e8f0",
          whiteSpace: "normal",
          width: isMobile ? "min(240px, calc(100vw - 48px))" : 240,
          zIndex: 100,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          lineHeight: 1.5,
        }}>
          {text}
          <div style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid rgba(99, 102, 241, 0.4)",
          }} />
        </div>
      )}
    </span>
  );
}

function HelpIcon({ tooltip, isMobile }) {
  return (
    <Tooltip text={tooltip} isMobile={isMobile}>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: isMobile ? 24 : 16,
        height: isMobile ? 24 : 16,
        borderRadius: "50%",
        background: "rgba(99, 102, 241, 0.2)",
        border: "1px solid rgba(99, 102, 241, 0.4)",
        color: "#818cf8",
        fontSize: isMobile ? 12 : 10,
        fontWeight: 700,
        cursor: "help",
        marginLeft: 6,
      }}>?</span>
    </Tooltip>
  );
}

function StatusIndicator({ status }) {
  const colors = {
    working: "#22c55e",
    failed: "#ef4444",
    untested: "#64748b",
  };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10,
      color: colors[status] || colors.untested,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: colors[status] || colors.untested,
      }} />
    </span>
  );
}

function FallbackChainDisplay({ chain, t, providers }) {
  if (!chain || chain.length <= 1) return null;

  return (
    <div style={{
      marginTop: 8,
      padding: "8px 10px",
      background: "rgba(245, 158, 11, 0.1)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      borderRadius: 6,
      fontSize: 10,
    }}>
      <div style={{ color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>
        ⚡ {t("api.fallback.title")}
      </div>
      {chain.map((attempt, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: attempt.success ? "#22c55e" : "#94a3b8",
          marginTop: 2,
        }}>
          <span>{attempt.success ? "✓" : "✗"}</span>
          <span>{t(providers[attempt.provider]?.labelKey || attempt.provider)}</span>
          {!attempt.success && attempt.error && (
            <span style={{ color: "#64748b" }}>
              — {attempt.error.code
                ? t(attempt.error.key, { code: attempt.error.code })
                : t(attempt.error.key)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function AdvancedSection({ title, expanded, onToggle, disabled, children }) {
  return (
    <div style={{
      marginTop: 12,
      borderTop: "1px dashed rgba(99, 102, 241, 0.2)",
      paddingTop: 12,
    }}>
      <button
        onClick={disabled ? undefined : onToggle}
        style={{
          background: "transparent",
          border: "none",
          color: "#64748b",
          fontSize: 11,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span style={{
          display: "inline-block",
          transition: "transform 0.2s",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        }}>▸</span>
        {title}
      </button>
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function CorsProxyInfo({ t, corsProxy, needsProxy }) {
  const providersNeedingProxy = Object.entries(UAH_PROVIDERS)
    .filter(([, v]) => !v.hasCors)
    .map(([k]) => t(UAH_PROVIDERS[k].labelKey))
    .join(", ");

  return (
    <div style={{
      background: "rgba(99, 102, 241, 0.05)",
      border: "1px solid rgba(99, 102, 241, 0.2)",
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      fontSize: 11,
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 6 }}>
        {t("api.cors.explanation")}
      </div>
      {providersNeedingProxy && (
        <div style={{ color: "#f59e0b" }}>
          ⚠ {t("api.cors.neededFor", { providers: providersNeedingProxy })}
        </div>
      )}
    </div>
  );
}
