
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import type { ThemePalette } from '../theme';
import { Button, Field } from '../components/ui';

type RegistrationType = 'customer' | 'individual' | 'business';

type AuthScreenProps = {
  palette: ThemePalette;
};

const registrationOptions: {
  value: RegistrationType;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'customer',
    title: 'Customer',
    description: 'Find service providers and request quotes.',
    icon: '🏠',
  },
  {
    value: 'individual',
    title: 'Individual Provider',
    description: 'Offer your skills and services to customers.',
    icon: '🛠️',
  },
  {
    value: 'business',
    title: 'Registered Business',
    description: 'Register your business and offer services.',
    icon: '🏢',
  },
];

export function AuthScreen({ palette }: AuthScreenProps) {
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>('customer');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      (signup && !name.trim())
    ) {
      return Alert.alert(
        'Missing details',
        'Complete all required fields.',
      );
    }

    if (password.length < 6) {
      return Alert.alert(
        'Password too short',
        'Use at least 6 characters.',
      );
    }

    setBusy(true);

    try {
      if (signup) {
        const isProvider = registrationType !== 'customer';

        const accountRole = isProvider ? 'provider' : 'customer';

        const providerType = isProvider
          ? registrationType
          : null;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              signup_type: registrationType,
              account_role: accountRole,
              provider_type: providerType,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          Alert.alert(
            'Check your email',
            'Confirm your email address, then sign in.',
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

        if (error) throw error;
      }
    } catch (error) {
      Alert.alert(
        'Authentication failed',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const optionStyle = (selected: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: selected ? palette.primary : palette.border,
    backgroundColor: selected ? palette.panel2 : palette.panel,
    gap: 12,
  });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: palette.bg,
      }}
    >
      <Text
        style={{
          fontSize: 34,
          fontWeight: '900',
          color: palette.text,
        }}
      >
        Fix<Text style={{ color: palette.primary }}>Mate</Text>
      </Text>

      <Text
        style={{
          color: palette.muted,
          marginBottom: 12,
        }}
      >
        Find trusted local help. Get the job done.
      </Text>

      {signup && (
        <>
          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            palette={palette}
          />

          <Text
            style={{
              color: palette.text,
              fontSize: 16,
              fontWeight: '700',
              marginTop: 8,
            }}
          >
            Choose your account type
          </Text>

          {registrationOptions.map(option => {
            const selected = registrationType === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setRegistrationType(option.value)}
                style={optionStyle(selected)}
              >
                <Text style={{ fontSize: 27 }}>
                  {option.icon}
                </Text>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      color: palette.text,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    {option.title}
                  </Text>

                  <Text
                    style={{
                      color: palette.muted,
                      fontSize: 12,
                    }}
                  >
                    {option.description}
                  </Text>
                </View>

                <Text
                  style={{
                    color: selected ? palette.primary : palette.muted,
                    fontSize: 20,
                    fontWeight: '800',
                  }}
                >
                  {selected ? '✓' : '○'}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}

      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        palette={palette}
        keyboardType="email-address"
      />

      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        palette={palette}
      />

      <Button
        title={
          busy
            ? 'Please wait…'
            : signup
              ? 'Create account'
              : 'Sign in'
        }
        onPress={submit}
        palette={palette}
        disabled={busy}
      />

      <Button
        title={
          signup
            ? 'I already have an account'
            : 'Create a new account'
        }
        onPress={() => setSignup(!signup)}
        palette={palette}
        secondary
        disabled={busy}
      />
    </View>
  );
}
