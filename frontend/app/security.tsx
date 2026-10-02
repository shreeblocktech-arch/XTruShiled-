import {
  Activity,
  CheckCircle2,
  Fingerprint,
  Globe,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Card, Pressed, Txt } from "@/src/components/ui";
import { useActiveFocus } from "@/src/hooks/useActiveFocus";
import { useChainHealth } from "@/src/services/marketService";
import { makeStyles, useTheme, type ThemeColors } from "@/src/theme";
import type { ChainHealth } from "@/src/providers/types";

export default function SecurityScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const active = useActiveFocus();
  const health = useChainHealth(active);
  const rows = health.data ?? [];
  const degraded = rows.filter((r) => r.status !== "secure").length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Security & Network" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        <Card style={styles.overview}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreRing}>
              <Txt variant="h1" tone="positive">
                {degraded ? 86 : 96}
              </Txt>
              <Txt variant="micro" tone="tertiary">
                / 100
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt variant="h3">Security score</Txt>
              <Txt variant="caption" tone="secondary">
                {degraded ? "One network degraded — failover active." : "Device integrity verified. No active threats."}
              </Txt>
            </View>
          </View>
          <View style={styles.statRow}>
            <Stat label="Device" value="Verified" tone="positive" colors={colors} />
            <Stat label="Threats" value="0" tone="positive" colors={colors} />
            <Stat label="Blocked tx" value="3" tone="primary" colors={colors} />
            <Stat label="Approvals" value="2" tone="warning" colors={colors} />
          </View>
        </Card>

        {/* Connective example */}
        <Card style={styles.connect}>
          <View style={styles.connectHead}>
            <Sparkles size={16} color={colors.accent} />
            <Txt variant="title" tone="accent">
              Market → News → Security → AI
            </Txt>
          </View>
          <Txt variant="caption" tone="secondary">
            ETH ↓ 3.2% → AI: pullback across L1s → Security: 2 contracts in this ecosystem show elevated
            approval risk → recommend reviewing token allowances.
          </Txt>
        </Card>

        {/* Network / RPC health */}
        <Txt variant="h3" style={styles.h}>
          Network health
        </Txt>
        <Card style={{ gap: 12 }}>
          {rows.map((r) => (
            <NetworkRow key={r.chain} row={r} colors={colors} />
          ))}
          {!rows.length ? (
            <Txt variant="caption" tone="tertiary">
              Checking RPC endpoints…
            </Txt>
          ) : null}
        </Card>

        {/* Transaction security */}
        <Txt variant="h3" style={styles.h}>
          Transaction security
        </Txt>
        <Card style={{ gap: 2 }}>
          {[
            { icon: <Activity size={18} color={colors.positive} />, label: "Transaction Firewall", status: "Active" },
            { icon: <ShieldCheck size={18} color={colors.positive} />, label: "Contract reputation", status: "Monitoring" },
            { icon: <Fingerprint size={18} color={colors.positive} />, label: "Approval monitoring", status: "2 to review" },
            { icon: <CheckCircle2 size={18} color={colors.positive} />, label: "Malicious contract detection", status: "On" },
          ].map((it, i, arr) => (
            <View key={it.label}>
              <View style={styles.txRow}>
                {it.icon}
                <Txt variant="bodyMed" style={{ flex: 1 }}>
                  {it.label}
                </Txt>
                <Txt variant="caption" tone="secondary">
                  {it.status}
                </Txt>
              </View>
              {i < arr.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </Card>

        {/* DApp sessions */}
        <Txt variant="h3" style={styles.h}>
          DApp / WalletConnect
        </Txt>
        <Card style={{ gap: 12 }}>
          {[
            { icon: <Globe size={18} color={colors.accent} />, name: "app.uniswap.org", perm: "2 permissions · expires 6h", risk: "Low" },
            { icon: <Link2 size={18} color={colors.accent} />, name: "opensea.io", perm: "1 permission · expires 2d", risk: "Low" },
          ].map((s, i, arr) => (
            <View key={s.name}>
              <View style={styles.txRow}>
                {s.icon}
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMed">{s.name}</Txt>
                  <Txt variant="micro" tone="tertiary">
                    {s.perm}
                  </Txt>
                </View>
                <Txt variant="caption" tone="positive">
                  {s.risk}
                </Txt>
              </View>
              {i < arr.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
          <Pressed style={styles.disconnect} testID="disconnect-all">
            <Txt variant="caption" tone="negative">
              Disconnect all sessions
            </Txt>
          </Pressed>
        </Card>
      </ScrollView>
    </View>
  );
}

function NetworkRow({ row, colors }: { row: ChainHealth; colors: ThemeColors }) {
  const styles = useStyles();
  const dot = row.status === "secure" ? colors.positive : row.status === "degraded" ? colors.warning : colors.negative;
  const statusText =
    row.status === "secure" ? "Secure" : row.status === "degraded" ? "Degraded" : "Offline";
  return (
    <View style={styles.netRow} testID={`network-${row.chain}`}>
      <View style={[styles.netDot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        <Txt variant="title">{row.name}</Txt>
        <Txt variant="micro" tone="tertiary">
          {statusText} · {row.provider} {row.latencyMs}ms · {row.verified} verified
          {row.failover ? " · failover active" : ""}
        </Txt>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Txt variant="micro" tone="secondary">
          #{row.blockHeight.toLocaleString()}
        </Txt>
        <Txt variant="micro" tone="tertiary">
          {row.lastVerified}
        </Txt>
      </View>
    </View>
  );
}

function Stat({ label, value, tone, colors }: { label: string; value: string; tone: "positive" | "warning" | "primary"; colors: ThemeColors }) {
  const styles = useStyles();
  const color = tone === "positive" ? colors.positive : tone === "warning" ? colors.warning : colors.onSurface;
  return (
    <View style={styles.stat}>
      <Txt variant="num" style={{ color }}>
        {value}
      </Txt>
      <Txt variant="micro" tone="tertiary">
        {label}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  overview: { gap: 16 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: c.positive,
    alignItems: "center",
    justifyContent: "center",
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 14 },
  stat: { alignItems: "center", gap: 3 },
  connect: { gap: 8, marginTop: 12, borderColor: c.accent + "33" },
  connectHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  h: { marginTop: 22, marginBottom: 8 },
  netRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  netDot: { width: 10, height: 10, borderRadius: 5 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  divider: { height: 1, backgroundColor: c.divider },
  disconnect: { alignItems: "center", paddingVertical: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: c.divider },
}));
