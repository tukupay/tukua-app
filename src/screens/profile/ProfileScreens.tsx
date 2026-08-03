import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenPattern } from '../../components/dashboard/DashboardBackground';
import { ProfileAvatar } from '../../components/navigation/ProfileAvatar';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDialog } from '../../context/DialogContext';
import {
  createDocument,
  createMemory,
  createSignedDownload,
  DEFAULT_PORTFOLIO_SETTINGS,
  deleteDocument,
  deleteMemory,
  fetchBalances,
  fetchDocuments,
  fetchMemories,
  fetchPortfolio,
  fetchPreferences,
  fetchProfile,
  patchMemory,
  patchPortfolio,
  patchPreferences,
  patchProfile,
  ProfileData,
  ProfileDocument,
  ProfileMemory,
  uploadProfileFile,
  type BalancesData,
  type PortfolioSettings,
} from '../../lib/profileApi';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';
import { Colors } from '../../theme/yana';

type HomeProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;
type EditProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

const HOME_LINKS: Array<{
  screen: keyof ProfileStackParamList;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { screen: 'ProfileEdit', title: 'Edit profile', subtitle: 'Identity, contact and avatar', icon: 'person-circle-outline' },
  { screen: 'Documents', title: 'Documents', subtitle: 'CV, certificates and files', icon: 'document-text-outline' },
  { screen: 'Portfolio', title: 'Portfolio', subtitle: 'Public page and visibility', icon: 'briefcase-outline' },
  { screen: 'Memory', title: 'Memory', subtitle: 'What Tukua remembers', icon: 'sparkles-outline' },
  { screen: 'Preferences', title: 'Preferences', subtitle: 'AI model and response style', icon: 'options-outline' },
  { screen: 'Balances', title: 'Balances', subtitle: 'Tokens and recent activity', icon: 'wallet-outline' },
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function ScreenShell({
  children,
  loading,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={Colors.primary} />
        ) : undefined
      }
    >
      {loading ? <SkeletonList /> : children}
    </ScrollView>
  );
}

function SkeletonList() {
  return (
    <View style={styles.stack}>
      <View style={[styles.skeleton, { height: 104 }]} />
      <View style={[styles.skeleton, { height: 150 }]} />
      <View style={[styles.skeleton, { height: 90 }]} />
    </View>
  );
}

