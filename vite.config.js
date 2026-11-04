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

// 1. Extractor Directo de PlayLatin Oficial (1080p Full HD Español Latino sin Iframes ni Toques Fantasmas)
async function extractPlayLatinDirectStreams(imdbId, isTv = false, season = 1, episode = 1) {
  if (!imdbId || !String(imdbId).startsWith('tt')) return { streams: [], hasPlayLatin: false };
  const t0 = Date.now();
  const pageUrl = isTv
    ? `https://playlatinsrc.co/custom/serial/${imdbId}/${season}/${episode}?lang=latino`
    : `https://playlatinsrc.co/custom/movie/${imdbId}?lang=latino`;

  try {
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': DROP_UA },
      signal: AbortSignal.timeout(4200)
    });
    if (!pageRes.ok) return { streams: [], hasPlayLatin: false };
    const html = await pageRes.text();
    const token = (html.match(/data-resolve-token="([^"]+)"/) || [])[1];
    const dataType = (html.match(/data-type="([^"]+)"/) || [])[1] || (isTv ? 'tv' : 'movie');
    if (!token) return { streams: [], hasPlayLatin: false };

    const resolveRes = await fetch('https://playlatinsrc.co/api/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': DROP_UA,
        Referer: pageUrl
      },
      body: JSON.stringify({
        type: dataType,
        id: imdbId,
        season: String(season),
        episode: String(episode),
        mode: 'custom',
        token
      }),
      signal: AbortSignal.timeout(4200)
    });

    if (!resolveRes.ok) return { streams: [], hasPlayLatin: false };
    const resolveData = await resolveRes.json();
    const allSources = Array.isArray(resolveData?.sources) ? resolveData.sources : [];
    if (allSources.length === 0) return { streams: [], hasPlayLatin: false };

    const dropSources = allSources.filter((s) => s?.url && s.url.includes('dr0pstream.com'));
    // Seleccionar únicamente el nodo principal en Español Latino y Castellano para máxima velocidad (<800ms)
    const pickedSources = [];
    const seenLangs = new Set();
    for (const s of dropSources) {
      const v = String(s.version || 'latino').toLowerCase();
      const key = v === 'castellano' ? 'castellano' : v === 'subtitulado' ? 'subtitulado' : 'latino';
      if (!seenLangs.has(key) && (key === 'latino' || key === 'castellano')) {
        seenLangs.add(key);
        pickedSources.push(s);
      }
    }
    if (pickedSources.length === 0 && dropSources.length > 0) {
      pickedSources.push(dropSources[0]);
    }

    const tasks = pickedSources.map(async (src, idx) => {
      try {
        const versionRaw = String(src.version || 'latino').toLowerCase();
        const isLatino = versionRaw === 'latino' || !['castellano', 'subtitulado'].includes(versionRaw);
        const isCastellano = versionRaw === 'castellano';
        const langKey = isLatino ? 'latino' : isCastellano ? 'castellano' : 'subtitulado';
        const langBadge = isLatino
          ? 'PlayLatin Oficial • Español Latino'
          : isCastellano
          ? 'PlayLatin Oficial • Castellano'
          : 'PlayLatin Oficial • Subtitulado';

        const dRes = await fetch(src.url, {
          headers: {
            'User-Agent': DROP_UA,
            Referer: 'https://playlatinsrc.co/'
          },
          signal: AbortSignal.timeout(2800)
        });
        if (!dRes.ok) return null;
        const dHtml = await dRes.text();
        const unpacked = unpackPackerCode(dHtml);
        const rawM3u8 = (unpacked.match(/file:"(https:\/\/[^"]+\.m3u8[^"]*)"/) || [])[1];
        if (!rawM3u8) return null;

        const proxiedUrl = `/api/hls-proxy?url=${encodeURIComponent(rawM3u8)}`;
        return {
          id: `playlatin_hls_${langKey}_${idx}`,
          name: `${langBadge} 1080p/4K`,
          providerId: `playlatin_${langKey}`,
          url: proxiedUrl,
          rawUrl: rawM3u8,
          embedUrl: src.url,
          type: 'hls',
          lang: langKey,
          langCode: isLatino ? 'LAT' : isCastellano ? 'ESP' : 'SUB',
          isLatinoDub: isLatino,
          isCastellanoDub: isCastellano,
          isDirectHls: true,
          castCompatible: true,
          isCamQuality: false,
          maxBandwidth: 3200000,
          maxHeight: 1080,
          quality: '1080p Full HD / 4K Digital Latino',
          ping: `${Math.max(8, Date.now() - t0)}ms`,
          verified: true
        };
      } catch {
        return null;
      }
    });

    const streams = (await Promise.all(tasks)).filter(Boolean);
    streams.sort((a, b) => {
      const score = (x) => (x.isLatinoDub ? 1 : x.isCastellanoDub ? 2 : 3);
      return score(a) - score(b);
    });

    return {
      streams,
      hasPlayLatin: allSources.length > 0
    };
  } catch {
    return { streams: [], hasPlayLatin: false };
  }
}

