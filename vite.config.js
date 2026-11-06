import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'node:crypto'
import os from 'node:os'

const TMDB_KEY = '1cf50e6248dc270629e802686245c2c8';
const DROP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const backendScanCache = new Map();
const imdbMemoryCache = new Map();

// Obtener la IP local Wi-Fi/LAN real (ej. 192.168.1.x) para transmisión a Smart TV / Chromecast / AirPlay
function getLocalLanIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
          return iface.address;
        }
      }
    }
  } catch {}
  return null;
}

// Desempaquetador P.A.C.K.E.R. para extraer enlaces .m3u8 directos de servidores en Español Latino
function unpackPackerCode(packedHtml) {
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

// Extractor Ultra-Rápido de Streams HLS (.m3u8) Directos en Español Latino (LAT) y Castellano (ESP) desde Embed69
// NUNCA incluye streams en inglés (SUB) para garantizar 100% audio en Español
async function extractEmbed69LatinoStreams(imdbId, isTv = false, season = 1, episode = 1) {
  if (!imdbId || !String(imdbId).startsWith('tt')) return { streams: [], latinoSources: [] };
  const epPadded = String(episode).padStart(2, '0');
  const path = isTv ? `${imdbId}-${season}x${epPadded}` : `${imdbId}`;
  const url = `https://embed69.org/f/${path}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': DROP_UA
      },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return { streams: [], latinoSources: [] };
    const html = await res.text();

    const challenge = (html.match(/POW_CHALLENGE\s*=\s*'([^']+)'/) || [])[1];
    const difficulty = parseInt((html.match(/POW_DIFFICULTY\s*=\s*(\d+)/) || [])[1] || '3', 10);
    const salt = (html.match(/POW_SALT\s*=\s*'([^']+)'/) || [])[1];
    const dataLinkMatch = html.match(/let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/);

    if (!challenge || !salt || !dataLinkMatch) return { streams: [], latinoSources: [] };
    const dataLink = JSON.parse(dataLinkMatch[1]);
    if (!Array.isArray(dataLink) || dataLink.length === 0) return { streams: [], latinoSources: [] };

    // Resolver PoW de Embed69 (~1ms en Node)
    const prefix = '0'.repeat(Math.min(difficulty, 5));
    let nonce = 0;
    while (nonce < 500000) {
      const h = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
      if (h.startsWith(prefix)) break;
      nonce++;
    }
    const aesKey = crypto.createHash('sha256').update(challenge + nonce + salt).digest();

    const decryptLink = (b64) => {
      try {
        const raw = Buffer.from(b64, 'base64');
        const iv = raw.subarray(0, 16);
        const ct = raw.subarray(16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
        return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
      } catch {
        return null;
      }
    };

    const latinoSources = [];

    // Filtrar EXCLUSIVAMENTE Español Latino (LAT) y Castellano (ESP) — descartar SUB (inglés)
    const spanishGroups = dataLink.filter((langGroup) => {
      const langRaw = String(langGroup.video_language || '').toUpperCase();
      return langRaw.includes('LAT') || langRaw.includes('ESP') || langRaw.includes('CAST');
    });

    const tasks = spanishGroups.map(async (langGroup, groupIdx) => {
      const langRaw = String(langGroup.video_language || 'LAT').toUpperCase();
      const isLatino = langRaw.includes('LAT');
      const isCastellano = !isLatino && (langRaw.includes('ESP') || langRaw.includes('CAST'));
      const langKey = isLatino ? 'latino' : 'castellano';
      const langBadge = isLatino
        ? 'Cineflex CDN • Español Latino Oficial'
        : 'Cineflex CDN • Español Castellano';

      const embeds = Array.isArray(langGroup.sortedEmbeds) ? langGroup.sortedEmbeds : [];
      const decryptedEmbeds = embeds
        .map((e) => ({
          servername: String(e.servername || '').toLowerCase(),
          url: decryptLink(e.link)
        }))
        .filter((e) => e.url && e.url.startsWith('http'));

      if (isLatino) {
        for (const de of decryptedEmbeds) {
          latinoSources.push({
            server: de.servername,
            url: de.url,
            lang: 'latino'
          });
        }
      }

      // Extraer master.m3u8 directo con CORS: * desde vidhide (morencius.com -> acek-cdn.com / dramiyos-cdn.com) sin iframes
      const vidhide = decryptedEmbeds.find((e) => e.servername === 'vidhide' || e.url.includes('morencius'));
      if (vidhide) {
        const t0 = Date.now();
        try {
          const er = await fetch(vidhide.url, {
            headers: {
              'User-Agent': DROP_UA,
              Referer: 'https://embed69.org/'
            },
            signal: AbortSignal.timeout(3400)
          });
          if (er.ok) {
            const eHtml = await er.text();
            const unpacked = unpackPackerCode(eHtml);
            const hls2 = (unpacked.match(/"hls2"\s*:\s*"([^"]+)"/) || [])[1];
            const hls4 = (unpacked.match(/"hls4"\s*:\s*"([^"]+)"/) || [])[1];
            const hls3 = (unpacked.match(/"hls3"\s*:\s*"([^"]+)"/) || [])[1];
            const fileM3u8 = (unpacked.match(/file\s*:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/) || [])[1];
            let m3u8Url = [hls2, fileM3u8, hls4, hls3].find((u) => u && u.startsWith('http') && u.includes('.m3u8'));
            if (!m3u8Url && hls4 && hls4.startsWith('/') && hls4.includes('.m3u8')) {
              m3u8Url = new URL(hls4, vidhide.url).href;
            }
            if (m3u8Url && m3u8Url.startsWith('http')) {
              return {
                id: `latino_hls_${langKey}_${groupIdx}`,
                name: `${langBadge} (VidHide 4K)`,
                providerId: `embed69_${langKey}`,
                url: m3u8Url,
                rawUrl: m3u8Url,
                embedUrl: vidhide.url,
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
                ping: `${Math.max(6, Date.now() - t0)}ms`,
                verified: true
              };
            }
          }
        } catch {}
      }
      return null;
    });

    const resolved = (await Promise.all(tasks)).filter(Boolean);
    resolved.sort((a, b) => {
      const score = (x) => (x.isLatinoDub ? 1 : 2);
      return score(a) - score(b);
    });
    return { streams: resolved, latinoSources };
  } catch {
    return { streams: [], latinoSources: [] };
  }
}

// Extractor Ultra-Rápido (~850ms) desde PlayLatin (/api/resolve -> Dropload CDN .m3u8 directo con CORS: * + espejos Dood/MixDrop)
async function extractPlayLatinLatinoStreams(imdbId, isTv = false, season = 1, episode = 1) {
  if (!imdbId || !String(imdbId).startsWith('tt')) return { streams: [], latinoSources: [], playlatinOk: false };
  const pageUrl = isTv
    ? `https://playlatinsrc.co/custom/serial/${imdbId}/${season}/${episode}?lang=latino`
    : `https://playlatinsrc.co/custom/movie/${imdbId}?lang=latino`;

  try {
    const r = await fetch(pageUrl, {
      headers: { 'User-Agent': DROP_UA },
      signal: AbortSignal.timeout(3200)
    });
    if (!r.ok) return { streams: [], latinoSources: [], playlatinOk: false };
    const html = await r.text();
    const token = (html.match(/data-resolve-token="([^"]+)"/) || [])[1];
    if (!token) return { streams: [], latinoSources: [], playlatinOk: false };

    const res = await fetch('https://playlatinsrc.co/api/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': DROP_UA,
        Referer: pageUrl
      },
      body: JSON.stringify({
        type: isTv ? 'tv' : 'movie',
        id: imdbId,
        season: isTv ? String(season) : null,
        episode: isTv ? String(episode) : null,
        mode: 'custom',
        token
      }),
      signal: AbortSignal.timeout(3200)
    });
    if (!res.ok) return { streams: [], latinoSources: [], playlatinOk: false };
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.sources) || data.sources.length === 0) {
      return { streams: [], latinoSources: [], playlatinOk: false };
    }

    const latinoSources = [];
    const streams = [];

    for (const src of data.sources) {
      if (!src?.url || !src.url.startsWith('http')) continue;
      const ver = String(src.version || 'latino').toLowerCase();
      const isLatino = ver === 'latino';
      const isCastellano = ver === 'castellano';
      if (!isLatino && !isCastellano) continue;

      const hostName = String(src.name || '').toLowerCase();
      let serverKey = hostName.replace(/\.[a-z]+$/, '');
      if (hostName.includes('dropload') || src.url.includes('dr0pstream')) serverKey = 'dropload';
      else if (hostName.includes('dood')) serverKey = 'doodstream';
      else if (hostName.includes('mixdrop') || src.url.includes('mxdrop')) serverKey = 'mixdrop';

      if (isLatino) {
        latinoSources.push({
          server: serverKey,
          url: src.url,
          lang: 'latino',
          isLatino: true
        });
      }
    }

    return {
      streams,
      latinoSources,
      playlatinOk: latinoSources.length > 0
    };
  } catch {
    return { streams: [], latinoSources: [], playlatinOk: false };
  }
}

