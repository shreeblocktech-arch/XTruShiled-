import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressed, Txt } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { useWallet } from "@/src/wallet/WalletContext";

export default function ImportWallet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const { stageImport } = useWallet();

  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = () => {
    const res = stageImport(text);
    if (!res.ok) {
      setError(res.error ?? "Invalid phrase.");
      return;
    }
    router.push({ pathname: "/onboarding/pin", params: { name } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        <Txt variant="h1">Import wallet</Txt>
        <Txt variant="bodyMed" tone="secondary" style={{ marginTop: 8 }}>
          Enter your 12-word recovery phrase, separated by spaces.
        </Txt>

        <TextInput
          testID="import-phrase-input"
          value={text}
          onChangeText={(t) => {
            setText(t);
            setError("");
          }}
          placeholder="word1 word2 word3 …"
          placeholderTextColor={colors.textTertiary}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <View style={styles.metaRow}>
          <Txt variant="caption" tone="tertiary">
            {wordCount}/12 words
          </Txt>
          {error ? (
            <Txt variant="caption" tone="negative">
              {error}
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressed
          testID="import-continue-button"
          disabled={wordCount !== 12}
          onPress={submit}
          style={[styles.primaryBtn, wordCount !== 12 && styles.disabled]}
        >
          <Txt variant="title" tone="onBrand">
            Continue
          </Txt>
        </Pressed>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  input: {
    marginTop: 20,
    minHeight: 140,
    backgroundColor: c.surfaceTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    color: c.onSurface,
    padding: 16,
    fontFamily: "Manrope-Medium",
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface },
  primaryBtn: { backgroundColor: c.brandPrimary, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  disabled: { opacity: 0.4 },
}));
