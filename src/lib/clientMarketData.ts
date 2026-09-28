import { FinancialRates, UserProfile, ChatMessage } from "../types";

export const BASE_FINANCIAL_RATES: FinancialRates = {
  currencies: [
    { name: "Dólar Oficial", buy: 1480, sell: 1530, change: 0.1, icon: "Building" },
    { name: "Dólar Blue", buy: 1520, sell: 1540, change: 0.4, icon: "Wallet" },
    { name: "Dólar MEP (Bolsa)", buy: 1517, sell: 1525, change: 0.2, icon: "TrendingUp" },
    { name: "Dólar CCL", buy: 1582, sell: 1583, change: 0.3, icon: "Globe" },
    { name: "Dólar Cripto (USDT)", buy: 1570, sell: 1574, change: 0.2, icon: "Coins" },
    { name: "Dólar Tarjeta", buy: 1924, sell: 1989, change: 0.1, icon: "CreditCard" }
  ],
  fixedIncome: [
    { name: "Plazo Fijo Tradicional", rate: "20.0% TNA", yield: "21.9% TEA", delay: "30-365 días", risk: "Bajo", desc: "Tasa fija bancaria en pesos del sistema financiero / Banco Nación (~20% TNA)." },
    { name: "Plazo Fijo UVA", rate: "Inflación + 1%", yield: "Variable", delay: "Mínimo 180 días", risk: "Bajo", desc: "Protege el capital contra la inflación indexando el depósito a la unidad UVA oficial." },
    { name: "FCI Money Market (Mercado Pago / Ualá)", rate: "19.1% TNA", yield: "20.9% TEA", delay: "Inmediato (T+0)", risk: "Bajo", desc: "Cuentas remuneradas de billeteras digitales con rendimientos diarios y disponibilidad 24/7." },
    { name: "Obligaciones Negociables (ONs)", rate: "7.0% - 9.0% anual en USD", yield: "En dólares (Hard Dollar)", delay: "Mediano plazo", risk: "Moderado", desc: "Deuda corporativa de empresas argentinas líderes que paga cupones y amortizaciones en dólares." }
  ],
  cedears: [
    { symbol: "SPY", name: "S&P 500 Index ETF", priceARS: 46100, change: 0.8, ratio: "20:1", assetClass: "Acciones Globales" },
    { symbol: "AAPL", name: "Apple Inc.", priceARS: 35600, change: -0.3, ratio: "10:1", assetClass: "Tecnología" },
    { symbol: "TSLA", name: "Tesla, Inc.", priceARS: 23200, change: 2.1, ratio: "15:1", assetClass: "Automotriz / Energía" },
    { symbol: "MELI", name: "MercadoLibre Inc.", priceARS: 52800, change: 1.4, ratio: "60:1", assetClass: "E-commerce LatAm" },
    { symbol: "MSFT", name: "Microsoft Corp.", priceARS: 22150, change: 0.5, ratio: "30:1", assetClass: "Software / Cloud" },
    { symbol: "NVDA", name: "Nvidia Corp.", priceARS: 15850, change: 3.2, ratio: "12:1", assetClass: "Inteligencia Artificial" }
  ],
  localStocks: [
    { symbol: "GGAL", name: "Grupo Financiero Galicia", priceARS: 6250, change: 1.4 },
    { symbol: "YPFD", name: "YPF S.A.", priceARS: 38900, change: 2.1 },
    { symbol: "PAMP", name: "Pampa Energía", priceARS: 4150, change: -0.5 },
    { symbol: "ALUA", name: "Aluar Aluminio Argentino", priceARS: 1280, change: 0.3 }
  ],
  crypto: [
    { symbol: "BTC", name: "Bitcoin", priceUSD: 79800, priceARS: 125605200, change: 1.2 },
    { symbol: "ETH", name: "Ethereum", priceUSD: 2450, priceARS: 3856300, change: -0.5 },
    { symbol: "USDT", name: "Tether (Dólar Cripto)", priceUSD: 1.0, priceARS: 1574, change: 0.1 }
  ],
  macroeconomics: {
    monthlyInflation: 2.2,
    projectedAnnualInflation: 29.8,
    riskCountry: 495
  },
  lastUpdated: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  source: "Mercado Local Argentina & DolarApi"
};

