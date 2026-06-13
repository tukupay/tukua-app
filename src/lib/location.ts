import * as Location from 'expo-location';

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

export async function captureUserLocation(): Promise<UserLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

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
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-tukupay-user`;
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
