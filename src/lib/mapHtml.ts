// Carte Leaflet (OpenStreetMap) rendue dans une WebView. Les messages
// renvoyés à l'app via postMessage sont préfixés :
//   "spot:<id>"  → ouvrir la fiche du spot
//   "expand"     → appui sur le fond de carte (ouvrir la carte en grand)
//   "arrive"     → un trait vient d'atteindre son spot (retour haptique)
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
    .leaflet-control-attribution { font-size: 9px; background: rgba(255,255,255,0.7) !important; color: rgba(6,46,69,0.7); }
    .zk-hidden { opacity: 0; }
    .zk-hidden.zk-pop { opacity: 1; }
    .zk-ring { position: relative; }
    .zk-ring::after { content: ''; position: absolute; inset: -2px; border-radius: 50%; border: 2px solid #0A6EA8; animation: zk-ring 0.6s ease-out both; }
    @keyframes zk-ring { from { transform: scale(1); opacity: 0.8; } to { transform: scale(2.6); opacity: 0; } }
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

    const map = L.map('map', { zoomControl: fullscreen, attributionControl: true, ...(loader ? { dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, zoomSnap: 0.1 } : {}) });
    // Mention obligatoire des données OpenStreetMap (licence ODbL), en texte
    // simple : un lien ouvrirait le site dans la WebView de la carte.
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

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

    // Ordre de départ des traits : du spot le plus proche au plus loin,
    // étalé sur ~1,3 s. Chaque spot reçoit un faisceau de traits qui partent
    // l'un après l'autre (décalage + léger aléa propre au spot).
    const RAY_STAGGER_TOTAL = 1300;
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
    // Aléa stable (même spot = même tirage) : de 0 à 1.
    function jitter(id, salt) {
      let h = 2166136261 ^ salt;
      for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
      return ((h >>> 0) % 1000) / 1000;
    }

    // Arc arrondi (Bézier cubique) du départ au spot. Le calcul se fait dans
    // un repère où la longitude est corrigée de la latitude, pour que la
    // courbe garde la même rondeur quelle que soit la direction ; bend règle
    // le creux (négatif = de l'autre côté). Le dernier point est exactement
    // le spot.
    const ARC_STEPS = 64;
    function arc(a, b, bend) {
      const k = Math.cos((a[0] * Math.PI) / 180);
      const ax = a[1] * k, ay = a[0], bx = b[1] * k, by = b[0];
      const dx = bx - ax, dy = by - ay;
      const nx = -dy * bend, ny = dx * bend;
      const c1 = [ax + dx / 3 + nx, ay + dy / 3 + ny];
      const c2 = [ax + (2 * dx) / 3 + nx, ay + (2 * dy) / 3 + ny];
      const pts = [];
      for (let i = 0; i <= ARC_STEPS; i++) {
        const t = i / ARC_STEPS, u = 1 - t;
        const x = u * u * u * ax + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * bx;
        const y = u * u * u * ay + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * by;
        pts.push([y, x / k]);
      }
      pts[ARC_STEPS] = [b[0], b[1]];
      return pts;
    }
    // Portion du trait déjà tracée (k de 0 à 1), avec un point intermédiaire
    // interpolé pour une progression continue.
    function partial(pts, k) {
      const pos = k * (pts.length - 1);
      const i = Math.floor(pos);
      const out = pts.slice(0, i + 1);
      if (i < pts.length - 1) {
        const f = pos - i, p = pts[i], q = pts[i + 1];
        out.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]);
      }
      return out;
    }
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // Marqueurs des spots, dont le point est révélé à l'arrivée du premier
    // trait (l'élément n'existe qu'une fois la carte cadrée).
    const dotMarkers = {};

    function playIntro() {
      const all = markers.map((m) => [m.lat, m.lon]).concat([[origin.lat, origin.lon]]);
      // Zoom au dixième (zoomSnap) : les spots remplissent l'écran au plus juste.
      const frameAll = () => map.fitBounds(all, { padding: [32, 32], animate: false });
      map.invalidateSize();
      frameAll();
      // La WebView peut prendre sa taille définitive après coup : on recadre,
      // les traits suivent car ils sont posés en coordonnées géographiques.
      map.on('resize', frameAll);

      L.marker([origin.lat, origin.lon], {
        icon: L.divIcon({ className: '', html: '<div class="zk-origin zk-pop"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
      }).addTo(map);

      // Plusieurs traits par spot, de courbures, épaisseurs et départs
      // différents : un faisceau plutôt qu'un fil unique. Le premier trait
      // (le plus marqué) est celui qui « allume » le spot.
      const STRANDS = [
        { bend: 0.2, weight: 2, opacity: 0.9, lag: 0 },
        { bend: 0.1, weight: 1.3, opacity: 0.6, lag: 110 },
        { bend: 0.3, weight: 1.1, opacity: 0.45, lag: 210 },
        { bend: -0.08, weight: 0.9, opacity: 0.35, lag: 320 },
      ];
      const rays = [];
      let end = 0;
      markers.forEach((m) => {
        const d = Math.sqrt(dist2(m));
        STRANDS.forEach((st, si) => {
          const pts = arc([origin.lat, origin.lon], [m.lat, m.lon], st.bend + (jitter(m.id, si) - 0.5) * 0.08);
          const line = L.polyline([pts[0]], {
            color: '#0A6EA8', weight: st.weight, opacity: st.opacity, interactive: false,
            lineCap: 'round', lineJoin: 'round', smoothFactor: 0, noClip: true,
          }).addTo(map);
          // Les traits vers les spots lointains durent un peu plus longtemps.
          const draw = 620 + Math.min(260, d * 140) + jitter(m.id, si + 7) * 80;
          const start = rayStart(m) + st.lag + jitter(m.id, si + 3) * 60;
          rays.push({ line, pts, start, draw, lead: si === 0, id: m.id, done: false });
          end = Math.max(end, start + draw);
        });
      });

      // Animation image par image (requestAnimationFrame) plutôt qu'en CSS :
      // plus fiable dans les WebView. Chaque trait part en douceur,
      // accélère puis ralentit en arrivant sur son spot.
      const t0 = performance.now();
      function frame(now) {
        const t = now - t0;
        rays.forEach((r) => {
          if (r.done) return;
          const k = Math.min(1, Math.max(0, (t - r.start) / r.draw));
          if (k <= 0) return;
          r.line.setLatLngs(partial(r.pts, easeInOut(k)));
          if (k >= 1) {
            r.done = true;
            if (r.lead) {
              const el = dotMarkers[r.id] && dotMarkers[r.id].getElement();
              if (el && el.firstChild) el.firstChild.classList.add('zk-pop', 'zk-ring');
              post('arrive');
            }
          }
        });
        if (t < end + 50) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      // Les traits restent affichés : c'est l'app qui fait disparaître
      // l'écran de chargement en fondu.
      setTimeout(() => post('introDone'), end + 350);
    }

    // Animation de l'écran de chargement : les points n'apparaissent qu'à
    // l'arrivée de leur trait.
    const intro = loader && origin && markers.length > 0;

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="zk-dot' + (intro ? ' zk-hidden' : '') + '" style="background:' + m.color + '"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([m.lat, m.lon], { icon }).addTo(map);
      if (intro) dotMarkers[m.id] = marker;
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
      // Une image d'attente : la carte connaît sa taille avant de démarrer.
      requestAnimationFrame(playIntro);
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
