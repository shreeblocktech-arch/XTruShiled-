// Sentiren / XtruShield design tokens — Jewel & Luxury + restrained Neon.
// Dark-first: the single scheme below holds the deep-navy palette so the app
// renders identically regardless of the device light/dark setting.
//
// Build sheets with makeStyles((colors) => ...) and read useTheme().colors for
// non-style color props. Never hardcode hex in components.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces (deep navy stack)
  surface: "#0B0F19", // app background
  onSurface: "#F5F7FA", // primary text on background
  surfaceSecondary: "#151B2B", // cards / sheets / rows
  onSurfaceSecondary: "#E5E7EB",
  surfaceTertiary: "#1E2538", // elevated fills, inputs, chips
  onSurfaceTertiary: "#9CA3AF",
  surfaceInverse: "#F5F7FA",
  onSurfaceInverse: "#0B0F19",
  muted: "#9CA3AF", // secondary text
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",

  // Brand
  brand: "#0052FF",
  onBrand: "#FFFFFF",
  brandPrimary: "#0052FF", // primary CTA / active states
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#1E2538",
  onBrandSecondary: "#F5F7FA",
  brandTertiary: "rgba(0,82,255,0.14)",
  onBrandTertiary: "#4D8CFF",

  // Neon accent (accent only, never the whole UI)
  accent: "#00E5FF",
  onAccent: "#04141B",
  accentSoft: "rgba(0,229,255,0.12)",
  brandSoft: "rgba(0,82,255,0.12)",

  // Status / semantics
  success: "#16C784",
  onSuccess: "#04140D",
  successSoft: "rgba(22,199,132,0.14)",
  warning: "#F5A623",
  onWarning: "#1A1200",
  warningSoft: "rgba(245,166,35,0.14)",
  error: "#EA3943",
  onError: "#FFFFFF",
  errorSoft: "rgba(234,57,67,0.14)",
  info: "#0052FF",
  onInfo: "#FFFFFF",

  // Market direction
  positive: "#16C784",
  negative: "#EA3943",

  // Registry badges
  verified: "#00E5FF",
  bridged: "#F5A623",
  unverified: "#6B7280",

  // Lines
  border: "#232B3E",
  borderStrong: "#2E3852",
  divider: "#1C2437",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

// Both keys hold the same dark palette so any device setting shows the intended
// jewel/neon theme.
export const themes: { light: ThemeColors; dark: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
