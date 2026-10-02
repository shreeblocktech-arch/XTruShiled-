import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Plus, Repeat, ScanLine, ShieldCheck, Sparkles, ArrowDown, ArrowUpRight, History } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { AppState, Dimensions, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AssetRow } from "@/src/components/AssetRow";
import { LiveIndicator } from "@/src/components/LiveIndicator";
import { Sparkline } from "@/src/components/Sparkline";
import { Card, Delta, Pressed, Txt } from "@/src/components/ui";
import { formatSignedUsd, formatUsd } from "@/src/lib/format";
import { seriesFor, TIMEFRAMES, type TF } from "@/src/lib/series";
import {
  buildPortfolio,
  QK,
  useChainHealth,
  useFearGreed,
  useNews,
  usePulse,
  useQuotes,
} from "@/src/services/marketService";
import { makeStyles, useTheme } from "@/src/theme";
import { useWallet } from "@/src/wallet/WalletContext";
import { aiProvider } from "@/src/providers";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { name } = useWallet();

  const [active, setActive] = useState(true);
  const [tf, setTf] = useState<TF>("1D");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setActive(AppState.currentState === "active");
      qc.invalidateQueries({ queryKey: QK.quotes });
      const sub = AppState.addEventListener("change", (s) => setActive(s === "active"));
      return () => {
        setActive(false);
        sub.remove();
      };
    }, [qc]),
  );

  const quotes = useQuotes(active);
  const pulse = usePulse(active);
  const fng = useFearGreed();
  const news = useNews(3);
  const health = useChainHealth(active);

  const portfolio = useMemo(() => buildPortfolio(quotes.data), [quotes.data]);
  const topAssets = useMemo(
    () => portfolio.assets.filter((a) => a.status !== "unverified" || a.balance > 0).slice(0, 4),
    [portfolio.assets],
  );

  const insight = useAiInsight(portfolio, pulse.data?.topGainer?.symbol);

  const status: "live" | "stale" = quotes.isError || (quotes.data && !quotes.data.live) ? "stale" : "live";
  const updatedAt = quotes.dataUpdatedAt || null;
  const degraded = (health.data ?? []).some((h) => h.status !== "secure");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([quotes.refetch(), pulse.refetch(), news.refetch(), fng.refetch(), health.refetch()]);
    setRefreshing(false);
  }, [quotes, pulse, news, fng, health]);

  const spark = useMemo(() => seriesFor(portfolio.sparkline, tf), [portfolio.sparkline, tf]);
  const hasData = portfolio.total > 0;
  const chartWidth = Math.max(220, Dimensions.get("window").width - 40);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky wallet header */}
      <View style={styles.header}>
        <Pressed style={styles.walletPill} onPress={() => router.push("/(tabs)/wallet")} testID="wallet-pill">
          <View style={styles.walletIcon}>
            <ShieldCheck size={14} color={colors.onBrandPrimary} />
          </View>
          <Txt variant="caption" numberOfLines={1}>
            {name ? `${name}'s wallet` : "Main wallet"}
          </Txt>
        </Pressed>
        <View style={styles.headerRight}>
          <Pressed style={styles.roundBtn} onPress={() => router.push("/(tabs)/history")} testID="history-shortcut">
            <History size={16} color={colors.onSurface} />
          </Pressed>
          <Pressed style={styles.roundBtn} onPress={() => router.push("/receive")} testID="scan-shortcut">
            <ScanLine size={16} color={colors.onSurface} />
          </Pressed>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Promo banner */}
        <Pressed onPress={() => router.push("/(tabs)/discover")} testID="promo-banner">
          <Card style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Sparkles size={15} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="title">Sentiren AI now live</Txt>
              <Txt variant="caption" tone="secondary">
                Try AI Insight
              </Txt>
            </View>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Card>
        </Pressed>

        {/* Portfolio hero */}
        <View style={styles.hero}>
          <Txt variant="caption" tone="secondary">
            Portfolio
          </Txt>
          <Txt
            variant="balance"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            style={styles.balance}
            testID="portfolio-balance"
          >
            {hasData ? formatUsd(portfolio.total) : "—"}
          </Txt>
          <View style={styles.deltaLine}>
            <Txt variant="caption" tone={portfolio.changeAbs >= 0 ? "positive" : "negative"} numberOfLines={1}>
              {portfolio.changeAbs >= 0 ? "▲" : "▼"} {hasData ? formatSignedUsd(portfolio.changeAbs) : ""} · {portfolio.changePct >= 0 ? "+" : ""}
              {portfolio.changePct.toFixed(2)}%
            </Txt>
            <LiveIndicator updatedAt={updatedAt} status={status} />
          </View>
        </View>

        {/* Compact portfolio chart */}
        <View style={styles.chartBox}>
          <Sparkline data={spark} width={chartWidth} height={54} color={colors.accent} fill />
          <View style={styles.tfRow}>
            {TIMEFRAMES.map((t) => (
              <Pressed key={t} onPress={() => setTf(t)} style={[styles.tfChip, tf === t && styles.tfChipActive]} testID={`timeframe-${t}`}>
                <Txt variant="micro" tone={tf === t ? "onBrand" : "secondary"}>
                  {t}
                </Txt>
              </Pressed>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <ActionBtn icon={<ArrowUpRight size={18} color={colors.onSurface} />} label="Send" onPress={() => router.push("/select-asset?mode=send")} testID="home-send" />
          <ActionBtn icon={<ArrowDown size={18} color={colors.onSurface} />} label="Receive" onPress={() => router.push("/select-asset?mode=receive")} testID="home-receive" />
          <ActionBtn icon={<Repeat size={18} color={colors.onBrandPrimary} />} label="Swap" highlight soon onPress={() => {}} testID="home-swap" />
          <ActionBtn icon={<Plus size={18} color={colors.onSurface} />} label="Buy" soon onPress={() => {}} testID="home-buy" />
        </View>

        {/* Tokens */}
        <View style={styles.sectionHead}>
          <Pressed style={styles.sectionTitle} onPress={() => router.push("/(tabs)/wallet")} testID="tokens-header">
            <Txt variant="h2">Tokens</Txt>
            <ChevronRight size={16} color={colors.textSecondary} />
          </Pressed>
        </View>
        <View>
          {topAssets.map((a) => (
            <AssetRow key={a.id} asset={a} onPress={() => router.push(`/asset/${a.id}`)} />
          ))}
          {!hasData ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Txt variant="caption" tone="tertiary">
                Loading live prices…
              </Txt>
            </View>
          ) : null}
        </View>
        <Pressed style={styles.viewAll} onPress={() => router.push("/(tabs)/wallet")} testID="assets-view-all">
          <Txt variant="caption">View all</Txt>
          <ChevronRight size={14} color={colors.onSurface} />
        </Pressed>

        {/* Market Pulse */}
        <Txt variant="h2" style={styles.h}>
          Market Pulse
        </Txt>
        <Card style={styles.pulse}>
          <PulseCell label="Top gainer" symbol={pulse.data?.topGainer?.symbol} value={pulse.data?.topGainer?.change24h} />
          <View style={styles.vDiv} />
          <PulseCell label="Top loser" symbol={pulse.data?.topLoser?.symbol} value={pulse.data?.topLoser?.change24h} />
          <View style={styles.vDiv} />
          <View style={styles.pulseCell}>
            <Txt variant="micro" tone="tertiary">
              Fear & Greed
            </Txt>
            <Txt variant="num" style={{ color: fngColor(fng.data?.value ?? 50, colors) }}>
              {fng.data?.value ?? "—"}
            </Txt>
            <Txt variant="micro" tone="secondary">
              {fng.data?.classification ?? ""}
            </Txt>
          </View>
        </Card>

        {/* AI Insight */}
        <Pressed onPress={() => router.push("/(tabs)/discover")} testID="ai-insight-card">
          <Card style={styles.aiCard}>
            <View style={styles.aiIcon}>
              <Sparkles size={15} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="title" tone="accent">
                AI Insight
              </Txt>
              <Txt variant="caption" style={{ marginTop: 3 }}>
                {insight.data ?? "Analyzing your portfolio and the market…"}
              </Txt>
            </View>
          </Card>
        </Pressed>

        {/* Security */}
        <Pressed onPress={() => router.push("/security")} testID="home-security-card">
          <Card style={styles.secCard}>
            <ShieldCheck size={18} color={degraded ? colors.warning : colors.positive} />
            <View style={{ flex: 1 }}>
              <Txt variant="title">{degraded ? "Attention needed" : "Protected"}</Txt>
              <Txt variant="caption" tone="secondary">
                {degraded ? "1 network degraded · failover active" : "All systems secure · last scan 2m ago"}
              </Txt>
            </View>
            <View style={[styles.secDot, { backgroundColor: degraded ? colors.warning : colors.positive }]} />
          </Card>
        </Pressed>

        {/* Latest news */}
        <Txt variant="h2" style={styles.h}>
          Latest
        </Txt>
        <Card style={{ gap: 11 }}>
          {(news.data ?? []).map((n, i) => (
            <View key={i} style={styles.newsRow} testID={`news-item-${i}`}>
              <View style={styles.newsBar} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyMed" numberOfLines={2}>
                  {n.title}
                </Txt>
                <Txt variant="micro" tone="tertiary" style={{ marginTop: 3 }}>
                  {n.source} · {n.publishedAt}
                </Txt>
              </View>
            </View>
          ))}
          {!news.data ? (
            <Txt variant="caption" tone="tertiary">
              Loading headlines…
            </Txt>
          ) : null}
        </Card>
      </ScrollView>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, soon, highlight, testID }: { icon: React.ReactNode; label: string; onPress: () => void; soon?: boolean; highlight?: boolean; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressed style={styles.actionItem} onPress={onPress} disabled={soon} testID={testID}>
      <View style={[styles.actionBtn, highlight && styles.actionBtnHighlight, soon && !highlight && styles.actionBtnSoon]}>{icon}</View>
      <Txt variant="caption" tone={soon && !highlight ? "tertiary" : "primary"}>
        {label}
      </Txt>
    </Pressed>
  );
}

