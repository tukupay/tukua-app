/**
 * Parent transport — map URL helpers + types.
 * Live trip/home data comes from Nest via `parentPortalApi` (TransportScreen).
 * No product dummy buses or trip history.
 */

export type LatLng = { lat: number; lng: number; label?: string };

export type ParentTransportRoute = {
  id: string;
  plate: string;
  name: string;
  status: 'On route' | 'Yard' | 'Maintenance';
  driverName: string;
  driverPhoneMasked: string;
  routeCode: string;
  originName: string;
  destinationName: string;
  etaMinutes: number;
  live: LatLng;
};

export type ParentTripHistory = {
  id: string;
  date: string;
  direction: 'to_school' | 'from_school';
  routeName: string;
  plate: string;
  boardedAt: string;
  alightedAt: string;
  durationMinutes: number;
  route: LatLng[];
};

/** Honest empty — Nest trips populate the UI. */
export const PARENT_CHILD_BUS: ParentTransportRoute | null = null;
export const PARENT_TRANSPORT_ROUTES: ParentTransportRoute[] = [];
export const PARENT_TRIP_HISTORY: ParentTripHistory[] = [];

export const DEFAULT_SCHOOL_PIN: LatLng = { lat: -1.2921, lng: 36.8219, label: 'School' };

export function googleMapsSearchUrl(q: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function googleMapsDirectionsUrl(origin: LatLng, dest: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}`;
}

export function googleMapsEmbedUrl(pin: LatLng, zoom = 14): string {
  return `https://maps.google.com/maps?q=${pin.lat},${pin.lng}&z=${zoom}&output=embed`;
}

export function googleMapsEmbedTwoPinUrl(a: LatLng, b: LatLng): string {
  return `https://maps.google.com/maps?saddr=${a.lat},${a.lng}&daddr=${b.lat},${b.lng}&output=embed`;
}

/** Minimal map picker shell for WebView — no fabricated vehicle markers. */
export function mapPickerHtml(center: LatLng): string {
  const { lat, lng } = center;
  return `<!DOCTYPE html><html><body style="margin:0;font-family:sans-serif">
<p style="padding:12px">Pick location near ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
<iframe style="border:0;width:100%;height:90vh" src="${googleMapsEmbedUrl(center)}"></iframe>
</body></html>`;
}
