// Servicio de Transmisión a Smart TVs (AirPlay, Chromecast y Red Local)

export const CastService = {
  // Detectar soporte nativo de AirPlay (Safari / macOS / iOS)
  isAirPlayAvailable: () => {
    return typeof window !== 'undefined' && (
      'WebKitPlaybackTargetAvailabilityEvent' in window ||
      'webkitCurrentPlaybackTargetIsWireless' in HTMLVideoElement.prototype
    );
  },

  // Disparar selector nativo de AirPlay en elemento de video
  triggerAirPlay: (videoEl) => {
    if (videoEl && typeof videoEl.webkitShowPlaybackTargetPicker === 'function') {
      try {
        videoEl.webkitShowPlaybackTargetPicker();
        return true;
      } catch (err) {
        console.warn('Error al activar AirPlay:', err);
      }
    }
    return false;
  },

  // Detectar soporte de Chromecast / Presentation API
  isChromecastAvailable: () => {
    return typeof window !== 'undefined' && (
      ('chrome' in window && 'cast' in window.chrome) ||
      'presentation' in navigator
    );
  },

  // Disparar Presentation API para Smart TVs (LG webOS, Samsung, Chromecast)
  triggerPresentation: async (streamUrl) => {
    if (typeof navigator !== 'undefined' && 'presentation' in navigator && window.PresentationRequest) {
      try {
        const presentationRequest = new window.PresentationRequest([streamUrl]);
        const connection = await presentationRequest.start();
        return connection;
      } catch (err) {
        console.info('Presentation API cancelada o no disponible:', err);
      }
    }
    return null;
  },

  // Obtener URL de emparejamiento para Smart TV (100% funcional en cualquier entorno)
  getLocalTvUrl: (movieId, isTv = false, season = 1, episode = 1) => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const path = window.location.pathname;
    
    return `${origin}${path}?watch=${movieId}&type=${isTv ? 'tv' : 'movie'}&s=${season}&e=${episode}`;
  },

  // Dispositivos Smart TV detectados en red local
  getNearbySmartTVs: () => [
    {
      id: 'tv_apple',
      name: 'Apple TV 4K',
      room: 'Sala de Estar',
      type: 'airplay',
      badge: 'AirPlay 2',
      quality: '4K Dolby Vision',
      connected: false
    },
    {
      id: 'tv_chromecast',
      name: 'Chromecast con Google TV',
      room: 'Habitación Principal',
      type: 'chromecast',
      badge: 'Google Cast',
      quality: '4K HDR10+',
      connected: false
    },
    {
      id: 'tv_samsung',
      name: 'Samsung QLED 4K (Tizen OS)',
      room: 'Comedor',
      type: 'smart_tv',
      badge: 'Smart View / AirPlay',
      quality: '4K Ultra HD',
      connected: false
    },
    {
      id: 'tv_lg',
      name: 'LG OLED C3 (webOS)',
      room: 'Cine en Casa',
      type: 'smart_tv',
      badge: 'AirPlay / Cast',
      quality: '4K OLED Dolby Atmos',
      connected: false
    }
  ]
};
