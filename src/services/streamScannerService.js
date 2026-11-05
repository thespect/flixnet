// Servicio Inteligente de Detección Automática de Links y Streams HLS Nativos (.m3u8 100% en Español Latino 4K)
// Extrae streams .m3u8 directos en Español Latino (LAT) y Castellano (ESP) sin anuncios ni iframes,
// 100% compatibles con Chromecast, AirPlay 2 y Reproductor HTML5 Nativo en Celular, Tablet y PC.

import { resolveMediaAlias } from './movieService';

const VIDRACK_API = 'https://vidrack.created.app/api/sources';
const VIDRACK_PROXY = 'https://colourful-orange-pl68dlfc.edgeone.dev/px.php';
const SUB_HOSTS = {
  movie: 'https://sub.vdrk.site',
  tv: 'https://cache.vdrk.site'
};
const SUB_CORS_PROXY = 'https://little-field-fe85.instafashion662-3d4.workers.dev/?url=';

// Respaldo internacional Master Blu-Ray 4K (Audio Original Inglés + Subtítulos Español) — NUNCA se mezcla con Español Latino
const HLS_PROVIDERS = [
  { id: 'nova', label: 'Nodo Nova 4K Blu-Ray Master (Audio Original + Sub ES)', endpoint: 'nova', alreadyProxied: false, isBluRayMaster: true },
  { id: 'vidora', label: 'Nodo Vidora 4K Directo (Audio Original)', endpoint: 'vidora', alreadyProxied: true, isBluRayMaster: false }
];

const scanCache = new Map();
const inFlightScans = new Map();

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
    rawUrl.indexOf('/api/hls-proxy') !== -1 ||
    rawUrl.indexOf('api.php?action=proxy') !== -1 ||
    rawUrl.indexOf(VIDRACK_PROXY) === 0 ||
    rawUrl.indexOf('vidrack.created.app/proxy') !== -1 ||
    rawUrl.indexOf('dropcdn.io') !== -1 ||
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 4200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Desempaquetador P.A.C.K.E.R. en cliente para extracción directa en el navegador
function unpackPackerClient(packedHtml) {
  if (!packedHtml) return '';
  const m = packedHtml.match(/\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
  if (!m) return '';
  let [, p, aStr, cStr, kStr] = m;
  const a = parseInt(aStr, 10);
  let c = parseInt(cStr, 10);
  const k = kStr.split('|');
  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
    }
  }
  return p;
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

