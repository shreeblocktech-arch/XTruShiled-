import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Flag,
  Repeat,
  ShieldCheck,
  Shuffle,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AssetIcon } from "@/src/components/AssetIcon";
import { InteractiveChart } from "@/src/components/InteractiveChart";
import { Card, Delta, Pressed, Txt } from "@/src/components/ui";
import { formatPrice, formatToken, formatUsd } from "@/src/lib/format";
import { seriesFor, TIMEFRAMES, type TF } from "@/src/lib/series";
import { quoteMap, useQuotes } from "@/src/services/marketService";
import { makeStyles, useTheme } from "@/src/theme";
import { ASSETS } from "@/src/wallet/assets";
import { activityFor } from "@/src/wallet/activity";

const TABS = ["Activity", "Market", "Security", "More"] as const;
type Tab = (typeof TABS)[number];

export default function AssetDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = ASSETS.find((a) => a.id === id) ?? ASSETS[0];
  const [tab, setTab] = useState<Tab>("Activity");

  const quotes = useQuotes(true);
  const q = useMemo(() => quoteMap(quotes.data)[asset.priceSymbol], [quotes.data, asset.priceSymbol]);
  const price = q?.price ?? 0;
  const fiat = price * asset.balance;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} testID="sheet-backdrop" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        {/* Header */}
        <View style={styles.header}>
          <AssetIcon symbol={asset.symbol} color={asset.color} size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{asset.name}</Txt>
            <View style={styles.badgeRow}>
              {asset.status === "verified" ? (
                <>
                  <CheckCircle2 size={12} color={colors.verified} />
                  <Txt variant="micro" tone="accent">
                    Verified{asset.listNumber ? ` • List #${asset.listNumber}` : ""}
                  </Txt>
                </>
              ) : asset.status === "bridged" ? (
                <>
                  <Shuffle size={12} color={colors.bridged} />
                  <Txt variant="micro" tone="warning">
                    Bridged{asset.listNumber ? ` • List #${asset.listNumber}` : ""}
                  </Txt>
                </>
              ) : (
                <Txt variant="micro" tone="tertiary">
                  Unverified
                </Txt>
              )}
            </View>
          </View>
          <Pressed style={styles.close} onPress={() => router.back()} testID="sheet-close">
            <X size={20} color={colors.onSurface} />
          </Pressed>
        </View>

        {/* Price + balance */}
        <View style={styles.priceRow}>
          <View>
            <Txt variant="numLg">{formatPrice(price)}</Txt>
            <Txt variant="micro" tone="tertiary">
              Market price
            </Txt>
          </View>
          {q ? <Delta value={q.change24h} /> : null}
        </View>
        <View style={styles.balanceBox}>
          <Txt variant="caption" tone="secondary">
            Your balance
          </Txt>
          <Txt variant="h2" style={{ marginTop: 2 }}>
            {formatToken(asset.balance, asset.symbol)}
          </Txt>
          <Txt variant="caption" tone="tertiary">
            ≈ {formatUsd(fiat)}
          </Txt>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Action icon={<ArrowUpRight size={20} color={colors.accent} />} label="Send" onPress={() => router.replace(`/send?assetId=${asset.id}`)} testID="sheet-send" />
          <Action icon={<ArrowDownLeft size={20} color={colors.accent} />} label="Receive" onPress={() => router.replace(`/receive?assetId=${asset.id}`)} testID="sheet-receive" />
          <Action icon={<Repeat size={20} color={colors.textTertiary} />} label="Swap" soon onPress={() => {}} testID="sheet-swap" />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressed key={t} style={styles.tab} onPress={() => setTab(t)} testID={`tab-${t}`}>
              <Txt variant="caption" tone={tab === t ? "primary" : "tertiary"}>
                {t}
              </Txt>
              <View style={[styles.tabBar, tab === t && { backgroundColor: colors.accent }]} />
            </Pressed>
          ))}
        </View>

        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {tab === "Activity" ? <ActivityTab symbol={asset.symbol} /> : null}
          {tab === "Market" ? <MarketTab spark={q?.sparkline ?? []} price={price} change={q?.change24h ?? 0} mktCap={q?.marketCap ?? 0} vol={q?.volume24h ?? 0} /> : null}
          {tab === "Security" ? <SecurityTab status={asset.status} /> : null}
          {tab === "More" ? <MoreTab asset={asset} /> : null}
        </ScrollView>
      </View>
    </View>
  );
}

