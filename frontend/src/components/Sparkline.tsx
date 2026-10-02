import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useTheme } from "@/src/theme";

interface Props {
  data: number[];
  width: number;
  height: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}

export function Sparkline({ data, width, height, color, fill = false, strokeWidth = 2 }: Props) {
  const { colors } = useTheme();
  const trendUp = data.length >= 2 ? data[data.length - 1] >= data[0] : true;
  const stroke = color ?? (trendUp ? colors.positive : colors.negative);

  const { line, area } = useMemo(() => {
    if (!data || data.length < 2) return { line: "", area: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pad = strokeWidth;
    const pts = data.map((v, i) => {
      const x = i * stepX;
      const y = pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const area = `${line} L${width} ${height} L0 ${height} Z`;
    return { line, area };
  }, [data, width, height, strokeWidth]);

  if (!line) return <View style={{ width, height }} />;
  const gid = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <Svg width={width} height={height}>
      {fill ? (
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
            <Stop offset="1" stopColor={stroke} stopOpacity={0} />
          </LinearGradient>
        </Defs>
      ) : null}
      {fill ? <Path d={area} fill={`url(#${gid})`} /> : null}
      <Path d={line} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
