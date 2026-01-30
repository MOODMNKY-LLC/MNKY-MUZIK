import type { User } from '@supabase/supabase-js';
import { useState, createContext, useEffect, useContext, useMemo } from 'react';

import { useSupabaseClient } from '@/providers/SupabaseProvider';
import type { UserDetails, UserRole, Subscription } from '@/types';

type UserContextType = {
  accessToken: string | null;
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  subscription: Subscription | null;
  role: UserRole | null;
  canPlay: boolean;
  refetchUserData: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export interface Props {
  [propName: string]: unknown;
}

export const MyUserContextProvider = (props: Props) => {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token?: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoadingUser(false);
    });

    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => {
      sub.unsubscribe();
    };
  }, [supabase]);

  const accessToken = session?.access_token ?? null;

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const getUserDetails = () => supabase.from('users').select('*').single();
  const getSubscription = () =>
    supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .single();

  useEffect(() => {
    if (user && !isLoadingData && !userDetails && !subscription) {
      setIsLoadingData(true);

      Promise.allSettled([getUserDetails(), getSubscription()]).then(
        ([userDetailsPromise, subscriptionPromise]) => {
          if (userDetailsPromise.status === 'fulfilled') {
            setUserDetails(userDetailsPromise.value?.data as unknown as UserDetails);
          } else {
            console.error(userDetailsPromise.reason);
          }

          if (subscriptionPromise.status === 'fulfilled') {
            setSubscription(subscriptionPromise.value?.data as unknown as Subscription);
          } else {
            console.error(subscriptionPromise.reason);
          }

          setIsLoadingData(false);
        }
      );
    } else if (!user && !isLoadingUser && !isLoadingData) {
      setUserDetails(null);
      setSubscription(null);
    }
  }, [user, isLoadingUser]);

  const refetchUserData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    const [userDetailsPromise, subscriptionPromise] = await Promise.allSettled([
      getUserDetails(),
      getSubscription(),
    ]);
    if (userDetailsPromise.status === 'fulfilled') {
      setUserDetails(userDetailsPromise.value?.data as unknown as UserDetails);
    }
    if (subscriptionPromise.status === 'fulfilled') {
      setSubscription(subscriptionPromise.value?.data as unknown as Subscription);
    }
    setIsLoadingData(false);
  };

  const role = (userDetails?.role as UserRole) ?? null;
  const canPlay = useMemo(() => {
    if (!user) return false;
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_BYPASS_SUBSCRIPTION === 'true') return true;
    if (subscription) return true;
    if (role === 'admin') return true;
    if (role === 'beta') {
      const until = userDetails?.beta_until;
      if (!until) return true;
      return new Date(until) > new Date();
    }
    return false;
  }, [user, subscription, role, userDetails?.beta_until]);

  const value = {
    accessToken,
    user,
    userDetails,
    isLoading: isLoadingUser || isLoadingData,
    subscription,
    role,
    canPlay,
    refetchUserData,
  };

  return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a MyUserContextProvider');
  }
  return context;
};