function Action({ icon, label, onPress, soon, testID }: { icon: React.ReactNode; label: string; onPress: () => void; soon?: boolean; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressed style={[styles.actionPill, soon && styles.actionSoon]} onPress={onPress} disabled={soon} testID={testID}>
      {icon}
      <Txt variant="title" tone={soon ? "tertiary" : "primary"}>
        {label}
      </Txt>
      {soon ? (
        <Txt variant="micro" tone="tertiary" style={{ fontSize: 9 }}>
          Soon
        </Txt>
      ) : null}
    </Pressed>
  );
}

function ActivityTab({ symbol }: { symbol: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const txs = activityFor(symbol);
  if (!txs.length)
    return (
      <Txt variant="caption" tone="tertiary" style={{ paddingVertical: 20, textAlign: "center" }}>
        No activity yet for {symbol}.
      </Txt>
    );
  return (
    <View style={{ gap: 4 }}>
      {txs.map((t) => (
        <View key={t.id} style={styles.txRow}>
          <View style={[styles.txIcon, { backgroundColor: (t.type === "in" ? colors.positive : colors.negative) + "1A" }]}>
            {t.type === "in" ? <ArrowDownLeft size={16} color={colors.positive} /> : <ArrowUpRight size={16} color={colors.negative} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyMed">{t.type === "in" ? "Received" : "Sent"}</Txt>
            <Txt variant="micro" tone="tertiary">
              {t.type === "in" ? "from" : "to"} {t.counterparty}
            </Txt>
          </View>
          <Txt variant="num" tone={t.type === "in" ? "positive" : "primary"}>
            {t.type === "in" ? "+" : "-"}
            {formatToken(t.amount, t.symbol)}
          </Txt>
        </View>
      ))}
    </View>
  );
}

function MarketTab({ spark, price, change, mktCap, vol }: { spark: number[]; price: number; change: number; mktCap: number; vol: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [tf, setTf] = useState<TF>("1D");
  const data = useMemo(() => seriesFor(spark, tf), [spark, tf]);
  const chartWidth = Dimensions.get("window").width - 36 - 28;
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.chartBox}>
        <InteractiveChart data={data} width={chartWidth} height={150} color={change >= 0 ? colors.positive : colors.negative} />
        <View style={styles.chartTfRow}>
          {TIMEFRAMES.map((t) => (
            <Pressed key={t} onPress={() => setTf(t)} style={[styles.chartTf, tf === t && styles.chartTfActive]} testID={`asset-tf-${t}`}>
              <Txt variant="micro" tone={tf === t ? "onBrand" : "secondary"}>
                {t}
              </Txt>
            </Pressed>
          ))}
        </View>
      </View>
      <View style={styles.statGrid}>
        <MarketStat label="Price" value={formatPrice(price)} />
        <MarketStat label="24h" value={`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`} />
        <MarketStat label="Market cap" value={formatUsd(mktCap, { compact: true })} />
        <MarketStat label="24h volume" value={formatUsd(vol, { compact: true })} />
      </View>
    </View>
  );
}

function MarketStat({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.marketStat}>
      <Txt variant="micro" tone="tertiary">
        {label}
      </Txt>
      <Txt variant="num">{value}</Txt>
    </View>
  );
}

