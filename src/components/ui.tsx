import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dateFromTime, formatTimeShort, timeFromDate } from '../lib/dates';
import type { TimeOfDay } from '../lib/types';
import { radius, space, TAP, useTheme } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  scroll = true,
  padTop = false,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Add the safe-area top inset (for screens without a header). */
  padTop?: boolean;
  footer?: ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const content = { padding: space.l, paddingTop: (padTop ? insets.top : 0) + space.l, paddingBottom: space.xxl + 64, gap: space.l };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {children}
        </ScrollView>
      ) : (
        <View style={[content, { flex: 1 }]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={[{ color: t.text, fontSize: 28, fontWeight: '700' }, style]}>
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={{ color: t.text, fontSize: 17, fontWeight: '600' }}>
      {children}
    </Text>
  );
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ color: muted ? t.textMuted : t.text, fontSize: 15, lineHeight: 21 }, style]}>{children}</Text>;
}

export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ color: t.textMuted, fontSize: 13, lineHeight: 18 }, style]}>{children}</Text>;
}

export function Card({ children, style, alt }: { children: ReactNode; style?: StyleProp<ViewStyle>; alt?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: alt ? t.cardAlt : t.card, borderRadius: radius.card, padding: space.l, gap: space.m },
        !t.dark && !alt && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  accessibilityHint,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = { primary: t.primary, secondary: t.cardAlt, ghost: 'transparent', danger: 'transparent' }[kind];
  const fg = { primary: t.onPrimary, secondary: t.text, ghost: t.primary, danger: t.danger }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        kind === 'danger' && { borderWidth: 1, borderColor: t.danger },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={fg} />}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? t.primary : t.card,
          borderColor: selected ? t.primary : t.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={selected ? t.onPrimary : t.text} />}
      <Text style={{ color: selected ? t.onPrimary : t.text, fontSize: 15, fontWeight: selected ? '600' : '400' }}>{label}</Text>
    </Pressable>
  );
}

/** A tappable list row, typically leading to another screen. */
export function Row({
  label,
  value,
  icon,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  danger?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      {icon && <Ionicons name={icon} size={22} color={danger ? t.danger : t.primary} />}
      <Text style={{ flex: 1, color: danger ? t.danger : t.text, fontSize: 16 }}>{label}</Text>
      {value != null && <Text style={{ color: t.textMuted, fontSize: 15 }}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={18} color={t.textMuted} />}
    </Pressable>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: t.text, fontSize: 16 }}>{label}</Text>
        {hint && <Small>{hint}</Small>}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: t.primary, false: t.border }}
      />
    </View>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const t = useTheme();
  const btn = (delta: -1 | 1, icon: IconName, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={delta < 0 ? value <= min : value >= max}
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={({ pressed }) => [styles.stepBtn, { backgroundColor: t.cardAlt, opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={20} color={t.text} />
    </Pressable>
  );
  return (
    <View style={styles.row} accessible={false}>
      <Text style={{ flex: 1, color: t.text, fontSize: 16 }}>{label}</Text>
      {btn(-1, 'remove', `Decrease ${label}`)}
      <Text accessibilityLiveRegion="polite" style={{ color: t.text, fontSize: 16, fontWeight: '600', minWidth: 36, textAlign: 'center' }}>
        {format(value)}
      </Text>
      {btn(1, 'add', `Increase ${label}`)}
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

/** Shows a time; tapping opens the native time picker. */
export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TimeOfDay;
  onChange: (t: TimeOfDay) => void;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.row}>
        <Text style={{ flex: 1, color: t.text, fontSize: 16 }}>{label}</Text>
        <DateTimePicker
          accessibilityLabel={label}
          mode="time"
          display="compact"
          value={dateFromTime(value)}
          onChange={(_, d) => d && onChange(timeFromDate(d))}
          accentColor={t.primary}
        />
      </View>
    );
  }
  return (
    <View>
      <Row label={label} value={formatTimeShort(value)} onPress={() => setOpen(true)} />
      {open && (
        <DateTimePicker
          mode="time"
          value={dateFromTime(value)}
          onChange={(_, d) => {
            setOpen(false);
            if (d) onChange(timeFromDate(d));
          }}
        />
      )}
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
      <Ionicons name={icon} size={40} color={t.primary} />
      <Text style={{ color: t.text, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
      {body && <Body muted style={{ textAlign: 'center' }}>{body}</Body>}
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#6C4F8F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: {
    minHeight: TAP + 6,
    borderRadius: radius.control,
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
  },
  chip: {
    minHeight: TAP,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.l,
    paddingVertical: space.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  row: { minHeight: TAP + 4, flexDirection: 'row', alignItems: 'center', gap: space.m },
  stepBtn: { width: TAP, height: TAP, borderRadius: TAP / 2, alignItems: 'center', justifyContent: 'center' },
});