function Card({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={label.toLowerCase().includes('username') ? 'none' : 'sentences'}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  busy,
  icon = 'save-outline',
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      style={({ pressed }) => [styles.primaryButton, (pressed || busy || disabled) && styles.buttonDim]}
    >
      {busy ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Ionicons name={icon} size={18} color={Colors.white} />
      )}
      <Text style={styles.primaryButtonText}>{busy ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}

function ErrorCard({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Card>
      <View style={styles.errorRow}>
        <Ionicons name="warning-outline" size={20} color={Colors.orange} />
        <Text style={styles.errorText}>{message}</Text>
      </View>
      {retry ? <PrimaryButton label="Try again" icon="refresh-outline" onPress={retry} /> : null}
    </Card>
  );
}

export function ProfileHomeScreen({ navigation }: HomeProps) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setProfile(await fetchProfile());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: moduleScrollBottomPad(insets.bottom) }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={Colors.white}
        />
      }
    >
      <View style={[styles.hero, { paddingTop: floatingHeaderInset(insets.top) }]}>
        <GreenPattern darker />
        <View style={styles.heroContent}>
          {loading ? (
            <>
              <View style={[styles.skeleton, styles.heroAvatarSkeleton]} />
              <View style={[styles.skeleton, styles.heroLineSkeleton]} />
            </>
          ) : (
            <>
              <ProfileAvatar
                name={profile?.full_name || profile?.username || 'Account'}
                uri={profile?.avatar_url || null}
                size={72}
              />
              <Text style={styles.heroTitle}>{profile?.full_name || 'Your profile'}</Text>
              <Text style={styles.heroSubtitle}>
                {profile?.username ? `@${profile.username}` : profile?.email || 'Complete your Tukua identity'}
              </Text>
            </>
          )}
        </View>
        <View style={styles.heroCurve} />
      </View>
      <View style={styles.homeBody}>
        {error ? <ErrorCard message={error} retry={() => void load()} /> : null}
        <Text style={styles.sectionTitle}>Your account</Text>
        <View style={styles.grid}>
          {HOME_LINKS.map((item) => (
            <Pressable
              key={item.screen}
              style={({ pressed }) => [styles.hubCard, pressed && styles.pressed]}
              onPress={() => navigation.navigate(item.screen as never)}
            >
              <View style={styles.hubIcon}>
                <Ionicons name={item.icon} size={23} color={Colors.primary} />
              </View>
              <Text style={styles.hubTitle}>{item.title}</Text>
              <Text style={styles.hubSubtitle}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export function ProfileEditScreen({}: EditProps) {
  const { showDialog } = useDialog();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setProfile(await fetchProfile());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (field: keyof ProfileData, value: string) => {
    setProfile((current) => ({ ...(current || {}), [field]: value }));
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await patchProfile({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        location: profile.location,
        phone_number: profile.phone_number || profile.phone,
        whatsapp_phone: profile.whatsapp_phone,
        secondary_phone: profile.secondary_phone,
      });
      setProfile(updated);
      showDialog({ title: 'Profile saved', message: 'Your account details are up to date.', variant: 'success' });
    } catch (e) {
      showDialog({ title: 'Could not save', message: errorMessage(e), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const chooseAvatar = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setAvatarBusy(true);
    try {
      const extension = asset.name.split('.').pop() || 'jpg';
      const result = await uploadProfileFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        bucket: 'avatars',
        path: `avatar-${Date.now()}.${extension}`,
      });
      const updated = await patchProfile({ avatar_url: result.publicUrl || result.path });
      setProfile(updated);
    } catch (e) {
      showDialog({ title: 'Avatar upload failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <ScreenShell loading={loading}>
      {error ? <ErrorCard message={error} retry={() => void load()} /> : null}
      {profile ? (
        <>
          <Card>
            <View style={styles.avatarEditor}>
              <ProfileAvatar
                name={profile.full_name || profile.username || 'Account'}
                uri={profile.avatar_url || null}
                size={76}
              />
              <Pressable style={styles.secondaryButton} onPress={() => void chooseAvatar()} disabled={avatarBusy}>
                {avatarBusy ? <ActivityIndicator color={Colors.primary} /> : <Ionicons name="camera-outline" size={18} color={Colors.primary} />}
                <Text style={styles.secondaryButtonText}>{avatarBusy ? 'Uploading…' : 'Change avatar'}</Text>
              </Pressable>
            </View>
          </Card>
          <Card title="Identity">
            <Field label="Full name" value={profile.full_name || ''} onChangeText={(v) => update('full_name', v)} />
            <Field label="Username" value={profile.username || ''} onChangeText={(v) => update('username', v)} placeholder="your_username" />
            <Field label="About" value={profile.bio || ''} onChangeText={(v) => update('bio', v)} multiline />
            <Field label="Location" value={profile.location || profile.business_location || ''} onChangeText={(v) => update('location', v)} />
          </Card>
          <Card title="Phone numbers" subtitle="Your primary number is used for sign-in and must be unique.">
            <Field label="Primary phone" value={profile.phone_number || profile.phone || ''} onChangeText={(v) => update('phone_number', v)} keyboardType="phone-pad" />
            <Field label="WhatsApp" value={profile.whatsapp_phone || ''} onChangeText={(v) => update('whatsapp_phone', v)} keyboardType="phone-pad" />
            <Field label="Secondary phone" value={profile.secondary_phone || ''} onChangeText={(v) => update('secondary_phone', v)} keyboardType="phone-pad" />
          </Card>
          <PrimaryButton label="Save profile" onPress={() => void save()} busy={saving} />
        </>
      ) : null}
    </ScreenShell>
  );
}

export function DocumentsScreen() {
  const { showDialog } = useDialog();
  const [items, setItems] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setItems(await fetchDocuments());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setBusy(true);
    try {
      const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const uploaded = await uploadProfileFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        bucket: 'user-documents',
        path: `${Date.now()}-${safeName}`,
      });
      await createDocument({
        title: asset.name.replace(/\.[^/.]+$/, ''),
        description: null,
        document_type: asset.mimeType?.startsWith('image/') ? 'other' : 'cv',
        file_url: uploaded.path,
        file_name: asset.name,
        file_size: asset.size || null,
        mime_type: asset.mimeType || null,
        status: 'pending',
      });
      await load();
    } catch (e) {
      showDialog({ title: 'Upload failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const open = async (item: ProfileDocument) => {
    try {
      await Linking.openURL(await createSignedDownload(item.file_url));
    } catch (e) {
      showDialog({ title: 'Could not open document', message: errorMessage(e), variant: 'danger' });
    }
  };

  const remove = (item: ProfileDocument) => {
    Alert.alert('Delete document?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteDocument(item.id).then(load).catch((e) => {
            showDialog({ title: 'Delete failed', message: errorMessage(e), variant: 'danger' });
          });
        },
      },
    ]);
  };

  return (
    <ScreenShell loading={loading}>
      {error ? <ErrorCard message={error} retry={() => void load()} /> : null}
      <Card title="Your documents" subtitle="Upload a CV, certificate, transcript, ID, or portfolio file.">
        <PrimaryButton label="Choose and upload file" icon="cloud-upload-outline" onPress={() => void upload()} busy={busy} />
      </Card>
      {items.length ? (
        items.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Ionicons name="document-text-outline" size={22} color={Colors.primary} /></View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>{item.document_type || 'Document'} · {item.status || 'saved'}</Text>
              </View>
              <Pressable onPress={() => void open(item)} style={styles.iconButton}><Ionicons name="eye-outline" size={20} color={Colors.primary} /></Pressable>
              <Pressable onPress={() => remove(item)} style={styles.iconButton}><Ionicons name="trash-outline" size={20} color={Colors.destructive} /></Pressable>
            </View>
          </Card>
        ))
      ) : !error ? (
        <Card><Text style={styles.emptyText}>No documents yet.</Text></Card>
      ) : null}
    </ScreenShell>
  );
}

