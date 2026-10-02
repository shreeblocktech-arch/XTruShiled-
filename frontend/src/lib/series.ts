export type TF = "1D" | "1W" | "1M" | "1Y";
export const TIMEFRAMES: TF[] = ["1D", "1W", "1M", "1Y"];

// Visual-only longer series derived from the live intraday sparkline.
// 1D returns the real intraday points; longer frames are synthesized around the
// same start/end so the shape stays plausible without extra API calls.
export function seriesFor(base: number[], tf: TF): number[] {
  if (!base.length) return base;
  if (tf === "1D") return base;
  const n = tf === "1W" ? 32 : tf === "1M" ? 44 : 60;
  const start = base[0];
  const end = base[base.length - 1];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const drift = start + (end - start) * f;
    const wobble = Math.sin(f * Math.PI * (tf === "1Y" ? 6 : 4) + start) * Math.abs(end - start) * 0.55;
    out.push(drift + wobble);
  }
  out[n - 1] = end;
  return out;
}
