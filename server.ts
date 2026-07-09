import express from "express";
import path from "path";
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
    { name: "Dólar Oficial", buy: 915, sell: 955, icon: "Building" },
    { name: "Dólar MEP (Bolsa)", buy: 1285, sell: 1295, icon: "TrendingUp" },
    { name: "Dólar CCL", buy: 1310, sell: 1320, icon: "Globe" },
    { name: "Dólar Cripto (USDT)", buy: 1295, sell: 1308, icon: "Coins" }
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

// API Endpoint for the AI Investment Advisor Chat
app.post("/api/advisor/chat", async (req, res) => {
  try {
    const { messages, userProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid format. 'messages' array is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Falta la configuración de la clave de API de Gemini en el servidor. Por favor, configúrala en el panel de secretos." 
      });
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
5. Concluye siempre con un consejo de diversificación acorde a su perfil.`;

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
    res.json({ content: answer });

  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ 
      error: "Error al comunicarse con el motor de IA. Detalles: " + (error.message || error) 
    });
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

// API Endpoint to get real-time Argentine financial news using Google Search grounding
app.get("/api/news", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY no configurado, usando noticias de contingencia.");
      return res.json(FALLBACK_NEWS);
    }

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
        return res.json(news.slice(0, 3));
      }
    }
    
    res.json(FALLBACK_NEWS);
  } catch (error) {
    console.error("Error al obtener noticias de Gemini con búsqueda:", error);
    res.json(FALLBACK_NEWS);
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
