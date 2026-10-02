// Centralized market-price service (Phase 1 + Phase 7).
// - One batched quotes request for ALL dedup'd symbols.
// - React Query gives the in-flight lock (single query) + last-valid retention.
// - UI refresh cadence is 10s and is GATED by screen focus / app-active so the
//   interval stops when Home is not focused or the app is backgrounded.
// - Balance service is separate and NEVER on the 10s timer.
import { useQuery } from "@tanstack/react-query";

import {
  marketDataProvider,
  newsProvider,
  sentimentProvider,
  rpcProvider,
} from "@/src/providers";
import type { MarketQuote, QuotesResult } from "@/src/providers/types";
import { ASSETS, PRICE_SYMBOLS, type Asset } from "@/src/wallet/assets";

export const QK = {
  quotes: ["market", "quotes", PRICE_SYMBOLS.join(",")] as const,
  pulse: ["market", "pulse"] as const,
  fng: ["market", "fng"] as const,
  news: ["market", "news"] as const,
  health: ["network", "health"] as const,
};

const MARKET_REFRESH_MS = 10_000;

export function useQuotes(active: boolean) {
  return useQuery({
    queryKey: QK.quotes,
    queryFn: () => marketDataProvider.getQuotes(PRICE_SYMBOLS),
    refetchInterval: active ? MARKET_REFRESH_MS : false,
    refetchIntervalInBackground: false,
    // Keep the previously fetched prices while refetching — no zero/null flash.
    placeholderData: (prev) => prev,
    staleTime: 0,
    gcTime: 5 * 60_000,
  });
}

export function usePulse(active: boolean) {
  return useQuery({
    queryKey: QK.pulse,
    queryFn: () => marketDataProvider.getPulse(),
    refetchInterval: active ? 30_000 : false,
    placeholderData: (prev) => prev,
  });
}

export function useFearGreed() {
  return useQuery({
    queryKey: QK.fng,
    queryFn: () => sentimentProvider.getFearGreed(),
    staleTime: 5 * 60_000,
  });
}

export function useNews(limit = 6) {
  return useQuery({
    queryKey: QK.news,
    queryFn: () => newsProvider.getLatest(limit),
    staleTime: 2 * 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useChainHealth(active = true) {
  return useQuery({
    queryKey: QK.health,
    queryFn: () => rpcProvider.getChainHealth(),
    refetchInterval: active ? 15_000 : false,
    placeholderData: (prev) => prev,
  });
}

// ---- Derived portfolio ------------------------------------------------------
export interface PricedAsset extends Asset {
  price: number;
  change24h: number;
  fiat: number;
  sparkline: number[];
}

export interface Portfolio {
  total: number;
  changeAbs: number;
  changePct: number;
  assets: PricedAsset[];
  sparkline: number[];
}

export function quoteMap(data?: QuotesResult): Record<string, MarketQuote> {
  const map: Record<string, MarketQuote> = {};
  data?.quotes.forEach((q) => (map[q.symbol] = q));
  return map;
}

export function buildPortfolio(data?: QuotesResult): Portfolio {
  const map = quoteMap(data);
  const priced: PricedAsset[] = ASSETS.map((a) => {
    const q = map[a.priceSymbol];
    const price = q?.price ?? 0;
    return {
      ...a,
      price,
      change24h: q?.change24h ?? 0,
      fiat: price * a.balance,
      sparkline: q?.sparkline ?? [],
    };
  });
  const total = priced.reduce((s, a) => s + a.fiat, 0);
  // Change today = sum of each asset's 24h delta in fiat.
  const changeAbs = priced.reduce((s, a) => {
    const prev = a.change24h ? a.fiat / (1 + a.change24h / 100) : a.fiat;
    return s + (a.fiat - prev);
  }, 0);
  const prevTotal = total - changeAbs;
  const changePct = prevTotal > 0 ? (changeAbs / prevTotal) * 100 : 0;

  // Portfolio sparkline: value-weighted blend of per-asset sparklines.
  const len = 24;
  const spark = new Array(len).fill(0);
  priced.forEach((a) => {
    if (a.sparkline.length === len && a.price > 0) {
      for (let i = 0; i < len; i++) spark[i] += a.sparkline[i] * a.balance;
    }
  });
  const sparkline = spark.some((v) => v > 0) ? spark : [];

  return { total, changeAbs, changePct, assets: priced, sparkline };
}
