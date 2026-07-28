/**
 * Parent transport — UI-only (mirrors Desk transport dummy; no Nest backend yet).
 * One active bus for the selected child + trip history with route points.
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
  /** Live bus position (Nairobi-ish demo). */
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
  /** Polyline / stops the bus passed. */
  route: LatLng[];
};

/** Demo single bus for the selected child until Nest transport ships. */
export const PARENT_CHILD_BUS: ParentTransportRoute = {
  id: 'bus-scania-2',
  plate: 'KBT 676H',
  name: 'Morning Route A',
  status: 'On route',
  driverName: 'Darrell Steward',
  driverPhoneMasked: '*** *** *101',
  routeCode: 'R-01',
  originName: 'Westlands terminus',
  destinationName: 'School gate',
  etaMinutes: 12,
  live: { lat: -1.2675, lng: 36.8108, label: 'Bus live' },
};

/** @deprecated Prefer PARENT_CHILD_BUS — kept for older callers. */
export const PARENT_TRANSPORT_ROUTES: ParentTransportRoute[] = [PARENT_CHILD_BUS];

export const PARENT_TRIP_HISTORY: ParentTripHistory[] = [
  {
    id: 'trip-1',
    date: '2026-07-25',
    direction: 'to_school',
    routeName: 'Morning Route A',
    plate: 'KBT 676H',
    boardedAt: '06:42',
    alightedAt: '07:18',
    durationMinutes: 36,
    route: [
      { lat: -1.2679, lng: 36.8102, label: 'Home stop' },
      { lat: -1.2701, lng: 36.8125, label: 'Ring Rd' },
      { lat: -1.2734, lng: 36.8158, label: 'Parklands' },
      { lat: -1.2768, lng: 36.8192, label: 'School gate' },
    ],
  },
  {
    id: 'trip-2',
    date: '2026-07-24',
    direction: 'from_school',
    routeName: 'Afternoon Route A',
    plate: 'KBT 676H',
    boardedAt: '15:45',
    alightedAt: '16:22',
    durationMinutes: 37,
    route: [
      { lat: -1.2768, lng: 36.8192, label: 'School gate' },
      { lat: -1.2734, lng: 36.8158, label: 'Parklands' },
      { lat: -1.2701, lng: 36.8125, label: 'Ring Rd' },
      { lat: -1.2679, lng: 36.8102, label: 'Home stop' },
    ],
  },
  {
    id: 'trip-3',
    date: '2026-07-24',
    direction: 'to_school',
    routeName: 'Morning Route A',
    plate: 'KBT 676H',
    boardedAt: '06:40',
    alightedAt: '07:15',
    durationMinutes: 35,
    route: [
      { lat: -1.2679, lng: 36.8102, label: 'Home stop' },
      { lat: -1.2712, lng: 36.814, label: 'Westlands Rd' },
      { lat: -1.2768, lng: 36.8192, label: 'School gate' },
    ],
  },
];

/** Fallback school gate pin when no live trip GPS is available. */
export const DEFAULT_SCHOOL_PIN: LatLng = {
  lat: -1.2768,
  lng: 36.8192,
  label: 'School',
};

/** WebView-safe embed — never use directions URLs here (they block iframe). */
export function googleMapsEmbedUrl(point: LatLng, zoom = 14): string {
  return `https://maps.google.com/maps?q=${point.lat},${point.lng}&z=${zoom}&output=embed`;
}

/** Embed showing two markers via center + zoom (no API key). */
export function googleMapsEmbedTwoPinUrl(a: LatLng, b: LatLng, zoom = 13): string {
  const lat = (a.lat + b.lat) / 2;
  const lng = (a.lng + b.lng) / 2;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function googleMapsSearchUrl(point: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
}

/** Opens native Maps app — not for WebView. */
export function googleMapsDirectionsUrl(route: LatLng[]): string | null {
  if (route.length < 2) return null;
  const origin = route[0]!;
  const dest = route[route.length - 1]!;
  const waypoints = route
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  return url;
}

/** Leaflet picker HTML for tap-to-set home coordinates in a WebView. */
export function mapPickerHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{margin:0;height:100%;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var lat=${lat}, lng=${lng};
  var map = L.map('map').setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  var marker = L.marker([lat, lng], { draggable: true }).addTo(map);
  function send(p) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(p));
  }
  marker.on('dragend', function() { var p = marker.getLatLng(); send({ lat: p.lat, lng: p.lng }); });
  map.on('click', function(e) { marker.setLatLng(e.latlng); send({ lat: e.latlng.lat, lng: e.latlng.lng }); });
</script>
</body></html>`;
}
