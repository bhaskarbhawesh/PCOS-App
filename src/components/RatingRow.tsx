import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Rating } from '../lib/types';
import { space, TAP, useTheme } from '../theme';

/**
 * Five large tap targets for a 1–5 self-rating. Tapping the selected value again clears it,
 * so every metric is optional.
 */
export function RatingRow({
  label,
  low,
  high,
  faces,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  faces: readonly [string, string, string, string, string];
  value: Rating | null;
  onChange: (v: Rating | null) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: space.s }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: t.textMuted, fontSize: 13 }}>
          1 {low} · 5 {high}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space.s }} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {faces.map((face, i) => {
          const v = (i + 1) as Rating;
          const selected = value === v;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityLabel={`${label} ${v} of 5${v === 1 ? `, ${low}` : v === 5 ? `, ${high}` : ''}`}
              accessibilityState={{ selected }}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(selected ? null : v);
              }}
              style={({ pressed }) => [
                styles.cell,
                {
                  backgroundColor: selected ? t.primary : t.cardAlt,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{face}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: selected ? t.onPrimary : t.textMuted }}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, minHeight: TAP + 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
});
