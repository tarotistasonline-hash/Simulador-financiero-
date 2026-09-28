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
  CreditCard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Bell,
  Trash2,
  Volume2,
  VolumeX,
  Activity,
  PieChart as PieChartIcon,
  Crown,
  EyeOff,
  Eye,
  Users,
  RotateCcw,
  Smartphone,
  Laptop,
  Bot
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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
import { trackEvent } from "./lib/analytics";
import { 
  fetchDirectMarketRates, 
  BASE_FINANCIAL_RATES, 
  FALLBACK_NEWS, 
  generateClientFallbackAdvice 
} from "./lib/clientMarketData";

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  date: string;
}

const ASSET_COLORS: { [key: string]: string } = {
  "Plazo Fijo Tradicional": "#3b82f6",
  "Plazo Fijo UVA": "#06b6d4",
  "FCI Money Market (Mercado Pago / Ualá)": "#10b981",
  "Obligaciones Negociables (ONs)": "#f59e0b",
  "SPY": "#8b5cf6",
  "AAPL": "#6366f1",
  "TSLA": "#ec4899",
  "MELI": "#eab308",
  "MSFT": "#0284c7",
  "NVDA": "#22c55e",
  "GGAL": "#a855f7",
  "YPFD": "#f97316",
  "BTC": "#f7931a",
  "ETH": "#627eea",
};

