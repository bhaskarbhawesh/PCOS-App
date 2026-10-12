import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimeShort } from '../lib/dates';
import type { Habit } from '../lib/types';
import { radius, space, TAP, useTheme } from '../theme';
import type { IconName } from './ui';

export function HabitCard({
  habit,
  done,
  streak,
  onToggle,
  onOpen,
  reorder,
  onMove,
}: {
  habit: Habit;
  done: boolean;
  streak: number;
  onToggle: () => void;
  onOpen: () => void;
  reorder?: boolean;
  onMove?: (delta: -1 | 1) => void;
}) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const toggle = () => {
    Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    if (!done && !reduceMotion) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 110, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    onToggle();
  };

  const times = habit.reminderTimes.map(formatTimeShort).join(', ');
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: done ? t.accent : t.border }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={habit.name}
        accessibilityHint={done ? 'Marks as not done today' : 'Marks as done today'}
        onPress={toggle}
        hitSlop={8}
        style={styles.tickWrap}
      >
        <Animated.View
          style={[
            styles.tick,
            { borderColor: done ? t.accent : t.primary, backgroundColor: done ? t.accent : 'transparent', transform: [{ scale }] },
          ]}
        >
          {done && <Ionicons name="checkmark" size={24} color={t.dark ? t.bg : '#fff'} />}
        </Animated.View>
      </Pressable>

      <Pressable
        style={{ flex: 1, minHeight: TAP, justifyContent: 'center' }}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${habit.name}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Ionicons name={habit.icon as IconName} size={18} color={t.primary} />
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '600', flexShrink: 1 }}>{habit.name}</Text>
        </View>
        <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}>
          {[times || 'No reminder', habit.muted ? 'muted' : null, streak > 0 ? `${streak}-day streak` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </Pressable>

      {reorder && onMove && (
        <View style={{ flexDirection: 'row' }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Move ${habit.name} up`} onPress={() => onMove(-1)} style={styles.move}>
            <Ionicons name="chevron-up" size={22} color={t.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Move ${habit.name} down`} onPress={() => onMove(1)} style={styles.move}>
            <Ionicons name="chevron-down" size={22} color={t.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingVertical: space.m,
    paddingHorizontal: space.m,
  },
  tickWrap: { width: TAP + 4, height: TAP + 4, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  move: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
});
