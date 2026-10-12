import Constants from 'expo-constants';
import { Linking } from 'react-native';

import { Body, Card, Divider, Heading, Row, Screen, Small } from '../../components/ui';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../../lib/config';
import { DISCLAIMER } from '../../lib/report';

export default function AboutScreen() {
  return (
    <Screen>
      <Card>
        <Heading>Compite</Heading>
        <Body>
          A calm routine app for people with PCOS: pick your daily habits, get gentle reminders, log how you feel in seconds, and bring a clear
          summary to your doctor. Pay once. No subscription. No ads. No account.
        </Body>
        <Small>Version {Constants.expoConfig?.version ?? '1.0.0'}</Small>
      </Card>
      <Card alt>
        <Heading>Important</Heading>
        <Body>{DISCLAIMER}</Body>
      </Card>
      <Card>
        <Row icon="mail-outline" label="Email support" value={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        <Divider />
        <Row icon="open-outline" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
      </Card>
    </Screen>
  );
}
