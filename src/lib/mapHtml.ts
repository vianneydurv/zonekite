// Carte Leaflet (OpenStreetMap) rendue dans une WebView. Les messages
// renvoyés à l'app via postMessage sont préfixés :
//   "spot:<id>"  → ouvrir la fiche du spot
//   "expand"     → appui sur le fond de carte (ouvrir la carte en grand)

export interface MapMarker {
  id: string;
  nom: string;
  lat: number;
  lon: number;
  color: string;
  // Affichés dans la bulle de la carte plein écran.
  verdict?: string;
  window?: string;
}

interface Options {
  // Carte plein écran : zoom +/-, bulle par spot avec lien vers la fiche.
  // Sinon (aperçu) : appui sur un point = fiche, appui ailleurs = "expand".
  fullscreen?: boolean;
  zoom?: number;
  // Spots sur lesquels cadrer la vue initiale (tous si absent).
  fitIds?: string[];
}

export function spotsMapHtml(markers: MapMarker[], { fullscreen = false, zoom = 12, fitIds }: Options = {}) {
  // Les données passent en JSON (et les textes via textContent côté page) :
  // pas d'injection HTML possible depuis un nom de spot.
  const data = JSON.stringify(markers);
  const fit = JSON.stringify(fitIds ?? null);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, Roboto, sans-serif; }
    .zk-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.45); }
    .zk-popup-title { font-weight: 700; font-size: 14px; color: #062E45; }
    .zk-popup-verdict { font-weight: 700; font-size: 11px; letter-spacing: 0.4px; margin-top: 4px; }
    .zk-popup-window { font-size: 12px; color: rgba(6,46,69,0.6); margin-top: 1px; }
    .zk-popup-link { display: block; margin-top: 8px; font-weight: 700; font-size: 12px; color: #0A6EA8; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const markers = ${data};
    const fitIds = ${fit};
    const fullscreen = ${fullscreen};
    const post = (msg) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(msg);

    const map = L.map('map', { zoomControl: fullscreen, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    function popupContent(m) {
      const root = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'zk-popup-title';
      title.textContent = m.nom;
      root.appendChild(title);
      if (m.verdict) {
        const verdict = document.createElement('div');
        verdict.className = 'zk-popup-verdict';
        verdict.style.color = m.color;
        verdict.textContent = m.verdict;
        root.appendChild(verdict);
      }
      if (m.window) {
        const win = document.createElement('div');
        win.className = 'zk-popup-window';
        win.textContent = m.window;
        root.appendChild(win);
      }
      const link = document.createElement('a');
      link.className = 'zk-popup-link';
      link.textContent = 'Voir la fiche →';
      link.onclick = () => post('spot:' + m.id);
      root.appendChild(link);
      return root;
    }

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="zk-dot" style="background:' + m.color + '"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([m.lat, m.lon], { icon }).addTo(map);
      if (fullscreen) {
        marker.bindPopup(() => popupContent(m));
      } else {
        marker.on('click', () => post('spot:' + m.id));
      }
    });

    if (!fullscreen) {
      map.on('click', () => post('expand'));
    }

    const framed = fitIds ? markers.filter((m) => fitIds.includes(m.id)) : markers;
    if (fullscreen && framed.length > 1) {
      map.fitBounds(framed.map((m) => [m.lat, m.lon]), { padding: [40, 40] });
    } else if (framed.length > 0) {
      map.setView([framed[0].lat, framed[0].lon], ${zoom});
    } else {
      map.setView([46.6, -1.5], 5);
    }

    window.zonekiteFlyTo = function (lat, lon) {
      map.flyTo([lat, lon], ${zoom}, { duration: 0.6 });
    };
  </script>
</body>
</html>`;
}
