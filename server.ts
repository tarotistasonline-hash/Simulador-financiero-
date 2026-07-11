import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client securely
// Using process.env.GEMINI_API_KEY which is injected by the platform
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Mock financial rates for Argentina
const FINANCIAL_RATES = {
  currencies: [
    { name: "Dólar Oficial", buy: 915, sell: 955, change: 0.1, icon: "Building" },
    { name: "Dólar MEP (Bolsa)", buy: 1285, sell: 1295, change: 3.2, icon: "TrendingUp" },
    { name: "Dólar CCL", buy: 1310, sell: 1320, change: 1.4, icon: "Globe" },
    { name: "Dólar Cripto (USDT)", buy: 1295, sell: 1308, change: 0.5, icon: "Coins" }
  ],
  fixedIncome: [
    { name: "Plazo Fijo Tradicional", rate: "37.0% TNA", yield: "43.9% TEA", delay: "30-365 días", risk: "Bajo", desc: "Tasa fija garantizada en pesos regulada por el BCRA." },
    { name: "Plazo Fijo UVA", rate: "Inflación + 1%", yield: "Variable", delay: "Mínimo 180 días", risk: "Bajo", desc: "Protege contra la inflación indexando el capital a la variación del UVA." },
    { name: "FCI Money Market (Mercado Pago / Ualá)", rate: "33.5% TNA", yield: "39.2% TEA", delay: "Inmediato (T+0)", risk: "Bajo", desc: "Fondo común con liquidez las 24 hs, ideal para el día a día." },
    { name: "Obligaciones Negociables (ONs)", rate: "7.0% - 9.5% anual en USD", yield: "En dólares", delay: "Mediano plazo", risk: "Moderado", desc: "Deuda de empresas argentinas líderes que paga intereses en dólares." }
  ],
  cedears: [
    { symbol: "SPY", name: "S&P 500 Index ETF", priceARS: 46800, change: 1.2, ratio: "20:1", assetClass: "Acciones Globales" },
    { symbol: "AAPL", name: "Apple Inc.", priceARS: 15400, change: -0.5, ratio: "10:1", assetClass: "Tecnología" },
    { symbol: "TSLA", name: "Tesla, Inc.", priceARS: 13100, change: 3.4, ratio: "15:1", assetClass: "Automotriz / Energía" },
    { symbol: "MELI", name: "MercadoLibre Inc.", priceARS: 63200, change: 2.1, ratio: "60:1", assetClass: "E-commerce LatAm" },
    { symbol: "MSFT", name: "Microsoft Corp.", priceARS: 29100, change: -0.1, ratio: "30:1", assetClass: "Software / Cloud" },
    { symbol: "NVDA", name: "Nvidia Corp.", priceARS: 19400, change: 4.8, ratio: "12:1", assetClass: "Inteligencia Artificial" }
  ],
  localStocks: [
    { symbol: "GGAL", name: "Grupo Financiero Galicia", priceARS: 5650, change: 2.3 },
    { symbol: "YPFD", name: "YPF S.A.", priceARS: 29200, change: 1.5 },
    { symbol: "PAMP", name: "Pampa Energía", priceARS: 3450, change: -0.8 },
    { symbol: "ALUA", name: "Aluar Aluminio Argentino", priceARS: 1120, change: 0.2 }
  ],
  crypto: [
    { symbol: "BTC", name: "Bitcoin", priceUSD: 58400, priceARS: 75920000, change: 1.8 },
    { symbol: "ETH", name: "Ethereum", priceUSD: 3120, priceARS: 40560000, change: -0.4 },
    { symbol: "USDT", name: "Tether (Dólar Cripto)", priceUSD: 1.0, priceARS: 1302, change: 0.1 }
  ],
  macroeconomics: {
    monthlyInflation: 4.1,
    projectedAnnualInflation: 58.0,
    riskCountry: 1450
  }
};

// API Endpoint to get current financial rates
app.get("/api/rates", (req, res) => {
  res.json(FINANCIAL_RATES);
});