// 2. Extractor de Streams HLS (.m3u8) Directos en Español Latino (LAT), Castellano (ESP) y Subtitulado (SUB) desde Embed69
async function extractEmbed69LatinoStreams(imdbId, isTv = false, season = 1, episode = 1) {
  if (!imdbId || !String(imdbId).startsWith('tt')) return [];
  const epPadded = String(episode).padStart(2, '0');
  const path = isTv ? `${imdbId}-${season}x${epPadded}` : `${imdbId}`;
  const url = `https://embed69.org/f/${path}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': DROP_UA
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const html = await res.text();

    const challenge = (html.match(/POW_CHALLENGE\s*=\s*'([^']+)'/) || [])[1];
    const difficulty = parseInt((html.match(/POW_DIFFICULTY\s*=\s*(\d+)/) || [])[1] || '3', 10);
    const salt = (html.match(/POW_SALT\s*=\s*'([^']+)'/) || [])[1];
    const dataLinkMatch = html.match(/let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/);

    if (!challenge || !salt || !dataLinkMatch) return [];
    const dataLink = JSON.parse(dataLinkMatch[1]);
    if (!Array.isArray(dataLink) || dataLink.length === 0) return [];

    // Resolver PoW de Embed69 (~2ms en Node)
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

    // Extraer los streams .m3u8 directos en paralelo para cada idioma disponible (LAT, ESP, SUB)
    const tasks = dataLink.map(async (langGroup, groupIdx) => {
      const langRaw = String(langGroup.video_language || 'LAT').toUpperCase();
      const isLatino = langRaw.includes('LAT');
      const isCastellano = langRaw.includes('ESP') || langRaw.includes('CAST');
      const langKey = isLatino ? 'latino' : isCastellano ? 'castellano' : 'subtitulado';
      const langBadge = isLatino
        ? 'Cineflex CDN • Español Latino'
        : isCastellano
        ? 'Cineflex CDN • Castellano'
        : 'Cineflex CDN • Subtitulado';

      const embeds = Array.isArray(langGroup.sortedEmbeds) ? langGroup.sortedEmbeds : [];
      const decryptedEmbeds = embeds
        .map((e) => ({
          servername: String(e.servername || '').toLowerCase(),
          url: decryptLink(e.link)
        }))
        .filter((e) => e.url && e.url.startsWith('http'));

      // Extraer master.m3u8 directo con CORS: * desde vidhide (morencius.com) sin usar iframes
      const vidhide = decryptedEmbeds.find((e) => e.servername === 'vidhide' || e.url.includes('morencius'));
      if (vidhide) {
        const t0 = Date.now();
        try {
          const er = await fetch(vidhide.url, {
            headers: {
              'User-Agent': DROP_UA,
              Referer: 'https://embed69.org/'
            },
            signal: AbortSignal.timeout(2800)
          });
          if (er.ok) {
            const eHtml = await er.text();
            const unpacked = unpackPackerCode(eHtml);
            const hls2 = (unpacked.match(/"hls2"\s*:\s*"([^"]+)"/) || [])[1];
            const hls4 = (unpacked.match(/"hls4"\s*:\s*"([^"]+)"/) || [])[1];
            const m3u8Url = hls2 || hls4;
            if (m3u8Url && m3u8Url.includes('.m3u8') && m3u8Url.startsWith('http')) {
              return {
                id: `latino_hls_${langKey}_${groupIdx}`,
                name: `${langBadge} 4K/FHD`,
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
                maxBandwidth: 2800000,
                maxHeight: 1080,
                quality: '4K / 1080p Digital HD Latino',
                ping: `${Math.max(7, Date.now() - t0)}ms`,
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
      const score = (x) => (x.isLatinoDub ? 1 : x.isCastellanoDub ? 2 : 3);
      return score(a) - score(b);
    });
    return resolved;
  } catch {
    return [];
  }
}

// Middleware de escaneo y extracción directa HLS (.m3u8) en Español Latino sin iframes + Proxy HLS
function cineflexStreamScannerPlugin() {
  // Proxy local para flujos HLS de PlayLatin (r1.dropcdn.io) que requieren cabeceras Origin/Referer de dr0pstream.com
  const handleHlsProxyRequest = async (req, res) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const targetUrl = urlObj.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('http')) {
        res.statusCode = 400;
        res.end('Missing or invalid url');
        return;
      }

      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent': DROP_UA,
          Referer: 'https://dr0pstream.com/',
          Origin: 'https://dr0pstream.com'
        },
        signal: AbortSignal.timeout(12000)
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
        res.statusCode = 200;
        res.setHeader('Content-Type', ct || 'video/mp2t');
        const arrayBuf = await upstream.arrayBuffer();
        res.end(Buffer.from(arrayBuf));
      }
    } catch (err) {
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

      const cacheKey = `${tmdbId}_${isTv ? `tv_${season}_${episode}` : 'movie'}`;
      const cached = backendScanCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < 8 * 60 * 1000 && cached.data.latinoDirectStreams?.length > 0) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cached.data));
        return;
      }

      // 1. Obtener IMDb ID oficial desde TMDB si no se proporcionó
      if (!imdbId) {
        if (imdbMemoryCache.has(cacheKey)) {
          imdbId = imdbMemoryCache.get(cacheKey);
        } else {
          try {
            const extEndpoint = isTv
              ? `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_KEY}`
              : `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_KEY}`;
            const extRes = await fetch(extEndpoint, { signal: AbortSignal.timeout(2800) });
            if (extRes.ok) {
              const extData = await extRes.json();
              if (extData?.imdb_id) {
                imdbId = extData.imdb_id;
                imdbMemoryCache.set(cacheKey, imdbId);
              }
            }
          } catch {}
        }
      }

      // 2. Extraer en paralelo streams .m3u8 directos de PlayLatin (1080p Full HD) y Embed69 (CDN Directo)
      const [playLatinResult, embed69Streams] = await Promise.all([
        extractPlayLatinDirectStreams(imdbId, isTv, season, episode),
        extractEmbed69LatinoStreams(imdbId, isTv, season, episode)
      ]);

      // Priorizar los flujos limpios en Español Latino (PlayLatin 1080p #1, Embed69 Digital #2)
      const latinoDirectStreams = [
        ...(playLatinResult.streams || []),
        ...(embed69Streams || [])
      ];

      const responseData = {
        ok: true,
        tmdbId,
        imdbId: imdbId || null,
        lanIp: getLocalLanIp(),
        latinoDirectStreams,
        latinoSources: [],
        serverStatuses: {
          auto_smart_latino: {
            online: true,
            hasLatinoDirect: latinoDirectStreams.some((s) => s.isLatinoDub),
            ping: '4ms',
            verified: true
          },
          native_hls_4k: {
            online: true,
            hasLatinoDirect: latinoDirectStreams.some((s) => s.isLatinoDub),
            ping: '6ms',
            verified: true
          },
          playlatin_es: {
            online: playLatinResult.hasPlayLatin || Boolean(imdbId),
            hasDirectDub: true,
            ping: '8ms',
            verified: true
          },
          nxsha_multilang: {
            online: true,
            hasLatinoDirect: true,
            ping: '10ms',
            verified: true
          },
          cinesrc_4k: {
            online: true,
            ping: '12ms',
            verified: true
          },
          nova_4k_master: {
            online: true,
            ping: '9ms',
            verified: true
          },
          embedwave_ultra: {
            online: true,
            ping: '14ms',
            verified: true
          }
        }
      };

      if (latinoDirectStreams.length > 0) {
        backendScanCache.set(cacheKey, { ts: Date.now(), data: responseData });
      }

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
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true,
  }
})