function SecurityTab({ status }: { status: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const checks = [
    { label: "Asset verified in registry", ok: status !== "unverified" },
    { label: "Network operational", ok: true },
    { label: "On-chain decimals confirmed", ok: true },
    { label: "Contract reputation checked", ok: true },
    { label: "No known threats", ok: true },
  ];
  return (
    <View style={{ gap: 10 }}>
      {checks.map((c) => (
        <View key={c.label} style={styles.checkRow}>
          <CheckCircle2 size={16} color={c.ok ? colors.positive : colors.textTertiary} />
          <Txt variant="bodyMed" tone={c.ok ? "primary" : "tertiary"}>
            {c.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

function MoreTab({ asset }: { asset: (typeof ASSETS)[number] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const rows = ["Buy", "Sell", "Bridge", "DApps", "Token info"];
  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 2 }}>
        {rows.map((r, i) => (
          <View key={r}>
            <Pressed style={styles.moreRow} testID={`more-${r}`}>
              <Txt variant="bodyMed" style={{ flex: 1 }}>
                {r}
              </Txt>
              <ChevronRight size={16} color={colors.textTertiary} />
            </Pressed>
            {i < rows.length - 1 ? <View style={styles.moreDivider} /> : null}
          </View>
        ))}
      </Card>

      {/* Verified Asset Registry card */}
      <Card style={{ gap: 10 }}>
        <View style={styles.regHead}>
          <ShieldCheck size={16} color={colors.accent} />
          <Txt variant="title">Verified Asset Registry</Txt>
        </View>
        <RegRow label="List number" value={asset.listNumber ? `#${asset.listNumber}` : "—"} />
        <RegRow label="Status" value={asset.status[0].toUpperCase() + asset.status.slice(1)} />
        <RegRow label="Network" value={asset.network} />
        <RegRow label="On-chain decimals" value={`${asset.decimals} ✓`} />
        <RegRow label="Verification source" value="XtruShield Registry" />
        {asset.contract ? <RegRow label="Contract" value={asset.contract} /> : null}
        <Pressed style={styles.report} testID="report-asset">
          <Flag size={14} color={colors.negative} />
          <Txt variant="caption" tone="negative">
            Report this asset
          </Txt>
        </Pressed>
      </Card>
    </View>
  );
}

function RegRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.regRow}>
      <Txt variant="caption" tone="tertiary">
        {label}
      </Txt>
      <Txt variant="caption">{value}</Txt>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...({ position: "absolute" } as const), top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(3,6,12,0.7)" },
  sheet: {
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "92%",
    borderTopWidth: 1,
    borderColor: c.border,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderStrong, marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 },
  balanceBox: { marginTop: 14, backgroundColor: c.surfaceTertiary, borderRadius: 14, padding: 14 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionPill: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: c.accentSoft,
    borderWidth: 1,
    borderColor: c.accent + "44",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionSoon: { backgroundColor: c.surfaceTertiary, borderColor: c.border },
  tabs: { flexDirection: "row", marginTop: 18, borderBottomWidth: 1, borderBottomColor: c.divider },
  tab: { flex: 1, alignItems: "center", gap: 8, paddingTop: 4 },
  tabBar: { height: 2, width: "60%", borderRadius: 1, backgroundColor: "transparent" },
  tabContent: { marginTop: 14 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  txIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  chartBox: { backgroundColor: c.surfaceTertiary, borderRadius: 14, padding: 14, gap: 12 },
  chartTfRow: { flexDirection: "row", gap: 6, justifyContent: "center" },
  chartTf: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: c.surfaceSecondary },
  chartTfActive: { backgroundColor: c.brandPrimary },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  marketStat: { width: "47%", backgroundColor: c.surfaceTertiary, borderRadius: 12, padding: 12, gap: 4 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  moreRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 4 },
  moreDivider: { height: 1, backgroundColor: c.divider },
  regHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  regRow: { flexDirection: "row", justifyContent: "space-between" },
  report: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: c.divider },
}));
