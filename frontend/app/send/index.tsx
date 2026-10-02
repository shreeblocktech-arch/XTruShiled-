import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Delete,
  Gauge,
  Loader,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { AssetIcon } from "@/src/components/AssetIcon";
import { Card, Pressed, Txt } from "@/src/components/ui";
import { formatPrice, formatToken, formatUsd, shortAddr } from "@/src/lib/format";
import { quoteMap, useQuotes } from "@/src/services/marketService";
import { makeStyles, useTheme } from "@/src/theme";
import { ASSETS } from "@/src/wallet/assets";
import { useWallet } from "@/src/wallet/WalletContext";

type Step = "recipient" | "amount" | "fee" | "security" | "review" | "pin" | "processing" | "done";

const STEP_TITLE: Record<Step, string> = {
  recipient: "Recipient",
  amount: "Amount",
  fee: "Network fee",
  security: "Security check",
  review: "Review",
  pin: "Confirm with PIN",
  processing: "Sending",
  done: "Sent",
};

const STEP_SUB: Partial<Record<Step, string>> = {
  recipient: "Where should it go?",
  amount: "How much are you sending?",
  fee: "Pick a network speed",
  security: "Sentiren is protecting this transfer",
  review: "Double-check before signing",
  pin: "Authorize this payment",
};

const FEES = [
  { id: "slow", label: "Economy", eta: "~10 min", icon: "gauge" },
  { id: "normal", label: "Standard", eta: "~2 min", icon: "gauge" },
  { id: "fast", label: "Fast", eta: "~30 sec", icon: "zap" },
] as const;

const SECURITY_CHECKS = [
  "Address verified",
  "Destination analyzed",
  "Transaction simulated",
  "Network verified",
  "Contract reputation checked",
];