const FALLBACK_PIE_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", 
  "#06b6d4", "#f97316", "#a855f7", "#eab308", "#14b8a6"
];

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

  const [localCapital, setLocalCapital] = useState<string>("1000000");

  const [activeTab, setActiveTab] = useState<"rates" | "simulator" | "calculator" | "advisor">("rates");
  
  // Tab-specific states
  const [cedearSearch, setCedearSearch] = useState<string>("");
  const [simPeriod, setSimPeriod] = useState<number>(12); // months
  const [customAllocations, setCustomAllocations] = useState<{ [key: string]: number }>({});
  const [isCustomizingAllocation, setIsCustomizingAllocation] = useState<boolean>(false);
  const [compareMarketAverage, setCompareMarketAverage] = useState<boolean>(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  // Calculator states (Inflation Cost)
  const [calcCurrency, setCalcCurrency] = useState<"ARS" | "USD">("ARS");
  const [calcPesos, setCalcPesos] = useState<number>(500000);
  const [calcDollars, setCalcDollars] = useState<number>(1000);
  const [calcMonths, setCalcMonths] = useState<number>(6);

  // Real Gain (Ganancia Real) Calculator States
  const [realGainCapital, setRealGainCapital] = useState<number>(1000000);
  const [realGainFundType, setRealGainFundType] = useState<string>("money_market");
  const [realGainCustomTna, setRealGainCustomTna] = useState<number>(45);
  const [realGainMonths, setRealGainMonths] = useState<number>(6);

  // Real Visitor states (No fake seeds; supports excluding owner visits)
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [uniqueUsers, setUniqueUsers] = useState<number>(0);
  const [activeNow, setActiveNow] = useState<number>(0);
  const [todayVisits, setTodayVisits] = useState<number>(0);
  const [recentVisits, setRecentVisits] = useState<Array<{ timestamp: string; deviceType: string; tab?: string }>>([]);
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("invertplay_owner_mode");
      if (saved !== null) return saved === "true";
      return typeof window !== "undefined" && (
        window.location.hostname.includes("ais-dev") ||
        window.location.hostname.includes("localhost") ||
        window.location.hostname === "127.0.0.1" ||
        window.self !== window.top
      );
    } catch {
      return true;
    }
  });
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

  // --- PRICE ALERTS & NOTIFICATIONS SYSTEM STATES ---
  interface PriceAlert {
    id: string;
    symbol: string;
    targetPrice: number;
    condition: "above" | "below";
    createdAt: string;
    triggered: boolean;
    triggeredAt?: string;
    triggerPrice?: number;
  }

  interface VisualToast {
    id: string;
    type: "volatility" | "target_price" | "system_event";
    title: string;
    message: string;
    symbol?: string;
    change?: number;
    timestamp: string;
    isCustomAlert?: boolean;
  }

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem("invertplay_price_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeToasts, setActiveToasts] = useState<VisualToast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("invertplay_sound_enabled");
    return saved !== "false"; // default true
  });

  // Web Audio API Synthesizer - plays a beautiful chord arpeggio for notifications
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playTone(784.0, now, 0.4); // G5
      playTone(1046.5, now + 0.08, 0.5); // C6
      playTone(1318.5, now + 0.16, 0.6); // E6
    } catch (e) {
      console.warn("No se pudo reproducir el sonido:", e);
    }
  };

  const triggerToast = (toast: Omit<VisualToast, "timestamp">) => {
    const newToast: VisualToast = {
      ...toast,
      timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
    setActiveToasts(prev => {
      if (prev.some(t => t.id === toast.id)) return prev;
      return [newToast, ...prev].slice(0, 5); // Max 5 visible
    });
    // Auto remove after 9 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 9000);
  };

  const dismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync alerts to localStorage
  useEffect(() => {
    localStorage.setItem("invertplay_price_alerts", JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  // Sync sound setting to localStorage
  useEffect(() => {
    localStorage.setItem("invertplay_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  // Inflation warning and simulation states
  const [customInflation, setCustomInflation] = useState<number | null>(null);
  const [showInflationToast, setShowInflationToast] = useState<boolean>(false);
  const [dismissedInflationToast, setDismissedInflationToast] = useState<boolean>(false);

  const currentInflation = customInflation !== null ? customInflation : (rates?.macroeconomics.monthlyInflation ?? 2.2);

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

  const handleToggleOwnerMode = async (newVal: boolean) => {
    setIsOwnerMode(newVal);
    localStorage.setItem("invertplay_owner_mode", newVal ? "true" : "false");
    const clientId = localStorage.getItem("invertplay_client_id") || "client_default";
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-is-owner": newVal ? "true" : "false"
        },
        body: JSON.stringify({ clientId, isOwner: newVal, isNewVisit: false })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.totalVisits === "number") setVisitorCount(data.totalVisits);
        if (typeof data.uniqueUsers === "number") setUniqueUsers(data.uniqueUsers);
        if (typeof data.activeNow === "number") setActiveNow(data.activeNow);
        if (typeof data.todayVisits === "number") setTodayVisits(data.todayVisits);
        if (Array.isArray(data.recentVisits)) setRecentVisits(data.recentVisits);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetRealVisitorCount = async () => {
    if (!window.confirm("¿Confirmas que deseas reiniciar el contador de visitas reales a 0?")) return;
    try {
      const res = await fetch("/api/visitors/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-is-owner": "true" },
        body: JSON.stringify({ isOwner: true })
      });
      if (res.ok) {
        const data = await res.json();
        setVisitorCount(0);
        setUniqueUsers(0);
        setTodayVisits(0);
        setActiveNow(0);
        setRecentVisits([]);
        localStorage.setItem("invertplay_visitors", "0");
        localStorage.setItem("invertplay_unique_users", "0");
      }
    } catch (e) {
      console.error("Error al reiniciar contador:", e);
    }
  };

  const handleManualVisitPulse = async () => {
    // Allows testing the real counter as if a new external visitor just entered
    const simulatedClientId = "visitor_test_" + Math.random().toString(36).substring(2, 7);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clientId: simulatedClientId, 
          isOwner: false, 
          isNewVisit: true,
          deviceType: Math.random() > 0.5 ? "Móvil" : "Escritorio",
          tab: activeTab
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVisitorCount(data.totalVisits);
        if (typeof data.uniqueUsers === "number") setUniqueUsers(data.uniqueUsers);
        if (typeof data.activeNow === "number") setActiveNow(data.activeNow);
        if (typeof data.todayVisits === "number") setTodayVisits(data.todayVisits);
        if (Array.isArray(data.recentVisits)) setRecentVisits(data.recentVisits);
      }
    } catch (err) {
      console.error("Error pulse visit:", err);
    }
  };

  useEffect(() => {
    trackEvent("Tab Changed", { tab: activeTab });
  }, [activeTab]);

  useEffect(() => {
    // Sync local capital text representation with the actual profile value
    if (parseFloat(localCapital) !== userProfile.capital) {
      setLocalCapital(userProfile.capital.toString());
    }
  }, [userProfile.capital]);

  // Fetch rates on component mount with robust fallback for static hosts (Netlify, etc.)
  const fetchRates = async (force = false) => {
    try {
      setLoadingRates(true);
      let data: FinancialRates | null = null;

      // 1. Try to fetch from backend if running fullstack (Express)
      try {
        const res = await fetch(`/api/rates${force ? "?force=true" : ""}`, {
          signal: AbortSignal.timeout(3500)
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          data = await res.json();
        }
      } catch {
        // Expected when deployed to static hosts like Netlify/Vercel without Node.js backend
      }

      // 2. If no backend (e.g. Netlify static hosting) or backend returned non-JSON, fetch directly from public market APIs (DolarApi, Coinbase)
      if (!data || !data.currencies || data.currencies.length === 0) {
        data = await fetchDirectMarketRates(force);
      }

      setRates(data);
      setErrorRates(null);
    } catch (err: any) {
      console.warn("[Rates] Usando base de cotizaciones local de contingencia:", err);
      setRates(BASE_FINANCIAL_RATES);
      setErrorRates(null);
    } finally {
      setLoadingRates(false);
    }
  };

  const checkPriceAlerts = (currentRates: FinancialRates) => {
    const now = new Date().toLocaleDateString("es-AR") + " " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    
    setPriceAlerts(prev => {
      let isChanged = false;
      const nextAlerts = prev.map(alert => {
        if (alert.triggered) return alert;
        
        // Find CEDEAR price
        const cedear = currentRates.cedears.find(c => c.symbol === alert.symbol);
        if (!cedear) return alert;
        
        const currentPrice = cedear.priceARS;
        let isTriggered = false;
        
        if (alert.condition === "above" && currentPrice >= alert.targetPrice) {
          isTriggered = true;
        } else if (alert.condition === "below" && currentPrice <= alert.targetPrice) {
          isTriggered = true;
        }
        
        if (isTriggered) {
          isChanged = true;
          
          // Trigger notification toast
          triggerToast({
            id: `alert-${alert.id}-${Date.now()}`,
            type: "target_price",
            title: "🎯 Alerta de Precio Alcanzada",
            message: `¡Tu objetivo para ${alert.symbol} de $${alert.targetPrice.toLocaleString("es-AR")} ARS fue alcanzado! Cotiza ahora a $${currentPrice.toLocaleString("es-AR")} ARS.`,
            symbol: alert.symbol,
            change: cedear.change,
            isCustomAlert: true
          });
          
          // Play sound
          playAlertChime();
          
          // Track Event in Mixpanel
          trackEvent("Price Alert Triggered", {
            symbol: alert.symbol,
            targetPrice: alert.targetPrice,
            condition: alert.condition,
            triggerPrice: currentPrice,
            change: cedear.change
          });
          
          return {
            ...alert,
            triggered: true,
            triggeredAt: now,
            triggerPrice: currentPrice
          };
        }
        
        return alert;
      });
      
      return isChanged ? nextAlerts : prev;
    });
  };

  const checkVolatilityToasts = (currentRates: FinancialRates) => {
    const VOLATILITY_THRESHOLD = 3.0;
    try {
      const notifiedStr = localStorage.getItem("invertplay_notified_volatility");
      const notifiedSet = notifiedStr ? new Set<string>(JSON.parse(notifiedStr)) : new Set<string>();
      
      const volatileToasts: any[] = [];
      
      // 1. Currencies
      currentRates.currencies.forEach(curr => {
        if (curr.change && Math.abs(curr.change) >= VOLATILITY_THRESHOLD) {
          volatileToasts.push({
            id: `vol-currency-${curr.name}`,
            type: "volatility",
            title: "⚡ Volatilidad en Divisa",
            message: `El ${curr.name} tuvo un movimiento brusco de ${curr.change > 0 ? "+" : ""}${curr.change}% hoy, cotizando a $${curr.sell}.`,
            symbol: curr.name,
            change: curr.change
          });
        }
      });
      
      // 2. CEDEARs
      currentRates.cedears.forEach(ced => {
        if (ced.change && Math.abs(ced.change) >= VOLATILITY_THRESHOLD) {
          volatileToasts.push({
            id: `vol-cedear-${ced.symbol}`,
            type: "volatility",
            title: "⚡ Volatilidad en CEDEAR",
            message: `El CEDEAR ${ced.symbol} (${ced.name}) registró una variación de ${ced.change > 0 ? "+" : ""}${ced.change}% en el día, a $${ced.priceARS.toLocaleString("es-AR")} ARS.`,
            symbol: ced.symbol,
            change: ced.change
          });
        }
      });
      
      // 3. Local Stocks
      currentRates.localStocks.forEach(stock => {
        if (stock.change && Math.abs(stock.change) >= VOLATILITY_THRESHOLD) {
          volatileToasts.push({
            id: `vol-stock-${stock.symbol}`,
            type: "volatility",
            title: "⚡ Volatilidad en Merval",
            message: `La acción local ${stock.symbol} experimentó un cambio fuerte de ${stock.change > 0 ? "+" : ""}${stock.change}% en la jornada, cotizando a $${stock.priceARS.toLocaleString("es-AR")} ARS.`,
            symbol: stock.symbol,
            change: stock.change
          });
        }
      });
      
      // 4. Crypto
      currentRates.crypto.forEach(coin => {
        if (coin.change && Math.abs(coin.change) >= VOLATILITY_THRESHOLD) {
          volatileToasts.push({
            id: `vol-crypto-${coin.symbol}`,
            type: "volatility",
            title: "⚡ Volatilidad Cripto",
            message: `La criptomoneda ${coin.symbol} se movió un ${coin.change > 0 ? "+" : ""}${coin.change}% hoy, cotizando a USD ${coin.priceUSD.toLocaleString("en-US")}.`,
            symbol: coin.symbol,
            change: coin.change
          });
        }
      });
      
      let triggeredAny = false;
      volatileToasts.forEach(item => {
        if (!notifiedSet.has(item.id)) {
          triggerToast({
            id: item.id,
            type: "volatility",
            title: item.title,
            message: item.message,
            symbol: item.symbol,
            change: item.change,
            isCustomAlert: false
          });
          
          // Track Event in Mixpanel
          trackEvent("Volatility Notification Triggered", {
            instrument: item.symbol,
            type: item.title,
            change: item.change
          });
          
          notifiedSet.add(item.id);
          triggeredAny = true;
        }
      });
      
      if (triggeredAny) {
        localStorage.setItem("invertplay_notified_volatility", JSON.stringify(Array.from(notifiedSet)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (rates) {
      checkPriceAlerts(rates);
    }
  }, [rates, priceAlerts]);

  useEffect(() => {
    if (rates) {
      checkVolatilityToasts(rates);
    }
  }, [rates]);

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

      let data: any[] | null = null;
      try {
        const res = await fetch("/api/news", { signal: AbortSignal.timeout(3500) });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          data = await res.json();
        }
      } catch {
        // Expected when deployed to Netlify without backend
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        const staleCached = localStorage.getItem("invertplay_news_cache");
        if (staleCached) {
          try {
            data = JSON.parse(staleCached);
          } catch {
            data = FALLBACK_NEWS;
          }
        } else {
          data = FALLBACK_NEWS;
        }
      }

      setNews(data || FALLBACK_NEWS);
      setErrorNews(null);

      // Save to client-side localStorage
      localStorage.setItem("invertplay_news_cache", JSON.stringify(data || FALLBACK_NEWS));
      localStorage.setItem("invertplay_news_timestamp", Date.now().toString());
    } catch (err: any) {
      console.warn("[News] Usando noticias de contingencia:", err);
      setNews(FALLBACK_NEWS);
      setErrorNews(null);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchNews();
  }, []);

  useEffect(() => {
    // Persistent server-backed real visitor count (excludes creator visits)
    let clientId = localStorage.getItem("invertplay_client_id");
    if (!clientId) {
      clientId = "client_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("invertplay_client_id", clientId);
    }

    // Clear legacy inflated seeds
    const oldStored = localStorage.getItem("invertplay_visitors");
    if (oldStored && parseInt(oldStored, 10) > 1000) {
      localStorage.removeItem("invertplay_visitors");
      localStorage.removeItem("invertplay_unique_users");
    }

    const deviceType = typeof window !== "undefined" && window.innerWidth < 768 ? "Móvil" : "Escritorio";

    const registerVisit = async () => {
      try {
        const res = await fetch("/api/visitors", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-is-owner": isOwnerMode ? "true" : "false"
          },
          body: JSON.stringify({ 
            clientId, 
            isOwner: isOwnerMode, 
            isNewVisit: true,
            deviceType,
            tab: activeTab
          })
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          setVisitorCount(data.totalVisits ?? 0);
          setUniqueUsers(data.uniqueUsers ?? 0);
          setActiveNow(data.activeNow ?? 0);
          if (typeof data.todayVisits === "number") setTodayVisits(data.todayVisits);
          if (Array.isArray(data.recentVisits)) setRecentVisits(data.recentVisits);
          localStorage.setItem("invertplay_visitors", (data.totalVisits ?? 0).toString());
          localStorage.setItem("invertplay_unique_users", (data.uniqueUsers ?? 0).toString());
        } else {
          // Local fallback for static hosts without backend (Netlify, etc.)
          const localVisits = Math.max(1, parseInt(localStorage.getItem("invertplay_local_visits") || "1", 10) + (isOwnerMode ? 0 : 1));
          localStorage.setItem("invertplay_local_visits", localVisits.toString());
          setVisitorCount(localVisits);
          setUniqueUsers(1);
          setActiveNow(1);
          setTodayVisits(localVisits);
        }
      } catch (err) {
        // Silent fallback for offline / static hosting
      }
    };

    registerVisit();

    // Poll live visitor stats every 10 seconds to keep counter unfrozen
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/visitors?clientId=${encodeURIComponent(clientId)}&isOwner=${isOwnerMode ? "true" : "false"}`);
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          if (typeof data.totalVisits === "number") setVisitorCount(data.totalVisits);
          if (typeof data.uniqueUsers === "number") setUniqueUsers(data.uniqueUsers);
          if (typeof data.activeNow === "number") setActiveNow(data.activeNow);
          if (typeof data.todayVisits === "number") setTodayVisits(data.todayVisits);
          if (Array.isArray(data.recentVisits)) setRecentVisits(data.recentVisits);
        }
      } catch (e) {
        // Silent poll fallback
      }
    }, 10000);

    // Heartbeat every 45s to maintain active server session
    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch("/api/visitors", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-is-owner": isOwnerMode ? "true" : "false"
          },
          body: JSON.stringify({ clientId, isOwner: isOwnerMode, isNewVisit: false, tab: activeTab })
        });
      } catch (e) {
        // Ignore heartbeat error
      }
    }, 45000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    };
  }, []);

    // Guestbook entries persistence
    useEffect(() => {
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
      case "Plazo Fijo Tradicional": return 0.20;
      case "Plazo Fijo UVA": return (currentInflation * 12 / 100) + 0.01; // index-linked estimate (UVA + 1%)
      case "FCI Money Market (Mercado Pago / Ualá)": return 0.191;
      case "Obligaciones Negociables (ONs)": return 0.38; // ON in USD yields ~8% + currency devaluation in ARS
      case "SPY": return 0.42; // Global actions are linked to CCL + standard asset growth
      case "AAPL": return 0.39;
      case "TSLA": return 0.45;
      case "MELI": return 0.42;
      case "MSFT": return 0.38;
      case "NVDA": return 0.48;
      case "GGAL": return 0.45;
      case "YPFD": return 0.48;
      case "BTC": return 0.55;
      case "ETH": return 0.50;
      default: return 0.20;
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

  // Data for Recharts PieChart (Asset allocation percentage chart)
  const pieChartData = currentAllocationArray
    .filter(a => a.percentage > 0)
    .map((a, idx) => ({
      name: a.instrumentName,
      value: a.percentage,
      amount: a.amount,
      color: ASSET_COLORS[a.instrumentName] || FALLBACK_PIE_COLORS[idx % FALLBACK_PIE_COLORS.length]
    }));

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

    const marketAverageAllocation = [
      { instrumentName: "SPY", percentage: 35 },
      { instrumentName: "FCI Money Market (Mercado Pago / Ualá)", percentage: 25 },
      { instrumentName: "Plazo Fijo Tradicional", percentage: 20 },
      { instrumentName: "Obligaciones Negociables (ONs)", percentage: 20 }
    ];

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

      const dataPoint: SimulationResult = {
        month,
        "Suma Invertida": Math.round(investedSum),
        "Retorno Proyectado": Math.round(portfolioValue),
        "Pérdida por Inflación (Efectivo)": Math.round(purchasingPower)
      };

      if (compareMarketAverage) {
        let marketAvgVal = userProfile.capital;
        if (month > 0) {
          marketAvgVal = marketAverageAllocation.reduce((total, alloc) => {
            const amount = (userProfile.capital * alloc.percentage) / 100;
            const yieldRate = getAnnualYield(alloc.instrumentName);
            const monthlyRate = Math.pow(1 + yieldRate, 1 / 12) - 1;
            const currentVal = amount * Math.pow(1 + monthlyRate, month);
            return total + currentVal;
          }, 0);
        }
        dataPoint["Promedio de Mercado"] = Math.round(marketAvgVal);
      }

      chartData.push(dataPoint);
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
    const isUSD = calcCurrency === "USD";
    // For ARS: current inflation (dynamic); for USD: US CPI global inflation (~0.28% monthly, ~3.4% annual)
    const monthlyRate = isUSD ? 0.0028 : (currentInflation / 100);
    const accumulatedInflation = Math.pow(1 + monthlyRate, calcMonths) - 1;
    const currentValue = isUSD ? calcDollars : calcPesos;
    const remainingPower = currentValue / Math.pow(1 + monthlyRate, calcMonths);
    const moneyLost = currentValue - remainingPower;

    // Reference items in Argentina adjusted by currency
    // In ARS:
    // Café con medialunas: ~$3.500 ARS
    // Tanque de nafta súper (50L): ~$65.000 ARS
    // Asado completo para 4 personas: ~$45.000 ARS
    // In USD:
    // Café de especialidad / Starbucks: ~$3.50 USD
    // Tanque de combustible súper (50L): ~$55 USD
    // Asado / Cena para 4 personas: ~$40 USD
    const cafeCost = isUSD ? 3.5 : 3500;
    const naftaCost = isUSD ? 55 : 65000;
    const asadoCost = isUSD ? 40 : 45000;

    const initialCafes = Math.floor(currentValue / cafeCost);
    const finalCafes = Math.floor(remainingPower / cafeCost);

    const initialNafta = Math.floor(currentValue / naftaCost);
    const finalNafta = Math.floor(remainingPower / naftaCost);

    const initialAsados = Math.floor(currentValue / asadoCost);
    const finalAsados = Math.floor(remainingPower / asadoCost);

    return {
      isUSD,
      currencySymbol: isUSD ? "USD" : "ARS",
      monthlyRatePercent: (monthlyRate * 100).toFixed(2),
      accumulatedPercent: (accumulatedInflation * 100).toFixed(1),
      remainingPower: isUSD ? Number(remainingPower.toFixed(2)) : Math.round(remainingPower),
      moneyLost: isUSD ? Number(moneyLost.toFixed(2)) : Math.round(moneyLost),
      cafes: { initial: initialCafes, final: finalCafes, diff: Math.max(0, initialCafes - finalCafes) },
      nafta: { initial: initialNafta, final: finalNafta, diff: Math.max(0, initialNafta - finalNafta) },
      asados: { initial: initialAsados, final: finalAsados, diff: Math.max(0, initialAsados - finalAsados) }
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

      let replyContent = "";
      let isFallback = false;

      try {
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
          }),
          signal: AbortSignal.timeout(10000)
        });

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          replyContent = data.content;
          isFallback = !!data.isFallback;
        } else {
          throw new Error("Backend offline");
        }
      } catch {
        // Fallback for static hosts (like Netlify) without Node.js backend
        replyContent = generateClientFallbackAdvice(chatHistory as any, userProfile);
        isFallback = true;
      }

      setIsFallbackMode(isFallback);

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        content: replyContent,
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
    { label: "👵🏽 Jubilados y Sueldos Bajos", text: "Soy jubilado o cobro un sueldo mínimo en Argentina. ¿Cómo puedo lograr mayor rendimiento con rescate inmediato sin congelar mi dinero en plazos fijos?" },
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
      case "Wallet": return <Wallet className="w-5 h-5 text-emerald-400" />;
      case "CreditCard": return <CreditCard className="w-5 h-5 text-purple-400" />;
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
                  <span className="text-zinc-400">Dólar Blue:</span>
                  <span className="text-white font-semibold font-mono">
                    ${rates.currencies.find(c => c.name.includes("Blue"))?.sell || 1540}
                  </span>
                </div>
                <div className="bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-lg flex items-center gap-2 shrink-0">
                  <span className="text-zinc-400">Dólar MEP:</span>
                  <span className="text-white font-semibold font-mono">
                    ${rates.currencies.find(c => c.name.includes("MEP"))?.sell || 1525}
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
                  onClick={() => fetchRates(true)} 
                  className={`p-1 text-zinc-400 hover:text-white transition hover:bg-zinc-800 rounded-md ${loadingRates ? "animate-spin text-emerald-400" : ""}`}
                  title="Actualizar cotizaciones en vivo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab("advisor");
                    trackEvent("Header Advisor Button Clicked");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer shadow-sm ${
                    activeTab === "advisor"
                      ? "bg-amber-500 text-zinc-950 shadow-amber-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  }`}
                  title="Abrir Asesor Invert-Play con Inteligencia Artificial"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>Asesor Invert-Play</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
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
                <span className="text-emerald-400 font-semibold">Tasa Ref.: {rates?.fixedIncome.find(f => f.name.includes("Plazo Fijo"))?.rate || "20.0% TNA"}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 font-semibold text-sm">
                  {userProfile.currency === "ARS" ? "$" : "USD"}
                </div>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={localCapital} 
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const sanitized = rawVal.replace(",", ".");
                    
                    if (sanitized === "" || /^[0-9]*\.?[0-9]*$/.test(sanitized)) {
                      setLocalCapital(sanitized);
                      const parsed = parseFloat(sanitized);
                      if (!isNaN(parsed)) {
                        setUserProfile(prev => ({ ...prev, capital: parsed }));
                      } else {
                        setUserProfile(prev => ({ ...prev, capital: 0 }));
                      }
                    }
                  }}
                  onBlur={() => {
                    if (localCapital === "" || isNaN(parseFloat(localCapital))) {
                      setLocalCapital("0");
                      setUserProfile(prev => ({ ...prev, capital: 0 }));
                    } else {
                      const parsed = parseFloat(localCapital);
                      setLocalCapital(parsed.toString());
                      setUserProfile(prev => ({ ...prev, capital: parsed }));
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-12 pr-16 text-white font-mono font-medium focus:outline-none focus:border-emerald-500 text-lg transition"
                  placeholder="0"
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

              {/* Quick Preset Badges */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {userProfile.currency === "ARS" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 50000;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $50k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 100000;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $100k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 500000;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $500k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 1000000;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $1M
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserProfile(prev => ({ ...prev, capital: 0 }));
                        setLocalCapital("0");
                      }}
                      className="px-2 py-1 text-[10px] bg-red-950/40 hover:bg-red-900/30 text-red-400 font-semibold rounded-md transition border border-red-900/30 ml-auto"
                    >
                      Limpiar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 100;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $100
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 500;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $500
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 1000;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $1k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = userProfile.capital + 5000;
                        setUserProfile(prev => ({ ...prev, capital: nextVal }));
                        setLocalCapital(nextVal.toString());
                      }}
                      className="px-2 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md transition"
                    >
                      + $5k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserProfile(prev => ({ ...prev, capital: 0 }));
                        setLocalCapital("0");
                      }}
                      className="px-2 py-1 text-[10px] bg-red-950/40 hover:bg-red-900/30 text-red-400 font-semibold rounded-md transition border border-red-900/30 ml-auto"
                    >
                      Limpiar
                    </button>
                  </>
                )}
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

          {/* Prominent "Asesor Invert-Play" Sidebar Spotlight Card */}
          <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    Asesor Invert-Play
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                      EN VIVO
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Inteligencia Artificial Financiera</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Obtené un diagnóstico instantáneo para tus <strong className="text-amber-400 font-mono">${userProfile.capital.toLocaleString("es-AR")} {userProfile.currency}</strong> según cotizaciones del día e inflación proyectada.
            </p>

            {/* Quick Prompt Trigger Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Consultas sugeridas:</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("advisor");
                  handleSendMessage(`¿Cuál es la mejor estrategia para invertir ${userProfile.currency === "USD" ? "US$ " : "$"}${userProfile.capital.toLocaleString("es-AR")} ${userProfile.currency} hoy con mi perfil ${userProfile.riskProfile}?`);
                }}
                className="text-left text-[11px] p-2 rounded-lg bg-zinc-950/80 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
              >
                <span>¿En qué invertir mi capital hoy?</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("advisor");
                  handleSendMessage(`¿Conviene más hacer Plazo Fijo, comprar Dólar MEP o invertir en CEDEARs en el contexto económico actual?`);
                }}
                className="text-left text-[11px] p-2 rounded-lg bg-zinc-950/80 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
              >
                <span>¿Dólar MEP vs Plazo Fijo vs Cedears?</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab("advisor");
                trackEvent("Sidebar Open Advisor Clicked");
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              Abrir Panel del Asesor
            </button>
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
                Restaurar Tasa Oficial ({rates?.macroeconomics.monthlyInflation ?? 2.2}%)
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
                Con una inflación de aproximadamente {rates?.macroeconomics.monthlyInflation ?? 2.2}% al mes, guardar dinero en efectivo ("bajo el colchón") significa perder poder adquisitivo de forma acelerada frente al costo de vida. Utilizar instrumentos como cuentas remuneradas, UVA o CEDEARs te permite resguardar tu esfuerzo.
              </p>
            </div>
          </div>

          {/* AdSense Sidebar Banner */}
          <AdSenseBanner slot="sidebar-vertical-ad" format="vertical" />

        </section>

        {/* Right Active View panel: Tabs & details (occupies 8 cols on desktop) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Custom Premium Tabs Navigation Bar - Optimized for Mobile with horizontal scrolling, preventing wrapping */}
          <nav className="bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/80 flex overflow-x-auto sm:flex-wrap gap-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none touch-pan-x">
            <button
              onClick={() => setActiveTab("rates")}
              className={`flex-1 min-w-[115px] sm:min-w-[120px] shrink-0 sm:shrink py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
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
              className={`flex-1 min-w-[115px] sm:min-w-[120px] shrink-0 sm:shrink py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
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
              className={`flex-1 min-w-[115px] sm:min-w-[120px] shrink-0 sm:shrink py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
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
              className={`flex-1 min-w-[130px] sm:min-w-[140px] shrink-0 sm:shrink py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === "advisor"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black border border-amber-300 shadow-lg shadow-amber-500/25"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-extrabold"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === "advisor" ? "text-zinc-950" : "text-amber-400"}`} />
              <span className="uppercase tracking-wider text-[11px] font-black">Asesor Invert-Play</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </button>
          </nav>

          {/* Quick-Access Prominent Advisor Banner (visible when browsing Rates, Simulator, or Calculator) */}
          {activeTab !== "advisor" && (
            <div className="bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Panel del Asesor Invert-Play
                    </h4>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                      IA Financiera Activa
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    ¿No sabés qué activos elegir? El Asesor analiza tus <strong className="text-amber-400 font-mono">${userProfile.capital.toLocaleString("es-AR")} {userProfile.currency}</strong> y tu perfil <span className="uppercase text-emerald-400 font-bold">{userProfile.riskProfile}</span> en tiempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("advisor");
                  trackEvent("Tab Top Banner Advisor Clicked");
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs py-2 px-4 rounded-xl transition shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-center active:scale-[0.98] cursor-pointer"
              >
                <span>Consultar al Asesor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            Tipos de Cambio (Dólar en Argentina)
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {rates.lastUpdated ? `Actualizado: ${rates.lastUpdated}` : "En Vivo"}
                            </span>
                            <button
                              onClick={() => fetchRates(true)}
                              disabled={loadingRates}
                              className="text-zinc-400 hover:text-white transition flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-800"
                              title="Forzar actualización desde el mercado"
                            >
                              <RefreshCw className={`w-3 h-3 ${loadingRates ? "animate-spin text-emerald-400" : ""}`} />
                              <span>Refrescar</span>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                          
                          {/* Price Alerts Widget */}
                          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="bg-indigo-500/10 border border-indigo-500/20 p-1.5 rounded-lg text-indigo-400">
                                  <Bell className="w-4 h-4 animate-bounce" />
                                </div>
                                <div>
                                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                    Alertas de Precios
                                  </h3>
                                  <p className="text-[10px] text-zinc-500">Monitorea tus CEDEARs favoritos</p>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setSoundEnabled(!soundEnabled);
                                  trackEvent("Sound Settings Toggled", { enabled: !soundEnabled });
                                }}
                                className={`p-1.5 rounded-lg border transition ${
                                  soundEnabled 
                                    ? "bg-zinc-950 border-zinc-800 text-indigo-400 hover:text-indigo-300" 
                                    : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-400"
                                }`}
                                title={soundEnabled ? "Silenciar alertas" : "Activar sonido de alerta"}
                              >
                                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Create New Alert Form */}
                            <div className="bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-850/80 flex flex-col gap-3">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nueva Alerta de CEDEAR</span>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-zinc-500 font-bold uppercase">Activo</label>
                                  <select
                                    id="alert-symbol-select"
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                  >
                                    {rates.cedears.map(c => (
                                      <option key={c.symbol} value={c.symbol}>
                                        {c.symbol} (${c.priceARS.toLocaleString()})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-zinc-500 font-bold uppercase">Condición</label>
                                  <select
                                    id="alert-condition-select"
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="above">Mayor o igual (≥)</option>
                                    <option value="below">Menor o igual (≤)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2 items-end">
                                <div className="flex-1 flex flex-col gap-1">
                                  <label className="text-[9px] text-zinc-500 font-bold uppercase">Precio Objetivo (ARS)</label>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                                    <input
                                      id="alert-price-input"
                                      type="number"
                                      placeholder="Precio"
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-6 pr-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => {
                                    const symbolSelect = document.getElementById("alert-symbol-select") as HTMLSelectElement;
                                    const conditionSelect = document.getElementById("alert-condition-select") as HTMLSelectElement;
                                    const priceInput = document.getElementById("alert-price-input") as HTMLInputElement;
                                    
                                    const symbol = symbolSelect.value;
                                    const condition = conditionSelect.value as "above" | "below";
                                    const targetPrice = parseFloat(priceInput.value);
                                    
                                    if (isNaN(targetPrice) || targetPrice <= 0) {
                                      alert("Por favor ingresá un precio válido mayor a 0.");
                                      return;
                                    }
                                    
                                    const newAlert: PriceAlert = {
                                      id: Math.random().toString(36).substring(2, 9),
                                      symbol,
                                      targetPrice,
                                      condition,
                                      createdAt: new Date().toLocaleDateString("es-AR") + " " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                                      triggered: false
                                    };
                                    
                                    setPriceAlerts(prev => [newAlert, ...prev]);
                                    priceInput.value = "";
                                    
                                    trackEvent("Price Alert Created", {
                                      symbol,
                                      targetPrice,
                                      condition
                                    });
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition shrink-0 h-[32px] flex items-center justify-center gap-1 active:scale-[0.98]"
                                >
                                  Crear 🎯
                                </button>
                              </div>
                            </div>

                            {/* Active & Triggered Alerts List */}
                            <div className="flex flex-col gap-2.5">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Tus Alertas</span>
                              
                              {priceAlerts.length === 0 ? (
                                <div className="text-center py-6 px-4 bg-zinc-950/30 rounded-xl border border-zinc-850 border-dashed text-zinc-500">
                                  <Bell className="w-5 h-5 mx-auto mb-1.5 text-zinc-600 opacity-60" />
                                  <p className="text-[11px]">No tenés alertas configuradas.</p>
                                  <p className="text-[9px] mt-0.5 text-zinc-600 font-medium">Establecé un objetivo arriba para recibir avisos.</p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                                  {priceAlerts.map(alert => {
                                    const cedear = rates.cedears.find(c => c.symbol === alert.symbol);
                                    const currentPrice = cedear ? cedear.priceARS : 0;
                                    return (
                                      <div 
                                        key={alert.id} 
                                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                                          alert.triggered 
                                            ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" 
                                            : "bg-zinc-950/50 border-zinc-850/80 hover:border-zinc-800 text-zinc-300"
                                        }`}
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-extrabold text-white">{alert.symbol}</span>
                                            <span className="text-[10px] text-zinc-500 font-semibold">
                                              {alert.condition === "above" ? "≥" : "≤"} ${alert.targetPrice.toLocaleString("es-AR")}
                                            </span>
                                            {alert.triggered ? (
                                              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                                                ¡Disparada!
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-[8px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">
                                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping" />
                                                Activa
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="text-[10px] text-zinc-500 flex flex-wrap gap-x-2">
                                            <span>Creada: {alert.createdAt.split(" ")[1]}</span>
                                            {alert.triggered && (
                                              <span className="text-emerald-500 font-medium">
                                                Disparada a: ${alert.triggerPrice?.toLocaleString("es-AR")} ({alert.triggeredAt?.split(" ")[1]})
                                              </span>
                                            )}
                                            {!alert.triggered && currentPrice > 0 && (
                                              <span>Actual: ${currentPrice.toLocaleString("es-AR")} ARS</span>
                                            )}
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => {
                                            setPriceAlerts(prev => prev.filter(a => a.id !== alert.id));
                                            trackEvent("Price Alert Deleted", {
                                              symbol: alert.symbol,
                                              targetPrice: alert.targetPrice
                                            });
                                          }}
                                          className="p-1 text-zinc-500 hover:text-red-400 rounded transition hover:bg-red-500/10"
                                          title="Eliminar alerta"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

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
                      
                      {/* Instrument allocations list & Recharts Pie Chart */}
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
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline"
                          >
                            {isCustomizingAllocation ? "Volver a sugerido" : "Personalizar porcentajes"}
                          </button>
                        </div>

                        {/* Side-by-side container for Sliders List & Recharts Pie Chart */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                          {/* Sliders / Allocation List */}
                          <div className="flex flex-col gap-3.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                            {currentAllocationArray.map((alloc, idx) => {
                              const assetColor = ASSET_COLORS[alloc.instrumentName] || FALLBACK_PIE_COLORS[idx % FALLBACK_PIE_COLORS.length];
                              return (
                                <div key={alloc.instrumentName} className="flex flex-col gap-1.5">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className="text-white font-semibold flex items-center gap-1.5">
                                      <span 
                                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" 
                                        style={{ backgroundColor: assetColor }} 
                                      />
                                      {alloc.instrumentName}
                                    </span>
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
                                        className="h-full rounded-full transition-all duration-300" 
                                        style={{ width: `${alloc.percentage}%`, backgroundColor: assetColor }}
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
                              );
                            })}
                          </div>

                          {/* Recharts Pie Chart Card */}
                          <div className="flex flex-col justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 min-h-[260px]">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <PieChartIcon className="w-3.5 h-3.5 text-emerald-400" />
                                Gráfico de Torta (% Cartera)
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {pieChartData.length} activo{pieChartData.length !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {pieChartData.length > 0 ? (
                              <div className="w-full h-[220px] relative flex items-center justify-center my-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={pieChartData}
                                      cx="50%"
                                      cy="42%"
                                      innerRadius={42}
                                      outerRadius={70}
                                      paddingAngle={3}
                                      dataKey="value"
                                      nameKey="name"
                                      animationDuration={500}
                                    >
                                      {pieChartData.map((entry, index) => (
                                        <Cell 
                                          key={`pie-cell-${index}`} 
                                          fill={entry.color} 
                                          stroke="#09090b"
                                          strokeWidth={2}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-zinc-900 border border-zinc-700/80 p-2.5 rounded-lg shadow-2xl text-xs font-sans">
                                              <p className="font-extrabold text-white mb-1 flex items-center gap-1.5">
                                                <span 
                                                  className="w-2.5 h-2.5 rounded-full inline-block" 
                                                  style={{ backgroundColor: data.color }} 
                                                />
                                                {data.name}
                                              </p>
                                              <p className="text-emerald-400 font-mono font-bold">
                                                {data.value}% <span className="text-zinc-400 font-normal">({userProfile.currency === "USD" ? "USD" : "ARS"} {Math.round(data.amount).toLocaleString("es-AR")})</span>
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Legend 
                                      formatter={(value, entry: any) => (
                                        <span className="text-[10px] text-zinc-300 font-medium">
                                          {value} ({entry.payload?.value}%)
                                        </span>
                                      )}
                                      iconSize={7}
                                      iconType="circle"
                                      layout="horizontal"
                                      verticalAlign="bottom"
                                      align="center"
                                      wrapperStyle={{ paddingTop: "6px" }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                                
                                {/* Center Donut Label */}
                                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                  <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-none">Total</span>
                                  <span className="text-xs font-extrabold font-mono text-white leading-tight">
                                    {totalAllocatedPercentage}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-zinc-500 text-xs py-10 text-center flex flex-col items-center justify-center gap-1 my-auto">
                                <PieChartIcon className="w-8 h-8 text-zinc-700 mb-1" />
                                <span>Sin distribución configurada</span>
                              </div>
                            )}
                          </div>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Trayectoria Proyectada del Capital</h4>
                        <p className="text-[11px] text-zinc-400">Comparativa del valor real entre tu Portafolio Diversificado vs Efectivo (Ajustado por Inflación).</p>
                      </div>

                      {/* Comparison Toggle */}
                      <button
                        onClick={() => {
                          setCompareMarketAverage(!compareMarketAverage);
                          trackEvent("toggle_compare_market_average", { enabled: !compareMarketAverage });
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition duration-200 select-none cursor-pointer self-start md:self-auto ${
                          compareMarketAverage
                            ? "bg-blue-500/10 border-blue-500/40 text-blue-400 hover:bg-blue-500/15"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${compareMarketAverage ? "bg-blue-500 animate-pulse" : "bg-zinc-600"}`} />
                        <span>Comparar con Promedio de Mercado</span>
                      </button>
                    </div>

                    {compareMarketAverage && (
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-[11px] text-blue-300/90 leading-relaxed">
                        💡 <strong>Promedio de Mercado (Benchmark):</strong> Es una asignación diversificada estándar compuesta por <strong>SPY (35%)</strong>, <strong>Money Market (25%)</strong>, <strong>Plazo Fijo Tradicional (20%)</strong> y <strong>Obligaciones Negociables (20%)</strong> para evaluar la efectividad de tu portafolio personalizado.
                      </div>
                    )}

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
                            <linearGradient id="colorMarketAverage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const portfolioItem = payload.find((p: any) => p.dataKey === "Retorno Proyectado");
                                const cashItem = payload.find((p: any) => p.dataKey === "Pérdida por Inflación (Efectivo)");
                                const marketItem = payload.find((p: any) => p.dataKey === "Promedio de Mercado");

                                const portfolioVal = Math.round(Number(portfolioItem?.value || 0));
                                const cashVal = Math.round(Number(cashItem?.value || 0));
                                const marketVal = marketItem ? Math.round(Number(marketItem.value || 0)) : null;

                                const diffAbsolute = portfolioVal - cashVal;
                                const diffPercent = cashVal > 0 ? ((diffAbsolute / cashVal) * 100).toFixed(1) : "0";
                                const currSymbol = userProfile.currency === "USD" ? "USD" : "ARS";

                                return (
                                  <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl text-xs flex flex-col gap-2 min-w-[270px]">
                                    <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                                      <span className="font-extrabold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <LineChart className="w-3.5 h-3.5 text-blue-400" />
                                        Mes {label} de Proyección
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-mono">T+{label}m</span>
                                    </div>

                                    <div className="flex flex-col gap-1.5 text-[11px]">
                                      <div className="flex justify-between items-center text-emerald-400">
                                        <span className="flex items-center gap-1.5 font-medium">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                          Portafolio Diversificado:
                                        </span>
                                        <span className="font-mono font-bold">${portfolioVal.toLocaleString("es-AR")} {currSymbol}</span>
                                      </div>

                                      {marketVal !== null && (
                                        <div className="flex justify-between items-center text-blue-400">
                                          <span className="flex items-center gap-1.5 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            Promedio de Mercado:
                                          </span>
                                          <span className="font-mono font-bold">${marketVal.toLocaleString("es-AR")} {currSymbol}</span>
                                        </div>
                                      )}

                                      <div className="flex justify-between items-center text-red-400">
                                        <span className="flex items-center gap-1.5 font-medium">
                                          <span className="w-2 h-2 rounded-full bg-red-400" />
                                          Efectivo ("Colchón"):
                                        </span>
                                        <span className="font-mono font-bold">${cashVal.toLocaleString("es-AR")} {currSymbol}</span>
                                      </div>
                                    </div>

                                    {/* Detailed Absolute Difference Tooltip (User Request) */}
                                    <div className="mt-1 pt-2 border-t border-zinc-800 bg-zinc-900/80 p-2.5 rounded-lg flex flex-col gap-1 border border-zinc-800/60">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">
                                          Diferencia Absoluta:
                                        </span>
                                        <span className={`font-mono font-extrabold text-xs ${diffAbsolute >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                          {diffAbsolute >= 0 ? "+" : ""}${diffAbsolute.toLocaleString("es-AR")} {currSymbol}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                        <span>Ventaja sobre efectivo:</span>
                                        <span className="font-mono text-emerald-400 font-bold">+{diffPercent}%</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
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
                          {compareMarketAverage && (
                            <Area 
                              name="Promedio de Mercado (Benchmark)" 
                              type="monotone" 
                              dataKey="Promedio de Mercado" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              fillOpacity={1} 
                              fill="url(#colorMarketAverage)" 
                            />
                          )}
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

                  {/* Real Gain (Ganancia Real) Calculator Section */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <Calculator className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-semibold text-white">Calculadora de Ganancia Real (Rendimiento Neto vs Inflación)</h4>
                        <p className="text-[11px] text-zinc-400">Calculá si tu fondo común de inversión o billetera realmente gana poder adquisitivo o si pierde contra la inflación acumulada.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Interactive Inputs (5 cols on lg) */}
                      <div className="lg:col-span-5 flex flex-col gap-4">
                        {/* Capital input */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-zinc-400">Capital a Simular:</span>
                            <span className="text-white font-mono">
                              {userProfile.currency === "USD" ? "USD" : "ARS"} {realGainCapital.toLocaleString("es-AR")}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50000"
                            max="10000000"
                            step="50000"
                            value={realGainCapital}
                            onChange={(e) => setRealGainCapital(parseInt(e.target.value) || 50000)}
                            className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                            <span>$50k</span>
                            <span>$5M</span>
                            <span>$10M</span>
                          </div>
                        </div>

                        {/* Months input */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-zinc-400">Plazo de Permanencia:</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              {realGainMonths} {realGainMonths === 1 ? "mes" : "meses"}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="24"
                            step="1"
                            value={realGainMonths}
                            onChange={(e) => setRealGainMonths(parseInt(e.target.value) || 1)}
                            className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                            <span>1 mes</span>
                            <span>12 meses</span>
                            <span>24 meses</span>
                          </div>
                        </div>

                        {/* Fund Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-400">Instrumento / Fondo de Inversión:</label>
                          <select
                            value={realGainFundType}
                            onChange={(e) => setRealGainFundType(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="money_market">FCI Money Market (Mercado Pago, Ualá) (~19.1% TNA)</option>
                            <option value="naranja_x">Cuenta Remunerada Naranja X (~25% TNA)</option>
                            <option value="plazo_fijo">Plazo Fijo Tradicional (~20% TNA)</option>
                            <option value="renta_fija">FCI Renta Fija (Bonos Cortos) (~28% TNA)</option>
                            <option value="acciones_arg">FCI Acciones Argentinas (~40% TNA)</option>
                            <option value="custom">Fondo Personalizado (Tasa Propia)</option>
                          </select>
                        </div>

                        {/* Custom TNA if chosen */}
                        {realGainFundType === "custom" && (
                          <div className="flex flex-col gap-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-850/80">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-zinc-400">Tasa Nominal Anual (TNA) de tu Fondo:</span>
                              <span className="text-indigo-400 font-mono font-bold">
                                {realGainCustomTna}% TNA
                              </span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="150"
                              step="5"
                              value={realGainCustomTna}
                              onChange={(e) => setRealGainCustomTna(parseInt(e.target.value) || 45)}
                              className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                              <span>10%</span>
                              <span>80%</span>
                              <span>150%</span>
                            </div>
                          </div>
                        )}

                        {/* Sincronizado con inflación */}
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-amber-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">Inflación Simulada</span>
                              <span className="text-[10px] text-zinc-500">Tasa mensual de referencia</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-black text-amber-400">
                              {currentInflation.toFixed(1)}% mensual
                            </span>
                            <span className="text-[9px] text-zinc-500">Ajustable en menú lateral</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Rich results cards (7 cols on lg) */}
                      <div className="lg:col-span-7 flex flex-col gap-4">
                        {(() => {
                          let fundTna = 0.20;
                          let fundLabel = "Fondo de Inversión";
                          switch (realGainFundType) {
                            case "money_market":
                              fundTna = 0.191;
                              fundLabel = "FCI Money Market (Mercado Pago / Ualá)";
                              break;
                            case "naranja_x":
                              fundTna = 0.25;
                              fundLabel = "Cuenta Remunerada Naranja X";
                              break;
                            case "renta_fija":
                              fundTna = 0.28;
                              fundLabel = "FCI Renta Fija Pesos";
                              break;
                            case "plazo_fijo":
                              fundTna = 0.20;
                              fundLabel = "Plazo Fijo Tradicional";
                              break;
                            case "acciones_arg":
                              fundTna = 0.40;
                              fundLabel = "FCI Acciones Argentinas";
                              break;
                            case "custom":
                              fundTna = realGainCustomTna / 100;
                              fundLabel = "Fondo Personalizado";
                              break;
                          }

                          // Calculations
                          const fundMonthlyRate = Math.pow(1 + fundTna, 1 / 12) - 1;
                          const finalNominal = realGainCapital * Math.pow(1 + fundMonthlyRate, realGainMonths);
                          const nominalEarnings = finalNominal - realGainCapital;

                          const inflationMonthlyRate = currentInflation / 100;
                          const accumulatedInflation = Math.pow(1 + inflationMonthlyRate, realGainMonths) - 1;
                          const finalRequiredForInflation = realGainCapital * (1 + accumulatedInflation);

                          const realValueInTodayMoney = finalNominal / (1 + accumulatedInflation);
                          const netRealReturn = realValueInTodayMoney - realGainCapital;
                          const realRatePercent = (realValueInTodayMoney / realGainCapital - 1) * 100;

                          const isPositiveReal = netRealReturn >= 0;

                          return (
                            <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-4 justify-between h-full">
                              
                              {/* Main metric */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    Resultado de Ganancia Real Neto
                                  </span>
                                  <span className={`text-2xl font-black font-mono tracking-tight mt-0.5 ${
                                    isPositiveReal ? "text-emerald-400" : "text-rose-400"
                                  }`}>
                                    {isPositiveReal ? "+" : ""}
                                    {userProfile.currency === "USD" ? "USD" : "ARS"}{" "}
                                    {Math.round(netRealReturn).toLocaleString("es-AR")}
                                  </span>
                                  <span className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${
                                    isPositiveReal ? "text-emerald-400/90" : "text-rose-400/90"
                                  }`}>
                                    {isPositiveReal ? (
                                      <>
                                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                                        Rendimiento Real Positivo: +{realRatePercent.toFixed(1)}%
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                                        Pérdida de Poder de Compra: {realRatePercent.toFixed(1)}%
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold uppercase ${
                                  isPositiveReal 
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                }`}>
                                  {isPositiveReal ? "Supera Inflación ✅" : "Licuado de Capital ⚠️"}
                                </div>
                              </div>

                              {/* Visual comparison bars */}
                              <div className="flex flex-col gap-3">
                                {/* Bar 1: Your investment */}
                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-zinc-300 font-semibold">Valor Final de tu Inversión (Nominal):</span>
                                    <span className="text-zinc-100 font-bold font-mono">
                                      {userProfile.currency === "USD" ? "USD" : "ARS"}{" "}
                                      {Math.round(finalNominal).toLocaleString("es-AR")} ({((finalNominal / realGainCapital - 1) * 100).toFixed(1)}% nominal)
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                                      style={{ width: `${Math.min(100, (finalNominal / Math.max(finalNominal, finalRequiredForInflation)) * 100)}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Bar 2: Inflation limit */}
                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-zinc-400 font-semibold">Límite Necesario para no Perder (Inflación):</span>
                                    <span className="text-zinc-300 font-bold font-mono">
                                      {userProfile.currency === "USD" ? "USD" : "ARS"}{" "}
                                      {Math.round(finalRequiredForInflation).toLocaleString("es-AR")} ({((accumulatedInflation) * 100).toFixed(1)}% infl.)
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <div 
                                      className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                                      style={{ width: `${Math.min(100, (finalRequiredForInflation / Math.max(finalNominal, finalRequiredForInflation)) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Breakdown details */}
                              <div className="grid grid-cols-2 gap-3.5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850/60 text-xs text-zinc-400">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] uppercase font-bold text-zinc-500">Interés Ganado (Nominal)</span>
                                  <span className="font-mono text-white font-bold">
                                    +{userProfile.currency === "USD" ? "USD" : "ARS"}{" "}
                                    {Math.round(nominalEarnings).toLocaleString("es-AR")}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">TNA del instrumento: {(fundTna * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col gap-0.5 border-l border-zinc-800/80 pl-3.5">
                                  <span className="text-[10px] uppercase font-bold text-zinc-500">Poder de Compra Real</span>
                                  <span className={`font-mono font-bold ${isPositiveReal ? "text-emerald-400" : "text-rose-400"}`}>
                                    {userProfile.currency === "USD" ? "USD" : "ARS"}{" "}
                                    {Math.round(realValueInTodayMoney).toLocaleString("es-AR")}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">Inflación acumulada: {(accumulatedInflation * 100).toFixed(1)}%</span>
                                </div>
                              </div>

                              {/* Recommendation */}
                              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                                isPositiveReal
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300/90"
                                  : "bg-amber-500/5 border-amber-500/20 text-amber-300/90"
                              }`}>
                                {isPositiveReal ? (
                                  <p>
                                    <strong>🎉 ¡Meta alcanzada!</strong> Tu dinero invertido en <strong>{fundLabel}</strong> rinde más que la inflación real acumulada de tu simulación. Estás logrando proteger tu patrimonio e incrementar de forma real tu poder de compra en un <strong>+{realRatePercent.toFixed(1)}%</strong>.
                                  </p>
                                ) : (
                                  <p>
                                    <strong>⚠️ Alerta de devaluación:</strong> Aunque tu inversión en <strong>{fundLabel}</strong> creció nominalmente un <strong>{((finalNominal / realGainCapital - 1) * 100).toFixed(1)}%</strong>, la inflación real acumulada fue del <strong>{(accumulatedInflation * 100).toFixed(1)}%</strong>. Esto significa que tu dinero perdió un <strong>{Math.abs(realRatePercent).toFixed(1)}%</strong> de poder adquisitivo neto. Considerá diversificar en instrumentos que den tasas reales positivas, activos indexados por UVA, u opciones en dólares como CEDEARs.
                                  </p>
                                )}
                              </div>

                            </div>
                          );
                        })()}
                      </div>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                      <div>
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-amber-400" />
                          Calculadora del Costo de No Invertir ("Bajo el Colchón")
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Compara cuánta riqueza real destruye la inflación guardando dinero inactivo en pesos o dólares.
                        </p>
                      </div>

                      {/* Currency Toggle: ARS vs USD */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setCalcCurrency("ARS")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            calcCurrency === "ARS"
                              ? "bg-amber-500 text-zinc-950 shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span>🇦🇷 Pesos (ARS)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcCurrency("USD")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            calcCurrency === "USD"
                              ? "bg-amber-500 text-zinc-950 shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span>🇺🇸 Dólares (USD)</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: inputs */}
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-zinc-400 flex justify-between">
                            <span>{calcCurrency === "ARS" ? "Suma en Pesos Inactiva" : "Suma en Dólares Inactiva"}</span>
                            <span className="text-amber-400 font-mono">
                              {calcCurrency === "ARS" 
                                ? `$${calcPesos.toLocaleString("es-AR")} ARS` 
                                : `US$ ${calcDollars.toLocaleString("en-US")} USD`}
                            </span>
                          </label>
                          {calcCurrency === "ARS" ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <input 
                                type="range"
                                min="100"
                                max="20000"
                                step="100"
                                value={calcDollars}
                                onChange={(e) => setCalcDollars(parseInt(e.target.value) || 100)}
                                className="w-full accent-amber-500 h-2 bg-zinc-950 rounded-lg cursor-pointer"
                              />
                              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                                <span>US$ 100</span>
                                <span>US$ 10.000</span>
                                <span>US$ 20.000</span>
                              </div>
                            </>
                          )}
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
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-zinc-500 uppercase font-medium">Pérdida de Poder Adquisitivo</span>
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold">
                              {calcMetrics.monthlyRatePercent}% mensual
                            </span>
                          </div>
                          <span className="text-4xl font-extrabold text-amber-500 font-mono">
                            -{calcMetrics.accumulatedPercent}%
                          </span>
                          <p className="text-[10px] text-zinc-400 leading-relaxed px-2">
                            {calcCurrency === "ARS" ? (
                              <>La inflación acumulada en {calcMonths} meses requerirá un {calcMetrics.accumulatedPercent}% más de pesos para comprar exactamente los mismos productos.</>
                            ) : (
                              <>Incluso en dólares, la inflación acumulada ({calcMetrics.monthlyRatePercent}% mensual / CPI internacional) devalúa tu poder de compra en un {calcMetrics.accumulatedPercent}% en {calcMonths} meses si no los inviertes.</>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: localized results with metrics */}
                      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Pérdida en Bienes de la Economía Real
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">
                            Base: {calcMetrics.currencySymbol}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 border-b border-zinc-800 pb-3">
                          <span className="text-[11px] text-zinc-500 font-medium">Poder de compra remanente:</span>
                          <span className="text-2xl font-black font-mono text-zinc-200">
                            {calcCurrency === "ARS" 
                              ? `$${calcMetrics.remainingPower.toLocaleString("es-AR")} ARS` 
                              : `US$ ${calcMetrics.remainingPower.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
                          </span>
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 mt-0.5">
                            <TrendingDown className="w-4 h-4" />
                            Perdiste el equivalente a {calcCurrency === "ARS" 
                              ? `$${calcMetrics.moneyLost.toLocaleString("es-AR")} ARS` 
                              : `US$ ${calcMetrics.moneyLost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
                          </span>
                        </div>

                        {/* Localized comparison examples */}
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-zinc-400">
                            {calcCurrency === "ARS"
                              ? "¿Qué significa esta desvalorización en productos locales?"
                              : "¿Qué significa esta desvalorización en dólares físicos?"}
                          </p>
                          
                          {/* Cafes */}
                          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="text-amber-500 text-lg shrink-0">☕</div>
                              <div className="flex flex-col">
                                <span className="text-xs text-white font-semibold">
                                  {calcCurrency === "ARS" ? "Cafés con Medialunas" : "Cafés de Especialidad"}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {calcCurrency === "ARS" ? "Estimado en $3.500 ARS c/u" : "Estimado en US$ 3.50 c/u"}
                                </span>
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
                                <span className="text-[10px] text-zinc-500">
                                  {calcCurrency === "ARS" ? "Tanque 50L ($65.000 ARS c/u)" : "Tanque 50L (US$ 55 c/u)"}
                                </span>
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
                                <span className="text-xs text-white font-semibold">
                                  {calcCurrency === "ARS" ? "Asado para 4 Personas" : "Cena / Asado para 4 Personas"}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {calcCurrency === "ARS" ? "Carne y bebidas ($45.000 ARS c/u)" : "Cena completa (US$ 40 c/u)"}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-zinc-400 line-through font-mono">Antes: {calcMetrics.asados.initial}</span>
                              <span className="text-xs font-bold text-red-400 font-mono">Ahora: {calcMetrics.asados.final}</span>
                              <span className="text-[9px] text-red-500 font-medium font-mono">-{calcMetrics.asados.diff} comidas</span>
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
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black animate-blink-gold-text">Asesor IA Invert-Play</h3>
                            {isFallbackMode && (
                              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                Contingencia Activa
                              </span>
                            )}
                          </div>
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

                    {/* Special Guide for retirees and low incomes banner */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex gap-3">
                        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400 self-start sm:self-center">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                            👵🏽 Especial: Guía para Jubilados e Ingresos Mínimos
                          </span>
                          <span className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                            ¿Cómo optimizar haberes mínimos o jubilaciones bajas usando billeteras con rendimiento diario (rescate inmediato) y sin congelar tu dinero?
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendMessage("Soy jubilado o cobro un sueldo mínimo en Argentina. ¿Cómo puedo lograr mayor rendimiento con rescate inmediato sin congelar mi dinero en plazos fijos?")}
                        disabled={chatLoading}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs py-1.5 px-3.5 rounded-lg transition shrink-0 flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        Ver Estrategia
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
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
        <AdSenseBanner slot="banner-home-bottom" format="horizontal" className="lg:col-span-12 mt-4" />

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

          {/* Visitor Counter & Support Server Card (Real Visitor Tracking excluding creator) */}
          <div className="w-full md:w-[350px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="pb-2 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visitas Reales</h3>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EN VIVO
              </span>
            </div>

            {/* Creator Exclusion Mode Banner */}
            <div className={`p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
              isOwnerMode 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300" 
                : "bg-zinc-950 border-zinc-800 text-zinc-400"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Crown className={`w-4 h-4 ${isOwnerMode ? "text-amber-400" : "text-zinc-500"}`} />
                  <span>Modo Creador</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleOwnerMode(!isOwnerMode)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition active:scale-95 flex items-center gap-1 ${
                    isOwnerMode
                      ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-sm"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                  }`}
                >
                  {isOwnerMode ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Mis visitas: EXCLUIDAS</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Mis visitas: Incluidas</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400">
                {isOwnerMode ? (
                  <span className="text-amber-200/90 font-medium">
                    ✓ <strong>Tus visitas NO se contabilizan.</strong> Podés navegar, recargar y testear con total tranquilidad sin alterar las estadísticas.
                  </span>
                ) : (
                  <span>Tus ingresos a la app se están contando como una visita normal. Haz clic arriba para excluirte.</span>
                )}
              </p>
            </div>

            {/* Real Counter Box */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                Visitas Reales Totales
              </span>
              
              <div className="flex items-baseline gap-1.5 animate-blink-fast text-red-500 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                <span className="text-3xl font-black tracking-widest">{visitorCount.toLocaleString()}</span>
                <span className="text-xs font-bold uppercase">Visitas</span>
              </div>

              {/* Multi-metric Real Grid */}
              <div className="grid grid-cols-3 gap-2 w-full mt-1 pt-2 border-t border-zinc-900 text-[10px]">
                <div className="flex flex-col items-center bg-zinc-900/60 p-2 rounded-lg border border-zinc-850/60">
                  <span className="text-zinc-500 text-[8px] uppercase font-bold">Únicos</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">{uniqueUsers.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center bg-zinc-900/60 p-2 rounded-lg border border-zinc-850/60">
                  <span className="text-zinc-500 text-[8px] uppercase font-bold">Hoy</span>
                  <span className="text-blue-400 font-mono font-bold text-xs">{todayVisits.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center bg-zinc-900/60 p-2 rounded-lg border border-zinc-850/60">
                  <span className="text-zinc-500 text-[8px] uppercase font-bold">En Línea</span>
                  <span className="text-amber-400 font-mono font-bold text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                    {activeNow}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between w-full pt-2 border-t border-zinc-900 gap-2">
                <button
                  type="button"
                  onClick={handleManualVisitPulse}
                  className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg font-bold transition active:scale-95 flex-1"
                  title="Simular una visita externa para verificar que el contador funciona"
                >
                  + Simular Visita Externa
                </button>
                <button
                  type="button"
                  onClick={handleResetRealVisitorCount}
                  className="text-[9px] bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border border-zinc-700/50 hover:border-red-500/30 p-1.5 rounded-lg font-bold transition active:scale-95"
                  title="Reiniciar contador de visitas reales a 0"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Recent Real Visits Log */}
            <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-zinc-400 uppercase tracking-wider">Últimas Visitas Reales</span>
                <span className="text-zinc-500 font-mono">{recentVisits.length} reg.</span>
              </div>
              {recentVisits.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-zinc-600 font-mono">
                  [Aún no hay visitas externas registradas]
                </div>
              ) : (
                <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto pr-1 scrollbar-none">
                  {recentVisits.map((v, idx) => (
                    <div key={idx} className="bg-zinc-900/80 border border-zinc-850 px-2 py-1 rounded flex justify-between items-center text-[9px] font-mono">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        {v.deviceType === "Móvil" ? (
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-blue-400" />
                        )}
                        <span>{v.deviceType}</span>
                        {v.tab && <span className="text-zinc-500">({v.tab})</span>}
                      </div>
                      <span className="text-zinc-500">{v.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support server with steaming coffee image */}
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

      {/* Toast Notification Stack (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {/* Toast Notification for High Inflation */}
          {showInflationToast && !dismissedInflationToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="pointer-events-auto w-full bg-zinc-950 border-2 border-red-500/50 rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
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

          {/* Price Alerts and Volatility Toasts */}
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="pointer-events-auto w-full bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 relative overflow-hidden group border-l-4"
              style={{
                borderLeftColor: toast.type === "target_price" ? "#6366f1" : (toast.change && toast.change >= 0 ? "#10b981" : "#ef4444")
              }}
            >
              {/* Subtle background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/40 to-transparent pointer-events-none" />
              
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                    toast.type === "target_price" 
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                      : (toast.change && toast.change >= 0 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400")
                  }`}>
                    {toast.type === "target_price" ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      toast.type === "target_price" 
                        ? "text-indigo-400" 
                        : (toast.change && toast.change >= 0 ? "text-emerald-400" : "text-red-400")
                    }`}>
                      {toast.title}
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                      {toast.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 leading-none transition"
                >
                  ×
                </button>
              </div>

              {toast.symbol && (
                <div className="flex items-center justify-between mt-0.5 bg-zinc-900/50 px-2.5 py-1.5 rounded-xl border border-zinc-900 relative z-10">
                  <span className="text-[10px] text-zinc-400 font-mono">Instrumento: <strong className="text-white font-bold">{toast.symbol}</strong></span>
                  {toast.change !== undefined && (
                    <span className={`text-[10px] font-mono font-bold ${toast.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {toast.change >= 0 ? "+" : ""}{toast.change}%
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Quick Action Button for Asesor Invert-Play */}
      {activeTab !== "advisor" && (
        <button
          onClick={() => {
            setActiveTab("advisor");
            trackEvent("Floating Advisor Button Clicked");
            window.scrollTo({ top: 380, behavior: "smooth" });
          }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black py-2.5 px-4 rounded-full shadow-2xl shadow-amber-500/30 border border-amber-300 flex items-center gap-2 transition duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group"
          aria-label="Abrir Asesor Invert-Play"
        >
          <Sparkles className="w-4 h-4 text-zinc-950 group-hover:rotate-12 transition-transform" />
          <span className="text-xs tracking-wide">Asesor Invert-Play</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
      )}

    </div>
  );
}
