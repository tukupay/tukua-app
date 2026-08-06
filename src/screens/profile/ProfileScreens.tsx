import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenPattern } from '../../components/dashboard/DashboardBackground';
import { ProfileAvatar } from '../../components/navigation/ProfileAvatar';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  analyzeDocument,
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
  lookupTokenShareRecipient,
  patchMemory,
  patchPortfolio,
  patchPreferences,
  patchProfile,
  requestAccountDeletion,
  transferTokens,
  uploadProfileFile,
  verifyIdDocument,
  BALANCES_PAGE_SIZE,
  ProfileData,
  ProfileDocument,
  ProfileMemory,
  type BalancesData,
  type PortfolioSettings,
  type TokenShareLookup,
} from '../../lib/profileApi';
import { pollMpesaTopUpStatus, tokensFromKes, topUpViaMpesa, TOPUP_PRESETS } from '../../lib/wallet';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';
import { navigateDashboard } from '../../navigation/AppNavigator';
import { useAppTheme } from '../../context/AppThemeContext';
import { useFontPreference } from '../../context/FontPreferenceContext';
import { MOBILE_FONT_OPTIONS, findFontOption, resolveNativeFontFamily } from '../../lib/mobileFonts';
import { Colors } from '../../theme/yana';
import {
  CHAT_BG_PATTERN_IDS,
  CHAT_BG_PATTERN_LABELS,
  SCHOOL_THEME_CONFIGS,
  SCHOOL_THEME_IDS,
  SCHOOL_THEME_LABELS,
  type ChatBgPatternId,
  type SchoolThemeId,
} from '../../theme/schoolThemes';

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 22;
const FONT_SIZE_STEP = 1;

/** A picked file/image, normalized across DocumentPicker and ImagePicker assets. */
type PickedAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

async function pickDocumentOrImage(): Promise<PickedAsset | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const asset = picked.assets[0];
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size };
}

async function pickFromGallery(): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const extension = (asset.mimeType || 'image/jpeg').split('/').pop() || 'jpg';
  const name = asset.fileName || `photo-${Date.now()}.${extension}`;
  return { uri: asset.uri, name, mimeType: asset.mimeType || 'image/jpeg', size: asset.fileSize };
}

async function pickFromCamera(): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const extension = (asset.mimeType || 'image/jpeg').split('/').pop() || 'jpg';
  const name = asset.fileName || `photo-${Date.now()}.${extension}`;
  return { uri: asset.uri, name, mimeType: asset.mimeType || 'image/jpeg', size: asset.fileSize };
}

