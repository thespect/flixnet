// Servicio Inteligente de Detección Automática de Links, Streams HLS Nativos (.m3u8 en Español Latino 4K)
// Extrae streams .m3u8 directos en Español Latino (LAT), Castellano (ESP) e Inglés 4K sin anuncios ni iframes,
// 100% compatibles con Chromecast, AirPlay 2 y Reproductor HTML5 Nativo en Celular, Tablet y PC.

const VIDRACK_API = 'https://vidrack.created.app/api/sources';
const VIDRACK_PROXY = 'https://colourful-orange-pl68dlfc.edgeone.dev/px.php';
const SUB_HOSTS = {
  movie: 'https://sub.vdrk.site',
  tv: 'https://cache.vdrk.site'
};
const SUB_CORS_PROXY = 'https://little-field-fe85.instafashion662-3d4.workers.dev/?url=';

const HLS_PROVIDERS = [
  { id: 'vidora', label: '🇺🇸 Nodo 4K Master (Audio Original)', endpoint: 'vidora', alreadyProxied: true },
  { id: 'nova', label: '🇺🇸 Nodo Nova 4K (Audio Original)', endpoint: 'nova', alreadyProxied: false },
  { id: 'movy', label: '🇺🇸 Nodo Movy Pro (Audio Original)', endpoint: 'movy', alreadyProxied: false }
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
  if (
    rawUrl.indexOf(VIDRACK_PROXY) === 0 ||
    rawUrl.indexOf('vidrack.created.app/proxy') !== -1 ||
    rawUrl.indexOf('acek-cdn.com') !== -1 ||
    rawUrl.indexOf('dramiyos-cdn.com') !== -1
  ) {
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 4800) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Convierte SRT a WebVTT para soporte nativo en <video> y AirPlay / Chromecast
export function srtToVtt(srtText) {
  if (!srtText) return 'WEBVTT\n\n';
  if (/^\s*WEBVTT/.test(srtText)) return srtText;
  return (
    'WEBVTT\n\n' +
    srtText
      .replace(/\r/g, '')
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
  );
}

export const StreamScannerService = {
  /**
   * Extrae streams HLS (.m3u8) directos internacionales de respaldo
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
              lang: 'en',
              isLatinoDub: false,
              isCastellanoDub: false,
              quality: qLabel,
              ping: `${ping}ms`,
              isDirectHls: true,
              castCompatible: true,
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
   * Descarga y convierte un archivo de subtítulos en Blob URL VTT local
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
   * Escaneo integral automático:
   * 1. Extrae streams HLS (.m3u8) directos en 🇲🇽 Español Latino (LAT) y 🇪🇸 Castellano (ESP) desde el backend
   * 2. Los coloca en la posición #1 para que el reproductor nativo 4K y Chromecast / AirPlay transmitan en Español Latino real
   * 3. Agrega los nodos HLS 4K originales + subtítulos en Español Latino como respaldo
   */
  async scanAllWorkingLinks(movie, season = 1, episode = 1, imdbId = null) {
    if (!movie?.id) return null;
    const isTv = Boolean(movie.isTv);
    const cacheKey = `${movie.id}_${isTv ? `tv_${season}_${episode}` : 'movie'}`;

    if (scanCache.has(cacheKey)) {
      return scanCache.get(cacheKey);
    }

    const startTime = performance.now();

    const [hlsResult, subtitles, backendScan] = await Promise.all([
      this.fetchDirectHlsStreams(movie.id, isTv, season, episode),
      this.fetchSubtitles(movie.id, isTv, season, episode),
      this.fetchBackendVerification(movie.id, isTv, season, episode, imdbId || movie.imdb_id)
    ]);

    if (backendScan?.lanIp && typeof window !== 'undefined') {
      window.__CINEFLEX_LAN_IP__ = backendScan.lanIp;
    }

    // Unir primero los streams HLS directos en Español Latino (LAT) y Castellano (ESP), y luego los internacionales
    const latinoDirect = Array.isArray(backendScan?.latinoDirectStreams)
      ? backendScan.latinoDirectStreams
      : [];
    const combinedDirectStreams = [
      ...latinoDirect,
      ...(hlsResult.streams || [])
    ];

    const result = {
      tmdbId: movie.id,
      imdbId: backendScan?.imdbId || imdbId || movie.imdb_id || null,
      lanIp: backendScan?.lanIp || null,
      isTv,
      season,
      episode,
      directHlsStreams: combinedDirectStreams,
      latinoDirectStreams: latinoDirect,
      subtitles: subtitles || [],
      latinoSources: backendScan?.latinoSources || [],
      hasConfirmedLatinoDub:
        latinoDirect.some((s) => s.isLatinoDub) || (backendScan?.latinoSources?.length || 0) > 0,
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

    const endpoints = [
      `/api/scan-streams?${params.toString()}`,
      `./api.php?action=scan&${params.toString()}`
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetchWithTimeout(ep, { headers: { Accept: 'application/json' } }, 5500);
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
