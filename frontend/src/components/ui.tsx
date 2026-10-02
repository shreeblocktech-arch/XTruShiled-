import { forwardRef } from "react";
import { Pressable, Text, View, type PressableProps, type TextProps, type ViewProps } from "react-native";

import { makeStyles, useTheme, type ThemeColors } from "@/src/theme";
import { type as typeRamp } from "@/src/typography";

type Variant = keyof typeof typeRamp;
type Tone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "brand"
  | "positive"
  | "negative"
  | "onBrand"
  | "warning";

const toneKey: Record<Tone, keyof ThemeColors> = {
  primary: "onSurface",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  accent: "accent",
  brand: "onBrandTertiary",
  positive: "positive",
  negative: "negative",
  onBrand: "onBrandPrimary",
  warning: "warning",
};

interface TxtProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function Txt({ variant = "body", tone = "primary", style, ...rest }: TxtProps) {
  const { colors } = useTheme();
  return <Text style={[typeRamp[variant], { color: colors[toneKey[tone]] }, style]} {...rest} />;
}

export function Card({ style, ...rest }: ViewProps) {
  const styles = useCardStyles();
  return <View style={[styles.card, style]} {...rest} />;
}

const useCardStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
  },
}));

export const Pressed = forwardRef<View, PressableProps>(function Pressed({ style, ...rest }, ref) {
  return (
    <Pressable
      ref={ref}
      style={(state) => [
        { opacity: state.pressed ? 0.7 : 1 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    />
  );
});

export function Delta({ value, size = "caption" }: { value: number; size?: Variant }) {
  const styles = useDeltaStyles();
  const positive = value >= 0;
  return (
    <View style={[styles.pill, positive ? styles.pos : styles.neg]}>
      <Txt variant={size} tone={positive ? "positive" : "negative"} numberOfLines={1}>
        {positive ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
      </Txt>
    </View>
  );
}

const useDeltaStyles = makeStyles((c) => ({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pos: { backgroundColor: c.successSoft },
  neg: { backgroundColor: c.errorSoft },
}));
