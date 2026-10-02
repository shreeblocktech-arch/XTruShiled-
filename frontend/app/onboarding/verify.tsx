import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressed, Txt } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { WORDLIST } from "@/src/wallet/wordlist";

function pickPositions(): number[] {
  const set = new Set<number>();
  while (set.size < 3) set.add(Math.floor(Math.random() * 12));
  return [...set].sort((a, b) => a - b);
}

export default function Verify() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, phrase } = useLocalSearchParams<{ name?: string; phrase?: string }>();
  const words = useMemo(() => (phrase ?? "").split(" "), [phrase]);
  const positions = useMemo(pickPositions, []);
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(false);

  const pos = positions[step];
  const correct = words[pos];

  const options = useMemo(() => {
    const opts = new Set<string>([correct]);
    while (opts.size < 4) opts.add(WORDLIST[Math.floor(Math.random() * WORDLIST.length)]);
    return [...opts].sort(() => Math.random() - 0.5);
  }, [correct]);

  const choose = (w: string) => {
    if (w !== correct) {
      setWrong(true);
      setTimeout(() => setWrong(false), 800);
      return;
    }
    if (step < positions.length - 1) setStep(step + 1);
    else router.push({ pathname: "/onboarding/pin", params: { name } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.progress}>
        {positions.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step ? styles.dotActive : null]} />
        ))}
      </View>
      <Txt variant="h1" style={{ marginTop: 24 }}>
        Confirm your phrase
      </Txt>
      <Txt variant="bodyMed" tone="secondary" style={{ marginTop: 8 }}>
        Select word #{pos + 1} from your recovery phrase.
      </Txt>

      <View style={styles.options}>
        {options.map((w) => (
          <Pressed key={w} style={styles.option} onPress={() => choose(w)} testID={`verify-option-${w}`}>
            <Txt variant="title">{w}</Txt>
          </Pressed>
        ))}
      </View>

      {wrong ? (
        <Txt variant="caption" tone="negative" style={{ textAlign: "center" }}>
          Not quite — try again.
        </Txt>
      ) : (
        <View style={styles.hint}>
          <CheckCircle2 size={14} color={colors.textTertiary} />
          <Txt variant="caption" tone="tertiary">
            {step} of {positions.length} confirmed
          </Txt>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface, paddingHorizontal: 24 },
  progress: { flexDirection: "row", gap: 6 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.surfaceTertiary },
  dotActive: { backgroundColor: c.accent },
  options: { gap: 12, marginTop: 28, flex: 1 },
  option: {
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  hint: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
}));
