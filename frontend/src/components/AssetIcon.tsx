import { View } from "react-native";

import { Txt } from "./ui";

export function AssetIcon({ symbol, color, size = 38 }: { symbol: string; color: string; size?: number }) {
  const label = size < 26 ? symbol.slice(0, 3) : symbol.slice(0, 4);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + "22",
        borderWidth: 1.5,
        borderColor: color + "66",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt variant="micro" numberOfLines={1} style={{ color, fontSize: Math.max(8, size * 0.3) }}>
        {label}
      </Txt>
    </View>
  );
}
