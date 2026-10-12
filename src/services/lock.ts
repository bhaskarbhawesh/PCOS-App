import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** True when the phone has Face ID / Touch ID or at least a passcode we can fall back to. */
export async function canLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level !== LocalAuthentication.SecurityLevel.NONE;
}

export async function unlock(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Compite',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false, // passcode fallback
  });
  return result.success;
}