export default function SendFlow() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assetId } = useLocalSearchParams<{ assetId?: string }>();
  const asset = ASSETS.find((a) => a.id === assetId) ?? ASSETS.find((a) => a.id === "btc")!;
  const { verifyPin } = useWallet();

  const quotes = useQuotes(true);
  const price = quoteMap(quotes.data)[asset.priceSymbol]?.price ?? 0;

  const [step, setStep] = useState<Step>("recipient");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState<(typeof FEES)[number]["id"]>("normal");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [ack, setAck] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const isBlocked = /^(bad|scam|0xbad)/i.test(address.trim());
  const needsAck = asset.status === "unverified";

  const order: Step[] = ["recipient", "amount", "fee", "security", "review", "pin"];
  const idx = order.indexOf(step);

  const goBack = () => {
    if (idx > 0 && step !== "processing" && step !== "done") setStep(order[idx - 1]);
    else router.back();
  };

  const canNext =
    step === "recipient"
      ? address.trim().length >= 8 && !isBlocked
      : step === "amount"
        ? amountNum > 0 && amountNum <= asset.balance
        : true;

  const next = () => {
    const map: Record<string, Step> = { recipient: "amount", amount: "fee", fee: "security", security: "review", review: "pin" };
    if (map[step]) setStep(map[step]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressed style={styles.back} onPress={goBack} disabled={step === "processing" || step === "done"} testID="send-back">
          <ChevronLeft size={24} color={colors.onSurface} />
        </Pressed>
        <Txt variant="h3" style={{ flex: 1 }}>
          {STEP_TITLE[step]}
        </Txt>
        <Pressed style={styles.assetTag} onPress={() => router.push("/select-asset?mode=send")} testID="send-switch-token">
          <AssetIcon symbol={asset.symbol} color={asset.color} size={22} />
          <Txt variant="caption">{asset.symbol}</Txt>
        </Pressed>
      </View>

      {step !== "processing" && step !== "done" ? (
        <View style={styles.progress}>
          {order.map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= idx && styles.progressActive]} />
          ))}
        </View>
      ) : null}
      {STEP_SUB[step] ? (
        <Txt variant="caption" tone="secondary" style={styles.stepSub}>
          {STEP_SUB[step]}
        </Txt>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        {step === "recipient" ? (
          <View style={{ gap: 12 }}>
            <Txt variant="caption" tone="secondary">
              Recipient {asset.chain} address
            </Txt>
            <TextInput
              testID="send-address-input"
              value={address}
              onChangeText={setAddress}
              placeholder={`Paste ${asset.symbol} address`}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            {address.trim().length >= 4 ? (
              isBlocked ? (
                <View style={[styles.banner, { backgroundColor: colors.errorSoft }]} testID="send-blocked-banner">
                  <ShieldAlert size={16} color={colors.error} />
                  <Txt variant="caption" tone="negative" style={{ flex: 1 }}>
                    BLOCKED — this address is flagged RED. Sending is disabled for your safety.
                  </Txt>
                </View>
              ) : (
                <View style={[styles.banner, { backgroundColor: colors.successSoft }]}>
                  <ShieldCheck size={16} color={colors.positive} />
                  <Txt variant="caption" tone="positive" style={{ flex: 1 }}>
                    Address format valid · no scam reports found.
                  </Txt>
                </View>
              )
            ) : null}
            {needsAck ? (
              <Pressed style={styles.ackRow} onPress={() => setAck((v) => !v)} testID="send-ack-unverified">
                <View style={[styles.checkbox, ack && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
                  {ack ? <Check size={14} color={colors.onBrandPrimary} /> : null}
                </View>
                <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
                  I understand {asset.symbol} is an unverified asset and accept the risk.
                </Txt>
              </Pressed>
            ) : null}
          </View>
        ) : null}

        {step === "amount" ? (
          <View style={{ gap: 14 }}>
            <View style={styles.amountBox}>
              <TextInput
                testID="send-amount-input"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
              <Txt variant="h3" tone="secondary">
                {asset.symbol}
              </Txt>
            </View>
            <Txt variant="caption" tone="tertiary" style={{ textAlign: "center" }}>
              ≈ {formatUsd(amountNum * price)}
            </Txt>
            <View style={styles.balRow}>
              <Txt variant="caption" tone="secondary">
                Available {formatToken(asset.balance, asset.symbol)}
              </Txt>
              <Pressed onPress={() => setAmount(String(asset.balance))} testID="send-max">
                <Txt variant="caption" tone="accent">
                  MAX
                </Txt>
              </Pressed>
            </View>
            {amountNum > asset.balance ? (
              <Txt variant="caption" tone="negative">
                Amount exceeds your balance.
              </Txt>
            ) : null}
          </View>
        ) : null}

        {step === "fee" ? (
          <View style={{ gap: 12 }}>
            {FEES.map((f) => (
              <Pressed
                key={f.id}
                style={[styles.feeRow, fee === f.id && styles.feeRowActive]}
                onPress={() => setFee(f.id)}
                testID={`send-fee-${f.id}`}
              >
                {f.icon === "zap" ? <Zap size={18} color={colors.accent} /> : <Gauge size={18} color={colors.accent} />}
                <View style={{ flex: 1 }}>
                  <Txt variant="title">{f.label}</Txt>
                  <Txt variant="micro" tone="tertiary">
                    {f.eta}
                  </Txt>
                </View>
                <Txt variant="caption" tone="secondary">
                  {formatUsd(f.id === "fast" ? 3.2 : f.id === "normal" ? 1.4 : 0.6)}
                </Txt>
              </Pressed>
            ))}
          </View>
        ) : null}

        {step === "security" ? <SecurityStep onDone={() => {}} /> : null}

        {step === "review" ? (
          <View style={{ gap: 12 }}>
            <Card style={{ gap: 12 }}>
              <ReviewRow label="Asset" value={`${asset.name} (${asset.symbol})`} />
              <ReviewRow label="Amount" value={`${formatToken(amountNum, asset.symbol)}  ≈ ${formatUsd(amountNum * price)}`} />
              <ReviewRow label="To" value={shortAddr(address, 10, 8)} />
              <ReviewRow label="Network" value={asset.network} />
              <ReviewRow label="Fee" value={FEES.find((f) => f.id === fee)!.label} />
            </Card>
            <View style={[styles.banner, { backgroundColor: colors.successSoft }]}>
              <ShieldCheck size={16} color={colors.positive} />
              <Txt variant="caption" tone="positive">
                Sentiren Security Check passed · Risk: LOW
              </Txt>
            </View>
          </View>
        ) : null}

        {step === "pin" ? (
          <PinStep
            pin={pin}
            error={pinError}
            onKey={(d) => {
              setPinError("");
              const nextPin = (pin + d).slice(0, 6);
              setPin(nextPin);
              if (nextPin.length === 6) {
                verifyPin(nextPin).then((ok) => {
                  if (ok) {
                    setStep("processing");
                  } else {
                    setPinError("Incorrect PIN");
                    setPin("");
                  }
                });
              }
            }}
            onDelete={() => setPin((p) => p.slice(0, -1))}
          />
        ) : null}

        {step === "processing" ? <ProcessingStep onDone={() => setStep("done")} /> : null}

        {step === "done" ? (
          <DoneStep asset={asset} amount={amountNum} address={address} onClose={() => router.replace("/(tabs)")} />
        ) : null}
      </ScrollView>

      {order.includes(step) && step !== "pin" ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressed
            testID="send-next-button"
            disabled={!canNext || (needsAck && step === "recipient" && !ack)}
            onPress={next}
          >
            <LinearGradient
              colors={[colors.brandPrimary, "#2E6BFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.primaryBtn, (!canNext || (needsAck && step === "recipient" && !ack)) && styles.disabled]}
            >
              <Txt variant="title" tone="onBrand">
                {step === "review" ? "Confirm & sign" : "Continue"}
              </Txt>
            </LinearGradient>
          </Pressed>
        </View>
      ) : null}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Txt variant="caption" tone="tertiary">
        {label}
      </Txt>
      <Txt variant="caption" style={{ flex: 1, textAlign: "right" }}>
        {value}
      </Txt>
    </View>
  );
}

function SecurityStep({ onDone }: { onDone: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown < SECURITY_CHECKS.length) {
      const id = setTimeout(() => setShown((n) => n + 1), 420);
      return () => clearTimeout(id);
    }
    onDone();
  }, [shown, onDone]);
  return (
    <View style={{ gap: 14 }}>
      <Txt variant="bodyMed" tone="secondary">
        Sentiren is analyzing this transaction…
      </Txt>
      <Card style={{ gap: 14 }}>
        {SECURITY_CHECKS.map((c, i) => (
          <View key={c} style={styles.secCheck}>
            {i < shown ? (
              <CheckCircle2 size={18} color={colors.positive} />
            ) : (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            )}
            <Txt variant="bodyMed" tone={i < shown ? "primary" : "tertiary"}>
              {c}
            </Txt>
          </View>
        ))}
        {shown >= SECURITY_CHECKS.length ? (
          <View style={[styles.banner, { backgroundColor: colors.successSoft, marginTop: 2 }]}>
            <ShieldCheck size={16} color={colors.positive} />
            <Txt variant="caption" tone="positive">
              Risk: LOW — safe to continue.
            </Txt>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function PinStep({ pin, error, onKey, onDelete }: { pin: string; error: string; onKey: (d: string) => void; onDelete: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 18 }}>
      <Txt variant="bodyMed" tone="secondary">
        Enter your PIN to sign locally
      </Txt>
      <View style={styles.dots}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFill]} />
        ))}
      </View>
      {error ? (
        <Txt variant="caption" tone="negative">
          {error}
        </Txt>
      ) : null}
      <View style={styles.pad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k) =>
          k === "" ? (
            <View key="empty" style={styles.key} />
          ) : k === "del" ? (
            <Pressed key="del" style={styles.key} onPress={onDelete} testID="send-pin-del">
              <Delete size={22} color={colors.onSurface} />
            </Pressed>
          ) : (
            <Pressed key={k} style={styles.key} onPress={() => onKey(k)} testID={`send-pin-${k}`}>
              <Txt variant="h2">{k}</Txt>
            </Pressed>
          ),
        )}
      </View>
    </View>
  );
}

