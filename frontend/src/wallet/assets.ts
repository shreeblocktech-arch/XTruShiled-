// Verified Asset Registry + demo holdings. Solana intentionally absent (MVP).
import { sha256Hex } from "./sha256";

export type ChainId = "BTC" | "ETH" | "BSC" | "TRX";
export type VerifyStatus = "verified" | "bridged" | "unverified";

export interface ChainMeta {
  id: ChainId;
  name: string;
  color: string;
}

export const CHAINS: Record<ChainId, ChainMeta> = {
  BTC: { id: "BTC", name: "Bitcoin", color: "#F7931A" },
  ETH: { id: "ETH", name: "Ethereum", color: "#627EEA" },
  BSC: { id: "BSC", name: "BNB Chain", color: "#F0B90B" },
  TRX: { id: "TRX", name: "Tron", color: "#EF0027" },
};

export interface Asset {
  id: string;
  symbol: string; // display symbol
  priceSymbol: string; // symbol used for market pricing
  name: string;
  chain: ChainId;
  network: string; // e.g. "ERC-20"
  decimals: number;
  balance: number;
  status: VerifyStatus;
  listNumber: number | null;
  color: string;
  contract?: string;
}

// Demo holdings for preview (balances are demo; prices are live).
export const ASSETS: Asset[] = [
  { id: "btc", symbol: "BTC", priceSymbol: "BTC", name: "Bitcoin", chain: "BTC", network: "Bitcoin", decimals: 8, balance: 0.842, status: "verified", listNumber: 1, color: "#F7931A" },
  { id: "eth", symbol: "ETH", priceSymbol: "ETH", name: "Ethereum", chain: "ETH", network: "Native", decimals: 18, balance: 4.106, status: "verified", listNumber: 2, color: "#627EEA" },
  { id: "bnb", symbol: "BNB", priceSymbol: "BNB", name: "BNB", chain: "BSC", network: "Native", decimals: 18, balance: 12.5, status: "verified", listNumber: 3, color: "#F0B90B" },
  { id: "trx", symbol: "TRX", priceSymbol: "TRX", name: "Tron", chain: "TRX", network: "Native", decimals: 6, balance: 15840, status: "verified", listNumber: 5, color: "#EF0027" },
  { id: "usdt-erc20", symbol: "USDT", priceSymbol: "USDT", name: "Tether", chain: "ETH", network: "ERC-20", decimals: 6, balance: 5200, status: "verified", listNumber: 6, color: "#26A17B", contract: "0xdAC1...1ec7" },
  { id: "usdc", symbol: "USDC", priceSymbol: "USDC", name: "USD Coin", chain: "ETH", network: "ERC-20", decimals: 6, balance: 3100, status: "verified", listNumber: 7, color: "#2775CA", contract: "0xA0b8...eB48" },
  { id: "usdt-trc20", symbol: "USDT", priceSymbol: "USDT", name: "Tether", chain: "TRX", network: "TRC-20", decimals: 6, balance: 2400, status: "verified", listNumber: 6, color: "#26A17B", contract: "TR7N...jLj6" },
  { id: "dai", symbol: "DAI", priceSymbol: "DAI", name: "Dai", chain: "ETH", network: "ERC-20", decimals: 18, balance: 820, status: "verified", listNumber: 11, color: "#F5AC37", contract: "0x6B17...1d0F" },
  { id: "link", symbol: "LINK", priceSymbol: "LINK", name: "Chainlink", chain: "ETH", network: "ERC-20", decimals: 18, balance: 210, status: "verified", listNumber: 12, color: "#2A5ADA", contract: "0x5149...3CA1" },
  { id: "matic-bridged", symbol: "MATIC", priceSymbol: "MATIC", name: "Polygon (Bridged)", chain: "BSC", network: "BEP-20", decimals: 18, balance: 4200, status: "bridged", listNumber: 18, color: "#8247E5", contract: "0xCC42...9270" },
  // Unverified — hidden on dashboard unless balance > 0.
  { id: "xshld", symbol: "XSHLD", priceSymbol: "XSHLD", name: "XShield Token", chain: "BSC", network: "BEP-20", decimals: 18, balance: 0, status: "unverified", listNumber: null, color: "#6B7280", contract: "0x9f01...ab77" },
];

export const PRICE_SYMBOLS = Array.from(new Set(ASSETS.map((a) => a.priceSymbol)));

// Deterministic demo addresses derived from the mnemonic (display only; real
// EC key derivation requires a native dev client and lands with signing).
export function deriveAddresses(mnemonic: string): Record<ChainId, string> {
  const evm = "0x" + sha256Hex(mnemonic + ":evm").slice(0, 40);
  return {
    ETH: evm,
    BSC: evm,
    BTC: "bc1q" + sha256Hex(mnemonic + ":btc").slice(0, 38),
    TRX: "T" + sha256Hex(mnemonic + ":trx").slice(0, 33),
  };
}