export const FALLBACK_NEWS = [
  {
    title: "Mercado atento a la evolución de las tasas y el dólar MEP",
    summary: "Los inversores locales analizan las señales del Banco Central respecto a la política cambiaria y la tasa de interés de referencia para los plazos fijos en pesos.",
    url: "https://www.cronista.com/finanzas-mercados/",
    source: "El Cronista",
    date: "Hoy"
  },
  {
    title: "CEDEARs mantienen volumen ante la volatilidad global",
    summary: "Los certificados de depósito de acciones extranjeras siguen siendo el instrumento de cobertura preferido por ahorristas argentinos para dolarizar carteras de manera fácil.",
    url: "https://www.ambito.com/finanzas",
    source: "Ámbito Financiero",
    date: "Ayer"
  },
  {
    title: "Señales de desaceleración en la inflación de alimentos",
    summary: "Consultoras privadas reportan una moderación en el ritmo de aumento de precios en la primera semana del mes, alineándose con las proyecciones del Ministerio de Economía.",
    url: "https://www.infobae.com/economia/",
    source: "Infobae",
    date: "Hace 2 días"
  }
];

let cachedDirectRates: FinancialRates | null = null;
let lastDirectFetchTime = 0;
const DIRECT_CACHE_TTL = 45 * 1000; // 45 seconds

/**
 * Direct client-side fetcher that connects to public CORS-enabled APIs.
 * This runs flawlessly on static hosts like Netlify, Vercel, or GitHub Pages
 * where no backend Node.js server is present.
 */