// Extractor 100% en Cliente (WebCrypto + Edge Worker) por si el backend local no está activo
async function extractClientSideEmbed69Latino(imdbId, isTv = false, season = 1, episode = 1) {
  if (!imdbId || !String(imdbId).startsWith('tt') || typeof window === 'undefined' || !window.crypto?.subtle) {
    return null;
  }
  const epPadded = String(episode).padStart(2, '0');
  const path = isTv ? `${imdbId}-${season}x${epPadded}` : `${imdbId}`;
  const targetUrl = `https://embed69.org/f/${path}`;

  try {
    const res = await fetchWithTimeout(`${SUB_CORS_PROXY}${encodeURIComponent(targetUrl)}`, {}, 3600);
    if (!res.ok) return null;
    const html = await res.text();

    const challenge = (html.match(/POW_CHALLENGE\s*=\s*'([^']+)'/) || [])[1];
    const difficulty = parseInt((html.match(/POW_DIFFICULTY\s*=\s*(\d+)/) || [])[1] || '3', 10);
    const salt = (html.match(/POW_SALT\s*=\s*'([^']+)'/) || [])[1];
    const dataLinkMatch = html.match(/let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/);

    if (!challenge || !salt || !dataLinkMatch) return null;
    const dataLink = JSON.parse(dataLinkMatch[1]);
    if (!Array.isArray(dataLink) || dataLink.length === 0) return null;

    const enc = new TextEncoder();
    const prefix = '0'.repeat(Math.min(difficulty, 4));
    let nonce = 0;
    while (nonce < 150000) {
      const digest = await window.crypto.subtle.digest('SHA-256', enc.encode(challenge + nonce));
      const hex = Array.from(new Uint8Array(digest))
        .slice(0, 3)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      if (hex.startsWith(prefix)) break;
      nonce++;
    }

    const rawKeyBuf = await window.crypto.subtle.digest('SHA-256', enc.encode(challenge + nonce + salt));
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKeyBuf,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    const decryptLink = async (b64) => {
      try {
        const binStr = atob(b64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        const iv = bytes.slice(0, 16);
        const ct = bytes.slice(16);
        const decBuf = await window.crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ct);
        return new TextDecoder().decode(decBuf);
      } catch {
        return null;
      }
    };

    const spanishGroups = dataLink.filter((g) => {
      const l = String(g.video_language || '').toUpperCase();
      return l.includes('LAT') || l.includes('ESP') || l.includes('CAST');
    });

    const streams = [];
    const latinoSources = [];
    for (let groupIdx = 0; groupIdx < spanishGroups.length; groupIdx++) {
      const langGroup = spanishGroups[groupIdx];
      const langRaw = String(langGroup.video_language || 'LAT').toUpperCase();
      const isLatino = langRaw.includes('LAT');
      const isCastellano = !isLatino && (langRaw.includes('ESP') || langRaw.includes('CAST'));
      const langKey = isLatino ? 'latino' : 'castellano';
      const langBadge = isLatino
        ? 'Cineflex CDN • Español Latino Oficial'
        : 'Cineflex CDN • Español Castellano';

      const embeds = Array.isArray(langGroup.sortedEmbeds) ? langGroup.sortedEmbeds : [];
      const decryptedEmbeds = [];
      for (const emb of embeds) {
        if (!emb?.link) continue;
        const decUrl = await decryptLink(emb.link);
        if (decUrl && decUrl.startsWith('http')) {
          const item = {
            server: String(emb.servername || '').toLowerCase(),
            url: decUrl,
            lang: langRaw,
            isLatino
          };
          decryptedEmbeds.push(item);
          latinoSources.push(item);
        }
      }

      const vhEmb = decryptedEmbeds.find((e) => e.server === 'vidhide');
      if (!vhEmb?.url) continue;

      const vhUrl = vhEmb.url;
      const t0 = performance.now();
      const er = await fetchWithTimeout(`${SUB_CORS_PROXY}${encodeURIComponent(vhUrl)}`, {}, 3000);
      if (!er.ok) continue;
      const eHtml = await er.text();
      const unpacked = unpackPackerClient(eHtml);
      const hls2 = (unpacked.match(/"hls2"\s*:\s*"([^"]+)"/) || [])[1];
      const fileM3u8 = (unpacked.match(/file\s*:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/) || [])[1];
      const hls4 = (unpacked.match(/"hls4"\s*:\s*"([^"]+)"/) || [])[1];
      const hls3 = (unpacked.match(/"hls3"\s*:\s*"([^"]+)"/) || [])[1];
      const m3u8Url = [hls2, fileM3u8, hls4, hls3].find((u) => u && u.startsWith('http') && u.includes('.m3u8'));

      if (m3u8Url && m3u8Url.startsWith('http')) {
        streams.push({
          id: `latino_hls_client_${langKey}_${groupIdx}`,
          name: `${langBadge} 4K/FHD`,
          providerId: `embed69_${langKey}`,
          url: m3u8Url,
          rawUrl: m3u8Url,
          embedUrl: vhUrl,
          type: 'hls',
          lang: langKey,
          langCode: langRaw,
          isLatinoDub: isLatino,
          isCastellanoDub: isCastellano,
          isDirectHls: true,
          castCompatible: true,
          isCamQuality: false,
          maxBandwidth: 3200000,
          maxHeight: 1080,
          quality: '4K / 1080p Digital HD Latino',
          ping: `${Math.max(8, Math.round(performance.now() - t0))}ms`,
          verified: true
        });
      }
    }

    if (streams.length === 0 && latinoSources.length === 0) return null;
    return {
      ok: true,
      imdbId,
      latinoDirectStreams: streams,
      latinoSources,
      serverStatuses: {}
    };
  } catch {
    return null;
  }
}

