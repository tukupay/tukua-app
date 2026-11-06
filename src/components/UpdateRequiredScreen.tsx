import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { STORE_URL_FALLBACK, installedVersion, type AppVersionCheck } from '../lib/appVersion';

const GREEN = '#172C1F';
const LIME = '#8DC02C';

/**
 * Shown instead of the whole app when this version is below the minimum Tukua allows
 * (see lib/appVersion.ts). The only way on is the store's update.
 */
export function UpdateRequiredScreen({ check }: { check: AppVersionCheck }) {
  const { version } = installedVersion();
  const url = check.store_url || STORE_URL_FALLBACK;
  return (
    <View style={styles.page}>
      <Image source={require('../../assets/images/icons/tukua-app-icon-512.png')} style={styles.icon} />
      <Text style={styles.title}>Update Tukua</Text>
      <Text style={styles.body}>
        {check.message || 'A new version of Tukua is ready. Update to keep using the app.'}
      </Text>
      <Text style={styles.versions}>
        This phone has version {version || '?'}
        {check.latest_version ? ` · the new version is ${check.latest_version}` : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void Linking.openURL(url).catch(() => Linking.openURL(STORE_URL_FALLBACK))}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.buttonText}>Update now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { width: 112, height: 112, borderRadius: 24, marginBottom: 28 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { color: '#DDEBDD', fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 14 },
  versions: { color: '#9FB8A4', fontSize: 13, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: LIME, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, minWidth: 220, alignItems: 'center' },
  buttonText: { color: GREEN, fontSize: 17, fontWeight: '700' },
});