export async function fetchDirectMarketRates(force = false): Promise<FinancialRates> {
  const now = Date.now();
  if (!force && cachedDirectRates && (now - lastDirectFetchTime < DIRECT_CACHE_TTL)) {
    return cachedDirectRates;
  }

  let liveCurrencies = [...BASE_FINANCIAL_RATES.currencies];
  let cclSell = 1583;
  let criptoSell = 1574;
  let sourceTag = "DolarApi (En vivo)";

  try {
    const dolarRes = await fetch("https://dolarapi.com/v1/dolares", {
      headers: { "Accept": "application/json" }
    });

    if (dolarRes.ok) {
      const dolaresData = await dolarRes.json();
      if (Array.isArray(dolaresData) && dolaresData.length > 0) {
        const mapped: any[] = [];
        const findCasa = (c: string) => dolaresData.find((d: any) => d.casa?.toLowerCase() === c.toLowerCase());

        const oficial = findCasa("oficial");
        if (oficial) mapped.push({ name: "Dólar Oficial", buy: Math.round(oficial.compra), sell: Math.round(oficial.venta), change: 0.1, icon: "Building" });

        const blue = findCasa("blue");
        if (blue) mapped.push({ name: "Dólar Blue", buy: Math.round(blue.compra), sell: Math.round(blue.venta), change: 0.3, icon: "Wallet" });

        const bolsa = findCasa("bolsa");
        if (bolsa) mapped.push({ name: "Dólar MEP (Bolsa)", buy: Math.round(bolsa.compra), sell: Math.round(bolsa.venta), change: 0.2, icon: "TrendingUp" });

        const ccl = findCasa("contadoconliqui");
        if (ccl) {
          cclSell = Math.round(ccl.venta);
          mapped.push({ name: "Dólar CCL", buy: Math.round(ccl.compra), sell: cclSell, change: 0.3, icon: "Globe" });
        }

        const cripto = findCasa("cripto");
        if (cripto) {
          criptoSell = Math.round(cripto.venta);
          mapped.push({ name: "Dólar Cripto (USDT)", buy: Math.round(cripto.compra), sell: criptoSell, change: 0.2, icon: "Coins" });
        }

        const tarjeta = findCasa("tarjeta");
        if (tarjeta) mapped.push({ name: "Dólar Tarjeta", buy: Math.round(tarjeta.compra), sell: Math.round(tarjeta.venta), change: 0.1, icon: "CreditCard" });

        if (mapped.length >= 3) {
          liveCurrencies = mapped;
        }
      }
    }
  } catch (err) {
    console.warn("[ClientMarketData] Error conectando a DolarApi desde el navegador:", err);
    sourceTag = "Mercado Local (Base Estimada)";
  }

  // Live Crypto
  let btcPriceUsd = 79800;
  let ethPriceUsd = 2450;
  try {
    const [btcRes, ethRes] = await Promise.all([
      fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot"),
      fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot")
    ]);
    if (btcRes.ok) {
      const btcJson = await btcRes.json();
      const btcVal = parseFloat(btcJson?.data?.amount);
      if (!isNaN(btcVal) && btcVal > 10000) btcPriceUsd = Math.round(btcVal);
    }
    if (ethRes.ok) {
      const ethJson = await ethRes.json();
      const ethVal = parseFloat(ethJson?.data?.amount);
      if (!isNaN(ethVal) && ethVal > 500) ethPriceUsd = Math.round(ethVal);
    }
  } catch {
    // Keep baseline crypto
  }

  const liveCrypto = [
    { symbol: "BTC", name: "Bitcoin", priceUSD: btcPriceUsd, priceARS: Math.round(btcPriceUsd * criptoSell), change: 1.2 },
    { symbol: "ETH", name: "Ethereum", priceUSD: ethPriceUsd, priceARS: Math.round(ethPriceUsd * criptoSell), change: -0.5 },
    { symbol: "USDT", name: "Tether (Dólar Cripto)", priceUSD: 1.0, priceARS: criptoSell, change: 0.1 }
  ];

  // Adjust CEDEARs in ARS based on live CCL
  const liveCedears = [
    { symbol: "SPY", name: "S&P 500 Index ETF", priceARS: Math.round((585 * cclSell) / 20), change: 0.8, ratio: "20:1", assetClass: "Acciones Globales" },
    { symbol: "AAPL", name: "Apple Inc.", priceARS: Math.round((225 * cclSell) / 10), change: -0.3, ratio: "10:1", assetClass: "Tecnología" },
    { symbol: "TSLA", name: "Tesla, Inc.", priceARS: Math.round((220 * cclSell) / 15), change: 2.1, ratio: "15:1", assetClass: "Automotriz / Energía" },
    { symbol: "MELI", name: "MercadoLibre Inc.", priceARS: Math.round((2000 * cclSell) / 60), change: 1.4, ratio: "60:1", assetClass: "E-commerce LatAm" },
    { symbol: "MSFT", name: "Microsoft Corp.", priceARS: Math.round((420 * cclSell) / 30), change: 0.5, ratio: "30:1", assetClass: "Software / Cloud" },
    { symbol: "NVDA", name: "Nvidia Corp.", priceARS: Math.round((120 * cclSell) / 12), change: 3.2, ratio: "12:1", assetClass: "Inteligencia Artificial" }
  ];

  const result: FinancialRates = {
    currencies: liveCurrencies,
    fixedIncome: BASE_FINANCIAL_RATES.fixedIncome,
    cedears: liveCedears,
    localStocks: BASE_FINANCIAL_RATES.localStocks,
    crypto: liveCrypto,
    macroeconomics: BASE_FINANCIAL_RATES.macroeconomics,
    lastUpdated: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    source: sourceTag
  };

  cachedDirectRates = result;
  lastDirectFetchTime = now;
  return result;
}

/**
 * Generates structured, high-quality Argentine financial advice directly in the browser
 * when backend AI calls are unavailable (e.g. running on Netlify without Node.js backend).
 */
