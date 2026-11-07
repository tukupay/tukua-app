/**
 * The school's fleet on a map: every vehicle with its own icon and colour, where it is and the
 * paths it has driven. Nest `GET /transport/fleet/map`.
 *
 * The map is free: OpenStreetMap tiles drawn by Leaflet inside a WebView. No key, no billing.
 * The vehicle markers are the same as on Desk
 * (`desktop/apps/frontend/src/pages/transport/lib/vehicleMarker.ts`); keep the two alike.
 */
import { deskFetch } from './deskApi';
import { Colors } from '../theme/yana';

export type FleetMapTrip = {
  id: string;
  status: string;
  trip_kind: string;
  route_name: string | null;
  started_at: string | null;
  ended_at: string | null;
  distance_km: number | null;
  boarded: number;
  top_speed_kmh: number | null;
  path: [number, number][];
};

export type FleetMapVehicle = {
  id: string;
  name: string;
  plate: string | null;
  icon: string;
  color: string;
  capacity: number | null;
  route_name: string | null;
  status: 'on_trip' | 'available' | 'workshop' | 'inactive';
  position: { lat: number; lng: number; speed_kmh: number | null; recorded_at: string | null; heading: number | null } | null;
  active_trip: { id: string; trip_kind: string; route_name: string | null; started_at: string | null; boarded: number } | null;
  trips: FleetMapTrip[];
};

export type FleetMapData = { day: string; live: boolean; refreshed_at: string; on_trip: number; vehicles: FleetMapVehicle[] };

/** Today's live map when `day` is left out; an earlier day as YYYY-MM-DD. */
export async function fetchFleetMap(day?: string) {
  return deskFetch<FleetMapData>(`/transport/fleet/map${day ? `?from=${encodeURIComponent(day)}` : ''}`);
}

/** The icon font's nearest picture for each kind of vehicle, for lists beside the map. */
export function vehicleIonicon(icon: string | null | undefined): 'bus' | 'car' | 'car-sport' | 'cube' {
  if (icon === 'car') return 'car-sport';
  if (icon === 'van') return 'car';
  if (icon === 'truck') return 'cube';
  return 'bus';
}

