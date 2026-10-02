import { useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Calculator,
  Compass,
  CreditCard,
  Fuel,
  Gauge,
  Globe,
  HardDrive,
  LineChart,
  Link2,
  Newspaper,
  Radar,
  Repeat,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet2,
} from "lucide-react-native";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Delta, Pressed, Txt } from "@/src/components/ui";
import { useActiveFocus } from "@/src/hooks/useActiveFocus";
import { quoteMap, useFearGreed, useQuotes } from "@/src/services/marketService";
import { makeStyles, useTheme } from "@/src/theme";

type Item = { icon: React.ReactNode; label: string; route?: string; soon?: boolean };

export default function DiscoverScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const active = useActiveFocus();
  const quotes = useQuotes(active);
  const fng = useFearGreed();

  const eth = useMemo(() => quoteMap(quotes.data).ETH, [quotes.data]);
  const ethDown = (eth?.change24h ?? 0) < 0;

  const sections: { title: string; color: string; items: Item[] }[] = [
    {
      title: "Security",
      color: colors.positive,
      items: [
        { icon: <Shield size={18} color={colors.positive} />, label: "Overview", route: "/security" },
        { icon: <ShieldAlert size={18} color={colors.positive} />, label: "Threats", route: "/security" },
        { icon: <Radar size={18} color={colors.positive} />, label: "Address Intelligence", route: "/security" },
        { icon: <Search size={18} color={colors.positive} />, label: "Scam Scanner", soon: true },
        { icon: <Activity size={18} color={colors.positive} />, label: "Transaction Guard", route: "/security" },
      ],
    },
    {
      title: "Market",
      color: colors.accent,
      items: [
        { icon: <LineChart size={18} color={colors.accent} />, label: "Overview", soon: true },
        { icon: <TrendingUp size={18} color={colors.accent} />, label: "Trending", soon: true },
        { icon: <Gauge size={18} color={colors.accent} />, label: "Fear & Greed", soon: true },
        { icon: <Sparkles size={18} color={colors.accent} />, label: "New / Hot Assets", soon: true },
      ],
    },
    {
      title: "AI",
      color: colors.onBrandTertiary,
      items: [
        { icon: <Bot size={18} color={colors.onBrandTertiary} />, label: "AI Hub", soon: true },
        { icon: <Gauge size={18} color={colors.onBrandTertiary} />, label: "Portfolio Analyzer", soon: true },
        { icon: <AlertTriangle size={18} color={colors.onBrandTertiary} />, label: "Risk Checker", soon: true },
        { icon: <Newspaper size={18} color={colors.onBrandTertiary} />, label: "News Analyzer", soon: true },
      ],
    },
    {
      title: "Tools",
      color: colors.warning,
      items: [
        { icon: <AlertTriangle size={18} color={colors.warning} />, label: "Price Alerts", soon: true },
        { icon: <Repeat size={18} color={colors.warning} />, label: "Converter", soon: true },
        { icon: <Calculator size={18} color={colors.warning} />, label: "Calculator", soon: true },
        { icon: <Fuel size={18} color={colors.warning} />, label: "Gas Tracker", soon: true },
        { icon: <CreditCard size={18} color={colors.warning} />, label: "XtruShield Card", route: "/card" },
        { icon: <HardDrive size={18} color={colors.warning} />, label: "Hardware Wallet", route: "/hardware" },
      ],
    },
    {
      title: "DApps",
      color: colors.accent,
      items: [
        { icon: <Globe size={18} color={colors.accent} />, label: "DApp Browser", soon: true },
        { icon: <Link2 size={18} color={colors.accent} />, label: "WalletConnect", soon: true },
        { icon: <Wallet2 size={18} color={colors.accent} />, label: "Active Sessions", route: "/security" },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Compass size={20} color={colors.onSurface} />
        <Txt variant="h2">Discover</Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Connective intelligence: Market -> News -> Security -> AI */}
        <Card style={styles.connect} testID="connective-intelligence">
          <View style={styles.connectHead}>
            <Sparkles size={16} color={colors.accent} />
            <Txt variant="title" tone="accent">
              Live Intelligence
            </Txt>
          </View>
          <View style={styles.connectRow}>
            <Txt variant="bodyMed">ETH {eth ? `${ethDown ? "" : "+"}${eth.change24h.toFixed(1)}%` : "—"}</Txt>
            {eth ? <Delta value={eth.change24h} size="micro" /> : null}
          </View>
          <View style={styles.chain}>
            <ArrowRight size={14} color={colors.textTertiary} />
            <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
              AI: {ethDown ? "Pullback across L1s; funds rotating to majors." : "Momentum building across L1 ecosystem."}
            </Txt>
          </View>
          <View style={styles.chain}>
            <ArrowRight size={14} color={colors.textTertiary} />
            <Txt variant="caption" tone="warning" style={{ flex: 1 }}>
              Security: 2 contracts in this ecosystem show elevated approval risk.
            </Txt>
          </View>
          <View style={styles.chain}>
            <ArrowRight size={14} color={colors.textTertiary} />
            <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
              Sentiment: Fear & Greed {fng.data?.value ?? "—"} ({fng.data?.classification ?? "…"}).
            </Txt>
          </View>
        </Card>

        {sections.map((s) => (
          <View key={s.title}>
            <Txt variant="h3" style={styles.sectionTitle}>
              {s.title}
            </Txt>
            <Card style={{ paddingVertical: 4 }}>
              {s.items.map((it, i) => (
                <View key={it.label}>
                  <Pressed
                    style={styles.item}
                    disabled={it.soon}
                    onPress={() => it.route && router.push(it.route as never)}
                    testID={`discover-${s.title}-${it.label}`}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: s.color + "1A" }]}>{it.icon}</View>
                    <Txt variant="bodyMed" style={{ flex: 1 }} tone={it.soon ? "tertiary" : "primary"}>
                      {it.label}
                    </Txt>
                    {it.soon ? (
                      <Txt variant="micro" tone="tertiary">
                        Soon
                      </Txt>
                    ) : (
                      <ArrowRight size={16} color={colors.textTertiary} />
                    )}
                  </Pressed>
                  {i < s.items.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  connect: { gap: 8, borderColor: c.accent + "33" },
  connectHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  connectRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chain: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { marginTop: 20, marginBottom: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  itemIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: c.divider, marginLeft: 50 },
}));
