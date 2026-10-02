export interface Tx {
  id: string;
  type: "in" | "out";
  symbol: string;
  amount: number;
  counterparty: string;
  group: "Today" | "Yesterday" | "This week";
  time: string;
  chain: string;
}

export const ACTIVITY: Tx[] = [
  { id: "t1", type: "in", symbol: "BTC", amount: 0.15, counterparty: "bc1q…4a2", group: "Today", time: "10:24", chain: "Bitcoin" },
  { id: "t2", type: "out", symbol: "ETH", amount: 0.4, counterparty: "0x8a…9f2", group: "Today", time: "09:03", chain: "Ethereum" },
  { id: "t3", type: "out", symbol: "USDT", amount: 250, counterparty: "TR7N…jLj6", group: "Today", time: "08:41", chain: "Tron" },
  { id: "t4", type: "in", symbol: "BNB", amount: 1.2, counterparty: "0x33…c71", group: "Yesterday", time: "21:15", chain: "BNB Chain" },
  { id: "t5", type: "in", symbol: "BTC", amount: 0.1, counterparty: "bc1q…8c3", group: "Yesterday", time: "16:50", chain: "Bitcoin" },
  { id: "t6", type: "out", symbol: "LINK", amount: 30, counterparty: "0x51…3CA1", group: "This week", time: "Mon", chain: "Ethereum" },
  { id: "t7", type: "in", symbol: "USDC", amount: 500, counterparty: "0xA0…eB48", group: "This week", time: "Sun", chain: "Ethereum" },
];

export function activityFor(symbol?: string): Tx[] {
  return symbol ? ACTIVITY.filter((t) => t.symbol === symbol) : ACTIVITY;
}
