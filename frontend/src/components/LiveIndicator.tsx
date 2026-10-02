import { useEffect, useState } from "react";
import { View } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";
import { Txt } from "./ui";

type Status = "live" | "stale";

export function LiveIndicator({ updatedAt, status }: { updatedAt: number | null; status: Status }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  let label = "Connecting…";
  if (status === "stale") label = "Stale · retrying";
  else if (updatedAt) {
    const secs = Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
    label = secs < 3 ? "Live · Updated just now" : `Updated ${secs}s ago`;
  }

  const dot = status === "stale" ? colors.warning : colors.positive;

  return (
    <View style={styles.wrap} testID="live-indicator">
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Txt variant="micro" tone="secondary">
        {label}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
}));