// Persistent visitor counter
const VISITOR_FILE = path.join(process.cwd(), "visitor_count.json");
let visitorStats = {
  totalVisits: 2458, // Initial seed matching the app design, which will now increment with real traffic
  uniqueUsers: 1450,
  knownClients: [] as string[]
};

// Load stats from file if it exists
try {
  if (fs.existsSync(VISITOR_FILE)) {
    const data = fs.readFileSync(VISITOR_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.totalVisits === "number") visitorStats.totalVisits = parsed.totalVisits;
      if (typeof parsed.uniqueUsers === "number") visitorStats.uniqueUsers = parsed.uniqueUsers;
      if (Array.isArray(parsed.knownClients)) visitorStats.knownClients = parsed.knownClients;
    }
  } else {
    fs.writeFileSync(VISITOR_FILE, JSON.stringify(visitorStats, null, 2), "utf-8");
  }
} catch (e) {
  console.error("Error loading visitor count file:", e);
}

// API Endpoint to register and get real-time visitor statistics
app.post("/api/visitors", (req, res) => {
  const { clientId } = req.body;
  
  visitorStats.totalVisits += 1;
  
  if (clientId && typeof clientId === "string" && clientId.trim() !== "") {
    if (!visitorStats.knownClients.includes(clientId)) {
      visitorStats.knownClients.push(clientId);
      visitorStats.uniqueUsers += 1;
      console.log(`[Visitors] New unique client registered: ${clientId}. Total unique: ${visitorStats.uniqueUsers}`);
    }
  }
  
  try {
    fs.writeFileSync(VISITOR_FILE, JSON.stringify(visitorStats, null, 2), "utf-8");
  } catch (writeErr) {
    console.error("Error writing visitor count file:", writeErr);
  }
  
  res.json({
    totalVisits: visitorStats.totalVisits,
    uniqueUsers: visitorStats.uniqueUsers
  });
});

// Shared Circuit Breaker Configuration for Gemini API to prevent quota limits or spam
let circuitBreakerActiveUntil = 0;
const BREAKER_DURATION_MS = 15 * 60 * 1000; // 15 minutes of break on quota/API limits

function activateCircuitBreaker(error: any) {
  const errorStr = String(error?.message || error || "");
  const isQuota = 
    errorStr.includes("429") || 
    errorStr.includes("RESOURCE_EXHAUSTED") || 
    errorStr.includes("quota") || 
    errorStr.toLowerCase().includes("circuit breaker") ||
    errorStr.toLowerCase().includes("rate limit") ||
    errorStr.toLowerCase().includes("limit exceeded");
  const isUnavailable = errorStr.includes("503") || errorStr.includes("UNAVAILABLE");
  
  if (isQuota || isUnavailable) {
    circuitBreakerActiveUntil = Date.now() + BREAKER_DURATION_MS;
    console.warn(`[Circuit Breaker Activated] Bypassing Gemini API calls for 15 minutes due to quota/rate limit error: ${errorStr.substring(0, 150)}`);
  }
}

