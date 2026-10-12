import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { Body, Button, Card, Divider, Heading, Row, Screen, Small, ToggleRow } from '../../components/ui';
import { PRIVACY_POLICY_URL } from '../../lib/config';
import { shareCsvExport } from '../../services/export';
import { canLock, unlock } from '../../services/lock';
import { cancelAllReminders } from '../../services/notifications';
import { useStore, wipeStorage } from '../../state/store';

export default function PrivacyScreen() {
  const { data, dispatch } = useStore();
  const [lockAvailable, setLockAvailable] = useState(false);

  useEffect(() => {
    canLock().then(setLockAvailable);
  }, []);

  const setLock = async (on: boolean) => {
    // Confirm the person can actually unlock before turning the lock on.
    if (on && !(await unlock())) return;
    dispatch({ type: 'updateSettings', patch: { lockEnabled: on } });
  };

  const exportCsv = async () => {
    try {
      await shareCsvExport(data);
    } catch {
      Alert.alert('Couldn’t export', 'Please try again.');
    }
  };

  const deleteAll = () =>
    Alert.alert(
      'Delete all my data?',
      'This will permanently delete all your habits, check-ins and cycle entries from this phone. This can’t be undone. Export a backup first if you’d like to keep a copy.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await cancelAllReminders();
            await wipeStorage();
            dispatch({ type: 'reset' }); // also resets onboarding, which routes back to the welcome screen
          },
        },
      ],
    );

  return (
    <Screen>
      <Card alt>
        <Heading>Private by design</Heading>
        <Body>
          No account, no ads, no analytics, no tracking. Everything you enter is stored only on this phone. Nothing leaves it unless you export it.
        </Body>
      </Card>

      <Card>
        <ToggleRow
          label="Lock with Face ID / passcode"
          hint={lockAvailable ? 'Asks to unlock each time you open the app.' : 'Set up Face ID or a passcode on your iPhone to use this.'}
          value={data.settings.lockEnabled}
          onChange={setLock}
          disabled={!lockAvailable && !data.settings.lockEnabled}
        />
      </Card>

      <Card>
        <Row icon="download-outline" label="Export all data (CSV)" onPress={exportCsv} />
        <Small>A spreadsheet of everything you’ve logged, shared through the iOS share sheet.</Small>
        <Divider />
        <Row icon="open-outline" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
      </Card>

      <Button kind="danger" icon="trash-outline" title="Delete all my data" onPress={deleteAll} />
      <Small>Deleting also cancels every scheduled reminder and returns you to the welcome screen.</Small>
    </Screen>
  );
}
