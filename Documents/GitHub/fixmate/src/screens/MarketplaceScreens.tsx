
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Button, Card, Field, Loading } from '../components/ui';
import { marketplace } from '../services/marketplace';

import type {
  AccountRole,
  Booking,
  Category,
  Job,
  Provider,
  ProviderType,
  Quote,
} from '../types';

import type { ThemePalette } from '../theme';

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const details = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return [
      details.message,
      details.details,
      details.hint ? `Hint: ${details.hint}` : '',
      details.code ? `Code: ${details.code}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return String(error);
}

function Screen({
  children,
  palette,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  palette: ThemePalette;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={[
        styles.screenContent,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function Heading({
  children,
  palette,
}: {
  children: React.ReactNode;
  palette: ThemePalette;
}) {
  return (
    <Text
      style={{
        color: palette.text,
        fontSize: 21,
        lineHeight: 27,
        fontWeight: '900',
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function Body({
  children,
  palette,
}: {
  children: React.ReactNode;
  palette: ThemePalette;
}) {
  return (
    <Text
      style={{
        color: palette.muted,
        fontSize: 13,
        lineHeight: 19,
      }}
    >
      {children}
    </Text>
  );
}

function SectionTitle({
  title,
  subtitle,
  palette,
}: {
  title: string;
  subtitle?: string;
  palette: ThemePalette;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: palette.text,
          fontSize: 18,
          lineHeight: 23,
          fontWeight: '900',
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            color: palette.muted,
            fontSize: 12,
            lineHeight: 17,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function CategorySelector({
  categories,
  selected,
  onToggle,
  palette,
}: {
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
  palette: ThemePalette;
}) {
  if (categories.length === 0) {
    return (
      <Body palette={palette}>
        No service categories are available yet.
      </Body>
    );
  }

  return (
    <View style={styles.categoryChipContainer}>
      {categories.map(category => {
        const active = selected.includes(category.id);

        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onToggle(category.id)}
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor: active
                  ? palette.primary
                  : palette.panel2,
                borderColor: active
                  ? palette.primary
                  : palette.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: active ? palette.primaryText : palette.text,
                fontSize: 12,
                fontWeight: '800',
              }}
            >
              {category.icon ? `${category.icon} ` : ''}
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BrowseScreen({
  palette,
}: {
  palette: ThemePalette;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [suburb, setSuburb] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [selectedProvider, setSelectedProvider] =
    useState<Provider | null>(null);

  const [providerCategoryIds, setProviderCategoryIds] =
    useState<string[]>([]);

  const [requestCategoryId, setRequestCategoryId] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestSuburb, setRequestSuburb] = useState('');
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const [providerData, categoryData] = await Promise.all([
        marketplace.providers(),
        marketplace.categories(),
      ]);

      setProviders(providerData);
      setCategories(categoryData);
    } catch (error) {
      Alert.alert(
        'Could not load marketplace',
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredProviders = providers.filter(provider => {
    const term = search.trim().toLowerCase();
    const area = suburb.trim().toLowerCase();

    const matchesSearch =
      !term ||
      provider.display_name.toLowerCase().includes(term) ||
      (provider.description ?? '').toLowerCase().includes(term) ||
      (provider.category_names ?? []).some(name =>
        name.toLowerCase().includes(term),
      );

    const matchesSuburb =
      !area ||
      provider.service_suburbs.some(value =>
        value.toLowerCase().includes(area),
      );

    const matchesCategory =
      !selectedCategory ||
      (provider.category_names ?? []).includes(selectedCategory);

    return matchesSearch && matchesSuburb && matchesCategory;
  });

  const openProvider = async (provider: Provider) => {
    setSelectedProvider(provider);
    setProviderCategoryIds([]);
    setRequestCategoryId('');
    setRequestTitle('');
    setRequestDescription('');
    setRequestSuburb(provider.service_suburbs[0] ?? '');

    try {
      const ids = await marketplace.providerCategoryIds(provider.user_id);

      setProviderCategoryIds(ids);
      setRequestCategoryId(ids[0] ?? '');
    } catch (error) {
      Alert.alert(
        'Could not load provider services',
        getErrorMessage(error),
      );

      setSelectedProvider(null);
    }
  };

  const closeProvider = () => {
    setSelectedProvider(null);
    setProviderCategoryIds([]);
    setRequestCategoryId('');
  };

  const sendRequest = async () => {
    if (!selectedProvider || requesting) return;

    if (
      !requestCategoryId ||
      !requestTitle.trim() ||
      !requestDescription.trim() ||
      !requestSuburb.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Complete the service, job title, description and suburb.',
      );
      return;
    }

    setRequesting(true);

    try {
      const jobId = await marketplace.requestQuote({
        provider_id: selectedProvider.user_id,
        category_id: requestCategoryId,
        title: requestTitle.trim(),
        description: requestDescription.trim(),
        suburb: requestSuburb.trim(),
      });

      setRequestTitle('');
      setRequestDescription('');
      setRequestCategoryId('');
      setRequestSuburb('');
      setSelectedProvider(null);
      setProviderCategoryIds([]);

      Alert.alert(
        'Request sent',
        `Your request has been created. Reference: ${jobId.slice(0, 8)}`,
      );
    } catch (error) {
      Alert.alert(
        'Could not send request',
        getErrorMessage(error),
      );
    } finally {
      setRequesting(false);
    }
  };

  if (selectedProvider) {
    const providerCategories = categories.filter(category =>
      providerCategoryIds.includes(category.id),
    );

    return (
      <Screen
        palette={palette}
        contentContainerStyle={{ paddingTop: 12 }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={closeProvider}
          style={[
            styles.backButton,
            { backgroundColor: palette.panel2 },
          ]}
        >
          <Text
            style={{
              color: palette.text,
              fontSize: 13,
              fontWeight: '800',
            }}
          >
            ← Back to marketplace
          </Text>
        </Pressable>

        <View
          style={[
            styles.providerHero,
            {
              backgroundColor: palette.panel,
              borderColor: palette.border,
            },
          ]}
        >
          <View
            style={[
              styles.providerAvatarLarge,
              { backgroundColor: palette.panel2 },
            ]}
          >
            <Text style={{ fontSize: 27 }}>
              {selectedProvider.provider_type === 'business'
                ? '🏢'
                : '🛠️'}
            </Text>
          </View>

          <Text
            style={[
              styles.eyebrow,
              { color: palette.primary },
            ]}
          >
            PROVIDER PROFILE
          </Text>

          <Text
            style={{
              color: palette.text,
              fontSize: 23,
              lineHeight: 29,
              fontWeight: '900',
            }}
          >
            {selectedProvider.display_name}
          </Text>

          <Text
            style={{
              color: palette.muted,
              fontSize: 12,
              marginTop: 5,
            }}
          >
            {selectedProvider.provider_type === 'business'
              ? 'Registered business'
              : 'Independent service provider'}
          </Text>

          {selectedProvider.is_verified ? (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: palette.panel2 },
              ]}
            >
              <Text
                style={{
                  color: palette.success,
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                ✓ Verified provider
              </Text>
            </View>
          ) : null}
        </View>

        <Card palette={palette}>
          <Heading palette={palette}>About this provider</Heading>

          <Body palette={palette}>
            {selectedProvider.description ||
              'This provider has not added a description yet.'}
          </Body>

          <View
            style={[
              styles.detailSection,
              { borderTopColor: palette.border },
            ]}
          >
            <Text style={[styles.detailHeading, { color: palette.text }]}>
              Services offered
            </Text>

            <View style={styles.categoryChipContainer}>
              {providerCategories.map(category => (
                <View
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: palette.panel2,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: palette.text,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {category.icon ? `${category.icon} ` : ''}
                    {category.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.detailSection,
              { borderTopColor: palette.border },
            ]}
          >
            <Text style={[styles.detailHeading, { color: palette.text }]}>
              Service areas
            </Text>

            <Text
              style={{
                color: palette.muted,
                fontSize: 13,
                lineHeight: 19,
                marginTop: 7,
              }}
            >
              📍 {selectedProvider.service_suburbs.join(', ')}
            </Text>
          </View>
        </Card>

        <SectionTitle
          title="Request a quote"
          subtitle="Tell the provider what you need."
          palette={palette}
        />

        <Card palette={palette}>
          <Text style={[styles.detailHeading, { color: palette.text }]}>
            Select a service
          </Text>

          {providerCategories.length > 0 ? (
            <CategorySelector
              categories={providerCategories}
              selected={requestCategoryId ? [requestCategoryId] : []}
              onToggle={id =>
                setRequestCategoryId(current =>
                  current === id ? '' : id,
                )
              }
              palette={palette}
            />
          ) : (
            <Body palette={palette}>
              This provider needs to add services before you can request
              a quote.
            </Body>
          )}

          <Field
            label="Job title"
            value={requestTitle}
            onChangeText={setRequestTitle}
            palette={palette}
          />

          <Field
            label="Describe the work required"
            value={requestDescription}
            onChangeText={setRequestDescription}
            palette={palette}
            multiline
          />

          <Field
            label="Your suburb"
            value={requestSuburb}
            onChangeText={setRequestSuburb}
            palette={palette}
          />

          <Button
            title={requesting ? 'Sending request…' : 'Send quote request'}
            onPress={sendRequest}
            palette={palette}
            disabled={requesting || providerCategories.length === 0}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.marketplaceHero,
          {
            backgroundColor: palette.panel,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                color: palette.primary,
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 1.8,
              }}
            >
              FIXMATE
            </Text>

            <Text
              style={{
                color: palette.muted,
                fontSize: 10,
                marginTop: 3,
              }}
            >
              YOUR LOCAL SERVICES MARKETPLACE
            </Text>
          </View>

          <View
            style={[
              styles.locationBadge,
              { backgroundColor: palette.panel2 },
            ]}
          >
            <Text
              style={{
                color: palette.success,
                fontSize: 11,
                fontWeight: '800',
              }}
            >
              ● Cape Town
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: palette.text,
            fontSize: 27,
            lineHeight: 32,
            fontWeight: '900',
            marginTop: 19,
          }}
        >
          Your next job,{' '}
          <Text style={{ color: palette.primary }}>
            sorted.
          </Text>
        </Text>

        <Text
          style={{
            color: palette.muted,
            fontSize: 13,
            lineHeight: 19,
            marginTop: 7,
          }}
        >
          Find local professionals for the things that matter.
        </Text>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={{ fontSize: 17, marginRight: 9 }}>🔎</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="What service do you need?"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={{
              flex: 1,
              minWidth: 0,
              color: palette.text,
              fontSize: 13,
              paddingVertical: 12,
            }}
          />
        </View>

        <View style={styles.suburbFilterRow}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>📍</Text>

          <TextInput
            value={suburb}
            onChangeText={setSuburb}
            placeholder="Filter by suburb"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={{
              flex: 1,
              minWidth: 0,
              color: palette.text,
              fontSize: 12,
              paddingVertical: 8,
            }}
          />

          {search || suburb ? (
            <Pressable
              onPress={() => {
                setSearch('');
                setSuburb('');
              }}
              hitSlop={8}
            >
              <Text
                style={{
                  color: palette.primary,
                  fontSize: 12,
                  fontWeight: '800',
                }}
              >
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.marketplaceContent}>
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: palette.panel2 },
            ]}
          >
            <Text style={{ fontSize: 18 }}>🧰</Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {providers.length}
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Providers
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: palette.panel2 },
            ]}
          >
            <Text style={{ fontSize: 18 }}>📂</Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {categories.length}
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Categories
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: palette.panel2 },
            ]}
          >
            <Text style={{ fontSize: 18 }}>📍</Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              SA
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Marketplace
            </Text>
          </View>
        </View>

        <SectionTitle
          title="Explore services"
          subtitle="Choose a category to get started."
          palette={palette}
        />

        <View style={styles.categoryGrid}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedCategory }}
            onPress={() => setSelectedCategory('')}
            style={({ pressed }) => [
              styles.categoryTile,
              {
                backgroundColor: !selectedCategory
                  ? palette.primary
                  : palette.panel,
                borderColor: !selectedCategory
                  ? palette.primary
                  : palette.border,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text style={styles.categoryIcon}>✨</Text>
            <Text
              numberOfLines={1}
              style={{
                color: !selectedCategory
                  ? palette.primaryText
                  : palette.text,
                fontSize: 12,
                fontWeight: '800',
                marginTop: 7,
              }}
            >
              All services
            </Text>
          </Pressable>

          {categories.map(category => {
            const active = selectedCategory === category.name;

            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() =>
                  setSelectedCategory(active ? '' : category.name)
                }
                style={({ pressed }) => [
                  styles.categoryTile,
                  {
                    backgroundColor: active
                      ? palette.primary
                      : palette.panel,
                    borderColor: active
                      ? palette.primary
                      : palette.border,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={styles.categoryIcon}>
                  {category.icon || '🔧'}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    color: active ? palette.primaryText : palette.text,
                    fontSize: 12,
                    fontWeight: '800',
                    marginTop: 7,
                  }}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.providerListHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                color: palette.text,
                fontSize: 18,
                fontWeight: '900',
              }}
            >
              Local providers
            </Text>

            <Text
              style={{
                color: palette.muted,
                fontSize: 11,
                marginTop: 3,
              }}
            >
              Professionals serving your area
            </Text>
          </View>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: palette.panel2 },
            ]}
          >
            <Text
              style={{
                color: palette.primary,
                fontSize: 11,
                fontWeight: '900',
              }}
            >
              {filteredProviders.length} found
            </Text>
          </View>
        </View>

        {loading ? (
          <Loading palette={palette} />
        ) : filteredProviders.length === 0 ? (
          <Card palette={palette}>
            <Text style={{ fontSize: 25 }}>🔍</Text>

            <Text
              style={{
                color: palette.text,
                fontWeight: '900',
                fontSize: 16,
              }}
            >
              No providers found
            </Text>

            <Body palette={palette}>
              Try another search, category or suburb. New providers will
              appear here as they join FixMate.
            </Body>

            <Button
              title="Clear all filters"
              onPress={() => {
                setSearch('');
                setSuburb('');
                setSelectedCategory('');
              }}
              palette={palette}
              secondary
            />

            <Button
              title="Refresh marketplace"
              onPress={load}
              palette={palette}
            />
          </Card>
        ) : (
          filteredProviders.map(provider => (
            <Pressable
              key={provider.user_id}
              accessibilityRole="button"
              onPress={() => openProvider(provider)}
              style={({ pressed }) => [
                styles.providerCard,
                {
                  backgroundColor: palette.panel,
                  borderColor: palette.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={styles.providerCardTop}>
                <View
                  style={[
                    styles.providerAvatar,
                    { backgroundColor: palette.panel2 },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>
                    {provider.provider_type === 'business'
                      ? '🏢'
                      : '🛠️'}
                  </Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: palette.text,
                      fontSize: 14,
                      fontWeight: '900',
                    }}
                  >
                    {provider.display_name}
                  </Text>

                  <Text
                    style={{
                      color: palette.muted,
                      fontSize: 11,
                      marginTop: 3,
                    }}
                  >
                    {provider.provider_type === 'business'
                      ? 'Registered business'
                      : 'Independent provider'}
                  </Text>
                </View>

                {provider.is_verified ? (
                  <View
                    style={[
                      styles.smallVerifiedBadge,
                      { backgroundColor: palette.panel2 },
                    ]}
                  >
                    <Text
                      style={{
                        color: palette.success,
                        fontSize: 9,
                        fontWeight: '900',
                      }}
                    >
                      ✓ VERIFIED
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                numberOfLines={2}
                style={{
                  color: palette.muted,
                  fontSize: 12,
                  lineHeight: 18,
                  marginTop: 11,
                }}
              >
                {provider.description || 'No description added.'}
              </Text>

              {(provider.category_names ?? []).length > 0 ? (
                <View style={styles.providerTags}>
                  {(provider.category_names ?? [])
                    .slice(0, 3)
                    .map(name => (
                      <View
                        key={name}
                        style={[
                          styles.providerTag,
                          { backgroundColor: palette.panel2 },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: palette.text,
                            fontSize: 10,
                            fontWeight: '700',
                          }}
                        >
                          {name}
                        </Text>
                      </View>
                    ))}
                </View>
              ) : null}

              <View
                style={[
                  styles.providerCardFooter,
                  { borderTopColor: palette.border },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      color: palette.muted,
                      fontSize: 9,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    SERVICE AREAS
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={{
                      color: palette.text,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 4,
                    }}
                  >
                    📍 {provider.service_suburbs.join(', ')}
                  </Text>
                </View>

                <Text
                  style={{
                    color: palette.primary,
                    fontSize: 11,
                    fontWeight: '900',
                    marginLeft: 8,
                  }}
                >
                  View profile →
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

export function JobsScreen({
  palette,
  userId,
  role,
}: {
  palette: ThemePalette;
  userId: string;
  role: AccountRole;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suburb, setSuburb] = useState('Goodwood');
  const [categoryId, setCategoryId] = useState('');

  const [selected, setSelected] = useState<Job | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [creating, setCreating] = useState(false);
  const [quoting, setQuoting] = useState(false);

  const isCustomer = role === 'customer';

  const load = async () => {
    try {
      if (isCustomer) {
        const categoryData = await marketplace.categories();

        setCategories(categoryData);

        if (!categoryId && categoryData[0]) {
          setCategoryId(categoryData[0].id);
        }
      } else {
        const [jobData, quoteData] = await Promise.all([
          marketplace.jobs(),
          marketplace.myQuotes(userId),
        ]);

        setJobs(jobData);
        setMyQuotes(quoteData);
      }
    } catch (error) {
      Alert.alert('Could not load jobs', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [userId, role]);

  const create = async () => {
    if (creating) return;

    if (
      !title.trim() ||
      !description.trim() ||
      !suburb.trim() ||
      !categoryId
    ) {
      Alert.alert('Missing details', 'Complete all job details.');
      return;
    }

    setCreating(true);

    try {
      await marketplace.createJob({
        customer_id: userId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        suburb: suburb.trim(),
      });

      setTitle('');
      setDescription('');
      setSuburb('Goodwood');

      Alert.alert(
        'Request published',
        'Providers can now submit quotations.',
      );

      await load();
    } catch (error) {
      Alert.alert('Could not publish', getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const quote = async () => {
    if (quoting) return;

    const value = Number(amount);

    if (
      !selected ||
      !Number.isFinite(value) ||
      value <= 0 ||
      !message.trim()
    ) {
      Alert.alert(
        'Check quotation',
        'Enter a valid amount and message.',
      );
      return;
    }

    setQuoting(true);

    try {
      await marketplace.submitQuote({
        job_id: selected.id,
        provider_id: userId,
        amount: value,
        message: message.trim(),
      });

      setSelected(null);
      setAmount('');
      setMessage('');

      Alert.alert(
        'Quotation sent',
        'The customer can now review your quote.',
      );

      await load();
    } catch (error) {
      Alert.alert('Could not send quote', getErrorMessage(error));
    } finally {
      setQuoting(false);
    }
  };

  if (isCustomer) {
    return (
      <Screen palette={palette}>
        <Heading palette={palette}>Post a job</Heading>

        <Text
          style={{
            color: palette.muted,
            fontSize: 12,
            marginBottom: 14,
          }}
        >
          Describe what you need and receive quotations from providers.
        </Text>

        <Card palette={palette}>
          <Text style={[styles.detailHeading, { color: palette.text }]}>
            Create a job request
          </Text>

          <Field
            label="What do you need done?"
            value={title}
            onChangeText={setTitle}
            palette={palette}
          />

          <Field
            label="Describe the work"
            value={description}
            onChangeText={setDescription}
            palette={palette}
            multiline
          />

          <Field
            label="Suburb"
            value={suburb}
            onChangeText={setSuburb}
            palette={palette}
          />

          <Text
            style={{
              color: palette.text,
              fontSize: 12,
              fontWeight: '800',
              marginBottom: 8,
            }}
          >
            Select a service category
          </Text>

          {loading ? (
            <Loading palette={palette} />
          ) : (
            <CategorySelector
              categories={categories}
              selected={categoryId ? [categoryId] : []}
              onToggle={setCategoryId}
              palette={palette}
            />
          )}

          <Button
            title={creating ? 'Publishing…' : 'Publish job request'}
            onPress={create}
            palette={palette}
            disabled={loading || creating}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen palette={palette}>
      <Heading palette={palette}>Available jobs</Heading>

      <Text
        style={{
          color: palette.muted,
          fontSize: 12,
          marginBottom: 14,
        }}
      >
        Browse open customer requests and submit quotations.
      </Text>

      {loading ? (
        <Loading palette={palette} />
      ) : jobs.length === 0 ? (
        <Card palette={palette}>
          <Text style={{ fontSize: 24 }}>📋</Text>
          <Text
            style={{
              color: palette.text,
              fontSize: 15,
              fontWeight: '800',
            }}
          >
            No open requests right now
          </Text>
          <Body palette={palette}>
            New customer job requests will appear here.
          </Body>
        </Card>
      ) : (
        jobs.map(job => {
          const alreadyQuoted = myQuotes.some(
            quoteItem => quoteItem.job_id === job.id,
          );

          const isSelected = selected?.id === job.id;

          return (
            <Card key={job.id} palette={palette}>
              <Text
                style={{
                  color: palette.text,
                  fontWeight: '900',
                  fontSize: 15,
                }}
              >
                {job.title}
              </Text>

              <Text
                style={{
                  color: palette.primary,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {job.category_name} · {job.suburb}
              </Text>

              <Body palette={palette}>{job.description}</Body>

              {alreadyQuoted ? (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: palette.panel2 },
                  ]}
                >
                  <Text
                    style={{
                      color: palette.success,
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    ✓ You have already quoted
                  </Text>
                </View>
              ) : (
                <Button
                  title={
                    isSelected
                      ? 'Close quotation form'
                      : 'Prepare a quotation'
                  }
                  onPress={() => {
                    setSelected(isSelected ? null : job);
                    setAmount('');
                    setMessage('');
                  }}
                  palette={palette}
                  secondary
                />
              )}

              {isSelected && !alreadyQuoted ? (
                <View
                  style={[
                    styles.formSection,
                    { borderTopColor: palette.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailHeading,
                      { color: palette.text },
                    ]}
                  >
                    Your quotation
                  </Text>

                  <Field
                    label="Quote amount (ZAR)"
                    value={amount}
                    onChangeText={setAmount}
                    palette={palette}
                    keyboardType="numeric"
                  />

                  <Field
                    label="Message / scope of work"
                    value={message}
                    onChangeText={setMessage}
                    palette={palette}
                    multiline
                  />

                  <Button
                    title={quoting ? 'Sending…' : 'Send quotation'}
                    onPress={quote}
                    palette={palette}
                    disabled={quoting}
                  />
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

export function MyQuotesScreen({
  palette,
  userId,
  role,
}: {
  palette: ThemePalette;
  userId: string;
  role: AccountRole;
}) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState('');

  const isCustomer = role === 'customer';

  const load = async () => {
    try {
      const data = isCustomer
        ? await marketplace.customerQuotes(userId)
        : await marketplace.myQuotes(userId);

      setQuotes(data);
    } catch (error) {
      Alert.alert(
        'Could not load quotations',
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [userId, role]);

  const accept = async (id: string) => {
    if (acceptingId) return;

    setAcceptingId(id);

    try {
      await marketplace.acceptQuote(id);

      Alert.alert(
        'Quotation accepted',
        'A booking has been created.',
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Could not accept quotation',
        getErrorMessage(error),
      );
    } finally {
      setAcceptingId('');
    }
  };

  return (
    <Screen palette={palette}>
      <Heading palette={palette}>Quotations</Heading>

      <Text
        style={{
          color: palette.muted,
          fontSize: 12,
          marginBottom: 14,
        }}
      >
        {isCustomer
          ? 'Review quotations received for your job requests.'
          : 'Keep track of quotations you have submitted.'}
      </Text>

      {loading ? (
        <Loading palette={palette} />
      ) : quotes.length === 0 ? (
        <Card palette={palette}>
          <Text style={{ fontSize: 24 }}>💬</Text>
          <Text
            style={{
              color: palette.text,
              fontWeight: '800',
              fontSize: 15,
            }}
          >
            No quotations yet
          </Text>
          <Body palette={palette}>
            Your quotations will appear here.
          </Body>
        </Card>
      ) : (
        quotes.map(quoteItem => (
          <Card key={quoteItem.id} palette={palette}>
            <Text
              style={{
                fontWeight: '900',
                color: palette.text,
                fontSize: 14,
              }}
            >
              {quoteItem.job_title ?? 'Job request'}
            </Text>

            <Text
              style={{
                color: palette.primary,
                fontSize: 15,
                fontWeight: '900',
              }}
            >
              R {Number(quoteItem.amount).toLocaleString('en-ZA')}
            </Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: palette.panel2 },
              ]}
            >
              <Text
                style={{
                  color:
                    quoteItem.status === 'accepted'
                      ? palette.success
                      : palette.text,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'capitalize',
                }}
              >
                {quoteItem.status}
              </Text>
            </View>

            <Body palette={palette}>
              {isCustomer && quoteItem.provider_name
                ? `From ${quoteItem.provider_name}. `
                : ''}
              {quoteItem.message}
            </Body>

            {isCustomer && quoteItem.status === 'pending' ? (
              <Button
                title={
                  acceptingId === quoteItem.id
                    ? 'Accepting…'
                    : 'Accept quotation'
                }
                onPress={() => accept(quoteItem.id)}
                palette={palette}
                disabled={Boolean(acceptingId)}
              />
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

export function BookingsScreen({
  palette,
  userId,
  role,
}: {
  palette: ThemePalette;
  userId: string;
  role: AccountRole;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  const isProvider = role === 'provider';

  const load = async () => {
    try {
      const data = await marketplace.bookings(userId);
      setBookings(data);
    } catch (error) {
      Alert.alert(
        'Could not load bookings',
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [userId]);

  const update = async (id: string, status: string) => {
    if (updatingId) return;

    setUpdatingId(id);

    try {
      await marketplace.updateBooking(id, status);
      await load();
    } catch (error) {
      Alert.alert('Update failed', getErrorMessage(error));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <Screen palette={palette}>
      <Heading palette={palette}>Bookings</Heading>

      <Text
        style={{
          color: palette.muted,
          fontSize: 12,
          marginBottom: 14,
        }}
      >
        Track accepted quotations and the progress of your work.
      </Text>

      {loading ? (
        <Loading palette={palette} />
      ) : bookings.length === 0 ? (
        <Card palette={palette}>
          <Text style={{ fontSize: 24 }}>📅</Text>

          <Text
            style={{
              color: palette.text,
              fontSize: 15,
              fontWeight: '800',
            }}
          >
            No bookings yet
          </Text>

          <Body palette={palette}>
            Accepted quotations become bookings and appear here.
          </Body>
        </Card>
      ) : (
        bookings.map(booking => (
          <Card key={booking.id} palette={palette}>
            <Text
              style={{
                fontWeight: '900',
                color: palette.text,
                fontSize: 14,
              }}
            >
              {booking.job_title}
            </Text>

            <Text
              style={{
                color: palette.primary,
                fontSize: 15,
                fontWeight: '900',
              }}
            >
              R {Number(booking.agreed_amount).toLocaleString('en-ZA')}
            </Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: palette.panel2 },
              ]}
            >
              <Text
                style={{
                  color: palette.text,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'capitalize',
                }}
              >
                {booking.status.replaceAll('_', ' ')}
              </Text>
            </View>

            {isProvider && booking.status === 'confirmed' ? (
              <Button
                title={
                  updatingId === booking.id
                    ? 'Updating…'
                    : 'Mark as in progress'
                }
                onPress={() => update(booking.id, 'in_progress')}
                palette={palette}
                secondary
                disabled={Boolean(updatingId)}
              />
            ) : null}

            {booking.status === 'in_progress' ? (
              <Button
                title={
                  updatingId === booking.id
                    ? 'Updating…'
                    : 'Mark as completed'
                }
                onPress={() => update(booking.id, 'completed')}
                palette={palette}
                disabled={Boolean(updatingId)}
              />
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export function ProfileScreen({
  palette,
  userId,
  email,
  onSignOut,
  onTheme,
  theme,
  role,
  initialProviderType,
}: {
  palette: ThemePalette;
  userId: string;
  email: string;
  onSignOut: () => void;
  onTheme: () => void;
  theme: string;
  role: AccountRole;
  initialProviderType: ProviderType;
}) {
  const [display, setDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [areas, setAreas] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [profile, categoryData, selected] = await Promise.all([
          marketplace.providerProfile(userId),
          marketplace.categories(),
          marketplace.providerCategoryIds(userId),
        ]);

        if (!active) return;

        setCategories(categoryData);
        setSelectedCategories(selected);

        if (profile) {
          setDisplay(profile.display_name);
          setDescription(profile.description ?? '');
          setAreas(profile.service_suburbs.join(', '));
        }
      } catch (error) {
        Alert.alert(
          'Could not load profile',
          getErrorMessage(error),
        );
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    if (role === 'provider') {
      load();
    } else {
      setLoadingProfile(false);
    }

    return () => {
      active = false;
    };
  }, [userId, role]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id],
    );
  };

  const save = async () => {
    if (saving) return;

    const serviceAreas = areas
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);

    if (
      !display.trim() ||
      !description.trim() ||
      !serviceAreas.length ||
      !selectedCategories.length
    ) {
      Alert.alert(
        'Complete your profile',
        'Add your name, description, at least one service suburb and one category.',
      );
      return;
    }

    setSaving(true);

    try {
      await marketplace.saveProvider({
        provider_type: initialProviderType,
        display_name: display.trim(),
        description: description.trim(),
        service_suburbs: serviceAreas,
        category_ids: selectedCategories,
      });

      Alert.alert(
        'Profile saved',
        'Your provider profile has been saved.',
      );
    } catch (error) {
      Alert.alert(
        'Could not save profile',
        getErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen palette={palette}>
      <Heading palette={palette}>Your account</Heading>

      <Card palette={palette}>
        <Text
          style={{
            color: palette.muted,
            fontSize: 11,
            fontWeight: '700',
          }}
        >
          EMAIL ADDRESS
        </Text>

        <View
          style={{
            backgroundColor: palette.inputBg,
            borderColor: palette.border,
            borderWidth: 1,
            borderRadius: 11,
            paddingHorizontal: 13,
            paddingVertical: 13,
            marginTop: 7,
          }}
        >
          <Text
            selectable
            style={{
              color: palette.inputText,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            {email || 'No email address available'}
          </Text>
        </View>

        <Text
          style={{
            color: palette.muted,
            fontSize: 10,
            marginTop: 5,
          }}
        >
          Your email address is linked to your account and cannot be
          edited here.
        </Text>

        <View
          style={[
            styles.detailSection,
            { borderTopColor: palette.border },
          ]}
        >
          <Text style={[styles.detailHeading, { color: palette.text }]}>
            Account type
          </Text>

          <Text
            style={{
              color: palette.primary,
              fontSize: 13,
              fontWeight: '800',
              marginTop: 5,
            }}
          >
            {role === 'provider' ? 'Provider' : 'Customer'}
          </Text>
        </View>

        <Button
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onPress={onTheme}
          palette={palette}
          secondary
        />
      </Card>

      {role === 'provider' ? (
        <>
          <Heading palette={palette}>Provider profile</Heading>

          <Card palette={palette}>
            {loadingProfile ? (
              <Loading palette={palette} />
            ) : (
              <>
                <Text
                  style={{
                    color: palette.text,
                    fontSize: 12,
                    fontWeight: '800',
                  }}
                >
                  Registered provider type
                </Text>

                <Text
                  style={{
                    color: palette.primary,
                    fontSize: 12,
                    fontWeight: '700',
                    marginTop: 5,
                    marginBottom: 14,
                  }}
                >
                  {initialProviderType === 'business'
                    ? 'Registered business'
                    : 'Individual provider'}
                </Text>

                <Field
                  label={
                    initialProviderType === 'business'
                      ? 'Business name'
                      : 'Your display name'
                  }
                  value={display}
                  onChangeText={setDisplay}
                  palette={palette}
                />

                <Field
                  label="About your services"
                  value={description}
                  onChangeText={setDescription}
                  palette={palette}
                  multiline
                />

                <Field
                  label="Service suburbs (comma separated)"
                  value={areas}
                  onChangeText={setAreas}
                  palette={palette}
                />

                <Text
                  style={{
                    color: palette.text,
                    fontSize: 12,
                    fontWeight: '800',
                    marginBottom: 8,
                  }}
                >
                  Services you provide
                </Text>

                <CategorySelector
                  categories={categories}
                  selected={selectedCategories}
                  onToggle={toggleCategory}
                  palette={palette}
                />

                <Button
                  title={saving ? 'Saving…' : 'Save provider profile'}
                  onPress={save}
                  palette={palette}
                  disabled={saving}
                />
              </>
            )}
          </Card>
        </>
      ) : null}

      <Button
        title="Sign out"
        onPress={onSignOut}
        palette={palette}
        secondary
      />
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared styles                                                              */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },

  marketplaceHero: {
    paddingHorizontal: 17,
    paddingTop: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  locationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },

  searchBox: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  suburbFilterRow: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  marketplaceContent: {
    paddingHorizontal: 16,
    paddingTop: 17,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },

  statValue: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },

  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 23,
  },

  categoryTile: {
    flexBasis: '27%',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 83,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },

  categoryIcon: {
    fontSize: 20,
  },

  providerListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },

  countBadge: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  providerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    marginBottom: 11,
  },

  providerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  providerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  providerAvatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  smallVerifiedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 12,
  },

  providerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },

  providerTag: {
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  providerCardFooter: {
    borderTopWidth: 1,
    marginTop: 11,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 13,
  },

  providerHero: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 6,
  },

  verifiedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    marginTop: 11,
  },

  detailSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },

  detailHeading: {
    fontSize: 12,
    fontWeight: '900',
  },

  categoryChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  categoryChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  formSection: {
    borderTopWidth: 1,
    paddingTop: 13,
    marginTop: 8,
    gap: 5,
  },
});
