import { apiGet, apiPost } from "./api";
import type {
  AIProvider,
  ChainExplorerProvider,
  ChainHealth,
  ChainId,
  FearGreed,
  MarketDataProvider,
  MarketPulse,
  NewsItem,
  NewsProvider,
  QuotesResult,
  RpcProvider,
  SentimentProvider,
} from "./types";

// ---- Market (CoinMarketCap behind the proxy) -------------------------------
export const marketDataProvider: MarketDataProvider = {
  getQuotes: (symbols) => apiGet<QuotesResult>("/market/quotes", { symbols: symbols.join(",") }),
  getPulse: () => apiGet<MarketPulse>("/market/pulse"),
};

// ---- News (CryptoPanic behind the proxy, mock fallback) --------------------
export const newsProvider: NewsProvider = {
  getLatest: (limit = 6) => apiGet<NewsItem[]>("/news/latest", { limit }),
};

// ---- AI (Gemini 3 Flash behind the proxy) ----------------------------------
export const aiProvider: AIProvider = {
  getInsight: async (context) => {
    const r = await apiPost<{ insight: string }>("/ai/insight", { context });
    return r.insight;
  },
};

// ---- Sentiment (alternative.me behind the proxy) ---------------------------
export const sentimentProvider: SentimentProvider = {
  getFearGreed: () => apiGet<FearGreed>("/sentiment/fng"),
};

// ---- RPC health (demo multi-RPC health for MVP; BTC/ETH/BSC/TRX only) -------
function jitter(base: number, spread: number) {
  return Math.round(base + (Math.random() - 0.5) * spread);
}
const now = () => "just now";

export const rpcProvider: RpcProvider = {
  getChainHealth: async () => {
    const rows: ChainHealth[] = [
      { chain: "ETH", name: "Ethereum", status: "secure", provider: "Alchemy", latencyMs: jitter(42, 16), verified: "3/3", failover: false, blockHeight: 21_985_412 + jitter(0, 30), lastVerified: now() },
      { chain: "BSC", name: "BNB Chain", status: "secure", provider: "BSC dataseed", latencyMs: jitter(58, 20), verified: "3/3", failover: false, blockHeight: 43_112_009 + jitter(0, 40), lastVerified: now() },
      { chain: "BTC", name: "Bitcoin", status: "degraded", provider: "mempool.space", latencyMs: jitter(210, 40), verified: "2/3", failover: true, blockHeight: 884_120 + jitter(0, 2), lastVerified: now() },
      { chain: "TRX", name: "Tron", status: "secure", provider: "TronGrid", latencyMs: jitter(88, 24), verified: "2/2", failover: false, blockHeight: 69_884_512 + jitter(0, 60), lastVerified: now() },
    ];
    return rows;
  },
};

// ---- Explorer links --------------------------------------------------------
const EXPLORERS: Record<ChainId, { tx: string; addr: string }> = {
  BTC: { tx: "https://mempool.space/tx/", addr: "https://mempool.space/address/" },
  ETH: { tx: "https://etherscan.io/tx/", addr: "https://etherscan.io/address/" },
  BSC: { tx: "https://bscscan.com/tx/", addr: "https://bscscan.com/address/" },
  TRX: { tx: "https://tronscan.org/#/transaction/", addr: "https://tronscan.org/#/address/" },
};

export const chainExplorerProvider: ChainExplorerProvider = {
  txUrl: (chain, hash) => EXPLORERS[chain].tx + hash,
  addressUrl: (chain, address) => EXPLORERS[chain].addr + address,
};

export * from "./types";
