'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, IncomeEntry, UserProfile } from './types';

const STORAGE_KEY = 'copilote_data';

const defaultState: AppState = {
  profile: null,
  entries: [],
};

interface StoreContextValue extends AppState {
  saveProfile: (profile: UserProfile) => void;
  addEntry: (entry: IncomeEntry) => void;
  deleteEntry: (id: string) => void;
  isLoaded: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        setState(parsed);
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const saveProfile = useCallback(
    (profile: UserProfile) => {
      persist({ ...state, profile });
    },
    [state, persist]
  );

  const addEntry = useCallback(
    (entry: IncomeEntry) => {
      const entries = [entry, ...state.entries];
      persist({ ...state, entries });
    },
    [state, persist]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      const entries = state.entries.filter((e) => e.id !== id);
      persist({ ...state, entries });
    },
    [state, persist]
  );

  return (
    <StoreContext.Provider
      value={{ ...state, saveProfile, addEntry, deleteEntry, isLoaded }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
