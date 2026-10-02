import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/src/theme";
import { useWallet } from "@/src/wallet/WalletContext";

export default function Index() {
  const { ready, hasWallet } = useWallet();
  const { colors } = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={hasWallet ? "/(tabs)" : "/onboarding/welcome"} />;
}