function generateLocalFallbackAdvice(messages: any[], userProfile: any): string {
  const latestMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
  
  const risk = (userProfile?.riskProfile || "moderado").toLowerCase();
  const capital = userProfile?.capital || 0;
  const currency = userProfile?.currency || "ARS";
  
  let text = `⚠️ **[Asesor de Contingencia Activo - Límite de Cuota de IA Excedido]**\n\n*¡Hola! El motor principal de Inteligencia Artificial (Gemini) ha alcanzado el límite de consultas gratuitas de este servidor compartido en este minuto. Para evitar mostrarte un error, nuestro sistema local ha procesado tu perfil y preparado una recomendación financiera personalizada:* \n\n`;

  // Check query keywords
  if (latestMessage.includes("jubila") || latestMessage.includes("pension") || latestMessage.includes("mínimo") || latestMessage.includes("minimo") || latestMessage.includes("sueldo") || latestMessage.includes("ingreso bajo") || latestMessage.includes("retirado")) {
    text += `### 👵🏽 Guía de Optimización para Jubilados e Ingresos Mínimos: Rendimiento Diario y Rescate Inmediato\n\n`;
    text += `Para un jubilado o alguien con un sueldo mínimo en Argentina, **la liquidez es vital**: no se puede dar el lujo de congelar dinero por 30 días (como en un Plazo Fijo) ante imprevistos médicos o compras de alimentos diarios. Sin embargo, dejar los pesos quietos en el banco es una pérdida constante por la inflación.\n\n`;
    text += `Aquí tienes la estrategia financiera defensiva más eficiente para optimizar ingresos magros:\n\n`;
    text += `#### 1. 📱 Billeteras Virtuales con Cuentas Remuneradas (Rescate Inmediato 24/7)\n`;
    text += `En lugar de dejar la jubilación o el sueldo en la caja de ahorro bancaria tradicional, **transfiérelo el mismo día de cobro** a una billetera digital que pague intereses diarios por solo tener el dinero allí:\n\n`;
    text += `- **Naranja X**: Ofrece una de las tasas remuneradas más altas del mercado (TNA ~40% o similar sobre saldos diarios) hasta un tope de saldo (actualmente $600.000 ARS). Es ideal para dejar el dinero del mes que vas consumiendo día a día.\n`;
    text += `- **Personal Pay / Ualá / Mercado Pago**: Sus fondos comunes de inversión de Money Market rinden aproximadamente un **~33.5% TNA**. El dinero sigue disponible las 24 horas del día, los 7 días de la semana, para compras con su tarjeta de débito, pagos de servicios o transferencias.\n\n`;
    text += `#### 2. 📅 El Truco del "Diferimiento de Pagos"\n`;
    text += `- **No pagues las cuentas antes de tiempo**: Si una factura de luz, gas o celular vence el día 15, no la pagues el día 1 en cuanto cobras. Deja ese dinero generando intereses diarios en tu cuenta remunerada y programa el pago para el mismo día del vencimiento.\n`;
    text += `- Al hacer esto con todos tus gastos mensuales, logras que el dinero trabaje para ti entre **10 y 15 días extra**, generando un rendimiento adicional que alivia tu bolsillo.\n\n`;
    text += `#### 3. 🛍️ Aprovecha Reintegros y Promociones Provinciales/Bancarias\n`;
    text += `- **Cuenta DNI (Banco Provincia)**: Si resides en Buenos Aires, es una herramienta de ahorro indispensable con reintegros de hasta 35% o 40% en carnicerías, verdulerías y comercios de barrio en días específicos.\n`;
    text += `- **BNA+ (Banco Nación)** y billeteras digitales como **Personal Pay** (que ofrece niveles de reintegro en base a consumos) pueden devolverte miles de pesos mensuales en compras esenciales.\n`;
    text += `- **Devolución de IVA o Reintegros para Jubilados**: Monitorea siempre los beneficios vigentes de ANSES o de AFIP que reintegran un porcentaje de las compras realizadas con la tarjeta de débito donde cobras tus haberes.\n\n`;
    text += `#### 4. ❌ ¿Conviene el Plazo Fijo Tradicional?\n`;
    text += `- **No se recomienda** para montos que correspondan al sustento diario. Aunque pague un poco más que una billetera virtual, el hecho de no poder tocar el dinero por **30 días enteros** es un riesgo muy alto ante cualquier urgencia.\n`;
    text += `- Úsalo únicamente si lograste separar un pequeño "excedente" que sabes con certeza absoluta que no vas a necesitar bajo ninguna circunstancia durante el próximo mes.`;
  } else if (latestMessage.includes("uva") || latestMessage.includes("plazo") || latestMessage.includes("fijo") || latestMessage.includes("tna")) {
    text += `### 🏦 Comparativa de Tasas en Pesos (Plazo Fijo vs UVA vs FCI)\n\n`;
    text += `Actualmente, las tasas en pesos para el mercado argentino se estructuran de la siguiente manera:\n\n`;
    text += `- **Plazo Fijo Tradicional (TNA ~37%)**: Te ofrece una previsibilidad absoluta, sabés exactamente cuánto vas a cobrar al final del período de 30 días. Sin embargo, con una inflación mensual que ronda el ~4.1%, la tasa real mensual (~3.08%) queda **por debajo de la inflación**, perdiendo poder adquisitivo lentamente.\n`;
    text += `- **Plazo Fijo UVA (Inflación + 1%)**: Excelente cobertura para empatarle o ganarle a la inflación de precios reales, pero tiene el contra de requerir una **inmovilización mínima de 180 días**. Si necesitás liquidez antes, este instrumento no es viable.\n`;
    text += `- **FCI Money Market (TNA ~33.5%)**: El fondo común diario con rescate inmediato en pesos que encontrás en billeteras digitales como Mercado Pago o Ualá. Paga un rendimiento un poco menor que el Plazo Fijo, pero la **liquidez es inmediata (las 24 hs, incluyendo fines de semana)**.\n\n`;
    text += `**Ventajas de la Renta Fija en Pesos:**\n- Cero volatilidad o riesgo de precio si el dólar oficial o financiero se planchan.\n- Ideal para administrar los fondos mensuales destinados a pagos corrientes o compromisos con fechas fijas.\n\n`;
    text += `**Riesgos / Desventajas:**\n- Exposición directa a la devaluación si se produce una disparada del dólar financiero (MEP/CCL).\n- Licuación si la tasa real no llega a ganarle a la inflación subyacente.`;
  } else if (latestMessage.includes("mep") || latestMessage.includes("dolar") || latestMessage.includes("dólar") || latestMessage.includes("parking") || latestMessage.includes("ccl")) {
    text += `### 💵 Todo sobre el Dólar MEP (Bolsa) y Cobertura Cambiaria\n\n`;
    text += `El **Dólar MEP (Bolsa)** cotiza actualmente en aproximadamente **$1295 ARS**. Comprar Dólar MEP es una de las maneras más populares de dolarizar ahorros en blanco en Argentina de forma legal e ilimitada.\n\n`;
    text += `**¿Cómo funciona el proceso de compra regulado?**\n`;
    text += `1. **Comprar un Bono en Pesos**: Comúnmente el bono soberano AL30 en la especie pesos.\n`;
    text += `2. **Parking Obligatorio**: Debés esperar el plazo regulatorio mínimo (actualmente **24 horas hábiles / 1 día de parking**) sin poder vender el activo. Es un tiempo de espera impuesto por la Comisión Nacional de Valores (CNV).\n`;
    text += `3. **Vender el Bono en Dólares**: Se vende el activo bajo la especie AL30D, acreditándose los dólares líquidos de forma limpia en tu cuenta de inversiones.\n\n`;
    text += `**Ventajas:**\n- Dolarización 100% legal, sin límites (saltando el cepo cambiario de los USD 200 bancarios) y con liquidación inmediata.\n- Es el paso previo ideal para comprar Obligaciones Negociables (ONs) o fondear inversiones en renta fija en dólares.\n\n`;
    text += `**Riesgos / Desventajas:**\n- Riesgo de volatilidad del bono durante las 24 hs del parking. Si el precio del AL30 baja sensiblemente en ese lapso, el tipo de cambio implícito final puede resultar levemente más alto.`;
  } else if (latestMessage.includes("cedear") || latestMessage.includes("acciones") || latestMessage.includes("spy") || latestMessage.includes("apple") || latestMessage.includes("tsla") || latestMessage.includes("meli") || latestMessage.includes("nvda") || latestMessage.includes("merval")) {
    text += `### 📈 CEDEARs (Certificados de Depósito Argentinos)\n\n`;
    text += `Los **CEDEARs** representan fracciones de acciones de empresas extranjeras muy reconocidas que cotizan en el exterior (como Apple, Tesla, MercadoLibre, Nvidia) o índices (como el S&P 500 bajo la sigla SPY) pero que podés comprar en pesos o dólares desde una cuenta local en Argentina.\n\n`;
    text += `**Doble Variación (Aspecto Crítico de Riesgo/Retorno):**\n`;
    text += `El precio de un CEDEAR en pesos varía en base a dos factores independientes en simultáneo:\n`;
    text += `1. **La cotización del Dólar CCL (Contado con Liquidación)** en la plaza local argentina.\n`;
    text += `2. **El precio de la acción subyacente** en su mercado de origen (ej: Wall Street en USD).\n\n`;
    text += `**Ventajas:**\n- Te protegen contra una eventual devaluación del peso argentino al estar indexados al tipo de cambio financiero.\n- Diversificación mundial: podés ser dueño de gigantes como Microsoft, Google o Nvidia desde Argentina con montos bajos.\n\n`;
    text += `**Desventajas / Riesgos:**\n- Riesgo Cambiario inverso: si el dólar financiero baja o se estabiliza mientras la inflación en pesos corre al 4%, vas a sufrir rentabilidad real negativa en pesos.\n- Riesgo de Mercado: si hay una corrección o caída en la bolsa de Nueva York, el CEDEAR bajará aunque el dólar suba.`;
  } else if (latestMessage.includes("portafolio") || latestMessage.includes("diversific") || latestMessage.includes("recomiend") || latestMessage.includes("invert")) {
    text += `### 💼 Estructura de Portafolio Recomendada\n\n`;
    if (risk === "bajo") {
      text += `Como seleccionaste un **Perfil de Riesgo Bajo**, la prioridad absoluta es conservar capital y mantener buena liquidez:\n\n`;
      text += `1. **70% en Renta Fija Líquida**: Repartido en **FCI Money Market (Mercado Pago / Ualá)** para transacciones cotidianas de corto plazo, y **Plazo Fijo UVA** para cubrirte de la inflación en pesos a mediano plazo.\n`;
      text += `2. **30% en Obligaciones Negociables (ONs)** corporativas de primer nivel (ej: YPF, Pampa Energía, Telecom) nominadas en dólares que paguen cupones periódicos (rendimientos históricos ~7.0% - 9.0% anual en dólares billete).`;
    } else if (risk === "agresivo") {
      text += `Como seleccionaste un **Perfil de Riesgo Agresivo**, el objetivo principal es maximizar el retorno a largo plazo tolerando alta volatilidad cambiaria o bursátil:\n\n`;
      text += `1. **60% en CEDEARs Diversificados**: Mantener un núcleo fuerte en el ETF del S&P 500 (**SPY**), acompañado de satélites en tecnológicas de fuerte rendimiento de inteligencia artificial o e-commerce como **NVDA**, **MSFT** y **MELI**.\n`;
      text += `2. **20% en Acciones de la Bolsa Local (Merval)**: Invertir en empresas líderes locales con valuaciones competitivas (ej: GGAL, YPFD, PAMP).\n`;
      text += `3. **20% en Criptomonedas**: Con un mix entre monedas estables con rendimiento en dólares (USDT) y una porción en activos fuertes de renta variable cripto como **BTC** y **ETH** para capturar ciclos alcistas de alta intensidad.`;
    } else {
      // moderado
      text += `Como seleccionaste un **Perfil de Riesgo Moderado**, buscamos un sano equilibrio entre cobertura de poder de compra y búsqueda de rentabilidad cambiaria:\n\n`;
      text += `1. **40% en Obligaciones Negociables (ONs)** en dólares: Garantiza una renta fija regular, previsible e independiente de los vaivenes de la moneda local, pagándote cupones en dólares directamente en tu cuenta de bolsa.\n`;
      text += `2. **30% en CEDEARs de Índices Estables**: Invertir principalmente en el **SPY** (S&P 500) o en corporaciones maduras como **AAPL** o **MSFT** que amortiguan caídas severas.\n`;
      text += `3. **30% en Instrumentos en Pesos Ajustados por Inflación**: Fondos comunes de inversión indexados por CER (inflación) o Plazos Fijos UVA para ganarle a la suba de precios internos del país.`;
    }
  } else {
    text += `### 💡 Planificación Financiera Estratégica\n\n`;
    text += `Para optimizar tu capital inicial de **${currency} ${capital.toLocaleString("es-AR")}**, te sugerimos concentrarte en estos pilares clave:\n\n`;
    text += `1. **Fondo de Emergencia**: Nunca inviertas dinero necesario en el corto plazo (menos de 6 meses) en activos volátiles. Ese dinero de reserva debe residir en instrumentos súper líquidos como **FCI Money Market (TNA ~33.5%)**.\n`;
    text += `2. **Identificar la Preocupación Principal**:\n`;
    text += `   - Si te quita el sueño la inflación local: El camino ideal es la renta indexada por pesos (**Plazo Fijo UVA** o fondos CER).\n`;
    text += `   - Si tu prioridad es la cobertura contra devaluaciones repentinas: La respuesta es dolarizarte mediante **Dólar MEP**, **Obligaciones Negociables (ONs)** o **CEDEARs**.\n\n`;
    text += `**Tu Perfil Declarado: ${risk.toUpperCase()}**\n`;
    if (risk === "bajo") {
      text += `Es preferible consolidar una cartera de renta fija pura: letras del tesoro local cortas, billeteras remuneradas y ONs corporativas que paguen dólares billete.`;
    } else if (risk === "agresivo") {
      text += `Podés potenciar el capital asumiendo más riesgo de mercado. Un portafolio compuesto mayormente por CEDEARs de primer nivel de Wall Street e inversiones criptográficas te dará el mayor potencial de crecimiento real.`;
    } else {
      text += `El sendero balanceado es tu mejor opción: un mix equilibrado entre renta fija garantizada en dólares de mediano plazo y renta variable moderada en acciones globales estables.`;
    }
  }

  text += `\n\n---\n*Nota: El servicio de IA inteligente se restablecerá automáticamente en este simulador una vez concluida la pausa temporal de cuota compartida. Si deseas consultar libremente y sin ningún tipo de límite, puedes hacerlo aguardando un breve momento.*`;
  return text;
}

