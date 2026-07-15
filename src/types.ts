export interface CurrencyRate {
  name: string;
  buy: number;
  sell: number;
  icon: string;
  change?: number;
}

export interface FixedIncomeInstrument {
  name: string;
  rate: string;
  yield: string;
  delay: string;
  risk: string;
  desc: string;
}

export interface CedearInstrument {
  symbol: string;
  name: string;
  priceARS: number;
  change: number;
  ratio: string;
  assetClass: string;
}

export interface LocalStockInstrument {
  symbol: string;
  name: string;
  priceARS: number;
  change: number;
}

export interface CryptoInstrument {
  symbol: string;
  name: string;
  priceUSD: number;
  priceARS: number;
  change: number;
}

export interface MacroeconomicData {
  monthlyInflation: number;
  projectedAnnualInflation: number;
  riskCountry: number;
}

export interface FinancialRates {
  currencies: CurrencyRate[];
  fixedIncome: FixedIncomeInstrument[];
  cedears: CedearInstrument[];
  localStocks: LocalStockInstrument[];
  crypto: CryptoInstrument[];
  macroeconomics: MacroeconomicData;
}

export type RiskProfile = "conservador" | "moderado" | "agresivo";

export interface UserProfile {
  capital: number;
  currency: "ARS" | "USD";
  riskProfile: RiskProfile;
  goals: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SimulationAllocation {
  instrumentName: string;
  percentage: number;
  amount: number;
  projectedReturn: number; // calculated projected return for the selected period
}

export interface SimulationResult {
  month: number;
  "Suma Invertida": number;
  "Retorno Proyectado": number;
  "Pérdida por Inflación (Efectivo)": number;
  "Promedio de Mercado"?: number;
}
