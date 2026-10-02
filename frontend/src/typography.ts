// Font loading + shared type ramp. Outfit for numbers/headings, Manrope for body.
// Dense scale — reduced for a compact Bloomberg-lite fintech feel.

export const fontMap = {
  "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
  "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
  "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
  "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
  "Manrope-Regular": require("../assets/fonts/Manrope-Regular.ttf"),
  "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
  "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
  "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
};

export const display = {
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semibold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
};

export const body = {
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semibold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
};

// Compact ramp.
export const type = {
  balance: { fontFamily: display.bold, fontSize: 26, lineHeight: 31 },
  h1: { fontFamily: display.semibold, fontSize: 19, lineHeight: 24 },
  h2: { fontFamily: display.semibold, fontSize: 16, lineHeight: 21 },
  h3: { fontFamily: display.semibold, fontSize: 14, lineHeight: 18 },
  num: { fontFamily: display.semibold, fontSize: 13, lineHeight: 17 },
  numLg: { fontFamily: display.semibold, fontSize: 15, lineHeight: 19 },
  title: { fontFamily: body.semibold, fontSize: 13, lineHeight: 17 },
  body: { fontFamily: body.regular, fontSize: 12.5, lineHeight: 18 },
  bodyMed: { fontFamily: body.medium, fontSize: 12.5, lineHeight: 18 },
  caption: { fontFamily: body.medium, fontSize: 11, lineHeight: 15 },
  micro: { fontFamily: body.semibold, fontSize: 10, lineHeight: 13 },
} as const;
