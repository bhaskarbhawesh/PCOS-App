import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { migrate, reducer, type Action } from '../lib/reducer';
import { emptyData, type AppData } from '../lib/types';

const STORAGE_KEY = 'compite:data:v1';

interface Store {
  data: AppData;
  dispatch: (action: Action) => void;
  loaded: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, emptyData);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', data: migrate(JSON.parse(raw)) });
      })
      .catch(() => {
        // Unreadable data: start fresh rather than crash. Never log the contents (health data).
      })
      .finally(() => setLoaded(true));
  }, []);

  // Save shortly after every change, and immediately when the app goes to the background.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => persist(latest.current), 250);
    return () => clearTimeout(t);
  }, [data, loaded]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && loaded) persist(latest.current);
    });
    return () => sub.remove();
  }, [loaded]);

  return <StoreContext.Provider value={{ data, dispatch, loaded }}>{children}</StoreContext.Provider>;
}

function persist(data: AppData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export async function wipeStorage() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
