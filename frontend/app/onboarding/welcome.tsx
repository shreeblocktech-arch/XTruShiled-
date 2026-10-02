import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressed, Txt } from "@/src/components/ui";
import { canManageWallet, isWeb } from "@/src/config/featureFlags";
import { makeStyles, useTheme } from "@/src/theme";

export default function Welcome() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("");

  const go = (path: "/onboarding/create" | "/onboarding/import") => {
    router.push({ pathname: path, params: { name: name.trim() } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.hero}>
        <LinearGradient colors={[colors.brandPrimary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
          <ShieldCheck size={38} color={colors.onBrandPrimary} />
        </LinearGradient>
        <Txt variant="h1" style={styles.title}>
          XtruShield
        </Txt>
        <Txt variant="bodyMed" tone="secondary" style={styles.tag}>
          Extra Protection. True Shielded Ownership.
        </Txt>
      </View>

      <View style={styles.bottom}>
        {isWeb ? (
          <View style={styles.webBanner} testID="web-preview-banner">
            <Txt variant="caption" tone="warning">
              Web preview only — install the iOS / Android build for secure on-device key storage.
            </Txt>
          </View>
        ) : null}
        <View style={styles.field}>
          <Txt variant="micro" tone="tertiary" style={styles.label}>
            YOUR NAME (OPTIONAL)
          </Txt>
          <TextInput
            testID="onboarding-name-input"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <Pressed
          testID="create-wallet-button"
          disabled={!canManageWallet}
          onPress={() => go("/onboarding/create")}
          style={[styles.primaryBtn, !canManageWallet && styles.disabled]}
        >
          <Txt variant="title" tone="onBrand">
            Create a new wallet
          </Txt>
        </Pressed>
        <Pressed
          testID="import-wallet-button"
          disabled={!canManageWallet}
          onPress={() => go("/onboarding/import")}
          style={[styles.secondaryBtn, !canManageWallet && styles.disabled]}
        >
          <Txt variant="title">I already have a wallet</Txt>
        </Pressed>
        <Txt variant="micro" tone="tertiary" style={styles.legal}>
          Non-custodial · keys are generated and stored only on this device
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface, paddingHorizontal: 24, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  logo: { width: 84, height: 84, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 6 },
  tag: { textAlign: "center" },
  bottom: { gap: 12 },
  field: { gap: 6, marginBottom: 4 },
  label: { letterSpacing: 1 },
  input: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    color: c.onSurface,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontFamily: "Manrope-Medium",
    fontSize: 15,
  },
  primaryBtn: { backgroundColor: c.brandPrimary, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  secondaryBtn: {
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabled: { opacity: 0.4 },
  legal: { textAlign: "center", marginTop: 4 },
  webBanner: {
    backgroundColor: c.warningSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.warning + "55",
    padding: 14,
  },
}));