export function generateClientFallbackAdvice(messages: ChatMessage[], userProfile: UserProfile): string {
  const latestMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
  const risk = (userProfile?.riskProfile || "moderado").toLowerCase();
  const capital = userProfile?.capital || 0;
  const currency = userProfile?.currency || "ARS";

  let text = `✨ **[Asesor Invert-Play - Modo Autónomo]**\n\n*He analizado tu consulta y tu perfil de inversión actual para darte una recomendación financiera personalizada para el mercado argentino:*\n\n`;

  if (latestMessage.includes("jubila") || latestMessage.includes("pension") || latestMessage.includes("mínimo") || latestMessage.includes("minimo") || latestMessage.includes("sueldo") || latestMessage.includes("ingreso bajo") || latestMessage.includes("retirado")) {
    text += `### 👵🏽 Guía de Optimización para Jubilados e Ingresos Mínimos: Rendimiento Diario y Rescate Inmediato\n\n`;
    text += `Para un jubilado o alguien con un sueldo mínimo en Argentina, **la liquidez es vital**: no se puede inmovilizar el dinero por 30 días (como en un Plazo Fijo tradicional) ante imprevistos médicos o compras de alimentos diarios. Sin embargo, dejar los pesos quietos en la caja de ahorro bancaria tradicional es una pérdida constante por la inflación.\n\n`;
    text += `Estrategia financiera defensiva recomendada:\n\n`;
    text += `#### 1. 📱 Billeteras Virtuales con Cuentas Remuneradas (Rescate Inmediato 24/7)\n`;
    text += `En lugar de dejar la jubilación o el sueldo en el banco tradicional sin rendir nada, transfiérelo a billeteras que paguen rendimientos diarios:\n\n`;
    text += `- **Naranja X**: Paga una de las tasas remuneradas más altas sobre saldos diarios (con tope de saldo).\n`;
    text += `- **Personal Pay / Ualá / Mercado Pago**: Sus fondos comunes de Money Market rinden ~19% - 22% TNA con disponibilidad 24/7 para compras o transferencias.\n\n`;
    text += `#### 2. 📅 El Truco del "Diferimiento de Pagos"\n`;
    text += `- No pagues facturas o servicios antes de su fecha límite de vencimiento. Deja ese dinero generando intereses diarios en tu cuenta remunerada y abónalo el mismo día del vencimiento.\n\n`;
    text += `#### 3. 🛍️ Programas de Reintegro y Beneficios\n`;
    text += `- Aprovecha beneficios como **Cuenta DNI**, reintegros de **BNA+** o descuentos en farmacias y supermercados que reintegran porcentajes directos en tu cuenta.\n\n`;
    text += `#### 4. ❌ ¿Conviene el Plazo Fijo Tradicional?\n`;
    text += `- **No se recomienda** para el dinero del mes. El bloqueo de 30 días es un riesgo excesivo ante cualquier urgencia imprevista.`;
  } else if (latestMessage.includes("uva") || latestMessage.includes("plazo") || latestMessage.includes("fijo") || latestMessage.includes("tna")) {
    text += `### 🏦 Comparativa de Tasas en Pesos (Plazo Fijo vs UVA vs FCI)\n\n`;
    text += `- **Plazo Fijo Tradicional (~20% TNA)**: Ofrece certeza nominal absoluta en 30 días, pero con una inflación proyectada similar o superior, la tasa real puede resultar ajustada.\n`;
    text += `- **Plazo Fijo UVA (Inflación + 1%)**: Excelente cobertura ante subas de precios, pero exige una inmovilización mínima de **180 días**.\n`;
    text += `- **FCI Money Market (~19.1% TNA)**: Disponible en billeteras como Mercado Pago o Ualá. Rinde intereses diarios y el dinero está disponible las 24 horas todos los días.\n\n`;
    text += `**Ventaja Clave:** Sin volatilidad cambiaria a corto plazo.\n**Riesgo:** Si el dólar o la inflación suben bruscamente, el rendimiento real en pesos puede perder poder de compra.`;
  } else if (latestMessage.includes("mep") || latestMessage.includes("dolar") || latestMessage.includes("dólar") || latestMessage.includes("parking") || latestMessage.includes("ccl")) {
    text += `### 💵 Todo sobre el Dólar MEP (Bolsa) y Cobertura Cambiaria\n\n`;
    text += `El **Dólar MEP** es la vía legal, regulada y transparente para dolarizar ahorros en Argentina a través de bonos (como el AL30/GD30).\n\n`;
    text += `1. **Comprar el Bono en Pesos (AL30)**.\n`;
    text += `2. **Aguardar el Parking reglamentario (24 hs hábiles)**.\n`;
    text += `3. **Vender el Bono en Dólares (AL30D)**.\n\n`;
    text += `**Ventajas:** 100% legal, sin el cupo bancario de los 200 USD y con dólares acreditados en tu cuenta bancaria.`;
  } else if (latestMessage.includes("cedear") || latestMessage.includes("acciones") || latestMessage.includes("spy") || latestMessage.includes("apple") || latestMessage.includes("tsla") || latestMessage.includes("meli") || latestMessage.includes("nvda") || latestMessage.includes("merval")) {
    text += `### 📈 Invertir en CEDEARs (Empresas Globales desde Argentina)\n\n`;
    text += `Los **CEDEARs** te permiten invertir en pesos o dólares en compañías mundiales como Apple, Nvidia, MercadoLibre o el índice S&P 500 (SPY).\n\n`;
    text += `**Doble Variación de Precio:**\n`;
    text += `1. Varía por el precio de la acción en Wall Street (en dólares).\n`;
    text += `2. Varía por la cotización del Dólar CCL en Argentina.\n\n`;
    text += `**Protección:** Si el dólar financiero sube, el valor de tus CEDEARs en pesos sube proporcionalmente.`;
  } else if (latestMessage.includes("portafolio") || latestMessage.includes("diversific") || latestMessage.includes("recomiend") || latestMessage.includes("invert")) {
    text += `### 💼 Estructura de Portafolio Recomendada\n\n`;
    if (risk === "bajo") {
      text += `Para tu **Perfil Conservador**, priorizamos la preservación del capital:\n\n`;
      text += `- **65% en Renta Fija Líquida**: FCI Money Market para gastos corrientes y Plazo Fijo UVA para cobertura de inflación.\n`;
      text += `- **35% en Obligaciones Negociables (ONs)** de corporaciones argentinas sólidas que pagan renta en dólares billete.`;
    } else if (risk === "agresivo") {
      text += `Para tu **Perfil Agresivo**, buscamos maximizar retornos tolerando volatilidad:\n\n`;
      text += `- **55% en CEDEARs**: Principalmente en SPY (S&P 500) y tecnológicas líderes (NVDA, MSFT, MELI).\n`;
      text += `- **25% en Acciones del Merval**: Empresas líderes de energía y finanzas (YPF, Pampa, Galicia).\n`;
      text += `- **20% en Criptomonedas**: Bitcoin (BTC) y monedas estables con rendimiento (USDT).`;
    } else {
      text += `Para tu **Perfil Moderado**, proponemos un equilibrio sólido:\n\n`;
      text += `- **40% en Obligaciones Negociables (ONs)** en dólares con renta periódica.\n`;
      text += `- **35% en CEDEARs Diversificados (SPY / Apple / Microsoft)**.\n`;
      text += `- **25% en Renta Fija en Pesos / Fondos Remunerados** para liquidez.`;
    }
  } else {
    text += `### 💡 Planificación Financiera para tu Capital\n\n`;
    text += `Con un capital declarado de **${currency} ${capital.toLocaleString("es-AR")}** y un perfil **${risk.toUpperCase()}**:\n\n`;
    text += `1. **Reserva de Emergencia (15-20%)**: Conserva liquidez en billeteras remuneradas (Money Market) para imprevistos.\n`;
    text += `2. **Protección Cambiaria e Inflación**: Dolariza o indexa la porción de mediano y largo plazo a través de Dólar MEP, CEDEARs u Obligaciones Negociables.\n`;
    text += `3. **Diversificación**: No coloques todo el capital en un solo instrumento bancario o de un solo tipo de moneda.`;
  }

  text += `\n\n---\n*Invert-Play AR: Simulador de Finanzas Personales. Toda recomendación tiene fines exclusivamente didácticos y formativos.*`;
  return text;
}
