import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, Heading, Screen, Small, Title, type IconName } from '../components/ui';
import { formatTimeShort } from '../lib/dates';
import { createHabit, HABIT_LIBRARY, type HabitTemplate } from '../lib/habits';
import { DISCLAIMER } from '../lib/report';
import { requestPermission } from '../services/notifications';
import { useStore } from '../state/store';
import { radius, space, TAP, useTheme } from '../theme';

export default function Onboarding() {
  const t = useTheme();
  const { dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>(['10-minute walk', 'Drink water', 'Bedtime routine']);
  const [custom, setCustom] = useState<HabitTemplate[]>([]);
  const [customName, setCustomName] = useState('');

  const options = [...HABIT_LIBRARY, ...custom];
  const toggle = (name: string) => setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  const addCustom = () => {
    const name = customName.trim();
    if (!name || options.some((o) => o.name.toLowerCase() === name.toLowerCase())) return;
    setCustom((c) => [...c, { name, icon: 'leaf-outline', type: 'general', reminderTimes: [] }]);
    setPicked((p) => [...p, name]);
    setCustomName('');
  };

  const finish = async (askForNotifications: boolean) => {
    if (askForNotifications) await requestPermission();
    const habits = options
      .filter((o) => picked.includes(o.name))
      .map((o, i) =>
        // The medication template has no name of its own; the person types it in later.
        createHabit({ name: o.type === 'general' ? o.name : 'My medication', icon: o.icon, type: o.type, reminderTimes: o.reminderTimes }, i),
      );
    dispatch({ type: 'addHabits', habits });
    dispatch({ type: 'updateSettings', patch: { onboardingDone: true } });
  };

  const dots = (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }} accessibilityLabel={`Step ${step + 1} of 3`}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? t.primary : t.border }} />
      ))}
    </View>
  );

  if (step === 0) {
    return (
      <Screen padTop>
        <View style={{ alignItems: 'center', gap: space.l, marginTop: space.xxl }}>
          <View style={[styles.logo, { backgroundColor: t.cardAlt }]}>
            <Ionicons name="flower-outline" size={56} color={t.primary} />
          </View>
          <Title style={{ textAlign: 'center' }}>Your PCOS routine, made calm.</Title>
          <Body muted style={{ textAlign: 'center' }}>
            Pay once. No subscription. No account. Your data stays on your phone.
          </Body>
        </View>
        <Card alt>
          <Small>{DISCLAIMER}</Small>
        </Card>
        {dots}
        <Button title="Get started" onPress={() => setStep(1)} />
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen padTop>
        {dots}
        <Title>Pick a few habits</Title>
        <Body muted>Start small. You can change names, times and days any time.</Body>
        <View style={{ gap: space.s }}>
          {options.map((o) => {
            const selected = picked.includes(o.name);
            return (
              <Pressable
                key={o.name}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={o.name}
                onPress={() => toggle(o.name)}
                style={[styles.option, { backgroundColor: selected ? t.cardAlt : t.card, borderColor: selected ? t.primary : t.border }]}
              >
                <Ionicons name={o.icon as IconName} size={22} color={t.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 16 }}>{o.name}</Text>
                  {o.reminderTimes.length > 0 && <Small>Reminder at {o.reminderTimes.map(formatTimeShort).join(', ')}</Small>}
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={selected ? t.primary : t.textMuted} />
              </Pressable>
            );
          })}
        </View>
        <Card>
          <Heading>Add your own</Heading>
          <View style={{ flexDirection: 'row', gap: space.s }}>
            <TextInput
              accessibilityLabel="Your own habit name"
              value={customName}
              onChangeText={setCustomName}
              onSubmitEditing={addCustom}
              placeholder="e.g. Morning sunlight"
              placeholderTextColor={t.textMuted}
              maxLength={60}
              returnKeyType="done"
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.bg }]}
            />
            <Button title="Add" kind="secondary" onPress={addCustom} disabled={!customName.trim()} />
          </View>
        </Card>
        <Button title={picked.length ? `Continue with ${picked.length}` : 'Continue without habits'} onPress={() => setStep(2)} />
        <Button title="Back" kind="ghost" onPress={() => setStep(0)} />
      </Screen>
    );
  }

  return (
    <Screen padTop>
      {dots}
      <View style={{ alignItems: 'center', gap: space.l, marginTop: space.xl }}>
        <View style={[styles.logo, { backgroundColor: t.cardAlt }]}>
          <Ionicons name="notifications-outline" size={52} color={t.primary} />
        </View>
        <Title style={{ textAlign: 'center' }}>Gentle reminders</Title>
        <Body muted style={{ textAlign: 'center' }}>
          We’ll send only the reminders you choose. You can set quiet hours, a daily maximum, or mute any habit in Settings.
        </Body>
      </View>
      <Button title="Allow notifications" icon="notifications-outline" onPress={() => finish(true)} />
      <Button title="Not now" kind="ghost" onPress={() => finish(false)} />
      <Button title="Back" kind="ghost" onPress={() => setStep(1)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  option: { minHeight: TAP + 12, flexDirection: 'row', alignItems: 'center', gap: space.m, borderWidth: 1.5, borderRadius: radius.card, paddingHorizontal: space.l, paddingVertical: space.s },
  input: { flex: 1, minHeight: TAP + 6, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: space.m, fontSize: 16 },
});
