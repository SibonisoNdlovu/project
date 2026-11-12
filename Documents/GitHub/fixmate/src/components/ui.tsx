
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import type { ThemePalette } from '../theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  palette: ThemePalette;
  disabled?: boolean;
  secondary?: boolean;
};

export function Button({
  title,
  onPress,
  palette,
  disabled = false,
  secondary = false,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary
            ? palette.panel2
            : palette.primary,
          borderColor: secondary
            ? palette.border
            : palette.primary,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          transform: [
            { scale: pressed && !disabled ? 0.98 : 1 },
          ],
        },
      ]}
    >
      <Text
        style={{
          color: secondary
            ? palette.text
            : palette.primaryText,
          fontWeight: '800',
          fontSize: 14,
          letterSpacing: 0.2,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  palette: ThemePalette;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
};

export function Field({
  label,
  value,
  onChangeText,
  palette,
  multiline = false,
  keyboardType = 'default',
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text
        style={[
          styles.fieldLabel,
          {
            color: focused ? palette.primary : palette.muted,
          },
        ]}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={palette.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={palette.primary}
        style={[
          styles.input,
          {
            backgroundColor: palette.inputBg,
            color: palette.inputText,
            borderColor: focused
              ? palette.primary
              : palette.border,
            minHeight: multiline ? 105 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );
}

export function Card({
  children,
  palette,
}: {
  children: React.ReactNode;
  palette: ThemePalette;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.panel,
          borderColor: palette.border,
          shadowColor: '#000000',
        },
      ]}
    >
      {children}
    </View>
  );
}

export function Loading({
  palette,
}: {
  palette: ThemePalette;
}) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator
        color={palette.primary}
        size="large"
      />
      <Text
        style={{
          color: palette.muted,
          fontSize: 12,
          marginTop: 10,
        }}
      >
        Loading...
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    marginVertical: 6,
  },

  fieldContainer: {
    gap: 8,
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  input: {
    borderWidth: 1.5,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
  },

  card: {
    borderWidth: 1,
    borderRadius: 19,
    padding: 17,
    marginBottom: 15,
    gap: 10,

    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
});
