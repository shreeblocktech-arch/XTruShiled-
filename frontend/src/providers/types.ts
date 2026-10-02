// Shared provider data contracts. UI code depends ONLY on these interfaces —
// never on CryptoPanic / Gemini / alternative.me / CoinMarketCap / RPC vendors
// directly. Implementations are swappable behind these types.

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change1h?: number | null;
  change7d?: number | null;
  marketCap?: number | null;
  volume24h?: number | null;
  sparkline: number[];
}

export interface QuotesResult {
  quotes: MarketQuote[];
  dataTimestamp: string;
  live: boolean;
}

export interface PulseMover {
  symbol: string;
  name: string;
  change24h: number;
  price: number;
}

export interface MarketPulse {
  topGainer: PulseMover | null;
  topLoser: PulseMover | null;
  dataTimestamp: string;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface FearGreed {
  value: number;
  classification: string;
}

export type ChainId = "BTC" | "ETH" | "BSC" | "TRX";

export interface ChainHealth {
  chain: ChainId;
  name: string;
  status: "secure" | "degraded" | "offline";
  provider: string;
  latencyMs: number;
  verified: string; // e.g. "3/3"
  failover: boolean;
  blockHeight: number;
  lastVerified: string;
}

export interface MarketDataProvider {
  getQuotes(symbols: string[]): Promise<QuotesResult>;
  getPulse(): Promise<MarketPulse>;
}

export interface NewsProvider {
  getLatest(limit?: number): Promise<NewsItem[]>;
}

export interface AIProvider {
  getInsight(context: string): Promise<string>;
}

export interface SentimentProvider {
  getFearGreed(): Promise<FearGreed>;
}

export interface RpcProvider {
  getChainHealth(): Promise<ChainHealth[]>;
}

export interface ChainExplorerProvider {
  txUrl(chain: ChainId, hash: string): string;
  addressUrl(chain: ChainId, address: string): string;
}
