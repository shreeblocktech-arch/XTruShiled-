import { CreditCard } from "lucide-react-native";
import { View } from "react-native";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Card, Txt } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function CardScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ScreenHeader title="XtruShield Card" />
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <CreditCard size={40} color={colors.accent} />
        </View>
        <Txt variant="h2" style={{ textAlign: "center" }}>
          Demo
        </Txt>
        <Card style={styles.badge}>
          <Txt variant="caption" tone="warning" style={{ textAlign: "center" }}>
            Requires issuer / KYC partner
          </Txt>
        </Card>
        <Txt variant="bodyMed" tone="secondary" style={{ textAlign: "center" }}>
          The XtruShield spending card is a preview. Card issuance, funding and KYC unlock once a
          banking partner is connected.
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: c.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: c.warningSoft, borderColor: c.warning + "55" },
}));