/** Native Alert action sheet — Take photo / Choose photo / Choose file. */
function pickFileOrPhoto(): Promise<PickedAsset | null> {
  return new Promise((resolve) => {
    Alert.alert('Add a file', 'Take a photo, choose one from your gallery, or pick a file.', [
      { text: 'Take photo', onPress: () => void pickFromCamera().then(resolve) },
      { text: 'Choose photo', onPress: () => void pickFromGallery().then(resolve) },
      { text: 'Choose file', onPress: () => void pickDocumentOrImage().then(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

type HomeProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;
type EditProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

const HOME_LINKS: Array<{
  screen: keyof ProfileStackParamList | '__join_school';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { screen: 'ProfileEdit', title: 'Edit profile', subtitle: 'Identity, contact and avatar', icon: 'person-circle-outline' },
  { screen: '__join_school', title: 'Join school', subtitle: 'Request to join · leave schools', icon: 'school-outline' },
  { screen: 'IdVerification', title: 'ID verification', subtitle: 'Verify your identity document', icon: 'shield-checkmark-outline' },
  { screen: 'Documents', title: 'Documents', subtitle: 'CV, certificates and files', icon: 'document-text-outline' },
  { screen: 'Portfolio', title: 'Portfolio', subtitle: 'Public page and visibility', icon: 'briefcase-outline' },
  { screen: 'Memory', title: 'Memory', subtitle: 'What Tukua remembers', icon: 'sparkles-outline' },
  { screen: 'Preferences', title: 'Preferences', subtitle: 'AI model, font and response style', icon: 'options-outline' },
  { screen: 'ProfileThemes', title: 'Themes', subtitle: 'App colors and chat background', icon: 'color-palette-outline' },
  { screen: 'Balances', title: 'Balances', subtitle: 'Tokens, top-up and activity', icon: 'wallet-outline' },
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
      showsVerticalScrollIndicator={false}
      decelerationRate="normal"
      scrollEventThrottle={16}
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
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
        autoCapitalize={
          label.toLowerCase().includes('username') || label.toLowerCase().includes('email')
            ? 'none'
            : 'sentences'
        }
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
      contentContainerStyle={[styles.homeContent, { paddingBottom: moduleScrollBottomPad(insets.bottom) }]}
      showsVerticalScrollIndicator={false}
      decelerationRate="normal"
      scrollEventThrottle={16}
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
              onPress={() => {
                if (item.screen === '__join_school') {
                  navigateDashboard('JoinSchool');
                  return;
                }
                navigation.navigate(item.screen as never);
              }}
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
  const [coverBusy, setCoverBusy] = useState(false);
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

  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    setSkillsInput((profile?.skills || []).join(', '));
  }, [profile?.skills]);

  const update = (field: keyof ProfileData, value: string) => {
    setProfile((current) => ({ ...(current || {}), [field]: value }));
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await patchProfile({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        location: profile.location,
        phone_number: profile.phone_number || profile.phone,
        whatsapp_phone: profile.whatsapp_phone,
        secondary_phone: profile.secondary_phone,
        country_code: profile.country_code,
        country_name: profile.country_name,
        preferred_currency: profile.preferred_currency,
        linkedin_url: profile.linkedin_url,
        facebook_url: profile.facebook_url,
        x_url: profile.x_url,
        portfolio_url: profile.portfolio_url,
        skills,
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

  const chooseCoverPhoto = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setCoverBusy(true);
    try {
      const extension = asset.name.split('.').pop() || 'jpg';
      const result = await uploadProfileFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        bucket: 'avatars',
        path: `cover-${Date.now()}.${extension}`,
      });
      const updated = await patchProfile({ cover_photo_url: result.publicUrl || result.path });
      setProfile(updated);
    } catch (e) {
      showDialog({ title: 'Cover photo upload failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setCoverBusy(false);
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
          <Card title="Cover photo" subtitle="Shown at the top of your public portfolio page.">
            {profile.cover_photo_url ? (
              <Image source={{ uri: profile.cover_photo_url }} style={styles.coverPreview} resizeMode="cover" />
            ) : (
              <View style={[styles.coverPreview, styles.coverPreviewEmpty]}>
                <Ionicons name="image-outline" size={26} color={Colors.mutedForeground} />
              </View>
            )}
            <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => void chooseCoverPhoto()} disabled={coverBusy}>
              {coverBusy ? <ActivityIndicator color={Colors.primary} /> : <Ionicons name="image-outline" size={18} color={Colors.primary} />}
              <Text style={styles.secondaryButtonText}>{coverBusy ? 'Uploading…' : 'Change cover photo'}</Text>
            </Pressable>
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
          <Card title="Country & currency">
            <Field label="Country code" value={profile.country_code || ''} onChangeText={(v) => update('country_code', v.toUpperCase())} placeholder="KE" />
            <Field label="Country name" value={profile.country_name || ''} onChangeText={(v) => update('country_name', v)} placeholder="Kenya" />
            <Field label="Preferred currency" value={profile.preferred_currency || ''} onChangeText={(v) => update('preferred_currency', v.toUpperCase())} placeholder="KES" />
          </Card>
          <Card title="Social links" subtitle="Shown on your public portfolio when enabled.">
            <Field label="LinkedIn" value={profile.linkedin_url || ''} onChangeText={(v) => update('linkedin_url', v)} placeholder="https://linkedin.com/in/you" keyboardType="default" />
            <Field label="Facebook" value={profile.facebook_url || ''} onChangeText={(v) => update('facebook_url', v)} placeholder="https://facebook.com/you" />
            <Field label="X (Twitter)" value={profile.x_url || ''} onChangeText={(v) => update('x_url', v)} placeholder="https://x.com/you" />
            <Field label="Portfolio / website" value={profile.portfolio_url || ''} onChangeText={(v) => update('portfolio_url', v)} placeholder="https://your-site.com" />
          </Card>
          <Card title="Skills" subtitle="Comma separated — shown on your public portfolio.">
            <Field label="Skills" value={skillsInput} onChangeText={setSkillsInput} placeholder="React, Excel, Public Speaking" multiline />
          </Card>
          <PrimaryButton label="Save profile" onPress={() => void save()} busy={saving} />
        </>
      ) : null}
    </ScreenShell>
  );
}

export function DocumentsScreen() {
  const { showDialog } = useDialog();
  const { session } = useAuth();
  const [items, setItems] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

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

  /** Fire analysis, poll a few times for status, then refresh the list once done. */
  const analyzeInBackground = useCallback(
    (docId: string) => {
      const userId = session?.user?.id;
      if (!userId) return;
      setAnalyzingIds((prev) => new Set(prev).add(docId));
      void analyzeDocument(userId, docId)
        .catch(() => null)
        .finally(async () => {
          for (let attempt = 0; attempt < 6; attempt += 1) {
            await new Promise((r) => setTimeout(r, 1500));
            try {
              const fresh = await fetchDocuments();
              setItems(fresh);
              const doc = fresh.find((d) => d.id === docId);
              if (doc && doc.status !== 'analyzing' && doc.status !== 'pending') break;
            } catch {
              break;
            }
          }
          setAnalyzingIds((prev) => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
        });
    },
    [session?.user?.id],
  );

  const upload = async (picked: PickedAsset | null) => {
    if (!picked) return;
    setBusy(true);
    try {
      const safeName = picked.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const uploaded = await uploadProfileFile({
        uri: picked.uri,
        name: picked.name,
        mimeType: picked.mimeType,
        bucket: 'user-documents',
        path: `${Date.now()}-${safeName}`,
      });
      const isImage = Boolean(picked.mimeType?.startsWith('image/'));
      const document = await createDocument({
        title: picked.name.replace(/\.[^/.]+$/, ''),
        description: null,
        document_type: isImage ? 'other' : 'cv',
        file_url: uploaded.path,
        file_name: picked.name,
        file_size: picked.size || null,
        mime_type: picked.mimeType || null,
        status: 'pending',
      });
      await load();
      // Vision analysis supports images and PDFs (see ported-edge.service.ts analyzeUserDocuments).
      const mime = String(picked.mimeType || '');
      if (isImage || mime === 'application/pdf') {
        analyzeInBackground(document.id);
      }
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
      <Card title="Your documents" subtitle="Upload a CV, certificate, transcript, ID, or portfolio file — from a file, your gallery, or the camera.">
        <PrimaryButton
          label="Add a document"
          icon="cloud-upload-outline"
          onPress={() => void pickFileOrPhoto().then(upload)}
          busy={busy}
        />
      </Card>
      {items.length ? (
        items.map((item) => {
          const analyzing = analyzingIds.has(item.id) || item.status === 'analyzing';
          return (
            <Card key={item.id}>
              <View style={styles.row}>
                <View style={styles.rowIcon}><Ionicons name="document-text-outline" size={22} color={Colors.primary} /></View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <View style={styles.rowMetaRow}>
                    {analyzing ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
                    <Text style={styles.rowMeta}>
                      {item.document_type || 'Document'} · {analyzing ? 'Analyzing…' : item.status || 'saved'}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => void open(item)} style={styles.iconButton}><Ionicons name="eye-outline" size={20} color={Colors.primary} /></Pressable>
                <Pressable onPress={() => remove(item)} style={styles.iconButton}><Ionicons name="trash-outline" size={20} color={Colors.destructive} /></Pressable>
              </View>
              {item.ai_analysis && item.status === 'completed' ? (
                <Text style={styles.memoryValue} numberOfLines={4}>{item.ai_analysis}</Text>
              ) : null}
            </Card>
          );
        })
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
  /** Portfolio "tags" — same array field the public page renders as `profile.skills` (string[]). */
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([fetchPortfolio(), fetchProfile()])
      .then(([portfolio, profile]) => {
        setUsername(portfolio.username || '');
        setSettings(portfolio.settings);
        const skills = Array.isArray(profile.skills) ? profile.skills : [];
        setTags(skills);
        setTagsInput(skills.join(', '));
      })
      .catch((e) => showDialog({ title: 'Could not load portfolio', message: errorMessage(e), variant: 'danger' }))
      .finally(() => setLoading(false));
  }, [showDialog]);

  const toggle = (key: keyof PortfolioSettings, value: boolean | string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const onTagsInputChange = (value: string) => {
    setTagsInput(value);
    // Always keep `tags` as string[] — split on comma, trim, drop blanks.
    setTags(
      value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([patchPortfolio(settings), patchProfile({ skills: tags })]);
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
      <Card title="Skills / tags" subtitle="Comma separated — shown as tags on your public portfolio page.">
        <Field label="Tags" value={tagsInput} onChangeText={onTagsInputChange} placeholder="React, Excel, Public Speaking" multiline />
        {tags.length ? (
          <View style={styles.chips}>
            {tags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
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

export function PreferencesScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, 'Preferences'>) {
  const { showDialog } = useDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState('gemini');
  const [sarcasm, setSarcasm] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptMemoryId, setPromptMemoryId] = useState<string | null>(null);
  const [preferredFont, setPreferredFont] = useState('Inter');
  const [fontSize, setFontSize] = useState(16);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const { setFontPreference } = useFontPreference();

  useEffect(() => {
    void Promise.all([fetchPreferences(), fetchMemories()])
      .then(([preferences, memories]) => {
        setModel(preferences.preferred_model || 'gemini');
        setSarcasm(Boolean(preferences.sarcasm_mode));
        const userPrefs = preferences.user_preferences || {};
        setPreferredFont(String(userPrefs.preferred_font || 'Inter'));
        setFontSize(Number(userPrefs.font_size) || 16);
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
      await patchPreferences({
        preferred_model: model,
        sarcasm_mode: sarcasm,
        preferred_font: preferredFont,
        font_size: fontSize,
      });
      setFontPreference(preferredFont, fontSize);
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
      <Card title="Font" subtitle="Applies across chat and profile web views.">
        <Text style={styles.label}>Font family</Text>
        <Pressable style={styles.fontDropdown} onPress={() => setFontPickerOpen(true)}>
          <Text style={styles.fontDropdownText}>{findFontOption(preferredFont).label}</Text>
          <Ionicons name="chevron-down" size={18} color={Colors.mutedForeground} />
        </Pressable>
        <Modal visible={fontPickerOpen} animationType="slide" transparent onRequestClose={() => setFontPickerOpen(false)}>
          <View style={styles.fontModalBackdrop}>
            <View style={styles.fontModalSheet}>
              <View style={styles.fontModalHeader}>
                <Text style={styles.cardTitle}>Choose a font</Text>
                <Pressable onPress={() => setFontPickerOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Colors.foreground} />
                </Pressable>
              </View>
              <TextInput
                value={fontSearch}
                onChangeText={setFontSearch}
                placeholder="Search fonts…"
                placeholderTextColor={Colors.mutedForeground}
                style={[styles.input, { marginBottom: 8 }]}
              />
              <FlatList
                data={MOBILE_FONT_OPTIONS.filter((f) =>
                  f.label.toLowerCase().includes(fontSearch.trim().toLowerCase()),
                )}
                keyExtractor={(item) => item.value}
                style={{ maxHeight: 380 }}
                showsVerticalScrollIndicator={false}
                decelerationRate="normal"
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                  const selected = item.value === preferredFont;
                  const nativeFamily = resolveNativeFontFamily(item.value, Boolean(item.weight));
                  return (
                    <Pressable
                      style={[styles.fontOptionRow, selected && styles.fontOptionRowActive]}
                      onPress={() => {
                        setPreferredFont(item.value);
                        setFontPickerOpen(false);
                        setFontSearch('');
                      }}
                    >
                      <Text style={[styles.fontOptionText, { fontFamily: nativeFamily }]}>{item.label}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={18} color={Colors.primary} /> : null}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
        <View style={styles.fontSizeRow}>
          <Text style={styles.rowMeta}>Font size</Text>
          <View style={styles.fontSizeControls}>
            <Pressable
              style={styles.fontSizeBtn}
              onPress={() => setFontSize((v) => Math.max(FONT_SIZE_MIN, v - FONT_SIZE_STEP))}
              accessibilityLabel="Decrease font size"
            >
              <Ionicons name="remove" size={16} color={Colors.primary} />
            </Pressable>
            <Text style={styles.fontSizeValue}>{fontSize}px</Text>
            <Pressable
              style={styles.fontSizeBtn}
              onPress={() => setFontSize((v) => Math.min(FONT_SIZE_MAX, v + FONT_SIZE_STEP))}
              accessibilityLabel="Increase font size"
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
            </Pressable>
          </View>
        </View>
      </Card>
      <Card title="Appearance" subtitle="School themes and chat background pattern.">
        <Pressable
          style={styles.modelRow}
          onPress={() => navigation.navigate('ProfileThemes')}
        >
          <Ionicons name="color-palette-outline" size={20} color={Colors.primary} />
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Themes</Text>
            <Text style={styles.rowMeta}>Open theme picker</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
        </Pressable>
      </Card>
      <PrimaryButton label="Save preferences" onPress={() => void save()} busy={saving} />
    </ScreenShell>
  );
}

export function ThemesScreen() {
  const { themeId, setThemeId, chatBgPattern, setChatBgPattern, palette } = useAppTheme();

  const pickTheme = (id: SchoolThemeId) => {
    // Persist immediately (AsyncStorage) and update context so WebAppScreen re-injects.
    setThemeId(id);
  };

  const pickChatBg = (id: ChatBgPatternId) => {
    setChatBgPattern(id);
  };

  return (
    <ScreenShell>
      <Card title="School theme" subtitle="Colors apply to native chrome and Navigation where possible.">
        <View style={styles.themeGrid}>
          {SCHOOL_THEME_IDS.map((id: SchoolThemeId) => {
            const swatch = SCHOOL_THEME_CONFIGS[id];
            const selected = themeId === id;
            return (
              <Pressable
                key={id}
                onPress={() => pickTheme(id)}
                style={[styles.themeCard, selected && styles.themeCardSelected]}
              >
                <View style={styles.themeSwatches}>
                  <View style={[styles.themeDot, { backgroundColor: swatch.primary }]} />
                  <View style={[styles.themeDot, { backgroundColor: swatch.secondary }]} />
                  <View style={[styles.themeDot, { backgroundColor: swatch.tertiary }]} />
                </View>
                <Text style={styles.themeLabel} numberOfLines={2}>
                  {SCHOOL_THEME_LABELS[id]}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={18} color={palette.primary} style={styles.themeCheck} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card title="Chat background" subtitle="Stored as tukua_chat_bg_pattern and injected into the chat WebView.">
        <View style={styles.chips}>
          {CHAT_BG_PATTERN_IDS.map((id: ChatBgPatternId) => {
            const on = chatBgPattern === id;
            return (
              <Pressable
                key={id}
                onPress={() => pickChatBg(id)}
                style={[styles.chip, on && styles.chipActive]}
              >
                <Text style={[styles.chipText, on && styles.chipTextActive]}>
                  {CHAT_BG_PATTERN_LABELS[id]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </ScreenShell>
  );
}

export function BalancesScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, 'Balances'>) {
  const { profile, session } = useAuth();
  const { showDialog } = useDialog();
  const [data, setData] = useState<BalancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('100');
  const [topUpBusy, setTopUpBusy] = useState(false);
  const [topUpStatus, setTopUpStatus] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareKes, setShareKes] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [shareLookup, setShareLookup] = useState<TokenShareLookup | null>(null);
  const [shareLooking, setShareLooking] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      // Always reload from the top so a fresh top-up/Sambaza transaction shows first.
      setData(await fetchBalances({ limit: BALANCES_PAGE_SIZE, offset: 0 }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !data?.has_more) return;
    setLoadingMore(true);
    try {
      const next = await fetchBalances({ limit: BALANCES_PAGE_SIZE, offset: data.transactions?.length || 0 });
      setData((current) =>
        current
          ? { ...next, transactions: [...(current.transactions || []), ...(next.transactions || [])] }
          : next,
      );
    } catch (e) {
      showDialog({ title: 'Could not load more', message: errorMessage(e), variant: 'danger' });
    } finally {
      setLoadingMore(false);
    }
  }, [data?.has_more, data?.transactions, loadingMore, showDialog]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile?.phone, phone]);

  const submitTopUp = async () => {
    const numericAmount = Number(amount);
    if (!phone.trim()) {
      showDialog({ title: 'Phone required', message: 'Enter the M-Pesa number to charge.', variant: 'warning' });
      return;
    }
    if (!(numericAmount > 0)) {
      showDialog({ title: 'Invalid amount', message: 'Enter an amount greater than 0.', variant: 'warning' });
      return;
    }
    setTopUpBusy(true);
    setTopUpStatus('Sending M-Pesa prompt…');
    try {
      const { checkout_request_id, tokens } = await topUpViaMpesa({
        phone_number: phone.trim(),
        amount: numericAmount,
        user_id: session?.user?.id,
      });
      setTopUpStatus('Check your phone for the M-Pesa prompt…');
      const result = await pollMpesaTopUpStatus(checkout_request_id, {
        onTick: (s) => {
          if (s.status === 'pending') setTopUpStatus('Waiting for M-Pesa confirmation…');
        },
      });
      if (result.status === 'completed') {
        setTopUpStatus('');
        showDialog({
          title: 'Top-up successful',
          message: result.message || `${(result.tokens || tokens).toLocaleString()} tokens have been added to your balance.`,
          variant: 'success',
        });
        void load();
      } else if (result.status === 'failed' || result.status === 'cancelled') {
        setTopUpStatus('');
        showDialog({ title: 'Top-up not completed', message: result.message || 'The M-Pesa payment was not completed.', variant: 'warning' });
      } else {
        setTopUpStatus('');
        showDialog({ title: 'Still processing', message: 'We could not confirm the payment yet — check Balances shortly.', variant: 'warning' });
      }
    } catch (e) {
      setTopUpStatus('');
      showDialog({ title: 'Top-up failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setTopUpBusy(false);
    }
  };

  const findShareRecipient = async () => {
    const trimmed = shareEmail.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      showDialog({ title: 'Email required', message: 'Enter a valid recipient email.', variant: 'warning' });
      return;
    }
    setShareLooking(true);
    setShareLookup(null);
    try {
      setShareLookup(await lookupTokenShareRecipient(trimmed));
    } catch (e) {
      showDialog({ title: 'Lookup failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setShareLooking(false);
    }
  };

  const submitSambaza = async () => {
    if (!shareLookup?.user_id) {
      showDialog({ title: 'Find recipient', message: 'Look up a recipient email first.', variant: 'warning' });
      return;
    }
    const kes = Math.floor(Number(shareKes)) || 0;
    const tokens = tokensFromKes(kes);
    if (kes < 1 || tokens < 1) {
      showDialog({ title: 'Invalid amount', message: 'Enter a KES amount that yields at least 1 token.', variant: 'warning' });
      return;
    }
    if (tokens > Number(data?.balance?.balance || 0)) {
      showDialog({
        title: 'Insufficient tokens',
        message: `You need ${tokens.toLocaleString()} tokens for that Sambaza.`,
        variant: 'warning',
      });
      return;
    }
    setShareBusy(true);
    try {
      await transferTokens({
        to_user_id: shareLookup.user_id,
        tokens,
        note: shareNote.trim() || `Sambaza KES ${kes} → ${tokens} tokens`,
      });
      showDialog({
        title: 'Sambaza sent',
        message: `Sent ${tokens.toLocaleString()} tokens to ${shareLookup.first_name || shareLookup.email}.`,
        variant: 'success',
      });
      setShareKes('');
      setShareNote('');
      void load();
    } catch (e) {
      showDialog({ title: 'Sambaza failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setShareBusy(false);
    }
  };

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

      <Card title="Top up tokens" subtitle="Pay with M-Pesa — tokens land instantly after confirmation.">
        <Field label="M-Pesa phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" />
        <View style={styles.presetRow}>
          {TOPUP_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              style={[styles.presetChip, amount === String(preset) && styles.presetChipActive]}
              onPress={() => setAmount(String(preset))}
            >
              <Text style={[styles.presetChipText, amount === String(preset) && styles.presetChipTextActive]}>
                KES {preset}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Amount (KES)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
        {Number(amount) > 0 ? (
          <Text style={styles.rowMeta}>≈ {tokensFromKes(Number(amount)).toLocaleString()} tokens</Text>
        ) : null}
        {topUpStatus ? (
          <View style={styles.topUpStatusRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.rowMeta}>{topUpStatus}</Text>
          </View>
        ) : null}
        <PrimaryButton label="Buy tokens with M-Pesa" onPress={() => void submitTopUp()} busy={topUpBusy} />
      </Card>

      <Card title="Sambaza tokens" subtitle="Share tokens with another Tukua user by email.">
        <Field label="Recipient email" value={shareEmail} onChangeText={setShareEmail} keyboardType="email-address" placeholder="friend@example.com" />
        <PrimaryButton label="Find recipient" onPress={() => void findShareRecipient()} busy={shareLooking} />
        {shareLookup?.user_id ? (
          <Text style={styles.rowMeta}>
            Found: {shareLookup.first_name || 'User'}
            {shareLookup.last_name_masked ? ` ${shareLookup.last_name_masked}` : ''} ({shareLookup.email})
          </Text>
        ) : null}
        <Field label="Amount (KES equivalent)" value={shareKes} onChangeText={setShareKes} keyboardType="number-pad" />
        {Number(shareKes) > 0 ? (
          <Text style={styles.rowMeta}>≈ {tokensFromKes(Number(shareKes)).toLocaleString()} tokens</Text>
        ) : null}
        <Field label="Note (optional)" value={shareNote} onChangeText={setShareNote} placeholder="Happy learning" />
        <PrimaryButton label="Send Sambaza" onPress={() => void submitSambaza()} busy={shareBusy} />
      </Card>

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

      {data?.has_more ? (
        <Pressable style={styles.loadMoreButton} onPress={() => void loadMore()} disabled={loadingMore}>
          {loadingMore ? (
            <ActivityIndicator size="small" color={Colors.foreground} />
          ) : (
            <Text style={styles.smallButtonMutedText}>Load more</Text>
          )}
        </Pressable>
      ) : null}

      <Pressable style={styles.dangerLink} onPress={() => navigation.navigate('DeleteAccount')}>
        <Ionicons name="trash-outline" size={16} color={Colors.orange} />
        <Text style={styles.dangerLinkText}>Delete my account</Text>
      </Pressable>
    </ScreenShell>
  );
}

/** ID verification — Nest vision check via `/platform/ai/verify-id` (no Supabase Edge). */
export function IdVerificationScreen() {
  const { showDialog } = useDialog();
  const [documentType, setDocumentType] = useState<'national_id' | 'passport'>('national_id');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; message?: string } | null>(null);

  const pickIdAsset = (): Promise<PickedAsset | null> => {
    return new Promise((resolve) => {
      Alert.alert('Add your ID', 'Take a photo, choose one from your gallery, or pick a file.', [
        { text: 'Take photo', onPress: () => void pickFromCamera().then(resolve) },
        { text: 'Choose photo', onPress: () => void pickFromGallery().then(resolve) },
        {
          text: 'Choose file',
          onPress: () =>
            void DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true }).then((picked) => {
              if (picked.canceled || !picked.assets?.[0]) return resolve(null);
              const asset = picked.assets[0];
              resolve({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
            }),
        },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
  };

  const pickAndVerify = async () => {
    try {
      const asset = await pickIdAsset();
      if (!asset) return;
      setFileName(asset.name || 'ID document');
      setUploading(true);
      setResult(null);
      const extension = (asset.name || 'id.jpg').split('.').pop() || 'jpg';
      const uploaded = await uploadProfileFile({
        uri: asset.uri,
        name: asset.name || `id-document.${extension}`,
        mimeType: asset.mimeType,
        bucket: 'user-documents',
        path: `id-verification-${Date.now()}.${extension}`,
      });
      const signedUrl = await createSignedDownload(uploaded.path);
      // Nest checks `document_type.startsWith('id_')` for ID-keyword validation.
      const nestDocType = documentType === 'passport' ? 'id_passport' : 'id_national';
      const verification = await verifyIdDocument({ image_url: signedUrl, document_type: nestDocType });
      const verified = Boolean(verification.is_valid ?? verification.verified ?? verification.success);
      setResult({ verified, message: verification.message || verification.analysis_notes });
      showDialog({
        title: verified ? 'ID verified' : 'Could not verify',
        message: verification.message || verification.analysis_notes || (verified ? 'Your document looks valid.' : 'We could not confirm this document — try a clearer photo.'),
        variant: verified ? 'success' : 'warning',
      });
    } catch (e) {
      showDialog({ title: 'Verification failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenShell>
      <Card title="Verify your identity" subtitle="Upload a clear photo of your ID or passport. We use AI to check authenticity.">
        <View style={styles.presetRow}>
          <Pressable
            style={[styles.presetChip, documentType === 'national_id' && styles.presetChipActive]}
            onPress={() => setDocumentType('national_id')}
          >
            <Text style={[styles.presetChipText, documentType === 'national_id' && styles.presetChipTextActive]}>National ID</Text>
          </Pressable>
          <Pressable
            style={[styles.presetChip, documentType === 'passport' && styles.presetChipActive]}
            onPress={() => setDocumentType('passport')}
          >
            <Text style={[styles.presetChipText, documentType === 'passport' && styles.presetChipTextActive]}>Passport</Text>
          </Pressable>
        </View>
        {fileName ? <Text style={styles.rowMeta}>Selected: {fileName}</Text> : null}
        {result ? (
          <View style={styles.topUpStatusRow}>
            <Ionicons
              name={result.verified ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={result.verified ? Colors.primary : Colors.orange}
            />
            <Text style={styles.rowMeta}>{result.message || (result.verified ? 'Verified' : 'Not verified')}</Text>
          </View>
        ) : null}
        <PrimaryButton label="Add ID & verify" icon="camera-outline" onPress={() => void pickAndVerify()} busy={uploading} />
      </Card>
    </ScreenShell>
  );
}

/** Delete account — Nest deletion request queue via `/platform/account/deletion-request` (no Supabase Edge). */
export function DeleteAccountScreen() {
  const { profile, logout } = useAuth();
  const { showDialog } = useDialog();
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      showDialog({ title: 'Type DELETE to confirm', message: 'This helps us avoid accidental account deletion.', variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await requestAccountDeletion({ email: profile?.email, phone: profile?.phone, reason: reason.trim() || undefined });
      showDialog({
        title: 'Deletion requested',
        message: 'We have received your request. Your account will be deleted per our data policy, and you will be signed out now.',
        variant: 'success',
      });
      await logout();
    } catch (e) {
      showDialog({ title: 'Could not submit request', message: errorMessage(e), variant: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell>
      <Card title="Delete account" subtitle="This permanently removes your Tukua account and data. This cannot be undone.">
        <Field label="Why are you leaving? (optional)" value={reason} onChangeText={setReason} multiline placeholder="Tell us what we could improve…" />
        <Field label='Type "DELETE" to confirm' value={confirmText} onChangeText={setConfirmText} placeholder="DELETE" />
        <Pressable
          style={[styles.dangerButton, submitting && styles.buttonDim]}
          onPress={() => void submit()}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={Colors.white} /> : <Ionicons name="trash-outline" size={16} color={Colors.white} />}
          <Text style={styles.dangerButtonText}>Delete my account</Text>
        </Pressable>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  homeContent: { flexGrow: 1 },
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
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  coverPreview: { width: '100%', height: 120, borderRadius: 14, backgroundColor: Colors.muted },
  coverPreviewEmpty: { alignItems: 'center', justifyContent: 'center' },
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
  loadMoreButton: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: Colors.muted, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4, marginBottom: 8 },
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
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  presetChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  presetChipText: { fontSize: 13, fontWeight: '600', color: Colors.mutedForeground },
  presetChipTextActive: { color: Colors.primary },
  topUpStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dangerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  dangerLinkText: { color: Colors.orange, fontSize: 13, fontWeight: '700', fontFamily: 'Inter_600SemiBold' },
  dangerButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: '#D64545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  dangerButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700', fontFamily: 'Inter_600SemiBold' },
  fontDropdown: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fontDropdownText: { fontSize: 14, fontWeight: '600', color: Colors.foreground, fontFamily: 'Inter_600SemiBold' },
  fontModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  fontModalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  fontModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  fontOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  fontOptionRowActive: { backgroundColor: Colors.primaryLight },
  fontOptionText: { fontSize: 15, color: Colors.foreground },
  fontChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  fontChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  fontChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  fontChipText: { fontSize: 13, fontWeight: '600', color: Colors.mutedForeground },
  fontChipTextActive: { color: Colors.primary },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  fontSizeControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fontSizeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fontSizeValue: { fontSize: 14, fontWeight: '700', color: Colors.foreground, minWidth: 36, textAlign: 'center' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  themeCard: {
    width: '47%',
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: 12,
  },
  themeCardSelected: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.primaryLight },
  themeSwatches: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  themeDot: { width: 18, height: 18, borderRadius: 9 },
  themeLabel: { fontSize: 12, fontWeight: '600', color: Colors.foreground, fontFamily: 'Inter_600SemiBold' },
  themeCheck: { position: 'absolute', top: 8, right: 8 },
});
