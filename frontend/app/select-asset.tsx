import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, X } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AssetIcon } from "@/src/components/AssetIcon";
import { Pressed, Txt } from "@/src/components/ui";
import { formatToken, formatUsd } from "@/src/lib/format";
import { buildPortfolio, useQuotes } from "@/src/services/marketService";
import { makeStyles, useTheme } from "@/src/theme";
import type { PricedAsset } from "@/src/services/marketService";

// Token picker shown when Send / Receive is tapped without a preselected asset.
export default function SelectAsset() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSend = mode === "send";

  const quotes = useQuotes(true);
  const portfolio = useMemo(() => buildPortfolio(quotes.data), [quotes.data]);

  const assets = useMemo(() => {
    const visible = portfolio.assets.filter((a) => a.status !== "unverified" || a.balance > 0);
    // Sending only makes sense for assets you hold.
    return isSend ? visible.filter((a) => a.balance > 0) : visible;
  }, [portfolio.assets, isSend]);

  const pick = (asset: PricedAsset) => {
    router.replace(isSend ? `/send?assetId=${asset.id}` : `/receive?assetId=${asset.id}`);
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} testID="select-asset-backdrop" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Txt variant="h2">{isSend ? "Send — choose token" : "Receive — choose token"}</Txt>
          <Pressed style={styles.close} onPress={() => router.back()} testID="select-asset-close">
            <X size={18} color={colors.onSurface} />
          </Pressed>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 6 }}>
          {assets.map((a) => (
            <Pressed key={a.id} style={styles.row} onPress={() => pick(a)} testID={`select-asset-row-${a.id}`}>
              <AssetIcon symbol={a.symbol} color={a.color} size={34} />
              <View style={styles.mid}>
                <Txt variant="title" numberOfLines={1}>
                  {a.name}
                </Txt>
                <Txt variant="caption" tone="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
                  {a.network} · {formatToken(a.balance, a.symbol)}
                </Txt>
              </View>
              <View style={styles.right}>
                <Txt variant="caption" numberOfLines={1}>
                  {formatUsd(a.price * a.balance)}
                </Txt>
              </View>
              <ChevronRight size={15} color={colors.textTertiary} />
            </Pressed>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(3,6,12,0.7)" },
  sheet: {
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "78%",
    borderTopWidth: 1,
    borderColor: c.border,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderStrong, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 12 },
  mid: { flex: 1, minWidth: 0, flexShrink: 1 },
  right: { alignItems: "flex-end", flexShrink: 0 },
}));
