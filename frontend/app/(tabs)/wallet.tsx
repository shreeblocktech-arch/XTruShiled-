import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AssetRow } from "@/src/components/AssetRow";
import { Card, Txt } from "@/src/components/ui";
import { useActiveFocus } from "@/src/hooks/useActiveFocus";
import { formatUsd } from "@/src/lib/format";
import { buildPortfolio, useQuotes } from "@/src/services/marketService";
import { makeStyles } from "@/src/theme";

export default function WalletScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const active = useActiveFocus();
  const quotes = useQuotes(active);
  const portfolio = useMemo(() => buildPortfolio(quotes.data), [quotes.data]);
  const assets = portfolio.assets.filter((a) => a.status !== "unverified" || a.balance > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Txt variant="h2">Wallet</Txt>
        <Txt variant="caption" tone="secondary">
          {formatUsd(portfolio.total)}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Card style={{ paddingVertical: 4 }}>
          {assets.map((a, i) => (
            <View key={a.id}>
              <AssetRow asset={a} onPress={() => router.push(`/asset/${a.id}`)} />
              {i < assets.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  divider: { height: 1, backgroundColor: c.divider, marginLeft: 46 },
}));
