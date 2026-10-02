import { CheckCircle2, Shuffle } from "lucide-react-native";
import { View } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";
import type { PricedAsset } from "@/src/services/marketService";
import { formatPrice, formatToken, formatUsd } from "@/src/lib/format";
import { AssetIcon } from "./AssetIcon";
import { Pressed, Txt } from "./ui";

// Compact 2-line token row.
// Left:  icon | Name (+ badge) / balance
// Right: holding value / market price · 24h% (smaller)
export function AssetRow({ asset, onPress }: { asset: PricedAsset; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const positive = asset.change24h >= 0;

  return (
    <Pressed onPress={onPress} style={styles.row} testID={`asset-row-${asset.id}`}>
      <AssetIcon symbol={asset.symbol} color={asset.color} size={34} />
      <View style={styles.mid}>
        <View style={styles.nameLine}>
          <Txt variant="title" numberOfLines={1}>
            {asset.name}
          </Txt>
          {asset.status === "verified" ? (
            <CheckCircle2 size={12} color={colors.verified} />
          ) : asset.status === "bridged" ? (
            <Shuffle size={12} color={colors.bridged} />
          ) : null}
        </View>
        <Txt variant="caption" tone="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
          {formatToken(asset.balance, asset.symbol)}
        </Txt>
      </View>
      <View style={styles.right}>
        <Txt variant="title" numberOfLines={1}>
          {formatUsd(asset.price * asset.balance)}
        </Txt>
        <View style={styles.priceLine}>
          <Txt variant="micro" tone="tertiary" numberOfLines={1}>
            {formatPrice(asset.price)}
          </Txt>
          <Txt variant="micro" tone={positive ? "positive" : "negative"} numberOfLines={1}>
            {positive ? "+" : ""}
            {asset.change24h.toFixed(2)}%
          </Txt>
        </View>
      </View>
    </Pressed>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
  },
  mid: { flex: 1, minWidth: 0, flexShrink: 1 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  right: { alignItems: "flex-end", flexShrink: 0, marginLeft: 8 },
  priceLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
}));