function PulseCell({ label, symbol, value }: { label: string; symbol?: string; value?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.pulseCell}>
      <Txt variant="micro" tone="tertiary">
        {label}
      </Txt>
      <Txt variant="num">{symbol ?? "—"}</Txt>
      {value != null ? <Delta value={value} size="micro" /> : <Txt variant="micro" tone="secondary">—</Txt>}
    </View>
  );
}

function fngColor(v: number, colors: ReturnType<typeof useTheme>["colors"]) {
  if (v >= 55) return colors.positive;
  if (v <= 45) return colors.negative;
  return colors.warning;
}

function useAiInsight(portfolio: ReturnType<typeof buildPortfolio>, gainer?: string) {
  const top = portfolio.assets.slice(0, 4).map((a) => `${a.symbol} ${a.change24h.toFixed(1)}%`).join(", ");
  const context = `Portfolio ~${Math.round(portfolio.total)} USD, today ${portfolio.changePct.toFixed(2)}%. Holdings: ${top}. Top gainer: ${gainer ?? "n/a"}.`;
  return useQuery({
    queryKey: ["ai", "home", top, gainer],
    queryFn: () => aiProvider.getInsight(context),
    enabled: portfolio.total > 0,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 },
  walletPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surfaceTertiary, borderRadius: 22, paddingVertical: 6, paddingLeft: 6, paddingRight: 14, maxWidth: 200 },
  walletIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  headerRight: { flexDirection: "row", gap: 8 },
  roundBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11 },
  bannerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" },
  hero: { marginTop: 18, gap: 3 },
  balance: { marginTop: 2 },
  deltaLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  chartBox: { marginTop: 12 },
  tfRow: { position: "absolute", right: 0, top: 0, flexDirection: "row", gap: 5 },
  tfChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: c.surfaceTertiary },
  tfChipActive: { backgroundColor: c.brandPrimary },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  actionItem: { alignItems: "center", gap: 6 },
  actionBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  actionBtnHighlight: { backgroundColor: c.brandPrimary },
  actionBtnSoon: { opacity: 0.5 },
  sectionHead: { marginTop: 22, marginBottom: 2 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: c.surfaceTertiary, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8, marginTop: 8 },
  h: { marginTop: 22, marginBottom: 8 },
  pulse: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  pulseCell: { flex: 1, alignItems: "center", gap: 3 },
  vDiv: { width: 1, height: 32, backgroundColor: c.divider },
  aiCard: { flexDirection: "row", gap: 11, alignItems: "center", marginTop: 11, borderColor: c.accent + "33" },
  aiIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" },
  secCard: { flexDirection: "row", gap: 11, alignItems: "center", marginTop: 11 },
  secDot: { width: 8, height: 8, borderRadius: 4 },
  newsRow: { flexDirection: "row", gap: 10 },
  newsBar: { width: 3, borderRadius: 2, backgroundColor: c.brandPrimary },
}));