export function tripKindLabel(kind: string | null | undefined): string {
  const k = String(kind || '').toLowerCase();
  if (k === 'home_morning') return 'Morning pick-up';
  if (k === 'home_evening') return 'Evening drop-off';
  if (k === 'event') return 'School trip';
  return 'Trip';
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 2880) return `${Math.floor(minutes / 60)} h ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

/** White shapes on a 24 by 24 box; `{c}` is the vehicle's colour, used to cut the windows out. */
const GLYPHS: Record<string, string> = {
  bus:
    '<rect x="3" y="4" width="18" height="13.5" rx="3" fill="#fff"/><rect x="5.2" y="6.4" width="13.6" height="4.6" rx="1.1" fill="{c}"/>' +
    '<rect x="5.2" y="13.2" width="2.6" height="1.6" rx=".8" fill="{c}"/><rect x="16.2" y="13.2" width="2.6" height="1.6" rx=".8" fill="{c}"/>' +
    '<circle cx="8" cy="18.2" r="2.1" fill="#fff"/><circle cx="16" cy="18.2" r="2.1" fill="#fff"/>',
  minibus:
    '<path d="M3.5 9a3 3 0 0 1 3-3h8.2a3 3 0 0 1 2.4 1.2l2.6 3.5a2 2 0 0 1 .8 1.6V17H3.5z" fill="#fff"/>' +
    '<path d="M6 8h3.4v3.2H5.6V8.4A.4.4 0 0 1 6 8zm4.9 0h3.4l2.4 3.2h-5.8z" fill="{c}"/>' +
    '<circle cx="8" cy="17.6" r="2.1" fill="#fff"/><circle cx="16.4" cy="17.6" r="2.1" fill="#fff"/>',
  van:
    '<path d="M2.8 8.4a2 2 0 0 1 2-2H13l5.2 4.4h1a2 2 0 0 1 2 2V17H2.8z" fill="#fff"/><path d="M11.4 8.2h1.2l3.2 2.8h-4.4z" fill="{c}"/>' +
    '<circle cx="7.4" cy="17.6" r="2.1" fill="#fff"/><circle cx="16.8" cy="17.6" r="2.1" fill="#fff"/>',
  car:
    '<path d="M4.6 11.4l1.9-4.3A2 2 0 0 1 8.3 6h7.4a2 2 0 0 1 1.8 1.1l1.9 4.3a2 2 0 0 1 1.6 2V17H3v-3.6a2 2 0 0 1 1.6-2z" fill="#fff"/>' +
    '<path d="M8.5 7.8h7l1.5 3.4H7z" fill="{c}"/><circle cx="7.6" cy="17.6" r="2.1" fill="#fff"/><circle cx="16.4" cy="17.6" r="2.1" fill="#fff"/>',
  truck:
    '<rect x="2.4" y="6" width="10.8" height="11" rx="1.6" fill="#fff"/><path d="M13.8 9h3.6l4.2 4.2V17h-7.8z" fill="#fff"/>' +
    '<path d="M15.3 10.4h1.6l2.2 2.2h-3.8z" fill="{c}"/><circle cx="7" cy="17.6" r="2.1" fill="#fff"/><circle cx="17.4" cy="17.6" r="2.1" fill="#fff"/>',
};

/** What the page is asked to draw. `pickedId` is the vehicle being followed, if any. */
export type FleetMapDrawing = { vehicles: FleetMapVehicle[]; live: boolean; pickedId: string | null; showPaths: boolean };

/** The call that redraws the map inside the WebView without loading the page again. */
export function fleetMapUpdateScript(drawing: FleetMapDrawing): string {
  // JSON is valid JavaScript here; `true` keeps the WebView from warning about a return value.
  return `window.__fleet && window.__fleet.draw(${JSON.stringify(drawing)}); true;`;
}

/**
 * The map page. It draws once from `drawing`, then again whenever `fleetMapUpdateScript` is
 * injected. Tapping a vehicle posts `{ type: 'pick', id }` back to the app.
 * The script inside uses no backticks so that it can sit in this template string.
 */
export function fleetMapHtml(drawing: FleetMapDrawing, centre: [number, number] = [-1.2864, 36.8172]): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8ece9; }
  .veh { background: transparent; border: 0; }
  @keyframes pulse { 0% { transform: scale(.8); opacity: .38 } 70% { transform: scale(1.55); opacity: 0 } 100% { transform: scale(1.55); opacity: 0 } }
  .ring { animation: pulse 2s ease-out infinite; }
  .leaflet-control-attribution { font-size: 9px; }
  #note { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); z-index: 999; background: rgba(255,255,255,.95);
    border-radius: 999px; padding: 6px 12px; font: 600 12px -apple-system, Roboto, sans-serif; color: #04140F; box-shadow: 0 1px 4px rgba(0,0,0,.25); display: none; }
</style>
</head>
<body>
<div id="map"></div>
<div id="note"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var GLYPHS = ${JSON.stringify(GLYPHS)};
  var note = document.getElementById('note');
  if (!window.L) { note.style.display = 'block'; note.textContent = 'The map needs an internet connection.'; return; }

  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView(${JSON.stringify(centre)}, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var fitted = '';

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  }
  function glyph(icon, colour, size) {
    var shape = (GLYPHS[icon] || GLYPHS.bus).split('{c}').join(colour);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '">' + shape + '</svg>';
  }
  function marker(v, moving, faded, picked) {
    var c = v.color || '#2563eb';
    var heading = v.position && v.position.heading;
    var arrow = moving && heading != null
      ? '<div style="position:absolute;left:26px;top:0;width:44px;height:44px;transform:rotate(' + Math.round(heading) + 'deg)">' +
        '<div style="position:absolute;left:16px;top:-7px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid ' + c + '"></div></div>'
      : '';
    var ring = moving ? '<div class="ring" style="position:absolute;left:26px;top:0;width:44px;height:44px;border-radius:9999px;background:' + c + ';opacity:.28"></div>' : '';
    var badge = '<div style="position:absolute;left:30px;top:4px;width:36px;height:36px;border-radius:9999px;background:' + c +
      ';border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45)' + (picked ? ',0 0 0 3px ' + c : '') +
      ';display:flex;align-items:center;justify-content:center">' + glyph(v.icon, c, 22) + '</div>';
    var label = v.plate || v.name;
    var tag = label
      ? '<div style="position:absolute;left:0;top:44px;width:96px;text-align:center;line-height:1"><span style="display:inline-block;max-width:92px;overflow:hidden;' +
        'text-overflow:ellipsis;white-space:nowrap;padding:3px 6px;border-radius:6px;background:#fff;color:#111827;border:1.5px solid ' + c +
        ';font:700 10.5px/1.1 monospace;letter-spacing:.3px;box-shadow:0 1px 3px rgba(0,0,0,.3)">' + esc(label) + '</span></div>'
      : '';
    return '<div style="position:relative;width:96px;height:64px;opacity:' + (faded ? 0.62 : 1) + '">' + ring + arrow + badge + tag + '</div>';
  }

  function draw(d) {
    layer.clearLayers();
    var points = [];
    var vehicles = (d.vehicles || []).filter(function (v) { return v.status !== 'inactive'; });
    vehicles.forEach(function (v) {
      var isPicked = d.pickedId === v.id;
      if (d.showPaths) {
        (v.trips || []).forEach(function (trip) {
          if (!trip.path || trip.path.length < 2) return;
          L.polyline(trip.path, {
            color: v.color, weight: isPicked ? 6 : 4, lineCap: 'round', lineJoin: 'round',
            opacity: d.pickedId ? (isPicked ? 0.95 : 0.22) : (trip.status === 'active' ? 0.9 : 0.6)
          }).addTo(layer);
          if (!d.pickedId || isPicked) { points.push(trip.path[0]); points.push(trip.path[trip.path.length - 1]); }
        });
      }
      if (!v.position) return;
      var moving = d.live && v.status === 'on_trip';
      var m = L.marker([v.position.lat, v.position.lng], {
        icon: L.divIcon({ className: 'veh', html: marker(v, moving, d.pickedId ? !isPicked : !moving, isPicked), iconSize: [96, 64], iconAnchor: [48, 22] }),
        zIndexOffset: isPicked ? 1000 : moving ? 500 : 0
      }).addTo(layer);
      m.on('click', function () {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pick', id: v.id }));
      });
      if (!d.pickedId || isPicked) points.push([v.position.lat, v.position.lng]);
    });

    note.style.display = vehicles.length ? 'none' : 'block';
    note.textContent = 'No vehicles to show yet.';

    // The view moves when what is being looked at changes, not on every new position.
    var key = (d.pickedId || 'all') + '|' + vehicles.length + '|' + (d.live ? 'live' : 'day');
    if (key !== fitted && points.length) {
      fitted = key;
      if (points.length === 1) map.setView(points[0], 15);
      else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
    }
  }

  window.__fleet = { draw: draw };
  draw(${JSON.stringify(drawing)});
})();
</script>
</body>
</html>`;
}