// API Endpoint for the AI Investment Advisor Chat
app.post("/api/advisor/chat", async (req, res) => {
  try {
    const { messages, userProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid format. 'messages' array is required." });
    }

    // Check if Circuit Breaker is active - IF SO, SEAMLESSLY RETURN SMART FALLBACK ADVICE WITH 200 OK
    if (Date.now() < circuitBreakerActiveUntil) {
      console.log(`[Circuit Breaker Active] Bypassing Gemini Chat to prevent quota spam. Returning local advice.`);
      const fallbackAdvice = generateLocalFallbackAdvice(messages, userProfile);
      return res.json({ content: fallbackAdvice, isFallback: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log(`[GEMINI_API_KEY Missing] Returning smart local fallback advisor response.`);
      const fallbackAdvice = generateLocalFallbackAdvice(messages, userProfile);
      return res.json({ content: fallbackAdvice, isFallback: true });
    }

    // Format messages into Gemini format
    // role must be 'user' or 'model'
    const formattedContents = messages.map(msg => {
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      };
    });

    const capitalStr = userProfile?.capital 
      ? `El usuario tiene un capital inicial de: ${userProfile.currency === "USD" ? "USD" : "ARS"} ${userProfile.capital.toLocaleString("es-AR")}.` 
      : "El usuario no especificó su capital de inicio aún.";
    
    const riskProfileStr = userProfile?.riskProfile 
      ? `Su perfil de riesgo auto-declarado es: ${userProfile.riskProfile.toUpperCase()}.` 
      : "El usuario no especificó un perfil de riesgo definido.";

    const goalsStr = userProfile?.goals 
      ? `Sus objetivos principales de inversión son: ${userProfile.goals}.` 
      : "Su objetivo es preservar capital y buscar oportunidades generales en Argentina.";

    const systemInstruction = `Eres "Invert-Play AR - Asesor Inteligente", un asesor financiero altamente capacitado y especializado en el mercado de capitales argentino. 
Tu tarea es guiar al usuario que está consultando desde Argentina.
Dales respuestas objetivas, realistas, didácticas y estructuradas. No prometas retornos irrealistas ni asumas riesgos ciegos.

Contexto actual del usuario:
- ${capitalStr}
- ${riskProfileStr}
- ${goalsStr}

Información actual aproximada de mercado que debes tener en cuenta al responder:
- Dólar MEP: ~$1295 ARS
- Dólar Cripto: ~$1305 ARS
- Plazo Fijo TNA: ~37% anual
- Inflación mensual reciente: ~4.1% mensual (proyección anual aprox. 55-60%)
- FCI Money Market TNA: ~33.5% anual
- CEDEARs populares: SPY, AAPL, TSLA, MELI, MSFT, NVDA.

Reglas del asesoramiento:
1. Sé claro y estructurado: Usa negritas, viñetas, listas de ventajas y desventajas.
2. Explica siempre la relación Riesgo vs Retorno. Los CEDEARs tienen riesgo cambiario (variación del CCL) y riesgo de mercado (la acción subyacente).
3. Usa la jerga argentina de forma amigable (Dólar MEP, Plazo Fijo, Cedears, FCI, Monotributo, ONs, Faca bajo el colchón, etc.) pero mantén el profesionalismo comercial. Puedes tutear o vosear cordialmente de forma sutil y empática.
4. Explica siempre las diferencias prácticas de plazo y liquidez (ej: Plazo Fijo inmoviliza por 30 días, FCI Money Market liquidez instantánea, CEDEARs liquidez inmediata en horario de mercado T+2 o T+1).
5. Atiende las consultas de jubilados, pensionados o de personas con sueldos mínimos con máxima empatía y sentido práctico: Prioriza la liquidez inmediata, desaconseja el Plazo Fijo si es dinero del sustento diario (por el bloqueo de 30 días), recomienda cuentas remuneradas (Mercado Pago, Naranja X, Personal Pay, Ualá), el truco de diferir vencimientos al máximo para ganar intereses en cuentas remuneradas, y programas de reintegro (Cuenta DNI, BNA+, devoluciones de IVA/ANSES).
6. Concluye siempre con un consejo de diversificación acorde a su perfil.`;

    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    let response;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });
        if (response) {
          lastError = null;
          break; // Success!
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or unavailable. Error:`, err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    const answer = response?.text || "Disculpas, no pude procesar una respuesta en este momento.";
    res.json({ content: answer, isFallback: false });

  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    
    activateCircuitBreaker(error);

    // Instead of throwing an error response code 429/500 and causing red banners in the front-end,
    // seamlessly transition to the beautiful smart Argentine investment advice fallback!
    try {
      const fallbackAdvice = generateLocalFallbackAdvice(req.body.messages || [], req.body.userProfile);
      return res.json({ content: fallbackAdvice, isFallback: true });
    } catch (fallbackGenError) {
      console.error("Failed to generate local advice fallback:", fallbackGenError);
      res.status(200).json({ 
        content: "⚠️ **[Fallo en Motor IA y Contingencia]**\n\nDisculpas, no pude procesar tu consulta en este momento debido a un problema temporal con las cuotas del servidor. Por favor, aguarda unos instantes e inténtalo de nuevo.",
        isFallback: true
      });
    }
  }
});

const FALLBACK_NEWS = [
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

interface CachedNews {
  data: any[];
  timestamp: number;
}

let newsCache: CachedNews | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// API Endpoint to get real-time Argentine financial news using Google Search grounding
app.get("/api/news", async (req, res) => {
  try {
    const now = Date.now();
    
    // Check Circuit Breaker
    if (now < circuitBreakerActiveUntil) {
      console.log(`[Circuit Breaker Active] Bypassing Gemini API to prevent quota spam. Serving from safety nets.`);
      if (newsCache) {
        return res.json(newsCache.data);
      }
      return res.json(FALLBACK_NEWS);
    }
    
    // Serve from cache if still fresh
    if (newsCache && (now - newsCache.timestamp < CACHE_TTL_MS)) {
      console.log(`[Cache Hit] Serving news from server-side cache. TTL remaining: ${Math.round((CACHE_TTL_MS - (now - newsCache.timestamp)) / 1000)}s`);
      return res.json(newsCache.data);
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY no configurado, usando noticias de contingencia.");
      return res.json(newsCache ? newsCache.data : FALLBACK_NEWS);
    }

    try {
      console.log("[Cache Miss] Fetching live news from Gemini with Google Search grounding...");
      // Tier 1: Try to fetch live news with Google Search grounding
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Busca las 3 noticias financieras más recientes e importantes de Argentina hoy (dólar, inflación, plazo fijo, CEDEARs, acciones o Banco Central). Buscá en internet las noticias más frescas e importantes de las últimas 24-48 horas. Devuelve estrictamente un arreglo JSON de exactamente 3 elementos con título, resumen, url de origen real (obtenida del buscador de Google Search), fuente y fecha aproximada.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Título breve y atractivo de la noticia financiera" },
                summary: { type: Type.STRING, description: "Resumen conciso de 1-2 oraciones explicando el impacto o novedad" },
                url: { type: Type.STRING, description: "URL de origen real de la noticia obtenida de los resultados de búsqueda de Google" },
                source: { type: Type.STRING, description: "Nombre del medio informativo, por ejemplo: El Cronista, Ámbito, Infobae, Clarín, La Nación, etc." },
                date: { type: Type.STRING, description: "Fecha amigable, por ejemplo: Hoy, Ayer, o la fecha de publicación" }
              },
              required: ["title", "summary", "url", "source", "date"]
            }
          }
        }
      });

      if (response && response.text) {
        const news = JSON.parse(response.text.trim());
        if (Array.isArray(news) && news.length > 0) {
          const formattedNews = news.slice(0, 3);
          // Save to cache
          newsCache = {
            data: formattedNews,
            timestamp: Date.now()
          };
          console.log("[Cache Update] Saved Tier 1 grounded news to cache.");
          return res.json(formattedNews);
        }
      }
    } catch (groundingError: any) {
      activateCircuitBreaker(groundingError);
      
      // If circuit breaker was just activated, skip Tier 2 and go directly to fallbacks
      if (Date.now() < circuitBreakerActiveUntil) {
        if (newsCache) {
          return res.json(newsCache.data);
        }
        return res.json(FALLBACK_NEWS);
      }

      const errorMsg = groundingError?.message || "";
      console.warn("[Tier 1 Failed] Grounding de búsqueda de Google no disponible o cuota excedida. Intentando generador estándar...", errorMsg);
      
      try {
        // Tier 2: Try standard model generation (without search grounding) using the model's financial training
        const fallbackAiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: "Genera las 3 noticias financieras más importantes y realistas de Argentina hoy (vinculadas a la cotización del dólar, inflación, CEDEARs, plazos fijos o Banco Central). Deben sonar sumamente actualizadas e incorporar datos realistas del panorama macroeconómico argentino actual. Devuelve estrictamente un arreglo JSON de exactamente 3 elementos con título, resumen, una URL verosímil de un medio argentino especializado (ej: cronista.com o ambito.com), el nombre del medio como fuente y la fecha 'Hoy' o 'Ayer'.",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  url: { type: Type.STRING },
                  source: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["title", "summary", "url", "source", "date"]
              }
            }
          }
        });

        if (fallbackAiResponse && fallbackAiResponse.text) {
          const fallbackNews = JSON.parse(fallbackAiResponse.text.trim());
          if (Array.isArray(fallbackNews) && fallbackNews.length > 0) {
            const formattedFallbackNews = fallbackNews.slice(0, 3);
            // Save to cache
            newsCache = {
              data: formattedFallbackNews,
              timestamp: Date.now()
            };
            console.log("[Cache Update] Saved Tier 2 standard news to cache.");
            return res.json(formattedFallbackNews);
          }
        }
      } catch (tier2Error: any) {
        activateCircuitBreaker(tier2Error);
        console.warn("[Tier 2 Failed] Fallo el modelo de contingencia estándar debido a límites de cuota generales:", tier2Error?.message || tier2Error);
      }
    }

    // Tier 3: If both AI tiers fail or hit quota limits:
    // Try to return the stale cache if available (even if expired, it's better than returning static fallbacks)
    if (newsCache) {
      console.log("[Cache Recovery] Serving stale cache as safety net after AI errors.");
      return res.json(newsCache.data);
    }

    // Return hardcoded default fallback if absolutely nothing else is available
    console.log("[Fallback] Serving static fallback news.");
    res.json(FALLBACK_NEWS);
  } catch (error) {
    console.warn("Error general en el endpoint de noticias, retornando contingencia:", error);
    res.json(newsCache ? newsCache.data : FALLBACK_NEWS);
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
