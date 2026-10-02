import { useLocalSearchParams, useRouter } from "expo-router";
import { Delete, Fingerprint } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressed, Txt } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { useWallet } from "@/src/wallet/WalletContext";

const PIN_LEN = 6;

export default function SetPin() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const { completeSetup } = useWallet();

  const [stage, setStage] = useState<"create" | "confirm">("create");
  const [first, setFirst] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const press = async (d: string) => {
    if (busy || pin.length >= PIN_LEN) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === PIN_LEN) {
      if (stage === "create") {
        setTimeout(() => {
          setFirst(next);
          setPin("");
          setStage("confirm");
        }, 120);
      } else {
        if (next === first) {
          setBusy(true);
          const ok = await completeSetup(next, (name as string) || "");
          if (ok) router.replace("/(tabs)");
        } else {
          setError("PINs don't match. Start again.");
          setTimeout(() => {
            setPin("");
            setFirst("");
            setStage("create");
          }, 700);
        }
      }
    }
  };

  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.top}>
        <Txt variant="h1">{stage === "create" ? "Create a PIN" : "Confirm your PIN"}</Txt>
        <Txt variant="bodyMed" tone="secondary" style={{ marginTop: 8, textAlign: "center" }}>
          {stage === "create" ? "You'll use this to unlock and approve transactions." : "Re-enter your 6-digit PIN."}
        </Txt>

        <View style={styles.dots}>
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length ? styles.dotFill : null]} />
          ))}
        </View>
        {error ? (
          <Txt variant="caption" tone="negative">
            {error}
          </Txt>
        ) : null}
      </View>

      <View style={styles.pad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"].map((k) => {
          if (k === "bio") return <View key={k} style={styles.key} />;
          if (k === "del")
            return (
              <Pressed key={k} style={styles.key} onPress={back} testID="pin-delete">
                <Delete size={24} color={colors.onSurface} />
              </Pressed>
            );
          return (
            <Pressed key={k} style={styles.key} onPress={() => press(k)} testID={`pin-key-${k}`}>
              <Txt variant="h1">{k}</Txt>
            </Pressed>
          );
        })}
      </View>
      <View style={styles.bioHint}>
        <Fingerprint size={14} color={colors.textTertiary} />
        <Txt variant="micro" tone="tertiary">
          Biometric unlock available on device builds
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface, paddingHorizontal: 24, justifyContent: "space-between" },
  top: { alignItems: "center", gap: 14 },
  dots: { flexDirection: "row", gap: 14, marginTop: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: c.borderStrong },
  dotFill: { backgroundColor: c.accent, borderColor: c.accent },
  pad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 },
  key: { width: "30%", height: 62, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  bioHint: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
}));