/**
 * A plain map with one or two labelled pins, on the same free tiles. With `pick`, tapping the map
 * moves the first pin there and posts `{ lat, lng }` back to the app (choosing a pick-up point).
 */
export function pinMapHtml(pins: Array<{ lat: number; lng: number; label?: string; colour?: string }>, opts?: { pick?: boolean }): string {
  const clean = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const centre = clean[0] ? [clean[0].lat, clean[0].lng] : [-1.2864, 36.8172];
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8ece9; }
  .pin { background: transparent; border: 0; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  if (!window.L) { document.body.innerHTML = '<p style="font:14px sans-serif;padding:16px">The map needs an internet connection.</p>'; return; }
  var pins = ${JSON.stringify(clean)};
  var pick = ${opts?.pick ? 'true' : 'false'};
  var map = L.map('map').setView(${JSON.stringify(centre)}, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  function icon(p) {
    var c = p.colour || '${Colors.primary}';
    var label = p.label ? '<div style="margin-top:2px;text-align:center"><span style="background:#fff;border:1.5px solid ' + c +
      ';border-radius:6px;padding:2px 6px;font:700 11px sans-serif;color:#111827;box-shadow:0 1px 3px rgba(0,0,0,.3)">' +
      String(p.label).replace(/[&<>]/g, '') + '</span></div>' : '';
    return L.divIcon({ className: 'pin', iconSize: [96, 48], iconAnchor: [48, 11],
      html: '<div style="width:96px"><div style="margin:0 auto;width:16px;height:16px;border-radius:9999px;background:' + c +
        ';border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>' + label + '</div>' });
  }
  var markers = pins.map(function (p) { return L.marker([p.lat, p.lng], { icon: icon(p) }).addTo(map); });
  if (pins.length > 1) map.fitBounds(L.latLngBounds(pins.map(function (p) { return [p.lat, p.lng]; })), { padding: [40, 40], maxZoom: 15 });
  if (pick) {
    map.on('click', function (e) {
      var lat = Math.round(e.latlng.lat * 1e6) / 1e6;
      var lng = Math.round(e.latlng.lng * 1e6) / 1e6;
      if (markers[0]) markers[0].setLatLng([lat, lng]);
      else markers[0] = L.marker([lat, lng], { icon: icon({ label: 'Here' }) }).addTo(map);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
    });
  }
})();
</script>
</body>
</html>`;
}
