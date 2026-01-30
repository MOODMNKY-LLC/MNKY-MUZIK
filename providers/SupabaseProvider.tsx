'use client';

import { createContext, useContext } from 'react';

import { createClient } from '@/lib/supabase/client';

type SupabaseContextType = {
  supabaseClient: ReturnType<typeof createClient>;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const supabaseClient = createClient();

  return (
    <SupabaseContext.Provider value={{ supabaseClient }}>{children}</SupabaseContext.Provider>
  );
};

export function useSupabaseClient() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return context.supabaseClient;
}
