// App.tsx

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { AuthScreen } from './src/screens/AuthScreen';
import {
  BookingsScreen,
  BrowseScreen,
  JobsScreen,
  MyQuotesScreen,
  ProfileScreen,
} from './src/screens/MarketplaceScreens';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { themes, type ThemeMode } from './src/theme';
import type {
  AccountRole,
  Profile,
  ProviderType,
} from './src/types';

const customerTabs = [
  { id: 'browse', label: 'Find', icon: '⌕' },
  { id: 'jobs', label: 'Jobs', icon: '＋' },
  { id: 'quotes', label: 'Quotes', icon: '▤' },
  { id: 'bookings', label: 'Bookings', icon: '✓' },
  { id: 'profile', label: 'Profile', icon: '◉' },
] as const;

const providerTabs = [
  { id: 'jobs', label: 'Jobs', icon: '＋' },
  { id: 'quotes', label: 'Quotes', icon: '▤' },
  { id: 'bookings', label: 'Bookings', icon: '✓' },
  { id: 'profile', label: 'Profile', icon: '◉' },
] as const;

type Tab = 'browse' | 'jobs' | 'quotes' | 'bookings' | 'profile';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('browse');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const palette = themes[themeMode];
  const role: AccountRole = profile?.account_role ?? 'customer';
  const tabs = role === 'provider' ? providerTabs : customerTabs;
  const initialProviderType: ProviderType =
    profile?.provider_type ?? 'individual';

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => {})
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        setTab('browse');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, phone, suburb, account_role, provider_type, is_admin',
        )
        .eq('id', session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        Alert.alert('Profile unavailable', error.message);
        setProfileLoading(false);
        return;
      }

      if (!data) {
        Alert.alert(
          'Account unavailable',
          'Your FixMate profile could not be found. Please contact support.',
        );
        setProfileLoading(false);
        return;
      }

      const nextProfile = data as Profile;

      setProfile(nextProfile);
      setTab(
        nextProfile.account_role === 'provider' ? 'jobs' : 'browse',
      );
      setProfileLoading(false);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Could not sign out', error.message);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text
          style={{
            color: palette.text,
            fontSize: 22,
            fontWeight: '800',
          }}
        >
          FixMate setup required
        </Text>

        <Text style={{ color: palette.muted, marginTop: 12 }}>
          Add your Supabase URL and anon key to the .env file, then restart
          Expo.
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: palette.text }}>Loading FixMate…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: palette.bg }}
      >
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        />
        <AuthScreen palette={palette} />
      </SafeAreaView>
    );
  }

  if (profileLoading || !profile) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: palette.text }}>
          Loading your account…
        </Text>
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (tab) {
      case 'browse':
        return role === 'customer' ? (
          <BrowseScreen palette={palette} />
        ) : null;

      case 'jobs':
        return (
          <JobsScreen
            palette={palette}
            userId={session.user.id}
            role={role}
          />
        );

      case 'quotes':
        return (
          <MyQuotesScreen
            palette={palette}
            userId={session.user.id}
            role={role}
          />
        );

      case 'bookings':
        return (
          <BookingsScreen
            palette={palette}
            userId={session.user.id}
            role={role}
          />
        );

case 'profile':
  return (
    <ProfileScreen
      palette={palette}
      userId={session.user.id}
      email={session.user.email ?? ''}
      onSignOut={signOut}
      onTheme={() =>
        setThemeMode(current =>
          current === 'dark' ? 'light' : 'dark',
        )
      }
      theme={themeMode}
      role={role}
      initialProviderType={initialProviderType}
    />
  );
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
<StatusBar
  barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
/>

      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <Text
          style={{
            color: palette.text,
            fontSize: 23,
            fontWeight: '900',
            letterSpacing: 1,
          }}
        >
          FIXMATE
        </Text>

        <Text style={{ color: palette.muted, fontSize: 12 }}>
          {role === 'provider'
            ? 'Provider workspace'
            : 'Services made simple'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>{renderScreen()}</View>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: palette.panel,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        {tabs.map(item => {
          const active = tab === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 7,
              }}
            >
              <Text
                style={{
                  fontSize: 19,
                  color: active ? palette.primary : palette.muted,
                }}
              >
                {item.icon}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  fontWeight: active ? '800' : '500',
                  color: active ? palette.primary : palette.muted,
                  marginTop: 3,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}