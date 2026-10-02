// Non-custodial wallet state. Mnemonic + PIN live in expo-secure-store on
// native (via the shared storage helper); web never persists keys.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";

import { storage } from "@/src/utils/storage";
import { generateMnemonic, validateMnemonic } from "./mnemonic";
import { deriveAddresses, type ChainId } from "./assets";
import { sha256Hex } from "./sha256";

const KEY_MNEMONIC = "sentiren.mnemonic";
const KEY_PIN = "sentiren.pinHash";
const KEY_ADDR = "sentiren.addresses";
const KEY_NAME = "sentiren.name";

type Addresses = Record<ChainId, string>;

interface WalletState {
  ready: boolean;
  hasWallet: boolean;
  name: string;
  addresses: Addresses | null;
  pendingMnemonic: string | null;
}

interface WalletApi extends WalletState {
  startCreate: () => Promise<string>;
  stageImport: (phrase: string) => { ok: boolean; error?: string };
  completeSetup: (pin: string, name: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  getMnemonic: () => Promise<string | null>;
  resetWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletApi | null>(null);

export function WalletProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<WalletState>({
    ready: false,
    hasWallet: false,
    name: "",
    addresses: null,
    pendingMnemonic: null,
  });
  const pendingRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const mnemonic = await storage.secureGet(KEY_MNEMONIC, "");
    const addresses = (await storage.getItem(KEY_ADDR, "")) as string;
    const name = (await storage.getItem(KEY_NAME, "")) as string;
    setState({
      ready: true,
      hasWallet: !!mnemonic,
      name: name || "",
      addresses: addresses ? (JSON.parse(addresses) as Addresses) : null,
      pendingMnemonic: null,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = useCallback(async () => {
    const phrase = await generateMnemonic();
    pendingRef.current = phrase;
    setState((s) => ({ ...s, pendingMnemonic: phrase }));
    return phrase;
  }, []);

  const stageImport = useCallback((phrase: string) => {
    const clean = phrase.trim().toLowerCase().replace(/\s+/g, " ");
    if (!validateMnemonic(clean)) return { ok: false, error: "Invalid recovery phrase. Check the words and try again." };
    pendingRef.current = clean;
    setState((s) => ({ ...s, pendingMnemonic: clean }));
    return { ok: true };
  }, []);

  const completeSetup = useCallback(async (pin: string, name: string) => {
    const phrase = pendingRef.current;
    if (!phrase) return false;
    const addresses = deriveAddresses(phrase);
    await storage.secureSet(KEY_MNEMONIC, phrase);
    await storage.secureSet(KEY_PIN, sha256Hex(pin));
    await storage.setItem(KEY_ADDR, JSON.stringify(addresses));
    await storage.setItem(KEY_NAME, name);
    pendingRef.current = null;
    setState({ ready: true, hasWallet: true, name, addresses, pendingMnemonic: null });
    return true;
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const stored = await storage.secureGet(KEY_PIN, "");
    return !!stored && stored === sha256Hex(pin);
  }, []);

  const getMnemonic = useCallback(async () => {
    const m = await storage.secureGet(KEY_MNEMONIC, "");
    return m || null;
  }, []);

  const resetWallet = useCallback(async () => {
    await storage.secureRemove(KEY_MNEMONIC);
    await storage.secureRemove(KEY_PIN);
    await storage.removeItem(KEY_ADDR);
    await storage.removeItem(KEY_NAME);
    pendingRef.current = null;
    setState({ ready: true, hasWallet: false, name: "", addresses: null, pendingMnemonic: null });
  }, []);

  const value = useMemo<WalletApi>(
    () => ({ ...state, startCreate, stageImport, completeSetup, verifyPin, getMnemonic, resetWallet }),
    [state, startCreate, stageImport, completeSetup, verifyPin, getMnemonic, resetWallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletApi {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
