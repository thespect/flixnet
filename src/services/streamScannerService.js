// Servicio Inteligente de Detección Automática de Links, Streams HLS Nativos (0% Anuncios) y Audio Español Latino
// Verifica en paralelo qué servidores tienen la película/serie activa, extrae streams HLS (.m3u8) directos
// sin iframes ni redirecciones, y carga subtítulos y pistas en Español Latino automáticamente.

const VIDRACK_API = 'https://vidrack.created.app/api/sources';
const VIDRACK_PROXY = 'https://colourful-orange-pl68dlfc.edgeone.dev/px.php';
const SUB_HOSTS = {
  movie: 'https://sub.vdrk.site',
  tv: 'https://cache.vdrk.site'
};
const SUB_CORS_PROXY = 'https://little-field-fe85.instafashion662-3d4.workers.dev/?url=';

const HLS_PROVIDERS = [
  { id: 'vidora', label: 'Nodo 1 • Ultra CDN (Directo)', endpoint: 'vidora', alreadyProxied: true },
  { id: 'nova', label: 'Nodo 2 • Nova 4K (Directo)', endpoint: 'nova', alreadyProxied: false },
  { id: 'movy', label: 'Nodo 3 • Movy Pro (Directo)', endpoint: 'movy', alreadyProxied: false }
];

const scanCache = new Map();

function b64Encode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return '';
  }
}

export function wrapWithStreamProxy(rawUrl, headers) {
  if (!rawUrl) return '';
  if (rawUrl.indexOf(VIDRACK_PROXY) === 0 || rawUrl.indexOf('vidrack.created.app/proxy') !== -1) {
    return rawUrl;
  }
  const params = [];
  params.push('play=' + encodeURIComponent(rawUrl));
  if (headers && (headers.Origin || headers.Referer)) {
    let data = '';
    if (headers.Origin) data += 'Origin=' + headers.Origin;
    if (headers.Referer) data += (data ? '|' : '') + 'Referer=' + headers.Referer;
    params.push('data=' + encodeURIComponent(b64Encode(data)));
  }
  params.push('type=' + encodeURIComponent('/index.m3u8'));
  return `${VIDRACK_PROXY}?${params.join('&')}`;
}

