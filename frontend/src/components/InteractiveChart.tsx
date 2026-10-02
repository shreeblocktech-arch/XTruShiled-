import { useMemo, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

import { formatPrice } from "@/src/lib/format";
import { makeStyles, useTheme } from "@/src/theme";
import { Txt } from "./ui";

interface Props {
  data: number[];
  width: number;
  height: number;
  color?: string;
}

// Line/area chart with touch-to-inspect crosshair. Drag across to read the
// value at any point; release keeps the last reading.
export function InteractiveChart({ data, width, height, color }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [sel, setSel] = useState<number | null>(null);
  const trendUp = data.length >= 2 ? data[data.length - 1] >= data[0] : true;
  const stroke = color ?? (trendUp ? colors.positive : colors.negative);

  const { pts, line, area, min, max } = useMemo(() => {
    if (!data || data.length < 2) return { pts: [] as number[][], line: "", area: "", min: 0, max: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pad = 6;
    const pts = data.map((v, i) => {
      const x = i * stepX;
      const y = pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2);
      return [x, y];
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const area = `${line} L${width} ${height} L0 ${height} Z`;
    return { pts, line, area, min, max };
  }, [data, width, height]);

  if (!line) return <View style={{ width, height }} />;
  const gid = "ic-grad";

  const onTouch = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    const i = Math.round((x / width) * (data.length - 1));
    setSel(Math.max(0, Math.min(data.length - 1, i)));
  };

  const selPt = sel != null ? pts[sel] : null;

  return (
    <View style={{ width }}>
      <View style={styles.readout}>
        <Txt variant="numLg" style={{ color: stroke }}>
          {formatPrice(sel != null ? data[sel] : data[data.length - 1])}
        </Txt>
      </View>
      <View
        style={{ width, height }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onTouch}
        onResponderMove={onTouch}
        onResponderRelease={() => {}}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.3} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${gid})`} />
          <Path d={line} stroke={stroke} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {selPt ? (
            <>
              <Line x1={selPt[0]} y1={0} x2={selPt[0]} y2={height} stroke={colors.borderStrong} strokeWidth={1} strokeDasharray="3 3" />
              <Circle cx={selPt[0]} cy={selPt[1]} r={5} fill={stroke} stroke={colors.surface} strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  readout: { marginBottom: 8 },
}));
