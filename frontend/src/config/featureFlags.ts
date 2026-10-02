// Phase 0 — baseline feature flags. Everything gated here ships as a clear
// placeholder until the corresponding partner / dev-client work lands.
import { Platform } from "react-native";

export const featureFlags = {
  CARD_ENABLED: false, // "Demo — requires issuer/KYC partner"
  HARDWARE_WALLET_ENABLED: false, // "Coming soon — requires custom dev client"
  // Enabled so the web preview stays fully explorable/testable; native uses
  // expo-secure-store, web uses AsyncStorage and shows a preview banner.
  WEB_WALLET_CREATE_ENABLED: true,
  SWAP_ENABLED: false, // "Coming Soon"
  SOLANA_ENABLED: false, // not exposed as an active network in MVP
} as const;

export const isWeb = Platform.OS === "web";

// Web preview never creates/imports a wallet or holds keys.
export const canManageWallet = !isWeb || featureFlags.WEB_WALLET_CREATE_ENABLED;
