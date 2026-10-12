import { router } from 'expo-router';
import { Linking } from 'react-native';

import { Card, Divider, Row, Screen, Small, Title } from '../../components/ui';
import { SUPPORT_EMAIL } from '../../lib/config';
import { DISCLAIMER } from '../../lib/report';
import { useStore } from '../../state/store';

export default function SettingsScreen() {
  const { data } = useStore();
  const s = data.settings;
  return (
    <Screen padTop>
      <Title>Settings</Title>
      <Card>
        <Row
          icon="notifications-outline"
          label="Notifications"
          value={s.notificationsEnabled ? `Up to ${s.maxRemindersPerDay}/day` : 'Off'}
          onPress={() => router.push('/settings/notifications')}
        />
        <Divider />
        <Row icon="document-text-outline" label="Doctor summary (PDF)" onPress={() => router.push('/settings/report')} />
        <Divider />
        <Row icon="shield-checkmark-outline" label="Privacy & data" onPress={() => router.push('/settings/privacy')} />
      </Card>
      <Card>
        <Row icon="information-circle-outline" label="About Compite" onPress={() => router.push('/settings/about')} />
        <Divider />
        <Row icon="mail-outline" label="Contact support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Card>
      <Small>{DISCLAIMER}</Small>
    </Screen>
  );
}