function ProcessingStep({ onDone }: { onDone: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const stages = ["Signing locally", "Broadcasting to network", "Awaiting confirmation"];
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage < stages.length) {
      const id = setTimeout(() => setStage((s) => s + 1), 900);
      return () => clearTimeout(id);
    }
    const id = setTimeout(onDone, 500);
    return () => clearTimeout(id);
  }, [stage, onDone, stages.length]);
  return (
    <View style={{ alignItems: "center", gap: 20, paddingTop: 30 }}>
      <Loader size={44} color={colors.accent} />
      <View style={{ gap: 12, alignSelf: "stretch" }}>
        {stages.map((s, i) => (
          <View key={s} style={styles.secCheck}>
            {i < stage ? (
              <CheckCircle2 size={18} color={colors.positive} />
            ) : i === stage ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <View style={styles.pendingDot} />
            )}
            <Txt variant="bodyMed" tone={i <= stage ? "primary" : "tertiary"}>
              {s}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function DoneStep({ asset, amount, address, onClose }: { asset: (typeof ASSETS)[number]; amount: number; address: string; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const hash = "0x" + Math.random().toString(16).slice(2, 10) + "…" + Math.random().toString(16).slice(2, 6);
  return (
    <View style={{ alignItems: "center", gap: 16, paddingTop: 24 }}>
      <View style={styles.doneIcon}>
        <ArrowUpRight size={40} color={colors.positive} />
      </View>
      <Txt variant="h1">Sent!</Txt>
      <Txt variant="numLg">{formatToken(amount, asset.symbol)}</Txt>
      <Card style={{ alignSelf: "stretch", gap: 10 }}>
        <ReviewRow label="To" value={shortAddr(address, 10, 8)} />
        <ReviewRow label="Tx hash" value={hash} />
        <ReviewRow label="Status" value="Confirmed" />
      </Card>
      <Pressed onPress={onClose} testID="send-done-close" style={{ alignSelf: "stretch" }}>
        <LinearGradient
          colors={[colors.brandPrimary, "#2E6BFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtnInline}
        >
          <Txt variant="title" tone="onBrand">
            Done
          </Txt>
        </LinearGradient>
      </Pressed>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  assetTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.surfaceTertiary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  progress: { flexDirection: "row", gap: 5, paddingHorizontal: 20, marginTop: 12 },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.surfaceTertiary },
  progressActive: { backgroundColor: c.accent },
  input: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    color: c.onSurface,
    padding: 16,
    fontFamily: "Manrope-Medium",
    fontSize: 15,
  },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12 },
  ackRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center" },
  amountBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 20 },
  amountInput: { color: c.onSurface, fontFamily: "Outfit-Bold", fontSize: 44, textAlign: "right", minWidth: 120 },
  balRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: c.surfaceTertiary, borderRadius: 12, padding: 14 },
  feeRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 },
  feeRowActive: { borderColor: c.accent },
  secCheck: { flexDirection: "row", alignItems: "center", gap: 12 },
  pendingDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: c.borderStrong },
  dots: { flexDirection: "row", gap: 14 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: c.borderStrong },
  dotFill: { backgroundColor: c.accent, borderColor: c.accent },
  pad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, width: 280 },
  key: { width: "30%", height: 58, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface, ...({ position: "absolute", left: 0, right: 0, bottom: 0 } as const) },
  primaryBtn: { borderRadius: 16, paddingVertical: 17, alignItems: "center" },
  primaryBtnInline: { borderRadius: 16, paddingVertical: 17, alignItems: "center", alignSelf: "stretch", marginTop: 6 },
  stepSub: { paddingHorizontal: 20, marginTop: 10 },
  disabled: { opacity: 0.4 },
  doneIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: c.successSoft, alignItems: "center", justifyContent: "center" },
}));
