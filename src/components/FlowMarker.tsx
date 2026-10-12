import { View } from 'react-native';

import type { CycleEntry } from '../lib/types';
import { useTheme } from '../theme';

/**
 * Encodes flow by shape and count, not colour alone:
 * spotting = hollow ring, light/medium/heavy = 1/2/3 dots, other notes = a short dash.
 */
export function FlowMarker({ entry, size = 6 }: { entry: CycleEntry; size?: number }) {
  const t = useTheme();
  const dot = (k: number) => <View key={k} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.flow }} />;
  let content;
  switch (entry.flow) {
    case 'spotting':
      content = <View style={{ width: size + 1, height: size + 1, borderRadius: size, borderWidth: 1.5, borderColor: t.flow }} />;
      break;
    case 'light':
      content = dot(0);
      break;
    case 'medium':
      content = [0, 1].map(dot);
      break;
    case 'heavy':
      content = [0, 1, 2].map(dot);
      break;
    default:
      content = <View style={{ width: size * 1.6, height: 2, borderRadius: 1, backgroundColor: t.textMuted }} />;
  }
  return <View style={{ flexDirection: 'row', gap: 2, height: size + 2, alignItems: 'center' }}>{content}</View>;
}
