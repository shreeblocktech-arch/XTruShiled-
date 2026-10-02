import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, useTheme } from "@/src/theme";
import { Pressed, Txt } from "./ui";

export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressed style={styles.back} onPress={() => router.back()} testID="header-back">
        <ChevronLeft size={24} color={colors.onSurface} />
      </Pressed>
      <Txt variant="h3" style={styles.title} numberOfLines={1}>
        {title}
      </Txt>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1 },
  right: { minWidth: 40, alignItems: "flex-end" },
}));