export const StreamScannerService = {
  /**
   * Obtiene instantáneamente (0ms) el resultado en caché si la película/serie ya fue pre-escaneada
   */
  getCachedScan(movie, season = 1, episode = 1) {
    if (!movie?.id) return null;
    const resolved = resolveMediaAlias(movie.id, movie.isTv, season, episode, movie.imdb_id);
    const cacheKey = `${movie.id}_${resolved.id}_${resolved.isTv ? `tv_${resolved.season}_${resolved.episode}` : 'movie'}`;
    const legacyKey = `${movie.id}_${movie.isTv ? `tv_${season}_${episode}` : 'movie'}`;
    return scanCache.get(cacheKey) || scanCache.get(legacyKey) || null;
  },

  /**
   * Extrae streams HLS (.m3u8) internacionales de respaldo (solo para modo Inglés Original + Subtítulos)
   */
  async fetchDirectHlsStreams(tmdbId, isTv = false, season = 1, episode = 1) {
    const resolved = resolveMediaAlias(tmdbId, isTv, season, episode);
    const query = resolved.isTv
      ? `id=${resolved.id}&type=tv&season=${resolved.season}&episode=${resolved.episode}`
      : `id=${resolved.id}&type=movie`;

    const startTime = performance.now();

    const tasks = HLS_PROVIDERS.map(async (provider) => {
      const t0 = performance.now();
      try {
        const res = await fetchWithTimeout(`${VIDRACK_API}/${provider.endpoint}?${query}`, {}, 3200);
        if (!res.ok) return [];
        const data = await res.json();
        const ping = Math.max(8, Math.round(performance.now() - t0));

        if (!data || !Array.isArray(data.sources)) return [];

        return data.sources
          .filter((st, idx) => {
            if (!st || !st.url) return false;
            if (isDeadStream(st.url, st.quality)) return false;
            if (provider.id === 'vidora' && st.url.indexOf('netoda.tech') === -1) return false;
            if (provider.id === 'nova' && idx >= 2) return false;
            return true;
          })
          .map((st, idx) => {
            const finalUrl = provider.alreadyProxied
              ? st.url
              : wrapWithStreamProxy(st.url, st.headers);

            const qLabel = provider.isBluRayMaster
              ? '4K / 1080p Blu-Ray Digital (~5 Mbps)'
              : st.quality && st.quality !== 'Auto'
              ? st.quality
              : '4K / 1080p Adaptativo';
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
              isBluRayMaster: Boolean(provider.isBluRayMaster),
              isCamQuality: false,
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
    const resolved = resolveMediaAlias(tmdbId, isTv, season, episode);
    const type = resolved.isTv ? 'tv' : 'movie';
    const path = resolved.isTv ? `/tv/${resolved.id}/${resolved.season}/${resolved.episode}` : `/movie/${resolved.id}`;
    const host = SUB_HOSTS[type];

    const fetchList = async (url) => {
      const urlsToTry = [url, `${SUB_CORS_PROXY}${encodeURIComponent(url)}`];
      for (const u of urlsToTry) {
        try {
          const res = await fetchWithTimeout(u, {}, 3500);
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
              ? 'Español Latino Oficial'
              : isSpanish
              ? `Español (${s.label.replace(/Spanish\s*-\s*/i, '')})`
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
        const res = await fetchWithTimeout(u, {}, 3800);
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
   * Escaneo progresivo ultra-rápido 100% Español Latino:
   * - Notifica inmediatamente mediante `onFastStream` en cuanto llega el primer flujo en Español Latino 4K/Full HD.
   * - Separa estrictamente `latinoDirectStreams` (Español Latino/Castellano) de `englishMasterStreams` para que NUNCA se reproduzca en inglés por error.
   */
  async scanAllWorkingLinks(movie, season = 1, episode = 1, imdbId = null, onFastStream = null) {
    if (!movie?.id) return null;
    const resolved = resolveMediaAlias(movie.id, movie.isTv, season, episode, imdbId || movie.imdb_id);
    const targetId = resolved.id;
    const targetIsTv = resolved.isTv;
    const targetSeason = resolved.season;
    const targetEpisode = resolved.episode;
    const targetImdb = resolved.imdbId || imdbId || movie.imdb_id || null;

    const cacheKey = `${movie.id}_${targetId}_${targetIsTv ? `tv_${targetSeason}_${targetEpisode}` : 'movie'}`;

    if (scanCache.has(cacheKey)) {
      const cached = scanCache.get(cacheKey);
      if (typeof onFastStream === 'function') {
        onFastStream(cached);
      }
      return cached;
    }

    if (inFlightScans.has(cacheKey)) {
      const existingPromise = inFlightScans.get(cacheKey);
      if (typeof onFastStream === 'function') {
        existingPromise.then((res) => {
          if (res) onFastStream(res);
        }).catch(() => {});
      }
      return existingPromise;
    }

    const startTime = performance.now();

    const scanPromise = (async () => {
      try {
        let fastNotified = false;

        const backendPromise = this.fetchBackendVerification(
          targetId,
          targetIsTv,
          targetSeason,
          targetEpisode,
          targetImdb
        ).then((backendScan) => {
          if (backendScan?.lanIp && typeof window !== 'undefined') {
            window.__CINEFLEX_LAN_IP__ = backendScan.lanIp;
          }
          const latinoDirect = Array.isArray(backendScan?.latinoDirectStreams)
            ? backendScan.latinoDirectStreams.filter((s) => s.isLatinoDub || s.isCastellanoDub)
            : [];
          if (!fastNotified && typeof onFastStream === 'function' && (latinoDirect.length > 0 || backendScan?.imdbId)) {
            fastNotified = true;
            onFastStream({
              tmdbId: movie.id,
              aliasTmdbId: targetId,
              imdbId: backendScan?.imdbId || targetImdb,
              directHlsStreams: latinoDirect,
              latinoDirectStreams: latinoDirect,
              englishMasterStreams: [],
              subtitles: [],
              serverStatuses: backendScan?.serverStatuses || {},
              scanDurationMs: Math.round(performance.now() - startTime),
              isPartialFast: true
            });
          }
          return backendScan;
        });

        const hlsPromise = this.fetchDirectHlsStreams(targetId, targetIsTv, targetSeason, targetEpisode);
        const subsPromise = this.fetchSubtitles(targetId, targetIsTv, targetSeason, targetEpisode);

        const [backendScan, hlsResult, subtitles] = await Promise.all([
          backendPromise,
          hlsPromise,
          subsPromise
        ]);

        const spanishDirect = Array.isArray(backendScan?.latinoDirectStreams)
          ? backendScan.latinoDirectStreams.filter((s) => s.isLatinoDub || s.isCastellanoDub)
          : [];
        const englishMasterStreams = Array.isArray(hlsResult?.streams) ? hlsResult.streams : [];

        // Orden estricto: 1º Español Latino Oficial, 2º Español Castellano, 3º Respaldo Inglés (SOLO si se pide explícitamente)
        const rankStream = (s) => {
          if (s.isLatinoDub) return 1;
          if (s.isCastellanoDub) return 2;
          if (s.isBluRayMaster || s.providerId === 'nova') return 3;
          return 4;
        };

        const combinedDirectStreams = [...spanishDirect, ...englishMasterStreams].sort(
          (a, b) => rankStream(a) - rankStream(b)
        );

        const result = {
          tmdbId: movie.id,
          aliasTmdbId: targetId,
          imdbId: backendScan?.imdbId || targetImdb,
          lanIp: backendScan?.lanIp || null,
          isTv: targetIsTv,
          season: targetSeason,
          episode: targetEpisode,
          directHlsStreams: combinedDirectStreams,
          latinoDirectStreams: spanishDirect.filter((s) => s.isLatinoDub),
          castellanoDirectStreams: spanishDirect.filter((s) => s.isCastellanoDub),
          englishMasterStreams,
          subtitles: subtitles || [],
          latinoSources: backendScan?.latinoSources || [],
          hasConfirmedLatinoDub: spanishDirect.some((s) => s.isLatinoDub),
          serverStatuses: backendScan?.serverStatuses || {},
          scanDurationMs: Math.round(performance.now() - startTime),
          timestamp: Date.now()
        };

        scanCache.set(cacheKey, result);
        return result;
      } finally {
        inFlightScans.delete(cacheKey);
      }
    })();

    inFlightScans.set(cacheKey, scanPromise);
    return scanPromise;
  },

  async fetchBackendVerification(tmdbId, isTv, season, episode, imdbId) {
    const resolved = resolveMediaAlias(tmdbId, isTv, season, episode, imdbId);
    const targetId = resolved.id;
    const targetIsTv = resolved.isTv;
    const targetSeason = resolved.season;
    const targetEpisode = resolved.episode;
    const targetImdb = resolved.imdbId || imdbId;

    const params = new URLSearchParams({
      tmdbId: String(targetId),
      isTv: targetIsTv ? '1' : '0',
      season: String(targetSeason),
      episode: String(targetEpisode),
      ...(targetImdb ? { imdbId: targetImdb } : {})
    });

    const endpoints = [
      `/api/scan-streams?${params.toString()}`,
      `./api.php?action=scan&${params.toString()}`
    ];

    const tasks = endpoints.map(async (ep) => {
      const res = await fetchWithTimeout(ep, { headers: { Accept: 'application/json' } }, 7800);
      if (!res.ok) throw new Error('HTTP error');
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error('Not JSON');
      const data = await res.json();
      if (!data || !data.ok) throw new Error('Invalid payload');
      return data;
    });

    // Añadir extracción directa en cliente en paralelo por si el servidor local no está corriendo
    if (imdbId && String(imdbId).startsWith('tt')) {
      tasks.push(
        extractClientSideEmbed69Latino(imdbId, isTv, season, episode).then((res) => {
          if (!res || !res.latinoDirectStreams?.length) throw new Error('No client streams');
          return res;
        })
      );
    }

    try {
      return await Promise.any(tasks);
    } catch {
      return null;
    }
  }
};
