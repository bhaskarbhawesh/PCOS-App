import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { unlock } from '../services/lock';
import { space, useTheme } from '../theme';
import { Body, Button, Title } from './ui';

export function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const t = useTheme();
  const busy = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (await unlock()) onUnlocked();
    } finally {
      busy.current = false;
    }
  }, [onUnlocked]);

  useEffect(() => {
    tryUnlock();
  }, [tryUnlock]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: t.bg }]} accessibilityViewIsModal>
      <Ionicons name="lock-closed-outline" size={48} color={t.primary} />
      <Title>Compite is locked</Title>
      <Body muted style={{ textAlign: 'center' }}>
        Your entries are private. Unlock with Face ID or your passcode.
      </Body>
      <Button title="Unlock" icon="finger-print-outline" onPress={tryUnlock} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.l, zIndex: 100 },
});