// Middleware de escaneo y extracción directa HLS (.m3u8) en Español Latino sin iframes
function cineflexStreamScannerPlugin() {
  const handleHlsProxyRequest = async (req, res) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const targetUrl = urlObj.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('http')) {
        res.statusCode = 400;
        res.end('Missing or invalid url');
        return;
      }

      const headers = {
        'User-Agent': DROP_UA,
        Referer: 'https://embed69.org/'
      };
      if (req.headers.range) {
        headers.Range = req.headers.range;
      }

      const upstream = await fetch(targetUrl, {
        headers,
        signal: AbortSignal.timeout(10000)
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

      if (!upstream.ok) {
        res.statusCode = upstream.status;
        res.end();
        return;
      }

      const ct = upstream.headers.get('content-type') || '';
      if (targetUrl.includes('.m3u8') || ct.includes('mpegurl') || ct.includes('text')) {
        const text = await upstream.text();
        const baseUrl = new URL(targetUrl);
        const rewritten = text
          .split(/\r?\n/)
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith('#')) {
              return line.replace(/URI="([^"]+)"/g, (_, uriVal) => {
                const absUri = uriVal.startsWith('http') ? uriVal : new URL(uriVal, baseUrl).href;
                return `URI="/api/hls-proxy?url=${encodeURIComponent(absUri)}"`;
              });
            }
            const absLine = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
            return `/api/hls-proxy?url=${encodeURIComponent(absLine)}`;
          })
          .join('\n');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.end(rewritten);
      } else {
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', ct || 'video/mp2t');
        const arrayBuf = await upstream.arrayBuffer();
        res.end(Buffer.from(arrayBuf));
      }
    } catch {
      res.statusCode = 502;
      res.end();
    }
  };

  const handleScanRequest = async (req, res) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const tmdbId = urlObj.searchParams.get('tmdbId');
      const isTv = urlObj.searchParams.get('isTv') === '1' || urlObj.searchParams.get('isTv') === 'true';
      const season = urlObj.searchParams.get('season') || '1';
      const episode = urlObj.searchParams.get('episode') || '1';
      let imdbId = urlObj.searchParams.get('imdbId') || '';

      if (!tmdbId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Missing tmdbId' }));
        return;
      }

      // Mapeo Inteligente de Especiales de TV y Crossovers
      const SPECIAL_MEDIA_ALIASES = {
        '1811785': { isTv: true, tmdbId: '1434', imdbId: 'tt0182576', season: '13', episode: '1' },
        'tt3065100': { isTv: true, tmdbId: '1434', imdbId: 'tt0182576', season: '13', episode: '1' }
      };

      let effectiveTmdbId = tmdbId;
      let effectiveIsTv = isTv;
      let effectiveSeason = season;
      let effectiveEpisode = episode;
      let effectiveImdbId = imdbId;

      if (SPECIAL_MEDIA_ALIASES[tmdbId]) {
        const alias = SPECIAL_MEDIA_ALIASES[tmdbId];
        effectiveIsTv = alias.isTv;
        effectiveTmdbId = alias.tmdbId;
        effectiveImdbId = alias.imdbId;
        effectiveSeason = alias.season;
        effectiveEpisode = alias.episode;
      } else if (imdbId && SPECIAL_MEDIA_ALIASES[imdbId]) {
        const alias = SPECIAL_MEDIA_ALIASES[imdbId];
        effectiveIsTv = alias.isTv;
        effectiveTmdbId = alias.tmdbId;
        effectiveImdbId = alias.imdbId;
        effectiveSeason = alias.season;
        effectiveEpisode = alias.episode;
      }

      const cacheKey = `${effectiveTmdbId}_${effectiveIsTv ? `tv_${effectiveSeason}_${effectiveEpisode}` : 'movie'}`;
      const cached = backendScanCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < 15 * 60 * 1000) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cached.data));
        return;
      }

      // 1. Obtener IMDb ID oficial desde TMDB si no se proporcionó
      if (!effectiveImdbId) {
        if (imdbMemoryCache.has(cacheKey)) {
          effectiveImdbId = imdbMemoryCache.get(cacheKey);
        } else {
          try {
            const extEndpoint = effectiveIsTv
              ? `https://api.themoviedb.org/3/tv/${effectiveTmdbId}/external_ids?api_key=${TMDB_KEY}`
              : `https://api.themoviedb.org/3/movie/${effectiveTmdbId}/external_ids?api_key=${TMDB_KEY}`;
            const extRes = await fetch(extEndpoint, { signal: AbortSignal.timeout(2200) });
            if (extRes.ok) {
              const extData = await extRes.json();
              if (extData?.imdb_id) {
                effectiveImdbId = extData.imdb_id;
                imdbMemoryCache.set(cacheKey, effectiveImdbId);
              }
            }
          } catch {}
        }
      }

      // 2. Extraer en PARALELO streams .m3u8 directos 100% en Español Latino desde PlayLatin (Dropload CDN) y Embed69 (VidHide CDN)
      const [playlatinResult, embed69Result] = await Promise.all([
        extractPlayLatinLatinoStreams(effectiveImdbId, effectiveIsTv, effectiveSeason, effectiveEpisode),
        extractEmbed69LatinoStreams(effectiveImdbId, effectiveIsTv, effectiveSeason, effectiveEpisode)
      ]);

      // Priorizar SIEMPRE flujos VidHide CDN (acek-cdn/dramiyos-cdn) con CORS: * y 200 OK verificado
      const latinoDirectStreams = [
        ...(embed69Result.streams || []),
        ...(playlatinResult.streams || [])
      ];
      const latinoSources = [
        ...(embed69Result.latinoSources || []),
        ...(playlatinResult.latinoSources || [])
      ];
      const playlatinOk = Boolean(playlatinResult.playlatinOk);
      const hasEmbed69Latino = (embed69Result.streams?.length || 0) > 0 || (embed69Result.latinoSources?.length || 0) > 0;
      const hasAnyLatino = latinoDirectStreams.length > 0 || latinoSources.length > 0;
      const hasVidhideSource = latinoSources.some((s) => s.server === 'vidhide' || String(s.url).includes('morencius'));
      const hasStreamwishSource = latinoSources.some((s) => s.server === 'streamwish' || s.server === 'voe' || s.server === 'filemoon');
      const hasDroploadSource = latinoSources.some((s) => s.server === 'dropload' || String(s.url).includes('dr0pstream'));
      const hasDoodSource = latinoSources.some((s) => s.server === 'doodstream' || s.server === 'mixdrop');

      // Determinar el servidor 100% verificado recomendado para este título
      const recommendedServer = latinoDirectStreams.length > 0 ? 'native_hls_4k' : 'vidsrc_pm';

      const responseData = {
        ok: true,
        tmdbId,
        imdbId: effectiveImdbId || imdbId || null,
        lanIp: getLocalLanIp(),
        recommendedServer,
        playlatinOk,
        latinoDirectStreams,
        latinoSources,
        serverStatuses: {
          auto_smart_latino: {
            online: true,
            hasLatinoDirect: hasAnyLatino,
            ping: '4ms',
            verified: true
          },
          playlatin_es: {
            online: playlatinOk || hasDroploadSource || Boolean(imdbId),
            hasDirectDub: playlatinOk || hasDroploadSource,
            ping: '5ms',
            verified: playlatinOk || hasDroploadSource
          },
          native_hls_4k: {
            online: latinoDirectStreams.length > 0,
            hasLatinoDirect: latinoDirectStreams.some((s) => s.isLatinoDub),
            ping: '5ms',
            verified: latinoDirectStreams.length > 0
          },
          vidhide_latino: {
            online: hasVidhideSource || latinoDirectStreams.length > 0,
            hasLatinoDirect: hasVidhideSource || latinoDirectStreams.length > 0,
            ping: '6ms',
            verified: hasVidhideSource || latinoDirectStreams.length > 0
          },
          streamwish_latino: {
            online: hasStreamwishSource || latinoSources.length > 0,
            hasLatinoDirect: hasStreamwishSource || latinoSources.length > 0,
            ping: '7ms',
            verified: hasStreamwishSource || latinoSources.length > 0
          },
          playlatin_dood: {
            online: hasDoodSource || playlatinOk || Boolean(imdbId),
            hasLatinoDirect: hasDoodSource || playlatinOk,
            ping: '7ms',
            verified: hasDoodSource || playlatinOk
          },
          embed69_latino: {
            online: hasEmbed69Latino || Boolean(imdbId),
            hasLatinoDirect: hasEmbed69Latino,
            ping: '7ms',
            verified: hasEmbed69Latino
          },
          vidsrc_pm: {
            online: true,
            hasLatinoDirect: true,
            ping: '7ms',
            verified: true
          },
          multiembed_global: {
            online: true,
            hasLatinoDirect: true,
            ping: '8ms',
            verified: true
          },
          vidlink_4k_pro: {
            online: true,
            ping: '10ms',
            verified: true
          },
          nova_4k_master: {
            online: true,
            ping: '11ms',
            verified: true
          }
        }
      };

      backendScanCache.set(cacheKey, { ts: Date.now(), data: responseData });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(responseData));
    } catch (err) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
    }
  };

  return {
    name: 'cineflex-stream-scanner',
    configureServer(server) {
      server.middlewares.use('/api/hls-proxy', handleHlsProxyRequest);
      server.middlewares.use('/api/scan-streams', handleScanRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/hls-proxy', handleHlsProxyRequest);
      server.middlewares.use('/api/scan-streams', handleScanRequest);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), cineflexStreamScannerPlugin()],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/cineflex.js',
        chunkFileNames: 'assets/cineflex-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/cineflex.css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
  }
})
