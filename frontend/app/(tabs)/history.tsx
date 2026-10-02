import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Fragment, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Txt } from "@/src/components/ui";
import { formatToken } from "@/src/lib/format";
import { ACTIVITY, type Tx } from "@/src/wallet/activity";
import { makeStyles, useTheme } from "@/src/theme";

export default function HistoryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const groups = useMemo(() => {
    const g: Record<string, Tx[]> = {};
    ACTIVITY.forEach((t) => {
      (g[t.group] ||= []).push(t);
    });
    return g;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Txt variant="h2">Activity</Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {Object.entries(groups).map(([group, items]) => (
          <Fragment key={group}>
            <Txt variant="micro" tone="tertiary" style={styles.group}>
              {group.toUpperCase()}
            </Txt>
            <Card style={{ paddingVertical: 4 }}>
              {items.map((t, i) => (
                <View key={t.id}>
                  <View style={styles.row} testID={`tx-${t.id}`}>
                    <View style={[styles.icon, { backgroundColor: (t.type === "in" ? colors.positive : colors.negative) + "1A" }]}>
                      {t.type === "in" ? (
                        <ArrowDownLeft size={18} color={colors.positive} />
                      ) : (
                        <ArrowUpRight size={18} color={colors.negative} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt variant="title">{t.type === "in" ? "Received" : "Sent"}</Txt>
                      <Txt variant="caption" tone="tertiary">
                        {t.type === "in" ? "from" : "to"} {t.counterparty} · {t.chain}
                      </Txt>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Txt variant="num" tone={t.type === "in" ? "positive" : "primary"}>
                        {t.type === "in" ? "+" : "-"}
                        {formatToken(t.amount, t.symbol)}
                      </Txt>
                      <Txt variant="micro" tone="tertiary">
                        {t.time}
                      </Txt>
                    </View>
                  </View>
                  {i < items.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </Card>
          </Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  group: { marginTop: 16, marginBottom: 8, letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: c.divider, marginLeft: 54 },
}));
