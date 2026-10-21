// Carte Leaflet (OpenStreetMap) rendue dans une WebView. Les messages
// renvoyés à l'app via postMessage sont préfixés :
//   "spot:<id>"  → ouvrir la fiche du spot
//   "expand"     → appui sur le fond de carte (ouvrir la carte en grand)
//   "introDone"  → fin de l'animation de l'écran de chargement

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
  // Écran de chargement de la recherche : carte plein écran, traits tracés
  // du point de départ (origin) vers chaque spot, puis message "introDone"
  // envoyé à l'app pour qu'elle ferme l'écran.
  loader?: boolean;
  origin?: { lat: number; lon: number } | null;
}

export function spotsMapHtml(
  markers: MapMarker[],
  { fullscreen = false, zoom = 12, fitIds, loader = false, origin }: Options = {}
) {
  // Les données passent en JSON (et les textes via textContent côté page) :
  // pas d'injection HTML possible depuis un nom de spot.
  const data = JSON.stringify(markers);
  const fit = JSON.stringify(fitIds ?? null);
  const start = JSON.stringify(origin ?? null);

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
    .zk-pop { animation: zk-pop 0.28s cubic-bezier(.2,1.6,.4,1) both; }
    @keyframes zk-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .zk-origin { width: 12px; height: 12px; border-radius: 50%; background: #062E45; border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(10,110,168,0.25); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const markers = ${data};
    const fitIds = ${fit};
    const origin = ${start};
    const fullscreen = ${fullscreen};
    const loader = ${loader};
    const post = (msg) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(msg);

    const map = L.map('map', { zoomControl: fullscreen, attributionControl: false, ...(loader ? { dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, zoomSnap: 0.1 } : {}) });
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

    // Ordre d'arrivée des traits : du spot le plus proche au plus loin, sur
    // ~1,1 s au total, chaque trait se dessinant en 0,48 s.
    const RAY_STAGGER_TOTAL = 1100;
    const RAY_DRAW = 480;
    const order = origin
      ? markers.slice().sort((a, b) => dist2(a) - dist2(b)).map((m) => m.id)
      : [];
    function dist2(m) {
      return (m.lat - origin.lat) ** 2 + (m.lon - origin.lon) ** 2;
    }
    function rayStart(m) {
      const i = order.indexOf(m.id);
      return order.length > 1 ? Math.round((i / (order.length - 1)) * RAY_STAGGER_TOTAL) : 0;
    }
    function rayDelay(m) {
      return rayStart(m) + RAY_DRAW - 60;
    }

    // Arc courbé (Bézier quadratique) entre le départ et le spot ; bend
    // règle la courbure (négatif = de l'autre côté).
    function arc(a, b, bend) {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const c = [mx - dy * bend, my + dx * bend];
      const pts = [];
      for (let t = 0; t <= 1.0001; t += 1 / 24) {
        const u = 1 - t;
        pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
      }
      return pts;
    }

    function playIntro() {
      const all = markers.map((m) => [m.lat, m.lon]).concat([[origin.lat, origin.lon]]);
      // Zoom au dixième (zoomSnap) : les spots remplissent l'écran au plus juste.
      map.fitBounds(all, { padding: [28, 28], animate: false });

      L.marker([origin.lat, origin.lon], {
        icon: L.divIcon({ className: '', html: '<div class="zk-origin zk-pop"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
      }).addTo(map);

      // Plusieurs traits par spot, de courbures, épaisseurs et départs
      // légèrement différents : un faisceau plutôt qu'un fil unique.
      const STRANDS = [
        { bend: 0.18, weight: 1.6, opacity: 0.85, lag: 0 },
        { bend: -0.12, weight: 1.1, opacity: 0.6, lag: 70 },
        { bend: 0.34, weight: 0.9, opacity: 0.45, lag: 130 },
        { bend: 0.05, weight: 0.8, opacity: 0.35, lag: 190 },
      ];
      const rays = [];
      markers.forEach((m) => {
        STRANDS.forEach((st) => {
          const line = L.polyline(arc([origin.lat, origin.lon], [m.lat, m.lon], st.bend), {
            color: '#0A6EA8', weight: st.weight, opacity: st.opacity, interactive: false,
          }).addTo(map);
          const path = line.getElement();
          const len = path.getTotalLength();
          path.style.strokeDasharray = len + ' ' + len;
          path.style.strokeDashoffset = len;
          rays.push({ path, len, start: rayStart(m) + st.lag - 60, opacity: st.opacity });
        });
      });

      const end = RAY_STAGGER_TOTAL + RAY_DRAW + 250;
      // Animation image par image (requestAnimationFrame) plutôt qu'en CSS :
      // plus fiable dans les WebView. Chaque trait se dessine (ease-out).
      const t0 = performance.now();
      function frame(now) {
        const t = now - t0;
        rays.forEach((r) => {
          const k = Math.min(1, Math.max(0, (t - r.start) / RAY_DRAW));
          r.path.style.strokeDashoffset = r.len * Math.pow(1 - k, 3);
        });
        if (t < end) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      // Les traits restent affichés : c'est l'app qui fait disparaître
      // l'écran de chargement en fondu.
      setTimeout(() => post('introDone'), end + 100);
    }

    // Animation de l'écran de chargement : les points n'apparaissent qu'à
    // l'arrivée de leur trait.
    const intro = loader && origin && markers.length > 0;

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="zk-dot' + (intro ? ' zk-pop' : '') + '" style="background:' + m.color
          + (intro ? ';animation-delay:' + rayDelay(m) + 'ms' : '') + '"></div>',
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
    if (intro) {
      playIntro();
    } else if (fullscreen && framed.length > 1) {
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
