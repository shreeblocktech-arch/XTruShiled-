import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Copy, Eye, EyeOff, Info } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressed, Txt } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { useWallet } from "@/src/wallet/WalletContext";

export default function CreateBackup() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const { startCreate } = useWallet();

  const [phrase, setPhrase] = useState<string>("");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    startCreate().then(setPhrase);
  }, [startCreate]);

  const words = phrase ? phrase.split(" ") : new Array(12).fill("");

  const copy = async () => {
    await Clipboard.setStringAsync(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Txt variant="h1">Your recovery phrase</Txt>
        <Txt variant="bodyMed" tone="secondary" style={styles.sub}>
          Write these 12 words down in order and keep them offline. Anyone with this phrase controls your funds.
        </Txt>

        <View style={styles.warn}>
          <Info size={16} color={colors.warning} />
          <Txt variant="caption" tone="warning" style={{ flex: 1 }}>
            Never share it. XtruShield can never recover it for you.
          </Txt>
        </View>

        <View style={styles.grid}>
          {words.map((w, i) => (
            <View key={i} style={styles.chip} testID={`mnemonic-word-${i}`}>
              <Txt variant="micro" tone="tertiary" style={styles.chipNum}>
                {i + 1}
              </Txt>
              <Txt variant="title">{revealed ? w : "••••"}</Txt>
            </View>
          ))}
          {!revealed ? (
            <Pressed style={styles.blur} onPress={() => setRevealed(true)} testID="reveal-phrase">
              <Eye size={20} color={colors.accent} />
              <Txt variant="caption" tone="accent">
                Tap to reveal
              </Txt>
            </Pressed>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressed style={styles.ghostBtn} onPress={() => setRevealed((v) => !v)}>
            {revealed ? <EyeOff size={16} color={colors.onSurface} /> : <Eye size={16} color={colors.onSurface} />}
            <Txt variant="caption">{revealed ? "Hide" : "Reveal"}</Txt>
          </Pressed>
          <Pressed style={styles.ghostBtn} onPress={copy} testID="copy-phrase">
            <Copy size={16} color={colors.onSurface} />
            <Txt variant="caption">{copied ? "Copied!" : "Copy"}</Txt>
          </Pressed>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressed
          testID="backed-up-button"
          disabled={!revealed}
          onPress={() => router.push({ pathname: "/onboarding/verify", params: { name, phrase } })}
          style={[styles.primaryBtn, !revealed && styles.disabled]}
        >
          <Txt variant="title" tone="onBrand">
            I&apos;ve saved it — continue
          </Txt>
        </Pressed>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  sub: { marginTop: 8 },
  warn: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: c.warningSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  chip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipNum: { width: 16 },
  blur: {
    ...({ position: "absolute" } as const),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: c.surface + "F2",
    borderRadius: 12,
  },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.surfaceTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface },
  primaryBtn: { backgroundColor: c.brandPrimary, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  disabled: { opacity: 0.4 },
}));
