import React, { useState, useEffect } from "react";
import { 
  Newspaper,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  LineChart, 
  Percent, 
  Briefcase, 
  MessageSquare, 
  AlertTriangle, 
  Search, 
  Building, 
  Coins, 
  Globe, 
  RefreshCw, 
  BarChart3,
  User, 
  Target, 
  ArrowRight, 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Wallet,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  FinancialRates, 
  UserProfile, 
  ChatMessage, 
  SimulationAllocation, 
  SimulationResult, 
  RiskProfile, 
  CedearInstrument, 
  CryptoInstrument, 
  LocalStockInstrument,
  FixedIncomeInstrument
} from "./types";
import { AdSenseBanner } from "./components/AdSenseBanner";
import { initMixpanel, trackEvent } from "./lib/analytics";

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  date: string;
}

export default function App() {
  // Global States
  const [rates, setRates] = useState<FinancialRates | null>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  const [errorRates, setErrorRates] = useState<string | null>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [errorNews, setErrorNews] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    capital: 1000000,
    currency: "ARS",
    riskProfile: "moderado",
    goals: "Quiero ganarle a la inflación y mantener mi capital dolarizado o invertido en empresas sólidas de tecnología."
  });

  const [activeTab, setActiveTab] = useState<"rates" | "simulator" | "calculator" | "advisor">("rates");
  
  // Tab-specific states
  const [cedearSearch, setCedearSearch] = useState<string>("");
  const [simPeriod, setSimPeriod] = useState<number>(12); // months
  const [customAllocations, setCustomAllocations] = useState<{ [key: string]: number }>({});
  const [isCustomizingAllocation, setIsCustomizingAllocation] = useState<boolean>(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Calculator states
  const [calcPesos, setCalcPesos] = useState<number>(500000);
  const [calcMonths, setCalcMonths] = useState<number>(6);

  // Guestbook and Visitor states
  const [visitorCount, setVisitorCount] = useState<number>(2458);
  const [guestName, setGuestName] = useState<string>("");
  const [guestProfile, setGuestProfile] = useState<RiskProfile>("moderado");
  const [guestComment, setGuestComment] = useState<string>("");
  const [isBlogExpanded, setIsBlogExpanded] = useState<boolean>(false);
  const [guestbookEntries, setGuestbookEntries] = useState<Array<{
    id: string;
    name: string;
    profile: RiskProfile;
    comment: string;
    timestamp: string;
  }>>([]);

  // AdSense dynamic configuration states
  const [adsenseId, setAdsenseId] = useState<string>(() => localStorage.getItem("adsense_publisher_id") || "");
  const [adsenseSaved, setAdsenseSaved] = useState<boolean>(false);
  
  // Helper to validate and normalize format
  const isAdsenseIdInvalid = (() => {
    const trimmed = adsenseId.trim();
    if (!trimmed) return false;
    
    // Check if it's just the prefix without digits
    if (trimmed === "ca-pub-" || trimmed === "pub-" || trimmed === "pub") return true;
    
    // If it starts with ca-pub- followed by digits
    if (trimmed.startsWith("ca-pub-")) {
      const rest = trimmed.slice(7);
      return !/^\d+$/.test(rest); // must be only digits
    }
    
    // If it starts with pub- followed by digits
    if (trimmed.startsWith("pub-")) {
      const rest = trimmed.slice(4);
      return !/^\d+$/.test(rest); // must be only digits
    }
    
    // If it starts with pub followed by digits
    if (trimmed.startsWith("pub")) {
      const rest = trimmed.slice(3);
      return !/^\d+$/.test(rest); // must be only digits
    }
    
    // If it is pure digits
    if (/^\d+$/.test(trimmed)) {
      return false;
    }
    
    return true;
  })();

  // Mixpanel dynamic configuration states
  const [mixpanelToken, setMixpanelToken] = useState<string>(() => localStorage.getItem("mixpanel_project_token") || "");
  const [mixpanelSaved, setMixpanelSaved] = useState<boolean>(false);

  // Inflation warning and simulation states
  const [customInflation, setCustomInflation] = useState<number | null>(null);
  const [showInflationToast, setShowInflationToast] = useState<boolean>(false);
  const [dismissedInflationToast, setDismissedInflationToast] = useState<boolean>(false);

  const currentInflation = customInflation !== null ? customInflation : (rates?.macroeconomics.monthlyInflation ?? 4.1);

  useEffect(() => {
    if (currentInflation > 5) {
      setShowInflationToast(true);
    } else {
      setShowInflationToast(false);
      setDismissedInflationToast(false);
    }
  }, [currentInflation]);

  const handleSaveAdSenseId = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanId = adsenseId.trim();
    
    // Auto-normalize
    if (cleanId.startsWith("pub-")) {
      cleanId = "ca-" + cleanId;
    } else if (cleanId.startsWith("pub") && !cleanId.startsWith("pub-") && /^\d+$/.test(cleanId.slice(3))) {
      cleanId = "ca-pub-" + cleanId.slice(3);
    } else if (/^\d+$/.test(cleanId)) {
      cleanId = "ca-pub-" + cleanId;
    }

    if (cleanId.length > 0 && !cleanId.startsWith("ca-pub-")) {
      return;
    }

    localStorage.setItem("adsense_publisher_id", cleanId);
    setAdsenseId(cleanId);
    setAdsenseSaved(true);
    // Dispatch custom event to notify all AdSenseBanner instances instantly
    window.dispatchEvent(new Event("adsense-client-id-changed"));
    trackEvent("AdSense ID Configured", { adsenseIdProvided: !!cleanId });
    setTimeout(() => {
      setAdsenseSaved(false);
    }, 3000);
  };

  const handleSaveMixpanelToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = mixpanelToken.trim();
    localStorage.setItem("mixpanel_project_token", cleanToken);
    setMixpanelToken(cleanToken);
    setMixpanelSaved(true);
    // Dispatch custom event to notify mixpanel instance
    window.dispatchEvent(new Event("mixpanel-token-changed"));
    trackEvent("Mixpanel Token Configured", { tokenProvided: !!cleanToken });
    setTimeout(() => {
      setMixpanelSaved(false);
    }, 3000);
  };

  useEffect(() => {
    trackEvent("Tab Changed", { tab: activeTab });
  }, [activeTab]);

  // Fetch rates on component mount
  const fetchRates = async () => {
    try {
      setLoadingRates(true);
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("No se pudieron cargar las cotizaciones del servidor.");
      const data = await res.json();
      setRates(data);
      setErrorRates(null);
    } catch (err: any) {
      console.error(err);
      setErrorRates("No se pudo conectar con el servidor para obtener cotizaciones en tiempo real.");
    } finally {
      setLoadingRates(false);
    }
  };

  const fetchNews = async (forceRefresh = false) => {
    try {
      setLoadingNews(true);

      if (!forceRefresh) {
        const cached = localStorage.getItem("invertplay_news_cache");
        const cachedTime = localStorage.getItem("invertplay_news_timestamp");
        const now = Date.now();

        if (cached && cachedTime) {
          const age = now - parseInt(cachedTime, 10);
          if (age < 30 * 60 * 1000) { // 30 minutes cache duration
            setNews(JSON.parse(cached));
            setErrorNews(null);
            return;
          }
        }
      }

      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("No se pudieron cargar las noticias de último momento.");
      const data = await res.json();
      setNews(data);
      setErrorNews(null);

      // Save to client-side localStorage
      localStorage.setItem("invertplay_news_cache", JSON.stringify(data));
      localStorage.setItem("invertplay_news_timestamp", Date.now().toString());
    } catch (err: any) {
      console.error(err);
      // Try to recover from local storage if network request failed due to server rate limit
      const staleCached = localStorage.getItem("invertplay_news_cache");
      if (staleCached) {
        setNews(JSON.parse(staleCached));
        setErrorNews(null);
      } else {
        setErrorNews("No se pudo conectar con el servidor para obtener las últimas noticias financieras.");
      }
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    initMixpanel();
    fetchRates();
    fetchNews();
  }, []);

  useEffect(() => {
    // Visitor count persistence and increment
    const storedCount = localStorage.getItem("invertplay_visitors");
    let currentCount = 2458;
    if (storedCount) {
      currentCount = parseInt(storedCount, 10) + 1;
    } else {
      currentCount = Math.floor(Math.random() * 500) + 1200;
    }
    localStorage.setItem("invertplay_visitors", currentCount.toString());
    setVisitorCount(currentCount);

    trackEvent("App Loaded", { visitorCount: currentCount });

    // Guestbook entries persistence
    const storedEntries = localStorage.getItem("invertplay_guestbook");
    if (storedEntries) {
      try {
        setGuestbookEntries(JSON.parse(storedEntries));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Prefill with default educational posts
      const defaults = [
        {
          id: "1",
          name: "Santi_Inversor",
          profile: "agresivo" as RiskProfile,
          comment: "¡Excelente simulador educativo! Me sirvió para entender el impacto real de la inflación en mis pesos y cómo los CEDEARs ayudan a dolarizar la cartera.",
          timestamp: "Hace 2 horas"
        },
        {
          id: "2",
          name: "Marta_Ahorros",
          profile: "conservador" as RiskProfile,
          comment: "Muy buena herramienta para la gente que recién arranca. El Plazo Fijo UVA vs el Tradicional es un debate eterno acá, y este gráfico lo explica impecable.",
          timestamp: "Ayer"
        },
        {
          id: "3",
          name: "Lucas_G",
          profile: "moderado" as RiskProfile,
          comment: "Las Obligaciones Negociables son mi instrumento favorito y acá están re bien explicadas con sus tasas actualizadas. ¡Gracias por el simulador!",
          timestamp: "Hace 2 días"
        }
      ];
      setGuestbookEntries(defaults);
      localStorage.setItem("invertplay_guestbook", JSON.stringify(defaults));
    }
  }, []);

  const handleAddGuestbookEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestComment.trim()) return;

    const newEntry = {
      id: Math.random().toString(),
      name: guestName.trim(),
      profile: guestProfile,
      comment: guestComment.trim(),
      timestamp: "Hace instantes"
    };

    const updated = [newEntry, ...guestbookEntries];
    setGuestbookEntries(updated);
    localStorage.setItem("invertplay_guestbook", JSON.stringify(updated));

    trackEvent("Guestbook Comment Created", { 
      name: newEntry.name, 
      profile: newEntry.profile,
      commentLength: newEntry.comment.length
    });

    setGuestName("");
    setGuestComment("");
  };

  // Set default allocations when risk profile or rates change
  useEffect(() => {
    if (!rates) return;
    resetAllocationsToDefault(userProfile.riskProfile);
  }, [userProfile.riskProfile, rates]);

  // Reset allocations helper
  const resetAllocationsToDefault = (profile: RiskProfile) => {
    if (!rates) return;
    const defaults: { [key: string]: number } = {};
    if (profile === "conservador") {
      defaults["Plazo Fijo Tradicional"] = 50;
      defaults["FCI Money Market (Mercado Pago / Ualá)"] = 30;
      defaults["Plazo Fijo UVA"] = 20;
    } else if (profile === "moderado") {
      defaults["Obligaciones Negociables (ONs)"] = 30;
      defaults["SPY"] = 30;
      defaults["AAPL"] = 20;
      defaults["FCI Money Market (Mercado Pago / Ualá)"] = 20;
    } else { // agresivo
      defaults["NVDA"] = 30;
      defaults["MELI"] = 20;
      defaults["BTC"] = 20;
      defaults["GGAL"] = 15;
      defaults["YPFD"] = 15;
    }
    setCustomAllocations(defaults);
    setIsCustomizingAllocation(false);
  };

  // Generate initial greeting for AI chat when user clicks on Chat tab
  useEffect(() => {
    if (activeTab === "advisor" && chatMessages.length === 0) {
      const welcomeMsg = `¡Hola! Soy tu **Asesor Inteligente de Invert-Play AR**. 
Veo que ingresaste un capital inicial de **${userProfile.currency === "USD" ? "USD" : "ARS"} ${userProfile.capital.toLocaleString("es-AR")}** con un perfil de riesgo **${userProfile.riskProfile.toUpperCase()}**.

Teniendo en cuenta el contexto económico actual de la Argentina, la inflación mensual y las alternativas disponibles:
¿Te gustaría saber cómo estructurar tu portafolio, o tienes alguna pregunta sobre CEDEARs, Dólar MEP, Plazo Fijo o Fondos Comunes? 
Escríbeme o selecciona una de las preguntas rápidas abajo.`;
      
      setChatMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeMsg,
          timestamp: new Date()
        }
      ]);
    }
  }, [activeTab]);

  // Estimated annualized returns in ARS for simulation
  const getAnnualYield = (instName: string): number => {
    // Return approximate annualized percentage return in ARS
    switch (instName) {
      case "Plazo Fijo Tradicional": return 0.37;
      case "Plazo Fijo UVA": return 0.55; // index-linked estimate
      case "FCI Money Market (Mercado Pago / Ualá)": return 0.335;
      case "Obligaciones Negociables (ONs)": return 0.58; // ON in USD yields ~8% + typical currency devaluation of ~46% = ~58% in ARS
      case "SPY": return 0.65; // Global actions are linked to CCL + standard asset growth
      case "AAPL": return 0.63;
      case "TSLA": return 0.72;
      case "MELI": return 0.68;
      case "MSFT": return 0.61;
      case "NVDA": return 0.82;
      case "GGAL": return 0.70;
      case "YPFD": return 0.75;
      case "BTC": return 0.85;
      case "ETH": return 0.80;
      default: return 0.35;
    }
  };

  // Calculation of allocations and return projection
  const currentAllocationArray: SimulationAllocation[] = Object.entries(customAllocations).map(([name, pct]) => {
    const percentage = pct as number;
    const amount = (userProfile.capital * percentage) / 100;
    const yieldRate = getAnnualYield(name);
    
    // Simple monthly compounded return over simulation period
    const monthlyRate = Math.pow(1 + yieldRate, 1 / 12) - 1;
    const projectedReturn = amount * Math.pow(1 + monthlyRate, simPeriod) - amount;

    return {
      instrumentName: name,
      percentage,
      amount,
      projectedReturn
    };
  });

  // Calculate dynamic risk metrics of the current allocation versus user's profile
  const getPortfolioRiskMetrics = () => {
    if (Object.keys(customAllocations).length === 0) {
      return {
        score: 0,
        category: "bajo" as "bajo" | "moderado" | "alto",
        isDeviated: false,
        deviationDirection: "none" as "under" | "over" | "none",
        message: "",
        lowRiskPct: 0,
        modRiskPct: 0,
        highRiskPct: 0
      };
    }

    // Risk score assigned to each asset (10 is ultra safe, 100 is highly volatile/speculative)
    const getAssetRiskScore = (name: string): number => {
      switch (name) {
        // Low Risk (Plazo Fijo, Money Market / MP / Ualá)
        case "Plazo Fijo Tradicional": return 10;
        case "FCI Money Market (Mercado Pago / Ualá)": return 15;
        case "Plazo Fijo UVA": return 20;

        // Moderate Risk (ONs, stable US stocks/indices via Cedears)
        case "Obligaciones Negociables (ONs)": return 40;
        case "SPY": return 55;
        case "AAPL": return 60;
        case "MSFT": return 58;

        // High Risk (Growth tech Cedears, local shares, crypto)
        case "TSLA": return 85;
        case "MELI": return 80;
        case "NVDA": return 90;
        case "GGAL": return 85;
        case "YPFD": return 85;
        case "BTC": return 95;
        case "ETH": return 90;
        default: return 50; // average
      }
    };

    let totalWeight = 0;
    let weightedRiskSum = 0;
    let lowRiskPct = 0;
    let modRiskPct = 0;
    let highRiskPct = 0;

    Object.entries(customAllocations).forEach(([name, pct]) => {
      const percentage = pct as number;
      if (percentage > 0) {
        const score = getAssetRiskScore(name);
        weightedRiskSum += percentage * score;
        totalWeight += percentage;

        if (score < 30) {
          lowRiskPct += percentage;
        } else if (score >= 30 && score < 70) {
          modRiskPct += percentage;
        } else {
          highRiskPct += percentage;
        }
      }
    });

    // If portfolio is under-allocated, assume remaining is in Cash/Low Risk (score 10)
    if (totalWeight < 100) {
      const remaining = 100 - totalWeight;
      weightedRiskSum += remaining * 10;
      lowRiskPct += remaining;
    }

    const currentScore = Math.round(weightedRiskSum / 100);

    // Map calculated score to effective category
    let currentCategory: "bajo" | "moderado" | "alto" = "bajo";
    if (currentScore >= 35 && currentScore < 65) {
      currentCategory = "moderado";
    } else if (currentScore >= 65) {
      currentCategory = "alto";
    }

    const targetProfile = userProfile.riskProfile;
    let isDeviated = false;
    let deviationDirection: "under" | "over" | "none" = "none";
    let message = "";

    if (targetProfile === "conservador") {
      if (currentCategory !== "bajo") {
        isDeviated = true;
        deviationDirection = "over";
        message = "Tu cartera actual asume demasiado riesgo para tu perfil Conservador. Tienes una exposición elevada a activos variables (como acciones internacionales CEDEARs o Criptomonedas), exponiendo tu capital a la alta volatilidad cambiaria y del mercado financiero internacional.";
      }
    } else if (targetProfile === "moderado") {
      if (currentCategory === "bajo") {
        isDeviated = true;
        deviationDirection = "under";
        message = "Tu cartera actual es demasiado conservadora para tu perfil Moderado. Estás manteniendo casi todo tu capital en pesos de tasa fija o fondos de rescate inmediato, perdiendo poder adquisitivo real contra la inflación debido a la falta de cobertura real (CEDEARs o bonos corporativos).";
      } else if (currentCategory === "alto") {
        isDeviated = true;
        deviationDirection = "over";
        message = "Tu cartera excede el nivel de volatilidad recomendado para tu perfil Moderado. Estás demasiado concentrado en acciones de alta volatilidad (como Tesla, Nvidia) o Criptomonedas, sin una base sólida de renta fija en pesos o Cedears diversificados como el SPY.";
      }
    } else if (targetProfile === "agresivo") {
      if (currentCategory !== "alto") {
        isDeviated = true;
        deviationDirection = "under";
        message = "Tu cartera actual es demasiado conservadora para tu perfil de riesgo Agresivo. Mantienes alta proporción en depósitos a tasa fija o renta fija corporativa de bajo crecimiento, lo que limitará severamente tus retornos de capital ante subas del mercado global o de criptoactivos.";
      }
    }

    return {
      score: currentScore,
      category: currentCategory,
      isDeviated,
      deviationDirection,
      message,
      lowRiskPct,
      modRiskPct,
      highRiskPct
    };
  };

  const riskMetrics = getPortfolioRiskMetrics();

  const totalAllocatedPercentage = (Object.values(customAllocations) as number[]).reduce((sum, v) => sum + v, 0);

  // Generate chart data for Recharts
  const generateChartData = (): SimulationResult[] => {
    const chartData: SimulationResult[] = [];
    const monthlyInflationRate = currentInflation / 100; // Dynamic monthly inflation

    for (let month = 0; month <= simPeriod; month++) {
      let investedSum = userProfile.capital;
      let portfolioValue = userProfile.capital;
      
      // Accumulate monthly gains for each allocation
      if (month > 0) {
        portfolioValue = currentAllocationArray.reduce((total, alloc) => {
          const yieldRate = getAnnualYield(alloc.instrumentName);
          const monthlyRate = Math.pow(1 + yieldRate, 1 / 12) - 1;
          const currentVal = alloc.amount * Math.pow(1 + monthlyRate, month);
          return total + currentVal;
        }, 0);
      }

      // Calculate cash decay due to inflation (buying power loss)
      // Cash keeps nominal value but loses real purchasing power
      const purchasingPower = userProfile.capital / Math.pow(1 + monthlyInflationRate, month);
      const inflationLoss = userProfile.capital - purchasingPower;

      chartData.push({
        month,
        "Suma Invertida": Math.round(investedSum),
        "Retorno Proyectado": Math.round(portfolioValue),
        "Pérdida por Inflación (Efectivo)": Math.round(purchasingPower)
      });
    }
    return chartData;
  };

  const chartData = generateChartData();
  const finalPortfolioValue = chartData[chartData.length - 1]["Retorno Proyectado"];
  const netEarnings = finalPortfolioValue - userProfile.capital;
  const finalCashValue = chartData[chartData.length - 1]["Pérdida por Inflación (Efectivo)"];
  const purchasingPowerLost = userProfile.capital - finalCashValue;

  // Inflation calculations for the Localized Cost of Inflation tab
  const getInflationMetrics = () => {
    const monthlyRate = currentInflation / 100; // Dynamic monthly inflation
    const accumulatedInflation = Math.pow(1 + monthlyRate, calcMonths) - 1;
    const currentValue = calcPesos;
    const remainingPower = calcPesos / Math.pow(1 + monthlyRate, calcMonths);
    const moneyLost = currentValue - remainingPower;

    // Local examples in Argentina based on average prices in mid-2026
    // Café con medialunas: ~$3.500 ARS
    // Tanque de nafta súper (50L): ~$65.000 ARS
    // Asado completo para 4 personas (carne, carbón, pan, vino): ~$45.000 ARS
    const cafeCost = 3500;
    const naftaCost = 65000;
    const asadoCost = 45000;

    const initialCafes = Math.floor(calcPesos / cafeCost);
    const finalCafes = Math.floor(remainingPower / cafeCost);

    const initialNafta = Math.floor(calcPesos / naftaCost);
    const finalNafta = Math.floor(remainingPower / naftaCost);

    const initialAsados = Math.floor(calcPesos / asadoCost);
    const finalAsados = Math.floor(remainingPower / asadoCost);

    return {
      accumulatedPercent: (accumulatedInflation * 100).toFixed(1),
      remainingPower: Math.round(remainingPower),
      moneyLost: Math.round(moneyLost),
      cafes: { initial: initialCafes, final: finalCafes, diff: initialCafes - finalCafes },
      nafta: { initial: initialNafta, final: finalNafta, diff: initialNafta - finalNafta },
      asados: { initial: initialAsados, final: finalAsados, diff: initialAsados - finalAsados }
    };
  };

  const calcMetrics = getInflationMetrics();

  // Send message to Server-side Gemini AI
  const handleSendMessage = async (textToSend?: string) => {
    const promptText = textToSend || chatInput;
    if (!promptText.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: promptText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    if (!textToSend) setChatInput("");
    setChatLoading(true);
    setChatError(null);

    trackEvent("AI Chat Message Sent", { 
      messageLength: promptText.length,
      userRiskProfile: userProfile.riskProfile,
      userCapital: userProfile.capital,
      userCurrency: userProfile.currency
    });

    try {
      // Build discussion thread context
      const chatHistory = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatHistory.push({ role: "user", content: promptText });

      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: chatHistory,
          userProfile: {
            capital: userProfile.capital,
            currency: userProfile.currency,
            riskProfile: userProfile.riskProfile,
            goals: userProfile.goals
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al conectar con el asesor virtual.");
      }

      const data = await res.json();

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date()
      }]);

    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "No se pudo obtener respuesta del asesor financiero. Inténtalo de nuevo.");
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to apply quick questions
  const quickQuestions = [
    { label: "UVA vs Plazo Fijo", text: "¿Qué me conviene más en este momento: el Plazo Fijo Tradicional o el Plazo Fijo UVA indexado por inflación?" },
    { label: "Cómo comprar Dólar MEP", text: "¿Cuáles son los pasos legales para comprar Dólar MEP desde Argentina y qué parking tiene actualmente?" },
    { label: "Armar portafolio moderado", text: "Tengo un perfil Moderado. ¿Cómo puedo diversificar mis ahorros entre CEDEARs y obligaciones negociables?" },
    { label: "Riesgos de CEDEARs", text: "¿Qué riesgos reales tienen los CEDEARs si el dólar MEP/CCL baja en Argentina?" }
  ];

  // Helper for rendering dynamic icon based on rate object
  const getRateIcon = (iconName: string) => {
    switch (iconName) {
      case "Building": return <Building className="w-5 h-5 text-emerald-400" />;
      case "TrendingUp": return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case "Globe": return <Globe className="w-5 h-5 text-indigo-400" />;
      case "Coins": return <Coins className="w-5 h-5 text-amber-400" />;
      default: return <DollarSign className="w-5 h-5 text-zinc-400" />;
    }
  };

  // Switch to Chat tab and automatically ask about rebalancing the portfolio deviation
  const handleConsultAdvisorAboutDeviation = () => {
    trackEvent("Risk Deviation Consulting Clicked", {
      targetProfile: userProfile.riskProfile,
      realProfile: riskMetrics.category,
      score: riskMetrics.score
    });
    setActiveTab("advisor");
    const query = `Mi perfil de riesgo objetivo es **${userProfile.riskProfile.toUpperCase()}** pero mi portafolio actual calcula un nivel de riesgo **${riskMetrics.category.toUpperCase()}** (puntaje de ${riskMetrics.score}/100) debido a mi distribución de activos.

¿Podrías darme un análisis detallado de este desvío en el contexto económico argentino y cómo puedo rebalancear mis inversiones para alinearlas con mi perfil?`;
    
    // Add custom helper message to chat to guide the user
    handleSendMessage(query);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2.5 rounded-xl shadow-lg shadow-emerald-500/10">
              <LineChart className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h1 id="app-logo" translate="no" className="notranslate text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Invert-Play AR
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  PESOS & DÓLARES
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Simulador Educativo de Finanzas Argentina</p>
            </div>
          </div>

          {/* Quick macro indicators */}
          <div className="flex items-center gap-3 text-xs overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 justify-center">
            {loadingRates ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Cargando indicadores...</span>
              </div>
            ) : rates ? (
              <>
                <div className="bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-lg flex items-center gap-2 shrink-0">
                  <span className="text-zinc-400">Dólar MEP:</span>
                  <span className="text-white font-semibold font-mono">
                    ${rates.currencies.find(c => c.name.includes("MEP"))?.sell || 1295}
                  </span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg flex items-center gap-2 shrink-0 transition-all duration-300 border ${
                  currentInflation > 5
                    ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse shadow-sm shadow-red-500/10"
                    : "bg-zinc-800/60 border-zinc-700/50 text-zinc-100"
                }`}>
                  <span className={currentInflation > 5 ? "text-red-400 font-bold flex items-center gap-1" : "text-zinc-400"}>
                    {currentInflation > 5 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                    Inflación:
                  </span>
                  <span className={`font-semibold font-mono ${currentInflation > 5 ? "text-red-400 font-extrabold" : "text-amber-400"}`}>
                    {currentInflation.toFixed(1)}% mensual
                  </span>
                  {currentInflation > 5 && (
                    <span className="bg-red-500 text-zinc-950 font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-bounce">
                      Crítico
                    </span>
                  )}
                </div>
                <div className="bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-lg flex items-center gap-2 shrink-0">
                  <span className="text-white font-medium">Riesgo País:</span>
                  <span className="text-red-500 font-bold font-mono">
                    {rates.macroeconomics.riskCountry} pts
                  </span>
                </div>
                <button 
                  onClick={fetchRates} 
                  className="p-1 text-zinc-400 hover:text-white transition hover:bg-zinc-800 rounded-md"
                  title="Actualizar cotizaciones"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <span className="text-red-400">Error de conexión</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Interactive panel: Profile and Goals Configuration (occupies 4 cols on desktop) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* User Settings Module */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <User className="w-5 h-5 text-amber-400 animate-blink-gold" />
              <h2 className="text-lg font-extrabold text-amber-400 animate-blink-gold uppercase tracking-wider">
                Tu Perfil de Inversión
              </h2>
            </div>

            {/* Capital Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400 flex justify-between">
                <span>Capital Disponible para Invertir</span>
                <span className="text-emerald-400 font-semibold">Tasa Libre de Riesgo: 37%</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 font-semibold text-sm">
                  {userProfile.currency === "ARS" ? "$" : "USD"}
                </div>
                <input 
                  type="number" 
                  value={userProfile.capital} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setUserProfile(prev => ({ ...prev, capital: val }));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-12 pr-16 text-white font-mono font-medium focus:outline-none focus:border-emerald-500 text-lg transition"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex gap-1">
                  <button 
                    onClick={() => setUserProfile(prev => ({ ...prev, currency: "ARS" }))}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${userProfile.currency === "ARS" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                  >
                    ARS
                  </button>
                  <button 
                    onClick={() => setUserProfile(prev => ({ ...prev, currency: "USD" }))}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${userProfile.currency === "USD" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                  >
                    USD
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Sugerencia: Se calcula en base a este capital la asignación y retorno proyectado.
              </p>
            </div>

            {/* Risk Profile Selection Cards */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Nivel de Riesgo Tolerado</label>
              <div className="grid grid-cols-3 gap-2">
                {(["conservador", "moderado", "agresivo"] as RiskProfile[]).map((prof) => (
                  <button
                    key={prof}
                    onClick={() => setUserProfile(prev => ({ ...prev, riskProfile: prof }))}
                    className={`px-2 py-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center capitalize ${
                      userProfile.riskProfile === prof 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-inner" 
                        : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold">{prof}</span>
                    <span className="text-[9px] text-zinc-500 block">
                      {prof === "conservador" ? "Tasa fija / ARS" : prof === "moderado" ? "Acciones/ONs" : "Crypto/Tech"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goals Input Area */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-zinc-500" />
                  <span>¿Qué buscas con tu inversión?</span>
                </label>
              </div>
              <textarea
                value={userProfile.goals}
                onChange={(e) => setUserProfile(prev => ({ ...prev, goals: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 h-20 resize-none transition"
                placeholder="Ej. Comprar un lote de terreno en 12 meses, ganarle a la inflación o resguardarme en dólares..."
              />
              <p className="text-[10px] text-zinc-500">
                * El Asesor Inteligente (AI) leerá esta meta para formular recomendaciones específicas.
              </p>
            </div>
          </div>

          {/* Dynamic Portfolio Deviation Warning Card */}
          <AnimatePresence>
            {riskMetrics.isDeviated && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 shadow-xl flex flex-col gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="bg-amber-500/15 p-1.5 rounded-lg border border-amber-500/20 text-amber-400 shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                      Desvío de Riesgo Detectado
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Tu distribución no coincide con tus metas
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-800/80 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-[10px] font-medium">Perfil Objetivo:</span>
                    <span className="font-bold text-emerald-400 uppercase tracking-wide bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] border border-emerald-500/20">
                      {userProfile.riskProfile}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-[10px] font-medium">Riesgo Real Cartera:</span>
                    <span className="font-bold text-amber-400 uppercase tracking-wide bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] border border-amber-500/20">
                      {riskMetrics.category} ({riskMetrics.score} pts)
                    </span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-zinc-300">
                  {riskMetrics.message}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => resetAllocationsToDefault(userProfile.riskProfile)}
                    className="py-2 px-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-[10px] transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                    Ajustar Cartera
                  </button>
                  <button
                    onClick={handleConsultAdvisorAboutDeviation}
                    className="py-2 px-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-100 font-semibold rounded-xl text-[10px] border border-zinc-800 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Pedir Ayuda AI
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Inflation Simulator Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulador Macroeconómico</h3>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase transition-all duration-300 ${
                currentInflation > 5 
                  ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse" 
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {currentInflation > 5 ? "Riesgo Alto ⚠️" : "Riesgo Controlado ✅"}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Ajustá la inflación mensual proyectada en la Argentina para evaluar su impacto real en la simulación de rendimientos y carteras en tiempo real.
            </p>

            <div className="flex flex-col gap-2.5 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-400">Inflación Mensual:</span>
                <span className={`font-mono font-black text-sm ${currentInflation > 5 ? "text-red-400" : "text-amber-400"}`}>
                  {currentInflation.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.1"
                value={currentInflation}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomInflation(val);
                  trackEvent("Inflation Adjusted", { newRate: val });
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>1.0% (Bajo)</span>
                <span>5.0% (Crítico)</span>
                <span>15.0% (Hiper)</span>
              </div>
            </div>

            {customInflation !== null && (
              <button
                onClick={() => {
                  setCustomInflation(null);
                  trackEvent("Inflation Reset");
                }}
                className="w-full py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-[10px] border border-zinc-700/30 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Tasa Oficial ({rates?.macroeconomics.monthlyInflation ?? 4.1}%)
              </button>
            )}
          </div>

          {/* Quick Informational Notice on Argentine Context */}
          <div className="bg-gradient-to-br from-indigo-950/20 to-zinc-900 border border-indigo-900/30 rounded-2xl p-5 flex gap-4">
            <div className="text-indigo-400 shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-indigo-300">¿Por qué es clave invertir en Argentina?</h3>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Con una inflación de aproximadamente 4.1% al mes, guardar dinero en efectivo ("bajo el colchón") significa perder casi la mitad de tu poder adquisitivo en un año. Utilizar instrumentos de tasa fija, UVA o CEDEARs te permite resguardar tu esfuerzo.
              </p>
            </div>
          </div>

          {/* AdSense Sidebar Banner */}
          <AdSenseBanner slot="sidebar-vertical-ad" format="vertical" />

        </section>

        {/* Right Active View panel: Tabs & details (occupies 8 cols on desktop) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Custom Premium Tabs Navigation Bar */}
          <nav className="bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/80 flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("rates")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === "rates"
                  ? "bg-zinc-800 text-white shadow-md border-b border-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              Tasas del Día
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === "simulator"
                  ? "bg-zinc-800 text-white shadow-md border-b border-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              <LineChart className="w-4 h-4 text-blue-400" />
              Simulador Portafolio
            </button>
            <button
              onClick={() => setActiveTab("calculator")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === "calculator"
                  ? "bg-zinc-800 text-white shadow-md border-b border-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              Costo de Inflación
            </button>
            <button
              onClick={() => setActiveTab("advisor")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition ${
                activeTab === "advisor"
                  ? "bg-amber-500 text-zinc-950 font-black border border-amber-300 shadow-lg shadow-amber-500/20"
                  : "bg-amber-950/20 text-amber-400 border border-amber-900/30 hover:bg-amber-900/20 font-extrabold"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === "advisor" ? "text-zinc-950" : "text-amber-400"} animate-spin`} />
              <span className="animate-blink-gold-text uppercase tracking-widest text-[11px] font-black">Asesor IA</span>
            </button>
          </nav>

          {/* Tab Views Stage */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: Rates and Quotes list */}
              {activeTab === "rates" && (
                <motion.div
                  key="rates-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-6"
                >
                  {loadingRates ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-zinc-400">Obteniendo cotizaciones financieras actualizadas desde el mercado...</p>
                    </div>
                  ) : errorRates || !rates ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                      <p className="text-zinc-400 font-medium">{errorRates || "Error desconocido"}</p>
                      <button 
                        onClick={fetchRates} 
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition"
                      >
                        Reintentar conexión
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Real-time News Feed */}
                      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                        {/* Ambient glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-zinc-800/60 pb-3.5 relative z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-emerald-500/10 border border-emerald-500/25 p-1.5 rounded-lg text-emerald-400">
                              <Newspaper className="w-4.5 h-4.5 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                Noticias Financieras de Argentina
                                <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase animate-pulse">
                                  Live Grounding
                                </span>
                              </h3>
                              <p className="text-[10px] text-zinc-500">
                                Monitoreo en tiempo real del mercado local usando IA y Google Search
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => fetchNews(true)}
                            disabled={loadingNews}
                            className="text-xs text-zinc-400 hover:text-emerald-400 bg-zinc-950/50 hover:bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-center font-bold disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? "animate-spin text-emerald-400" : ""}`} />
                            {loadingNews ? "Actualizando..." : "Actualizar Noticias"}
                          </button>
                        </div>

                        {loadingNews ? (
                          <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                            <div className="relative">
                              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                              <div className="absolute inset-0 bg-emerald-400/10 blur-md rounded-full animate-pulse" />
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium">Buscando las noticias financieras de último momento con Google Search...</p>
                          </div>
                        ) : errorNews ? (
                          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl text-center flex flex-col items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                            <p className="text-xs text-zinc-400">{errorNews}</p>
                            <button
                              onClick={() => fetchNews(true)}
                              className="text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-white hover:bg-zinc-850 font-bold transition"
                            >
                              Intentar de nuevo
                            </button>
                          </div>
                        ) : news.length === 0 ? (
                          <p className="text-xs text-zinc-500 text-center py-4">No se encontraron noticias recientes en este momento.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            {news.map((item, idx) => (
                              <a
                                key={idx}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="group bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-850 hover:border-zinc-750 p-4 rounded-xl transition flex flex-col justify-between gap-3 relative overflow-hidden hover:shadow-lg hover:shadow-emerald-500/[0.01]"
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-emerald-400 font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full tracking-wider">
                                      {item.source}
                                    </span>
                                    <span className="text-zinc-500 font-medium font-mono">
                                      {item.date}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition line-clamp-2 leading-snug">
                                    {item.title}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">
                                    {item.summary}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-emerald-400/80 group-hover:text-emerald-400 font-black tracking-wide uppercase mt-1">
                                  <span>Leer nota completa</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Currencies Grid */}
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          Tipos de Cambio (Dólar en Argentina)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {rates.currencies.map((curr) => (
                            <div key={curr.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 hover:border-zinc-700 transition">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-zinc-400 font-medium">{curr.name}</span>
                                {getRateIcon(curr.icon)}
                              </div>
                              <div className="flex justify-between items-baseline mt-2">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-zinc-500 font-medium uppercase">Compra</span>
                                  <span className="text-md font-bold font-mono text-white">${curr.buy}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-zinc-500 font-medium uppercase">Venta</span>
                                  <span className="text-lg font-extrabold font-mono text-emerald-400">${curr.sell}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fixed Income Instruments Grid */}
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          Renta Fija y Plazos Fijos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rates.fixedIncome.map((fi) => (
                            <div key={fi.name} className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition">
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-xs font-bold text-white">{fi.name}</h4>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    fi.risk === "Bajo" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                  }`}>
                                    Riesgo {fi.risk}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">{fi.desc}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800/60 text-center">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-zinc-500 uppercase font-medium">Tasa (TNA)</span>
                                  <span className="text-xs font-bold font-mono text-white mt-0.5">{fi.rate}</span>
                                </div>
                                <div className="flex flex-col border-x border-zinc-800/60">
                                  <span className="text-[9px] text-zinc-500 uppercase font-medium">Equivalente TEA</span>
                                  <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{fi.yield}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-zinc-500 uppercase font-medium">Plazo Mín.</span>
                                  <span className="text-xs font-bold text-zinc-300 mt-0.5">{fi.delay}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CEDEARs and Stocks Lists */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        {/* CEDEARs column with search */}
                        <div className="md:col-span-7 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-indigo-400" />
                              CEDEARs (Acciones Internacionales en Pesos)
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-mono">Ratio conversión</span>
                          </div>

                          <div className="relative">
                            <Search className="absolute inset-y-0 left-0 pl-3 w-5 h-5 my-auto text-zinc-500 pointer-events-none" />
                            <input 
                              type="text" 
                              value={cedearSearch}
                              onChange={(e) => setCedearSearch(e.target.value)}
                              placeholder="Buscar por símbolo o empresa (ej: NVDA, Apple)..."
                              className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                            />
                          </div>

                          <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-zinc-800/40 border-b border-zinc-800 text-zinc-400 font-semibold">
                                  <th className="p-3">Símbolo</th>
                                  <th className="p-3">Nombre</th>
                                  <th className="p-3 text-right">Precio ARS</th>
                                  <th className="p-3 text-right">Variación</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800">
                                {rates.cedears
                                  .filter(c => c.symbol.toLowerCase().includes(cedearSearch.toLowerCase()) || c.name.toLowerCase().includes(cedearSearch.toLowerCase()))
                                  .map((cedear) => (
                                    <tr key={cedear.symbol} className="hover:bg-zinc-800/20 transition">
                                      <td className="p-3 font-bold text-white flex items-center gap-1.5">
                                        {cedear.symbol}
                                        <span className="text-[9px] font-medium text-zinc-500 font-mono">({cedear.ratio})</span>
                                      </td>
                                      <td className="p-3 text-zinc-400 truncate max-w-[140px]">{cedear.name}</td>
                                      <td className="p-3 text-right font-mono font-bold text-zinc-200">${cedear.priceARS.toLocaleString("es-AR")}</td>
                                      <td className={`p-3 text-right font-mono font-bold ${cedear.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {cedear.change >= 0 ? "+" : ""}{cedear.change}%
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Local Stocks and Crypto columns */}
                        <div className="md:col-span-5 flex flex-col gap-4">
                          
                          {/* Crypto */}
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                              <Coins className="w-4 h-4 text-amber-400" />
                              Criptomonedas de Resguardo
                            </h3>
                            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-1 divide-y divide-zinc-800/60">
                              {rates.crypto.map((coin) => (
                                <div key={coin.symbol} className="p-3 flex justify-between items-center hover:bg-zinc-800/25 rounded-lg transition">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-white text-xs">{coin.symbol}</span>
                                    <span className="text-[10px] text-zinc-500">{coin.name}</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="font-mono font-bold text-zinc-200 text-xs">
                                      {coin.priceUSD > 10 ? `USD ${coin.priceUSD.toLocaleString("en-US")}` : `$${coin.priceARS.toLocaleString("es-AR")}`}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${coin.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                      {coin.change >= 0 ? "+" : ""}{coin.change}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Local Merval Stocks */}
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              Acciones Merval (Líderes Locales)
                            </h3>
                            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-1 divide-y divide-zinc-800/60">
                              {rates.localStocks.map((stock) => (
                                <div key={stock.symbol} className="p-3 flex justify-between items-center hover:bg-zinc-800/25 rounded-lg transition">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-white text-xs">{stock.symbol}</span>
                                    <span className="text-[10px] text-zinc-500">{stock.name}</span>
                                  </div>
                                  <div className="flex flex-col items-end font-mono">
                                    <span className="font-bold text-zinc-200 text-xs">${stock.priceARS.toLocaleString("es-AR")}</span>
                                    <span className={`text-[10px] font-bold ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                      {stock.change >= 0 ? "+" : ""}{stock.change}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* TAB 2: Investment Returns Simulator */}
              {activeTab === "simulator" && (
                <motion.div
                  key="simulator-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-6"
                >
                  {/* Setup parameters & allocation slider section */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-800 pb-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">Simulador de Estrategias y Portafolios</h3>
                        <p className="text-xs text-zinc-400">Distribuye tu capital y proyecta el crecimiento real versus la inflación.</p>
                      </div>
                      
                      {/* Period Switcher */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-400">Plazo:</span>
                        <div className="inline-flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                          {[3, 6, 12, 24].map((mo) => (
                            <button
                              key={mo}
                              onClick={() => setSimPeriod(mo)}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition ${simPeriod === mo ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                              {mo} meses
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Allocation Breakdown and Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Instrument allocations list */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Activos en tu Cartera</h4>
                          <button
                            onClick={() => {
                              if (isCustomizingAllocation) {
                                resetAllocationsToDefault(userProfile.riskProfile);
                              } else {
                                setIsCustomizingAllocation(true);
                              }
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            {isCustomizingAllocation ? "Volver a sugerido" : "Personalizar porcentajes"}
                          </button>
                        </div>

                        <div className="flex flex-col gap-3.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                          {currentAllocationArray.map((alloc) => (
                            <div key={alloc.instrumentName} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-white font-semibold">{alloc.instrumentName}</span>
                                <span className="text-zinc-400 font-mono font-bold">
                                  {alloc.percentage}% ({userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(alloc.amount).toLocaleString("es-AR")})
                                </span>
                              </div>
                              
                              {/* Range Input if customizing */}
                              {isCustomizingAllocation ? (
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={alloc.percentage}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setCustomAllocations(prev => {
                                      const updated = { ...prev, [alloc.instrumentName]: val };
                                      return updated;
                                    });
                                  }}
                                  className="w-full accent-emerald-500 h-1.5 bg-zinc-850 rounded-lg cursor-pointer"
                                />
                              ) : (
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full" 
                                    style={{ width: `${alloc.percentage}%` }}
                                  />
                                </div>
                              )}
                              
                              <div className="flex justify-between text-[10px] text-zinc-500">
                                <span>Retorno estimado: {(getAnnualYield(alloc.instrumentName)*100).toFixed(1)}% TNA</span>
                                <span className="text-emerald-400 font-mono">
                                  Ganancia: +{userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(alloc.projectedReturn).toLocaleString("es-AR")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Allocations sum indicator */}
                        {isCustomizingAllocation && (
                          <div className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                            totalAllocatedPercentage === 100 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }`}>
                            {totalAllocatedPercentage === 100 
                              ? "✓ Total distribuido correctamente al 100%." 
                              : `⚠️ Total distribuido: ${totalAllocatedPercentage}% / Debe sumar exactamente 100%.`}
                          </div>
                        )}

                        {/* Visual Portfolio Risk Breakdown (Low, Med, High Risk Stacked Bar) */}
                        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex flex-col gap-3 mt-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                              Composición de Riesgo Real
                            </span>
                            <span className="text-zinc-400 font-mono text-[10px]">
                              Score de Riesgo: <strong className={riskMetrics.isDeviated ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>{riskMetrics.score} / 100</strong>
                            </span>
                          </div>

                          {/* Stacked risk bar */}
                          <div className="relative">
                            <div className="flex h-3 w-full rounded-full overflow-hidden bg-zinc-900 border border-zinc-800/80">
                              {riskMetrics.lowRiskPct > 0 && (
                                <div 
                                  style={{ width: `${riskMetrics.lowRiskPct}%` }} 
                                  className="h-full bg-emerald-500 transition-all duration-300 relative group"
                                  title={`Bajo Riesgo: ${riskMetrics.lowRiskPct}%`}
                                />
                              )}
                              {riskMetrics.modRiskPct > 0 && (
                                <div 
                                  style={{ width: `${riskMetrics.modRiskPct}%` }} 
                                  className="h-full bg-indigo-500 transition-all duration-300 relative group"
                                  title={`Riesgo Moderado: ${riskMetrics.modRiskPct}%`}
                                />
                              )}
                              {riskMetrics.highRiskPct > 0 && (
                                <div 
                                  style={{ width: `${riskMetrics.highRiskPct}%` }} 
                                  className="h-full bg-rose-500 transition-all duration-300 relative group"
                                  title={`Alto Riesgo: ${riskMetrics.highRiskPct}%`}
                                />
                              )}
                            </div>
                          </div>

                          {/* Legend / Info */}
                          <div className="grid grid-cols-3 gap-1 text-[10px] pt-1 border-t border-zinc-900">
                            <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <div className="flex flex-col">
                                <span>Bajo ({riskMetrics.lowRiskPct}%)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 font-medium border-x border-zinc-900/60 px-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              <div className="flex flex-col">
                                <span>Moderado ({riskMetrics.modRiskPct}%)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <div className="flex flex-col">
                                <span>Alto ({riskMetrics.highRiskPct}%)</span>
                              </div>
                            </div>
                          </div>

                          {/* Status verification message */}
                          <div className={`mt-1.5 p-2 rounded-lg text-[11px] leading-relaxed flex items-center gap-2 border ${
                            riskMetrics.isDeviated 
                              ? "bg-amber-500/5 border-amber-500/20 text-amber-300" 
                              : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                          }`}>
                            <div className="shrink-0">
                              {riskMetrics.isDeviated ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <span>
                              {riskMetrics.isDeviated ? (
                                <>
                                  El riesgo real de tu cartera ({riskMetrics.category}) no se alinea con tu objetivo de perfil <strong>{userProfile.riskProfile.toUpperCase()}</strong>.
                                </>
                              ) : (
                                <>
                                  Tu cartera está óptimamente alineada con tu perfil de riesgo <strong>{userProfile.riskProfile.toUpperCase()}</strong>. ¡Excelente distribución!
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Summary Metrics of Simulation */}
                      <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 flex flex-col justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Crecimiento estimado</span>
                          <span className="text-3xl font-black font-mono text-white tracking-tight">
                            {userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(finalPortfolioValue).toLocaleString("es-AR")}
                          </span>
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <TrendingUp className="w-4 h-4" />
                            Ganancia neta proyectada de +{userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(netEarnings).toLocaleString("es-AR")}
                          </span>
                        </div>

                        {/* Inflation loss comparison block */}
                        <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex flex-col gap-1.5">
                          <span className="text-[11px] text-zinc-400 uppercase font-medium">Si mantienes efectivo bajo el colchón</span>
                          <div className="flex justify-between items-baseline">
                            <span className="font-mono text-sm text-red-400 font-bold">
                              Poder de compra final: {userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(finalCashValue).toLocaleString("es-AR")}
                            </span>
                            <span className="text-[10px] text-zinc-500">Pérdida por Inflación</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Perderías aproximadamente <strong>-{userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(purchasingPowerLost).toLocaleString("es-AR")}</strong> de poder adquisitivo real en {simPeriod} meses debido a la desvalorización.
                          </p>
                        </div>

                        {/* Action buttons */}
                        <button
                          onClick={() => {
                            setActiveTab("advisor");
                          }}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-amber-400 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-amber-500/30 shadow-md shadow-amber-500/5"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                          <span className="animate-blink-gold-text font-black uppercase tracking-wider">Consultar portafolio al Asesor IA</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Recharts Chart Area */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Trayectoria Proyectada del Capital</h4>
                      <p className="text-[11px] text-zinc-400">Comparativa del valor real entre tu Portafolio Diversificado vs Efectivo (Ajustado por Inflación).</p>
                    </div>

                    <div className="h-72 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorEfectivo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#71717a" 
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(v) => `Mes ${v}`}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#f4f4f5' }}
                            formatter={(value: any) => [`$${value.toLocaleString("es-AR")}`, '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Area 
                            name="Portafolio Diversificado" 
                            type="monotone" 
                            dataKey="Retorno Proyectado" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorPortfolio)" 
                          />
                          <Area 
                            name="Efectivo en mano (Poder de Compra)" 
                            type="monotone" 
                            dataKey="Pérdida por Inflación (Efectivo)" 
                            stroke="#f87171" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorEfectivo)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: Purchasing Power Loss Calculator */}
              {activeTab === "calculator" && (
                <motion.div
                  key="calculator-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-6">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-amber-400" />
                        Calculadora del Costo de No Invertir ("Bajo el Colchón")
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Introduce un capital guardado en pesos y visualiza con ejemplos cotidianos cuánta riqueza real destruye la inflación mensual.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: inputs */}
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-zinc-400 flex justify-between">
                            <span>Suma en Pesos Inactiva</span>
                            <span className="text-amber-400 font-mono">${calcPesos.toLocaleString("es-AR")} ARS</span>
                          </label>
                          <input 
                            type="range"
                            min="50000"
                            max="5000000"
                            step="50000"
                            value={calcPesos}
                            onChange={(e) => setCalcPesos(parseInt(e.target.value) || 50000)}
                            className="w-full accent-amber-500 h-2 bg-zinc-950 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                            <span>$50.000</span>
                            <span>$2.500.000</span>
                            <span>$5.000.000</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-zinc-400 flex justify-between">
                            <span>Tiempo Transcurrido Sin Invertir</span>
                            <span className="text-amber-400 font-mono">{calcMonths} meses</span>
                          </label>
                          <input 
                            type="range"
                            min="1"
                            max="24"
                            step="1"
                            value={calcMonths}
                            onChange={(e) => setCalcMonths(parseInt(e.target.value) || 1)}
                            className="w-full accent-amber-500 h-2 bg-zinc-950 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                            <span>1 mes</span>
                            <span>12 meses (1 año)</span>
                            <span>24 meses (2 años)</span>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl flex flex-col gap-2 text-center">
                          <span className="text-xs text-zinc-500 uppercase font-medium">Devaluación Acumulada Proyectada</span>
                          <span className="text-4xl font-extrabold text-amber-500 font-mono">
                            {calcMetrics.accumulatedPercent}%
                          </span>
                          <p className="text-[10px] text-zinc-400 leading-relaxed px-2">
                            La inflación acumulada en {calcMonths} meses requerirá un {calcMetrics.accumulatedPercent}% más de dinero para adquirir los mismos bienes.
                          </p>
                        </div>
                      </div>

                      {/* Right: localized results with metrics */}
                      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pérdida en la Economía Real</h4>
                        
                        <div className="flex flex-col gap-1 border-b border-zinc-800 pb-3">
                          <span className="text-[11px] text-zinc-500 font-medium">Poder de compra remanente:</span>
                          <span className="text-2xl font-black font-mono text-zinc-200">
                            ${calcMetrics.remainingPower.toLocaleString("es-AR")} ARS
                          </span>
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 mt-0.5">
                            <TrendingDown className="w-4 h-4" />
                            Perdiste el equivalente a ${calcMetrics.moneyLost.toLocaleString("es-AR")} ARS
                          </span>
                        </div>

                        {/* Localized comparison examples */}
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-zinc-400">¿Qué significa esta desvalorización de dinero real?</p>
                          
                          {/* Cafes */}
                          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="text-amber-500 text-lg shrink-0">☕</div>
                              <div className="flex flex-col">
                                <span className="text-xs text-white font-semibold">Cafés con Medialunas</span>
                                <span className="text-[10px] text-zinc-500">Estimado en $3.500 c/u</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-zinc-400 line-through font-mono">Antes: {calcMetrics.cafes.initial}</span>
                              <span className="text-xs font-bold text-red-400 font-mono">Ahora: {calcMetrics.cafes.final}</span>
                              <span className="text-[9px] text-red-500 font-medium font-mono">-{calcMetrics.cafes.diff} cafés</span>
                            </div>
                          </div>

                          {/* Tanques de Nafta */}
                          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="text-amber-500 text-lg shrink-0">🚗</div>
                              <div className="flex flex-col">
                                <span className="text-xs text-white font-semibold">Tanques de Combustible Súper</span>
                                <span className="text-[10px] text-zinc-500">Tanque 50L ($65.000 c/u)</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-zinc-400 line-through font-mono">Antes: {calcMetrics.nafta.initial}</span>
                              <span className="text-xs font-bold text-red-400 font-mono">Ahora: {calcMetrics.nafta.final}</span>
                              <span className="text-[9px] text-red-500 font-medium font-mono">-{calcMetrics.nafta.diff} tanques</span>
                            </div>
                          </div>

                          {/* Asados */}
                          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="text-amber-500 text-lg shrink-0">🥩</div>
                              <div className="flex flex-col">
                                <span className="text-xs text-white font-semibold">Asado para 4 Personas</span>
                                <span className="text-[10px] text-zinc-500">Carne y acompañamientos ($45.000 c/u)</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-zinc-400 line-through font-mono">Antes: {calcMetrics.asados.initial}</span>
                              <span className="text-xs font-bold text-red-400 font-mono">Ahora: {calcMetrics.asados.final}</span>
                              <span className="text-[9px] text-red-500 font-medium font-mono">-{calcMetrics.asados.diff} asados</span>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: Smart Investment Advisor AI Chat */}
              {activeTab === "advisor" && (
                <motion.div
                  key="advisor-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-4"
                >
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
                    
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-amber-500/15 p-2 rounded-xl border border-amber-500/20">
                          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black animate-blink-gold-text">Asesor IA Invert-Play</h3>
                          <p className="text-[11px] text-zinc-400">Contextualizado con tus metas, capital y cotizaciones actuales.</p>
                        </div>
                      </div>
                      
                      {/* Profile context summary badge */}
                      <div className="hidden sm:flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px]">
                        <span className="text-zinc-500">Cartera:</span>
                        <span className="text-zinc-300 font-mono">${userProfile.capital.toLocaleString("es-AR")}</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-500">Riesgo:</span>
                        <span className="text-emerald-400 font-semibold uppercase">{userProfile.riskProfile}</span>
                      </div>
                    </div>

                    {/* Chat Messages Container */}
                    <div className="bg-zinc-950 border border-zinc-850/60 rounded-xl p-4 h-[380px] overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-zinc-800">
                      {chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                        >
                          {/* Avatar icon */}
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs border ${
                            msg.role === "user" 
                              ? "bg-zinc-800 border-zinc-700 text-zinc-300" 
                              : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          }`}>
                            {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                          </div>

                          {/* Message Body */}
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.role === "user" 
                              ? "bg-zinc-800 text-zinc-100 rounded-tr-none" 
                              : "bg-zinc-900 border border-zinc-800/80 text-zinc-300 rounded-tl-none whitespace-pre-wrap"
                          }`}>
                            {/* Render basic custom bold markdown formatting */}
                            {msg.content.split("\n").map((line, idx) => {
                              // Replace bold markdown manually
                              const formattedParts: React.ReactNode[] = [];
                              let lastIdx = 0;
                              const boldRegex = /\*\*(.*?)\*\*/g;
                              let match;
                              
                              while ((match = boldRegex.exec(line)) !== null) {
                                if (match.index > lastIdx) {
                                  formattedParts.push(line.substring(lastIdx, match.index));
                                }
                                formattedParts.push(
                                  <strong key={match.index} className="text-white font-semibold">
                                    {match[1]}
                                  </strong>
                                );
                                lastIdx = boldRegex.lastIndex;
                              }
                              
                              if (lastIdx < line.length) {
                                formattedParts.push(line.substring(lastIdx));
                              }

                              return (
                                <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                                  {formattedParts.length > 0 ? formattedParts : line}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Loading/Typing Indicator */}
                      {chatLoading && (
                        <div className="flex gap-3 max-w-[80%] self-start items-center">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <Sparkles className="w-4 h-4 animate-spin" />
                          </div>
                          <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-zinc-500 flex items-center gap-1.5">
                            <span>Analizando portafolio e indicadores...</span>
                            <span className="flex gap-1">
                              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
                              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </span>
                          </div>
                        </div>
                      )}

                      {chatError && (
                        <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-3 rounded-xl text-xs text-center flex items-center justify-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{chatError}</span>
                        </div>
                      )}
                    </div>

                    {/* Predefined prompt pills */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Preguntas Rápidas de Consulta:</span>
                      <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((q) => (
                          <button
                            key={q.label}
                            onClick={() => handleSendMessage(q.text)}
                            disabled={chatLoading}
                            className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg text-[11px] text-zinc-300 font-semibold transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <span>{q.label}</span>
                            <ChevronRight className="w-3 h-3 text-zinc-500" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat input box */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={chatLoading}
                        placeholder="Escribe tu consulta financiera (ej: ¿Cuáles son las ventajas de las ONs?)..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition disabled:opacity-50"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={chatLoading || !chatInput.trim()}
                        className="bg-emerald-500 text-zinc-950 px-5 rounded-xl text-xs font-bold hover:bg-emerald-400 transition flex items-center gap-1.5 disabled:opacity-40"
                      >
                        Enviar
                        <ArrowUpRight className="w-4 h-4 text-zinc-950" />
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </section>

        {/* Google AdSense Banner Slot */}
        <section className="lg:col-span-12 mt-4">
          <AdSenseBanner slot="banner-home-bottom" format="horizontal" />
        </section>

        {/* Guestbook & Visitor Counter (Full Width Section) */}
        <section id="visitas-seccion" className="lg:col-span-12 border-t border-zinc-800/80 pt-8 mt-4 flex flex-col md:flex-row gap-6">
          
          {/* Guestbook Card as simple "Blog" */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div 
              onClick={() => setIsBlogExpanded(!isBlogExpanded)}
              className="flex justify-between items-center pb-2 border-b border-zinc-800 cursor-pointer hover:opacity-90 select-none"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Blog
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {guestbookEntries.length} comentarios
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-medium">
                  {isBlogExpanded ? "Ocultar contenido" : "Expandir contenido"}
                </span>
                {isBlogExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isBlogExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-4"
                >
                  {/* Post Comments Form */}
                  <form onSubmit={handleAddGuestbookEntry} className="flex flex-col gap-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-zinc-400 font-semibold uppercase">Tu Nombre / Alias</label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Ej. InversorMerval"
                          className="bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-zinc-400 font-semibold uppercase">Tu Perfil de Riesgo</label>
                        <select
                          value={guestProfile}
                          onChange={(e) => setGuestProfile(e.target.value as RiskProfile)}
                          className="bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none transition"
                        >
                          <option value="conservador">Conservador 🛡️</option>
                          <option value="moderado">Moderado ⚖️</option>
                          <option value="agresivo">Agresivo 🔥</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Mensaje / Comentario</label>
                      <textarea
                        required
                        rows={2}
                        value={guestComment}
                        onChange={(e) => setGuestComment(e.target.value)}
                        placeholder="Escribe un mensaje de apoyo, consulta o comentario sobre tus finanzas..."
                        className="bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white focus:outline-none transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-2 px-4 rounded-xl text-xs font-bold transition active:scale-[0.98]"
                    >
                      Publicar Comentario 🚀
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {guestbookEntries.map((entry) => (
                      <div key={entry.id} className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-xl flex flex-col gap-1.5 hover:border-zinc-800 transition">
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white">{entry.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              entry.profile === "conservador" ? "bg-emerald-500/10 text-emerald-400" :
                              entry.profile === "moderado" ? "bg-indigo-500/10 text-indigo-400" :
                              "bg-rose-500/10 text-rose-400"
                            }`}>
                              {entry.profile}
                            </span>
                          </div>
                          <span className="text-zinc-500 font-mono">{entry.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed italic">
                          "{entry.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Visitor Counter & Support Server Card */}
          <div className="w-full md:w-[320px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 justify-between">
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-zinc-800 flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Estadísticas</h3>
              </div>

              {/* Visitor Counter */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center relative overflow-hidden">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                  Contador de Visitas
                </span>
                
                {/* Blinking counter as requested: "Contador de visitas - titilante" */}
                <div className="flex items-baseline gap-1 animate-blink-fast text-red-500 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                  <span className="text-3xl font-black tracking-widest">{visitorCount.toLocaleString()}</span>
                  <span className="text-xs font-bold uppercase">Online</span>
                </div>

                <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>Servidor en línea y activo</span>
                </div>
              </div>
            </div>

            {/* Support server with steaming coffee image: "Apoyo servidor a través de imagen de pocillo de café humeante https://mpago.la/2m7bcUT" */}
            <div className="bg-gradient-to-br from-amber-950/15 to-zinc-950/40 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/25 shrink-0 flex items-center justify-center">
                  <img 
                    src="https://img.icons8.com/emoji/48/hot-beverage.png" 
                    className="w-8 h-8 animate-bounce" 
                    alt="Pocillo de café humeante"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Apoyo al Servidor</h4>
                  <p className="text-[10px] text-zinc-400">¿Te sirve el simulador? Invítanos un café para mantener el hosting</p>
                </div>
              </div>

              <a
                href="https://mpago.la/2m7bcUT"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 active:scale-[0.98]"
              >
                <span>¡Apoyar con un Cafecito! ☕</span>
              </a>
            </div>

          </div>

          {/* AdSense Configuration Card */}
          <div className="w-full md:w-[320px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="pb-2 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monetización</h3>
              </div>
              <span className="text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold uppercase">
                AdSense
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Ingresá tu ID de editor de Google AdSense para activar los banners publicitarios dinámicamente en el simulador.
            </p>

            <form onSubmit={handleSaveAdSenseId} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  ID de Editor (Publisher ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adsenseId}
                    onChange={(e) => setAdsenseId(e.target.value)}
                    placeholder="Ej: ca-pub-1234567890123456"
                    className={`w-full bg-zinc-950 border focus:outline-none transition font-mono placeholder:text-zinc-600 rounded-xl pl-3 pr-8 py-2 text-xs text-white ${
                      isAdsenseIdInvalid
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-zinc-800 focus:border-orange-500/60"
                    }`}
                  />
                  {adsenseId && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdsenseId("");
                        localStorage.removeItem("adsense_publisher_id");
                        window.dispatchEvent(new Event("adsense-client-id-changed"));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs px-1 font-bold"
                      title="Limpiar ID"
                    >
                      ×
                    </button>
                  )}
                </div>
                {adsenseId.trim().startsWith("pub-") && (
                  <p className="text-[10px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                    ✨ ID con "pub-" detectado. Lo convertiremos automáticamente a "ca-pub-" al guardar.
                  </p>
                )}
                {adsenseId.trim().startsWith("pub") && !adsenseId.trim().startsWith("pub-") && /^\d+$/.test(adsenseId.trim().slice(3)) && (
                  <p className="text-[10px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                    ✨ ID con "pub" detectado. Lo convertiremos automáticamente a "ca-pub-" al guardar.
                  </p>
                )}
                {/^\d+$/.test(adsenseId.trim()) && adsenseId.trim().length > 0 && (
                  <p className="text-[10px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                    ✨ ID numérico detectado. Se formateará automáticamente como "ca-pub-" al guardar.
                  </p>
                )}
                {isAdsenseIdInvalid && (
                  <p className="text-[10px] text-red-400 font-bold mt-1 flex items-center gap-1 animate-pulse">
                    ⚠️ El ID de AdSense debe comenzar con "ca-pub-", "pub-" o ser solo números (ej: pub-1234567890123456)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isAdsenseIdInvalid || !adsenseId.trim()}
                className="w-full bg-orange-500 hover:bg-orange-400 text-zinc-950 disabled:bg-zinc-800/80 disabled:text-zinc-500 disabled:cursor-not-allowed font-extrabold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-[0.98]"
              >
                <span>Aplicar y Activar Ads 🚀</span>
              </button>
            </form>

            {adsenseSaved && (
              <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>¡ID guardado y activado con éxito!</span>
              </div>
            )}

            {/* Persistent status info block */}
            <div className="text-[10px] text-zinc-500 leading-normal bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Estado actual:</span>
                {localStorage.getItem("adsense_publisher_id") ? (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVO
                  </span>
                ) : (
                  <span className="text-amber-400 font-extrabold flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    MODO DEMO
                  </span>
                )}
              </div>
              {localStorage.getItem("adsense_publisher_id") && (
                <div className="text-[9px] font-mono text-zinc-400 break-all bg-zinc-950/60 p-1.5 rounded border border-zinc-900 flex justify-between items-center">
                  <span>{localStorage.getItem("adsense_publisher_id")}</span>
                  <span className="text-[8px] text-emerald-500 font-extrabold uppercase">Activo</span>
                </div>
              )}
            </div>

            <div className="text-[9px] text-zinc-500 leading-normal bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850">
              <span className="text-zinc-400 font-bold">Nota:</span> Podés ingresar tu ID comenzando con <code className="text-amber-400 font-mono">pub-</code> o simplemente el número. El simulador lo convertirá automáticamente a <code className="text-emerald-400 font-mono">ca-pub-</code> para que Google AdSense funcione correctamente.
            </div>
          </div>

          {/* Mixpanel Configuration Card */}
          <div className="w-full md:w-[320px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="pb-2 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analíticas</h3>
              </div>
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full font-semibold uppercase">
                Opcional
              </span>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl flex flex-col gap-1 text-[11px] text-emerald-400 leading-normal">
              <span className="font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                ¡MODO LOCAL ACTIVO!
              </span>
              <span>
                No te preocupes. El simulador ya funciona al 100% en modo local. No necesitás registrarte ni configurar nada para continuar usándolo.
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Opcionalmente, si querés medir tu propia audiencia, podés ingresar un Token de Mixpanel. Si no lo necesitás, ignorá esta tarjeta completamente.
            </p>

            <form onSubmit={handleSaveMixpanelToken} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Token de Proyecto (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={mixpanelToken}
                    onChange={(e) => setMixpanelToken(e.target.value)}
                    placeholder="Ej: f4a8c..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500/60 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none transition font-mono placeholder:text-zinc-600"
                  />
                  {mixpanelToken && (
                    <button
                      type="button"
                      onClick={() => {
                        setMixpanelToken("");
                        localStorage.removeItem("mixpanel_project_token");
                        window.dispatchEvent(new Event("mixpanel-token-changed"));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs px-1 font-bold"
                      title="Limpiar Token"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>Habilitar Analíticas (Opcional) 📊</span>
              </button>
            </form>

            {mixpanelSaved && (
              <div className="text-[10px] text-purple-300 font-semibold bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                <span>¡Configuración opcional guardada!</span>
              </div>
            )}

            <div className="text-[9px] text-zinc-500 leading-normal bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850 flex flex-col gap-1">
              <div>
                <span className="text-zinc-400 font-bold">Estado actual:</span>{" "}
                {mixpanelToken ? (
                  <span className="text-emerald-400 font-bold">● Conectado (Producción)</span>
                ) : (
                  <span className="text-amber-400 font-bold">● Modo Simulado / Consola</span>
                )}
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950/80 px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">Invert-Play AR</span>
            <span>•</span>
            <span className="font-bold animate-blink-orange">Simulador Educativo de Finanzas Argentina</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <span>Diseño optimizado para Argentina. Las simulaciones no constituyen una recomendación directa de compra.</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification for High Inflation */}
      <AnimatePresence>
        {showInflationToast && !dismissedInflationToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-950 border-2 border-red-500/50 rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="bg-red-500/15 p-2 rounded-xl border border-red-500/20 text-red-400 shrink-0 mt-0.5 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-red-400 uppercase tracking-wider">
                    ¡Alerta de Alta Inflación!
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed mt-1">
                  La tasa mensual de <strong className="text-white font-bold font-mono">{currentInflation.toFixed(1)}%</strong> supera el límite crítico de <strong className="text-white font-bold">5.0%</strong>. El dinero inactivo pierde poder de compra drásticamente.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 flex flex-col gap-1 text-[10px] text-zinc-400">
              <span className="font-extrabold text-red-400 uppercase tracking-wide">💡 Recomendación de cobertura:</span>
              <span>Priorizá instrumentos protegidos contra inflación (ej. UVA), CEDEARs dolarizados, ONs corporativas o criptomonedas.</span>
            </div>

            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => {
                  setDismissedInflationToast(true);
                  trackEvent("Inflation Toast Dismissed", { rate: currentInflation });
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold rounded-lg text-[10px] border border-zinc-800 transition"
              >
                Ignorar
              </button>
              <button
                onClick={() => {
                  setActiveTab("simulator");
                  setDismissedInflationToast(true);
                  trackEvent("Inflation Toast Recommendation Clicked");
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] transition shadow-md shadow-red-500/20"
              >
                Ver Coberturas 📈
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
