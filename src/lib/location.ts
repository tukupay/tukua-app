import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { getNestApiBaseUrl } from './localHost';

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  country?: string;
  timestamp: string;
};

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      city: data.city || data.locality || data.principalSubdivision,
      country: data.countryName,
    };
  } catch {
    return {};
  }
}

/**
 * Ask for location now (shows the system dialog when not yet decided). For the first-run permission wizard and
 * for features that need it, at the moment the user starts them. Never throws.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Current position + city. By default it never pops a system dialog (sign-in / register call it in the
 * background): it only reads location when the user already allowed it. Pass { ask: true } to ask first.
 */
export async function captureUserLocation(opts: { ask?: boolean } = {}): Promise<UserLocation | null> {
  if (Platform.OS === 'web') return null;
  const allowed = opts.ask ? await requestLocationPermission() : await hasLocationPermission();
  if (!allowed) return null;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? 0,
    city: geo.city,
    country: geo.country,
    timestamp: new Date().toISOString(),
  };
}

/** Sync GPS to Yana on first login (TukuPay path). Stored in users.first_login_* columns. */
export async function syncLocationToYana(accessToken: string, location: UserLocation) {
  const url = `${getNestApiBaseUrl()}/platform/edge/sync-tukupay-user`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, location }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Location sync failed');
  }
  return res.json();
}
