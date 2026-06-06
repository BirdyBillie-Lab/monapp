'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, Client, IncomeEntry, Product, UserProfile } from './types';

const STORAGE_KEY = 'copilote_data';

const defaultState: AppState = {
  profile: null,
  entries: [],
  clients: [],
  products: [],
};

interface StoreContextValue extends AppState {
  saveProfile: (profile: UserProfile) => void;
  addEntry: (entry: IncomeEntry) => void;
  updateEntry: (entry: IncomeEntry) => void;
  deleteEntry: (id: string) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
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
        const parsed = JSON.parse(raw) as Partial<AppState>;
        setState({ ...defaultState, ...parsed, clients: parsed.clients ?? [], products: parsed.products ?? [] });
      }
    } catch { /* ignore */ }
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const saveProfile  = useCallback((profile: UserProfile) => persist({ ...state, profile }), [state, persist]);
  const addEntry     = useCallback((entry: IncomeEntry)   => persist({ ...state, entries: [entry, ...state.entries] }), [state, persist]);
  const updateEntry  = useCallback((entry: IncomeEntry)   => persist({ ...state, entries: state.entries.map(e => e.id === entry.id ? entry : e) }), [state, persist]);
  const deleteEntry  = useCallback((id: string)           => persist({ ...state, entries: state.entries.filter(e => e.id !== id) }), [state, persist]);
  const addClient     = useCallback((client: Client)     => persist({ ...state, clients: [client, ...state.clients] }), [state, persist]);
  const updateClient  = useCallback((client: Client)     => persist({ ...state, clients: state.clients.map(c => c.id === client.id ? client : c) }), [state, persist]);
  const deleteClient  = useCallback((id: string)         => persist({ ...state, clients: state.clients.filter(c => c.id !== id) }), [state, persist]);
  const addProduct    = useCallback((product: Product)   => persist({ ...state, products: [product, ...state.products] }), [state, persist]);
  const updateProduct = useCallback((product: Product)   => persist({ ...state, products: state.products.map(p => p.id === product.id ? product : p) }), [state, persist]);
  const deleteProduct = useCallback((id: string)         => persist({ ...state, products: state.products.filter(p => p.id !== id) }), [state, persist]);

  return (
    <StoreContext.Provider value={{ ...state, saveProfile, addEntry, updateEntry, deleteEntry, addClient, updateClient, deleteClient, addProduct, updateProduct, deleteProduct, isLoaded }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