const TEMPLATES = ['minimal', 'developer', 'designer', 'business', 'academic', 'creative', 'healthcare', 'legal', 'educator', 'freelancer'];

export function PortfolioScreen() {
  const { showDialog } = useDialog();
  const [username, setUsername] = useState('');
  const [settings, setSettings] = useState<PortfolioSettings>(DEFAULT_PORTFOLIO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchPortfolio()
      .then((result) => {
        setUsername(result.username || '');
        setSettings(result.settings);
      })
      .catch((e) => showDialog({ title: 'Could not load portfolio', message: errorMessage(e), variant: 'danger' }))
      .finally(() => setLoading(false));
  }, [showDialog]);

  const toggle = (key: keyof PortfolioSettings, value: boolean | string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await patchPortfolio(settings);
      showDialog({ title: 'Portfolio saved', message: 'Your public portfolio settings are updated.', variant: 'success' });
    } catch (e) {
      showDialog({ title: 'Could not save', message: errorMessage(e), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell loading={loading}>
      <Card title="Your portfolio">
        <Text style={styles.portfolioUrl}>{username ? `tukua.ai/yana/${username}` : 'Set a username in Edit profile first.'}</Text>
      </Card>
      <Card title="Template">
        <View style={styles.chips}>
          {TEMPLATES.map((template) => (
            <Pressable key={template} style={[styles.chip, settings.template === template && styles.chipActive]} onPress={() => toggle('template', template)}>
              <Text style={[styles.chipText, settings.template === template && styles.chipTextActive]}>{template}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card title="Custom headline">
        <Field label="Headline" value={settings.custom_headline || ''} onChangeText={(v) => toggle('custom_headline', v)} placeholder="Developer | Educator | Creator" />
      </Card>
      <Card title="What to show">
        {([
          ['show_email', 'Email'],
          ['show_phone', 'Phone / WhatsApp'],
          ['show_bio', 'Bio and about'],
          ['show_skills', 'Skills'],
          ['show_education', 'Education'],
          ['show_social', 'Social links'],
          ['show_documents', 'Documents'],
        ] as Array<[keyof PortfolioSettings, string]>).map(([key, label]) => (
          <View key={key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Switch value={Boolean(settings[key])} onValueChange={(value) => toggle(key, value)} trackColor={{ true: Colors.primary }} />
          </View>
        ))}
      </Card>
      <PrimaryButton label="Save portfolio" onPress={() => void save()} busy={saving} />
    </ScreenShell>
  );
}

export function MemoryScreen() {
  const { showDialog } = useDialog();
  const [items, setItems] = useState<ProfileMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await fetchMemories());
    } catch (e) {
      showDialog({ title: 'Could not load memories', message: errorMessage(e), variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [showDialog]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await createMemory({ key: key.trim(), value });
      setKey('');
      setValue('');
      await load();
    } catch (e) {
      showDialog({ title: 'Could not save memory', message: errorMessage(e), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: ProfileMemory) => {
    setEditingId(item.id);
    setEditingValue(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
  };

  const saveEdit = async (item: ProfileMemory) => {
    try {
      await patchMemory(item.id, { value: editingValue });
      setEditingId(null);
      setEditingValue('');
      await load();
    } catch (e) {
      showDialog({ title: 'Could not update', message: errorMessage(e), variant: 'danger' });
    }
  };

  const remove = (item: ProfileMemory) => {
    Alert.alert('Delete memory?', item.key, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteMemory(item.id).then(load) },
    ]);
  };

  return (
    <ScreenShell loading={loading}>
      <Card title="Add memory" subtitle="Facts and preferences Tukua should remember about you.">
        <Field label="Key" value={key} onChangeText={setKey} placeholder="e.g. job_title" />
        <Field label="Value" value={value} onChangeText={setValue} multiline />
        <PrimaryButton label="Add memory" icon="add-outline" onPress={() => void add()} busy={saving} disabled={!key.trim()} />
      </Card>
      {items.length ? items.map((item) => (
        <Card key={item.id}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.display_name || item.key}</Text>
              {editingId === item.id ? (
                <>
                  <TextInput
                    value={editingValue}
                    onChangeText={setEditingValue}
                    multiline
                    style={[styles.input, styles.textarea, { marginTop: 8 }]}
                  />
                  <View style={styles.inlineActions}>
                    <Pressable style={styles.smallButton} onPress={() => void saveEdit(item)}>
                      <Text style={styles.smallButtonText}>Save</Text>
                    </Pressable>
                    <Pressable style={styles.smallButtonMuted} onPress={() => setEditingId(null)}>
                      <Text style={styles.smallButtonMutedText}>Cancel</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable onPress={() => edit(item)}>
                  <Text style={styles.memoryValue} numberOfLines={3}>{typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}</Text>
                </Pressable>
              )}
            </View>
            <Pressable style={styles.iconButton} onPress={() => remove(item)}><Ionicons name="trash-outline" size={20} color={Colors.destructive} /></Pressable>
          </View>
        </Card>
      )) : <Card><Text style={styles.emptyText}>No memories yet.</Text></Card>}
    </ScreenShell>
  );
}

const MODELS = [
  { id: 'gemini', name: 'Tukua Flash', note: 'Fast responses' },
  { id: 'deepseek', name: 'Tukua Deep Research', note: 'Detailed research' },
  { id: 'openai', name: 'Tukua Balanced', note: 'Balanced performance' },
];

export function PreferencesScreen() {
  const { showDialog } = useDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState('gemini');
  const [sarcasm, setSarcasm] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptMemoryId, setPromptMemoryId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchPreferences(), fetchMemories()])
      .then(([preferences, memories]) => {
        setModel(preferences.preferred_model || 'gemini');
        setSarcasm(Boolean(preferences.sarcasm_mode));
        const memory = memories.find((item) => item.key === 'user_prompt');
        if (memory) {
          setPromptMemoryId(memory.id);
          setPrompt(typeof memory.value === 'string' ? memory.value : JSON.stringify(memory.value));
        }
      })
      .catch((e) => showDialog({ title: 'Could not load preferences', message: errorMessage(e), variant: 'danger' }))
      .finally(() => setLoading(false));
  }, [showDialog]);

  const save = async () => {
    setSaving(true);
    try {
      await patchPreferences({ preferred_model: model, sarcasm_mode: sarcasm });
      if (promptMemoryId) {
        await patchMemory(promptMemoryId, { value: prompt });
      } else if (prompt.trim()) {
        const memory = await createMemory({ key: 'user_prompt', value: prompt, display_name: 'Custom instructions' });
        setPromptMemoryId(memory.id);
      }
      showDialog({ title: 'Preferences saved', message: 'Tukua will use these choices in future chats.', variant: 'success' });
    } catch (e) {
      showDialog({ title: 'Could not save', message: errorMessage(e), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell loading={loading}>
      <Card title="Custom instructions">
        <Field label="Tell Tukua about yourself" value={prompt} onChangeText={setPrompt} multiline placeholder="Your goals, role, and preferred style…" />
      </Card>
      <Card title="AI model">
        {MODELS.map((item) => (
          <Pressable key={item.id} style={[styles.modelRow, model === item.id && styles.modelRowActive]} onPress={() => setModel(item.id)}>
            <Ionicons name={model === item.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={Colors.primary} />
            <View style={styles.rowBody}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowMeta}>{item.note}</Text></View>
          </Pressable>
        ))}
      </Card>
      <Card title="Response style">
        <View style={styles.toggleRow}>
          <View style={styles.rowBody}><Text style={styles.toggleLabel}>Savage mode 😏</Text><Text style={styles.rowMeta}>Adds extra wit to responses.</Text></View>
          <Switch value={sarcasm} onValueChange={setSarcasm} trackColor={{ true: Colors.orange }} />
        </View>
      </Card>
      <PrimaryButton label="Save preferences" onPress={() => void save()} busy={saving} />
    </ScreenShell>
  );
}

export function BalancesScreen() {
  const [data, setData] = useState<BalancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await fetchBalances());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const balance = Number(data?.balance?.balance || 0);
  return (
    <ScreenShell
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {error ? <ErrorCard message={error} retry={() => void load()} /> : null}
      <View style={styles.balanceHero}>
        <GreenPattern darker />
        <Text style={styles.balanceLabel}>Available tokens</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent activity</Text>
      {data?.transactions?.length ? data.transactions.map((item) => {
        const positive = Number(item.amount) >= 0;
        return (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, positive ? styles.creditIcon : styles.debitIcon]}>
                <Ionicons name={positive ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={positive ? Colors.primary : Colors.orange} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.description || item.transaction_type}</Text>
                <Text style={styles.rowMeta}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</Text>
              </View>
              <Text style={[styles.transactionAmount, positive ? styles.creditText : styles.debitText]}>{positive ? '+' : ''}{Number(item.amount).toLocaleString()}</Text>
            </View>
          </Card>
        );
      }) : !error ? <Card><Text style={styles.emptyText}>No token transactions yet.</Text></Card> : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  stack: { gap: 12 },
  skeleton: { borderRadius: 16, backgroundColor: '#E3EBE7', opacity: 0.9 },
  hero: { minHeight: 270, overflow: 'hidden', paddingHorizontal: 20 },
  heroContent: { alignItems: 'center', zIndex: 1, paddingTop: 12, paddingBottom: 42 },
  heroTitle: { color: Colors.white, fontSize: 25, fontWeight: '700', marginTop: 12, fontFamily: 'Poppins_600SemiBold' },
  heroSubtitle: { color: Colors.navbarMuted, fontSize: 13, marginTop: 2, fontFamily: 'Inter_400Regular' },
  heroCurve: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 30, backgroundColor: Colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  heroAvatarSkeleton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.22)' },
  heroLineSkeleton: { width: 150, height: 18, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
  homeBody: { paddingHorizontal: 16, marginTop: -2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 12, marginTop: 8, fontFamily: 'Poppins_600SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hubCard: { width: '48%', minHeight: 145, backgroundColor: Colors.white, borderRadius: 18, padding: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  hubIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  hubTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground, fontFamily: 'Inter_600SemiBold' },
  hubSubtitle: { fontSize: 12, lineHeight: 17, color: Colors.mutedForeground, marginTop: 4, fontFamily: 'Inter_400Regular' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 4, fontFamily: 'Inter_600SemiBold' },
  cardSubtitle: { fontSize: 12, lineHeight: 17, color: Colors.mutedForeground, marginBottom: 12, fontFamily: 'Inter_400Regular' },
  field: { marginTop: 10 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.labelGray, marginBottom: 6, fontFamily: 'Inter_600SemiBold' },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, paddingHorizontal: 12, color: Colors.foreground, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, marginTop: 6 },
  primaryButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700', fontFamily: 'Inter_600SemiBold' },
  buttonDim: { opacity: 0.62 },
  secondaryButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  secondaryButtonText: { color: Colors.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  avatarEditor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, color: '#92400E', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.foreground, fontFamily: 'Inter_600SemiBold' },
  rowMeta: { fontSize: 11, color: Colors.mutedForeground, marginTop: 3, fontFamily: 'Inter_400Regular' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.muted },
  emptyText: { textAlign: 'center', color: Colors.mutedForeground, fontSize: 14, paddingVertical: 12 },
  portfolioUrl: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.background },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.foreground, fontSize: 12, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  toggleLabel: { color: Colors.foreground, fontSize: 14, fontWeight: '600' },
  memoryValue: { color: Colors.mutedForeground, fontSize: 13, lineHeight: 18, marginTop: 6 },
  inlineActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallButton: { borderRadius: 9, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8 },
  smallButtonText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  smallButtonMuted: { borderRadius: 9, backgroundColor: Colors.muted, paddingHorizontal: 14, paddingVertical: 8 },
  smallButtonMutedText: { color: Colors.foreground, fontSize: 12, fontWeight: '600' },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, paddingHorizontal: 10, borderRadius: 12, marginTop: 6 },
  modelRowActive: { backgroundColor: Colors.primaryLight },
  balanceHero: { minHeight: 150, borderRadius: 22, overflow: 'hidden', padding: 22, justifyContent: 'center', marginBottom: 18 },
  balanceLabel: { color: Colors.navbarMuted, fontSize: 13, zIndex: 1 },
  balanceAmount: { color: Colors.white, fontSize: 38, fontWeight: '800', marginTop: 5, zIndex: 1 },
  creditIcon: { backgroundColor: Colors.primaryLight },
  debitIcon: { backgroundColor: '#FFF1E8' },
  transactionAmount: { fontSize: 15, fontWeight: '700' },
  creditText: { color: Colors.primary },
  debitText: { color: Colors.orange },
});
