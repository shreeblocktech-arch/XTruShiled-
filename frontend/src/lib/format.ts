// Formatting helpers (Hermes-safe, no Intl dependency).
function groupInt(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value)) return "$0.00";
  const neg = value < 0;
  const v = Math.abs(value);
  if (opts?.compact && v >= 1_000_000_000) return `${neg ? "-" : ""}$${(v / 1e9).toFixed(2)}B`;
  if (opts?.compact && v >= 1_000_000) return `${neg ? "-" : ""}$${(v / 1e6).toFixed(2)}M`;
  if (opts?.compact && v >= 1_000) return `${neg ? "-" : ""}$${(v / 1e3).toFixed(2)}K`;
  const fixed = v.toFixed(2);
  const [int, dec] = fixed.split(".");
  return `${neg ? "-" : ""}$${groupInt(int)}.${dec}`;
}

export function formatPrice(value: number): string {
  if (!isFinite(value) || value === 0) return "$0.00";
  if (value >= 1) return formatUsd(value);
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(2)}`;
}

export function formatPct(value: number): string {
  if (!isFinite(value)) return "0.00%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatSignedUsd(value: number): string {
  return `${value >= 0 ? "+" : "-"}${formatUsd(Math.abs(value))}`;
}

export function formatToken(value: number, symbol?: string): string {
  const s = value >= 1000 ? groupInt(Math.round(value).toString()) : parseFloat(value.toFixed(6)).toString();
  return symbol ? `${s} ${symbol}` : s;
}

export function shortAddr(addr: string, lead = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= lead + tail + 3) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}
