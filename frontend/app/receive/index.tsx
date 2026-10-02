import { useLocalSearchParams } from "expo-router";
import { Check, Copy, Share2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Platform, ScrollView, Share, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";

import { AssetIcon } from "@/src/components/AssetIcon";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Card, Pressed, Txt } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { ASSETS } from "@/src/wallet/assets";
import { useWallet } from "@/src/wallet/WalletContext";

const RECEIVE_IDS = ["btc", "eth", "bnb", "trx", "usdt-erc20"];
const EXPIRIES = ["None", "1 hour", "24 hours", "7 days"] as const;

export default function ReceiveScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { assetId } = useLocalSearchParams<{ assetId?: string }>();
  const { addresses } = useWallet();

  const receiveAssets = useMemo(() => RECEIVE_IDS.map((id) => ASSETS.find((a) => a.id === id)!).filter(Boolean), []);
  const [selectedId, setSelectedId] = useState(assetId && RECEIVE_IDS.includes(assetId) ? assetId : "btc");
  const asset = ASSETS.find((a) => a.id === selectedId)!;
  const address = addresses?.[asset.chain] ?? "";

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [expiry, setExpiry] = useState<(typeof EXPIRIES)[number]>("None");
  const [copied, setCopied] = useState(false);

  const payload = useMemo(() => {
    let p = `${asset.chain.toLowerCase()}:${address}`;
    const params: string[] = [];
    if (amount) params.push(`amount=${amount}`);
    if (message) params.push(`message=${encodeURIComponent(message)}`);
    if (params.length) p += `?${params.join("&")}`;
    return p;
  }, [asset.chain, address, amount, message]);

  const copy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    const lines = [
      `Send me ${asset.symbol}${amount ? ` (${amount} ${asset.symbol})` : ""} on ${asset.network}`,
      address,
      message ? `Note: ${message}` : "",
      expiry !== "None" ? `Expires in ${expiry}` : "",
    ].filter(Boolean);
    await Share.share({ message: lines.join("\n") });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Receive" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Asset chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
        >
          {receiveAssets.map((a) => (
            <Pressed
              key={a.id}
              style={[styles.chip, selectedId === a.id && styles.chipActive]}
              onPress={() => setSelectedId(a.id)}
              testID={`receive-chip-${a.id}`}
            >
              <AssetIcon symbol={a.symbol} color={a.color} size={22} />
              <Txt variant="bodyMed" tone={selectedId === a.id ? "primary" : "secondary"}>
                {a.symbol}
              </Txt>
            </Pressed>
          ))}
        </ScrollView>

        {/* QR card with neon gradient frame */}
        <LinearGradient
          colors={[colors.accent, colors.brandPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.qrFrame}
        >
          <View style={styles.qrCard} testID="receive-qr-card">
            <View style={styles.badge}>
              <Check size={12} color={colors.accent} />
              <Txt variant="micro" tone="accent">
                Verified · {asset.name}
                {asset.listNumber ? ` · List #${asset.listNumber}` : ""}
              </Txt>
            </View>
            <View style={styles.qrWrap}>
              <QRCode value={payload || "xtrushield"} size={188} backgroundColor="#FFFFFF" color="#0B0F19" />
              <View style={[styles.qrLogo, { borderColor: "#FFFFFF", backgroundColor: asset.color }]}>
                <Txt variant="micro" style={{ color: "#FFFFFF", fontSize: 9 }}>
                  {asset.symbol.slice(0, 3)}
                </Txt>
              </View>
            </View>
            <View style={styles.addrPill}>
              <Txt variant="caption" numberOfLines={1} style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", letterSpacing: 0.4 }}>
                {address}
              </Txt>
            </View>
            <Txt variant="micro" tone="tertiary">
              {asset.network} network · send only {asset.symbol} to this address
            </Txt>
            <View style={styles.qrActions}>
              <Pressed style={styles.qrBtn} onPress={copy} testID="receive-copy">
                <Copy size={16} color={colors.onSurface} />
                <Txt variant="caption">{copied ? "Copied!" : "Copy"}</Txt>
              </Pressed>
              <Pressed style={styles.qrBtn} onPress={share} testID="receive-share">
                <Share2 size={16} color={colors.onSurface} />
                <Txt variant="caption">Share</Txt>
              </Pressed>
            </View>
          </View>
        </LinearGradient>

        {/* Optional request details */}
        <Txt variant="h3" style={styles.h}>
          Payment request
        </Txt>
        <Card style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Txt variant="micro" tone="tertiary">
              AMOUNT (OPTIONAL)
            </Txt>
            <TextInput
              testID="receive-amount"
              value={amount}
              onChangeText={setAmount}
              placeholder={`0.00 ${asset.symbol}`}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Txt variant="micro" tone="tertiary">
              MESSAGE (OPTIONAL)
            </Txt>
            <TextInput
              testID="receive-message"
              value={message}
              onChangeText={setMessage}
              placeholder="What's this for?"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Txt variant="micro" tone="tertiary">
              EXPIRES
            </Txt>
            <View style={styles.expiryRow}>
              {EXPIRIES.map((e) => (
                <Pressed
                  key={e}
                  style={[styles.expiryChip, expiry === e && styles.expiryChipActive]}
                  onPress={() => setExpiry(e)}
                  testID={`receive-expiry-${e}`}
                >
                  <Txt variant="micro" tone={expiry === e ? "onBrand" : "secondary"}>
                    {e}
                  </Txt>
                </Pressed>
              ))}
            </View>
          </View>
        </Card>

        <Pressed onPress={share} testID="receive-share-request">
          <LinearGradient
            colors={[colors.brandPrimary, "#2E6BFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareBtn}
          >
            <Share2 size={18} color={colors.onBrandPrimary} />
            <Txt variant="title" tone="onBrand">
              Share payment request
            </Txt>
          </LinearGradient>
        </Pressed>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  chipRow: { marginBottom: 20, flexGrow: 0 },
  chipRowContent: { gap: 8, paddingRight: 16 },
  chip: {
    flexShrink: 0,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: c.surfaceTertiary,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipActive: { borderColor: c.accent, backgroundColor: c.accentSoft },
  qrFrame: { borderRadius: 27, padding: 1.5 },
  qrCard: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: 25,
    padding: 20,
    alignItems: "center",
    gap: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: c.accentSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  qrWrap: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 20 },
  qrLogo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  addrPill: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "stretch",
    alignItems: "center",
  },
  qrActions: { flexDirection: "row", gap: 12 },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  h: { marginTop: 22, marginBottom: 8 },
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
  expiryRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  expiryChip: { flexShrink: 0, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: c.surfaceTertiary, borderWidth: 1, borderColor: c.border },
  expiryChipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  shareBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 17,
    marginTop: 20,
  },
}));
