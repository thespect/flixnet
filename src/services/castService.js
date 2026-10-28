// Servicio Avanzado de Transmisión Inalámbrica 4K (AirPlay 2, Google Chromecast, RemotePlayback API y Smart TV LAN)
// Optimizado para funcionar de forma sencilla, rápida y estable en Celular (iOS/Android), Tablet y PC/Mac.

import { REAL_4K_SOURCES } from './movieService';

export const CastService = {
  // Detectar soporte nativo de AirPlay (iPhone, iPad, Mac Safari)
  isAirPlayAvailable: () => {
    if (typeof window === 'undefined') return false;
    return (
      'WebKitPlaybackTargetAvailabilityEvent' in window ||
      (typeof HTMLVideoElement !== 'undefined' &&
        'webkitShowPlaybackTargetPicker' in HTMLVideoElement.prototype)
    );
  },

  // Detectar soporte de Google Cast / RemotePlayback / Presentation API (Android, Tablet, PC Chrome/Edge)
  isChromecastAvailable: () => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window.cast && window.cast.framework) ||
        (window.chrome && window.chrome.cast) ||
        (typeof HTMLVideoElement !== 'undefined' && 'remote' in HTMLVideoElement.prototype) ||
        ('presentation' in navigator && window.PresentationRequest)
    );
  },

  /**
   * Prepara el elemento <video> para transmisión inalámbrica (AirPlay / RemotePlayback).
   * AirPlay y RemotePlayback NO pueden transmitir URLs "blob:" generadas por MSE.
   * Si el reproductor usa blob: y tenemos un stream .m3u8/.mp4 directo con CORS: * (como nuestro stream Español Latino),
   * conectamos la URL directa al <video> en Safari/Móvil antes de abrir el selector de TV.
   */
  prepareVideoForWirelessCast: (videoEl, directStreamUrl) => {
    if (!videoEl) return null;
    videoEl.disableRemotePlayback = false;
    videoEl.setAttribute('x-webkit-airplay', 'allow');
    videoEl.setAttribute('airplay', 'allow');

    const currentSrc = videoEl.currentSrc || videoEl.src || '';
    const isBlob = currentSrc.startsWith('blob:');
    const targetUrl =
      directStreamUrl && !directStreamUrl.startsWith('blob:')
        ? directStreamUrl
        : !isBlob && currentSrc
        ? currentSrc
        : REAL_4K_SOURCES[0].resolutions['2160p'];

    // En dispositivos Apple (iPhone, iPad, Mac Safari) que soportan HLS nativo, reemplazar blob: por la URL .m3u8 directa
    const canPlayNativeHls = Boolean(
      videoEl.canPlayType &&
        (videoEl.canPlayType('application/vnd.apple.mpegurl') ||
          videoEl.canPlayType('application/x-mpegURL'))
    );

    if (isBlob && targetUrl && (canPlayNativeHls || targetUrl.endsWith('.mp4'))) {
      try {
        const savedTime = videoEl.currentTime || 0;
        videoEl.src = targetUrl;
        videoEl.load();
        if (savedTime > 1) {
          videoEl.currentTime = savedTime;
        }
        videoEl.play().catch(() => {});
      } catch {}
    }

    return targetUrl;
  },

  /**
   * Activa AirPlay 2 nativo en iPhone, iPad y Mac, o RemotePlayback en otros dispositivos
   */
  triggerAirPlay: async (videoEl, directStreamUrl = '') => {
    const vEl = videoEl || document.querySelector('video');
    if (vEl) {
      CastService.prepareVideoForWirelessCast(vEl, directStreamUrl);

      // 1. Selector Nativo AirPlay de Apple (iOS / iPadOS / macOS)
      if (typeof vEl.webkitShowPlaybackTargetPicker === 'function') {
        try {
          vEl.webkitShowPlaybackTargetPicker();
          return {
            ok: true,
            method: 'airplay',
            message: 'Selector nativo de AirPlay abierto. Elige tu Apple TV o Smart TV.'
          };
        } catch (err) {
          console.warn('Error al abrir selector AirPlay:', err);
        }
      }

      // 2. W3C Remote Playback API (Safari moderno / Chrome móvil)
      if (vEl.remote && typeof vEl.remote.prompt === 'function') {
        try {
          await vEl.remote.prompt();
          return {
            ok: true,
            method: 'remote_playback',
            message: 'Conectado a pantalla inalámbrica mediante Remote Playback.'
          };
        } catch {}
      }
    }

    return {
      ok: false,
      method: 'manual',
      message: 'En iPhone/iPad/Mac abre Centro de Control > Duplicar Pantalla o usa Safari para AirPlay directo.'
    };
  },

  /**
   * Activa Chromecast / Google TV / Android TV en Celular, Tablet o PC
   * Usa: 1) Google Cast Framework SDK -> 2) W3C RemotePlayback API -> 3) Presentation API
   */
  triggerChromecast: async (directStreamUrl, movie = null, season = 1, episode = 1, videoEl = null) => {
    const vEl = videoEl || document.querySelector('video');
    const streamToCast =
      directStreamUrl && !directStreamUrl.startsWith('blob:')
        ? directStreamUrl
        : movie?.real4kSource?.resolutions?.['2160p'] || REAL_4K_SOURCES[0].resolutions['2160p'];

    // CAPA 1: Google Cast SDK Oficial (PC Chrome/Edge y Android Chrome)
    if (typeof window !== 'undefined' && window.cast && window.cast.framework && window.chrome?.cast) {
      try {
        const context = window.cast.framework.CastContext.getInstance();
        context.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });

        await context.requestSession();
        const session = context.getCurrentSession();
        if (session) {
          const isHls =
            streamToCast.includes('.m3u8') ||
            streamToCast.includes('px.php') ||
            streamToCast.includes('vidrack');
          const contentType = isHls ? 'application/x-mpegurl' : 'video/mp4';

          const mediaInfo = new window.chrome.cast.media.MediaInfo(streamToCast, contentType);
          const metadata = new window.chrome.cast.media.GenericMediaMetadata();
          metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
          metadata.title = movie?.title
            ? `${movie.title}${movie.isTv ? ` (T${season}:E${episode})` : ''} • 4K Latino`
            : 'Cineflex 4K Español Latino';
          metadata.subtitle = 'Cineflex Max • 4K Ultra HD • Español Latino';
          if (movie?.poster_path || movie?.backdrop_path) {
            metadata.images = [new window.chrome.cast.Image(movie.poster_path || movie.backdrop_path)];
          }
          mediaInfo.metadata = metadata;

          const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
          request.autoplay = true;
          if (vEl && vEl.currentTime > 2) {
            request.currentTime = Math.floor(vEl.currentTime);
          }

          await session.loadMedia(request);
          return {
            ok: true,
            method: 'chromecast_sdk',
            message: 'Transmitiendo en Español Latino 4K a tu Chromecast / Google TV.'
          };
        }
      } catch (err) {
        if (err === 'cancel') {
          return { ok: false, method: 'cancelled', message: 'Selección de Chromecast cancelada.' };
        }
      }
    }

    // CAPA 2: W3C Remote Playback API (Nativo en Celulares y Tablets Android / Chrome)
    if (vEl && vEl.remote && typeof vEl.remote.prompt === 'function') {
      try {
        CastService.prepareVideoForWirelessCast(vEl, streamToCast);
        await vEl.remote.prompt();
        return {
          ok: true,
          method: 'remote_playback',
          message: 'Transmitiendo video directamente a tu Smart TV / Chromecast.'
        };
      } catch {}
    }

    // CAPA 3: W3C Presentation API (Smart TVs LG webOS, Samsung Tizen, Chromecast en red local)
    const tvLink = CastService.getLocalTvUrl(movie?.id || 533535, movie?.isTv, season, episode);
    if (typeof navigator !== 'undefined' && 'presentation' in navigator && window.PresentationRequest) {
      try {
        const presentationRequest = new window.PresentationRequest([streamToCast, tvLink]);
        await presentationRequest.start();
        return {
          ok: true,
          method: 'presentation_api',
          message: 'Pantalla conectada mediante Presentation API.'
        };
      } catch {}
    }

    return {
      ok: false,
      method: 'fallback',
      message: 'Usa el botón de App Cast móvil, escanea el código QR en tu TV o abre el menú Transmitir del navegador.'
    };
  },

  /**
   * Obtiene la URL de red local Wi-Fi real (reemplazando localhost por la IP LAN ej. 192.168.1.x)
   * para que cualquier Smart TV, celular o tablet en la misma red Wi-Fi pueda abrirla directamente.
   */
  getLocalTvUrl: (movieId, isTv = false, season = 1, episode = 1) => {
    if (typeof window === 'undefined') return '';
    const loc = window.location;
    const lanIp = window.__CINEFLEX_LAN_IP__;
    let origin = loc.origin;

    if (lanIp && (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1')) {
      origin = `${loc.protocol}//${lanIp}${loc.port ? `:${loc.port}` : ''}`;
    }

    return `${origin}${loc.pathname}?watch=${movieId}&type=${isTv ? 'tv' : 'movie'}&s=${season}&e=${episode}`;
  },

  /**
   * Genera enlaces directos de 1 toque para transmitir desde Celular o Tablet (iOS / Android)
   * hacia cualquier Smart TV (Samsung, LG, Roku, Fire TV, Chromecast, Apple TV)
   */
  getMobileCastAppLinks: (directStreamUrl, title = 'Cineflex 4K Latino') => {
    const cleanStream = directStreamUrl || REAL_4K_SOURCES[0].resolutions['2160p'];
    const encodedUrl = encodeURIComponent(cleanStream);
    const encodedTitle = encodeURIComponent(title);

    return {
      streamUrl: cleanStream,
      // Web Video Caster (iOS & Android -> transmite .m3u8 Latino a Samsung, LG, Roku, Chromecast, Fire TV)
      webVideoCaster: `wvc-x-callback://open?url=${encodedUrl}&title=${encodedTitle}`,
      // VLC para iOS, Android y Apple TV / Android TV
      vlc: `vlc://${cleanStream}`,
      // Intent nativo de Android para abrir reproductor/transmisor externo
      androidIntent: `intent:${cleanStream}#Intent;type=application/x-mpegURL;S.title=${encodedTitle};end`
    };
  },

  // Dispositivos Smart TV / Receptores compatibles
  getNearbySmartTVs: () => [
    {
      id: 'tv_chromecast',
      name: 'Chromecast / Google TV / Android TV',
      room: 'Transmisión Directa Google Cast (.m3u8 Latino)',
      type: 'chromecast',
      badge: 'Google Cast 4K',
      quality: '4K HDR10+ • Español Latino',
      connected: false
    },
    {
      id: 'tv_apple',
      name: 'Apple TV 4K / AirPlay 2',
      room: 'iPhone, iPad y Mac (AirPlay Nativo)',
      type: 'airplay',
      badge: 'AirPlay 2',
      quality: '4K Dolby Vision • Español Latino',
      connected: false
    },
    {
      id: 'tv_samsung_lg',
      name: 'Samsung Tizen / LG webOS / Roku / Fire TV',
      room: 'Vía Remote Playback o Web Video Caster',
      type: 'smart_tv',
      badge: 'DLNA / Smart View',
      quality: '4K Ultra HD • Español Latino',
      connected: false
    }
  ]
};