function isDeadStream(url, quality) {
  if (!url) return true;
  if (url.indexOf('sun.paleoak.top') !== -1 && /1080/i.test(quality || '')) return true;
  return false;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Convierte SRT a WebVTT para soporte nativo en <video>
export function srtToVtt(srtText) {
  if (!srtText) return 'WEBVTT\n\n';
  if (/^\s*WEBVTT/.test(srtText)) return srtText;
  return 'WEBVTT\n\n' + srtText
    .replace(/\r/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
}

export const StreamScannerService = {
  /**
   * Extrae streams HLS (.m3u8) directos para reproducir la película o serie real
   * en el reproductor HTML5 nativo con 0% anuncios, 0% popups y 0% iframes.
   */
  async fetchDirectHlsStreams(tmdbId, isTv = false, season = 1, episode = 1) {
    const query = isTv
      ? `id=${tmdbId}&type=tv&season=${season}&episode=${episode}`
      : `id=${tmdbId}&type=movie`;

    const startTime = performance.now();

    const tasks = HLS_PROVIDERS.map(async (provider) => {
      const t0 = performance.now();
      try {
        const res = await fetchWithTimeout(`${VIDRACK_API}/${provider.endpoint}?${query}`, {}, 5000);
        if (!res.ok) return [];
        const data = await res.json();
        const ping = Math.max(8, Math.round(performance.now() - t0));

        if (!data || !Array.isArray(data.sources)) return [];

        return data.sources
          .filter((st) => {
            if (!st || !st.url) return false;
            if (isDeadStream(st.url, st.quality)) return false;
            if (provider.id === 'vidora' && st.url.indexOf('netoda.tech') === -1) return false;
            return true;
          })
          .map((st, idx) => {
            const finalUrl = provider.alreadyProxied
              ? st.url
              : wrapWithStreamProxy(st.url, st.headers);

            const qLabel = st.quality && st.quality !== 'Auto' ? st.quality : '4K / 1080p Adaptativo';
            return {
              id: `hls_${provider.id}_${idx}`,
              name: `${provider.label}${idx > 0 ? ` #${idx + 1}` : ''}`,
              providerId: provider.id,
              url: finalUrl,
              rawUrl: st.url,
              type: (st.type || 'hls').toLowerCase(),
              quality: qLabel,
              ping: `${ping}ms`,
              isDirectHls: true,
              verified: true
            };
          });
      } catch {
        return [];
      }
    });

    const settled = await Promise.allSettled(tasks);
    const allStreams = [];
    const seenUrls = new Set();

    settled.forEach((r) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        for (const item of r.value) {
          if (item.url && !seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allStreams.push(item);
          }
        }
      }
    });

    // Priorizar 1080p/4K directos y menor latencia
    allStreams.sort((a, b) => {
      const score = (q) => {
        const s = String(q || '').toLowerCase();
        if (s.includes('2160') || s.includes('4k')) return 1;
        if (s.includes('1080')) return 2;
        if (s.includes('auto')) return 3;
        return 4;
      };
      return score(a.quality) - score(b.quality);
    });

    return {
      streams: allStreams,
      scanTimeMs: Math.round(performance.now() - startTime)
    };
  },

  /**
   * Obtiene subtítulos verificados priorizando Español Latino y Español España
   */
  async fetchSubtitles(tmdbId, isTv = false, season = 1, episode = 1) {
    const type = isTv ? 'tv' : 'movie';
    const path = isTv ? `/tv/${tmdbId}/${season}/${episode}` : `/movie/${tmdbId}`;
    const host = SUB_HOSTS[type];

    const fetchList = async (url) => {
      const urlsToTry = [url, `${SUB_CORS_PROXY}${encodeURIComponent(url)}`];
      for (const u of urlsToTry) {
        try {
          const res = await fetchWithTimeout(u, {}, 4000);
          if (!res.ok) continue;
          const json = await res.json();
          if (Array.isArray(json)) return json;
        } catch {}
      }
      return [];
    };

    try {
      const [v2, v1] = await Promise.all([
        fetchList(`${host}/v2${path}`),
        fetchList(`${host}/v1${path}`)
      ]);

      const merged = new Map();
      for (const s of [...v2, ...v1]) {
        if (!s || !s.label || !s.file) continue;
        const key = String(s.label).toLowerCase();
        if (!merged.has(key)) {
          const isSpanish = /spanish|español|latino|castellano|es\b/i.test(s.label);
          const isLatino = /latin|méxico|mexico|latam/i.test(s.label);
          merged.set(key, {
            label: isLatino
              ? '🇲🇽 Español Latino Oficial'
              : isSpanish
              ? `🇪🇸 ${s.label.replace(/Spanish\s*-\s*/i, 'Español • ')}`
              : s.label,
            rawLabel: s.label,
            url: s.file,
            isSpanish,
            isLatino
          });
        }
      }

      const list = [...merged.values()];
      // Ordenar poniendo Español Latino primero, luego Español, luego el resto
      list.sort((a, b) => {
        if (a.isLatino !== b.isLatino) return a.isLatino ? -1 : 1;
        if (a.isSpanish !== b.isSpanish) return a.isSpanish ? -1 : 1;
        return a.label.localeCompare(b.label);
      });

      return list;
    } catch {
      return [];
    }
  },

  /**
   * Descarga y convierte un archivo de subtítulos en Blob URL VTT local para evitar bloqueos CORS en <track>
   */
  async resolveSubtitleBlobUrl(subUrl) {
    const candidates = [
      subUrl,
      `${SUB_CORS_PROXY}${encodeURIComponent(subUrl)}`,
      `${VIDRACK_PROXY}?play=${encodeURIComponent(subUrl)}`
    ];
    for (const u of candidates) {
      try {
        const res = await fetchWithTimeout(u, {}, 4000);
        if (!res.ok) continue;
        const text = await res.text();
        if (/^\s*(WEBVTT|\d)/i.test(text)) {
          const vtt = srtToVtt(text);
          return URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
        }
      } catch {}
    }
    return null;
  },

  /**
   * Escaneo integral automático: combina el backend local (/api/scan-streams si está activo)
   * con el escáner directo HLS y verifica qué servidores funcionan para esta película/serie.
   */
  async scanAllWorkingLinks(movie, season = 1, episode = 1, imdbId = null) {
    if (!movie?.id) return null;
    const isTv = Boolean(movie.isTv);
    const cacheKey = `${movie.id}_${isTv ? `tv_${season}_${episode}` : 'movie'}`;

    if (scanCache.has(cacheKey)) {
      return scanCache.get(cacheKey);
    }

    const startTime = performance.now();

    // Ejecutar en paralelo:
    // 1. Extracción de streams HLS directos (.m3u8) 0% anuncios
    // 2. Subtítulos en Español Latino
    // 3. Escaneo de backend local (Vite middleware / PHP) para verificar PlayLatinSRC (Español Latino Doblado) y servidores embed
    const [hlsResult, subtitles, backendScan] = await Promise.all([
      this.fetchDirectHlsStreams(movie.id, isTv, season, episode),
      this.fetchSubtitles(movie.id, isTv, season, episode),
      this.fetchBackendVerification(movie.id, isTv, season, episode, imdbId)
    ]);

    const result = {
      tmdbId: movie.id,
      imdbId: backendScan?.imdbId || imdbId || movie.imdb_id || null,
      isTv,
      season,
      episode,
      directHlsStreams: hlsResult.streams || [],
      subtitles: subtitles || [],
      latinoSources: backendScan?.latinoSources || [],
      hasConfirmedLatinoDub: (backendScan?.latinoSources?.length || 0) > 0,
      serverStatuses: backendScan?.serverStatuses || {},
      scanDurationMs: Math.round(performance.now() - startTime),
      timestamp: Date.now()
    };

    scanCache.set(cacheKey, result);
    return result;
  },

  async fetchBackendVerification(tmdbId, isTv, season, episode, imdbId) {
    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      isTv: isTv ? '1' : '0',
      season: String(season),
      episode: String(episode),
      ...(imdbId ? { imdbId } : {})
    });

    // Intentar primero el middleware de Vite (/api/scan-streams) y luego api.php (XAMPP)
    const endpoints = [
      `/api/scan-streams?${params.toString()}`,
      `./api.php?action=scan&${params.toString()}`
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetchWithTimeout(ep, { headers: { Accept: 'application/json' } }, 3800);
        if (!res.ok) continue;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('json')) continue;
        const data = await res.json();
        if (data && data.ok) return data;
      } catch {}
    }
    return null;
  }
};

