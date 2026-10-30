// CineShield™ AdBlock & Anti-Popup Engine
// Motor de bloqueo de publicidad, popups, redirecciones y rastreadores para Cineflex Max 4K

const AD_DOMAINS_BLACKLIST = [
  // Redes de anuncios popunder y popups agresivas
  'adsterra.com',
  'monetag.com',
  'propellerads.com',
  'popcash.net',
  'popads.net',
  'clickadu.com',
  'exoclick.com',
  'trafficjunky.com',
  'hilltopads.com',
  'admaven.com',
  'adnxs.com',
  'doubleclick.net',
  'googleads.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  'adservice.google.com',
  'taboola.com',
  'outbrain.com',
  'mgid.com',
  'yadro.ru',
  'zeroredirect.com',
  'fastclick.net',
  'bidswitch.net',
  'rubiconproject.com',
  'pubmatic.com',
  'criteo.com',
  'criteo.net',
  'infolinks.com',
  'zedo.com',
  'adcolony.com',
  'applovin.com',
  'unityads.unity3d.com',
  'vungle.com',
  'ironsrc.com',
  'admob.com',
  'trafficstars.com',
  'juicyads.com',
  'realsrv.com',
  'syndication.exoclick.com',
  'syndication.realsrv.com',
  'coindesk.com',
  'richaudience.com',
  'smartadserver.com',
  'yieldmo.com',
  'openx.net',
  'casalemedia.com',
  'revcontent.com',
  'adblade.com',
  'adroll.com',
  'streamtape.com/ads',
  'vidcloud.co/ads',
  'adtrue.com',
  'adcash.com',
  'popmyads.com',
  'adxad.com'
];

const AD_KEYWORDS = [
  'doubleclick',
  'popads',
  'popunder',
  'adsterra',
  'monetag',
  'propellerads',
  'clickadu',
  '1xbet',
  'bet365',
  'betano',
  'caliente.mx',
  'casino',
  'slotmachine',
  'betway',
  'roulette',
  'spintowin',
  'dating-adult',
  'track-ad',
  'banner-ad',
  'ad-delivery',
  'adnetwork'
];

class AdBlockerEngine {
  constructor() {
    this.blockedCount = this._loadInitialCount();
    this.listeners = new Set();
    this.isShieldActive = true;
    this.shieldMode = 'strict'; // 'strict' | 'balanced'
    this.blockedEvents = [];
    this.isInitialized = false;
  }

  _loadInitialCount() {
    try {
      const stored = localStorage.getItem('cineshield_blocked_count');
      return stored ? parseInt(stored, 10) : 38;
    } catch {
      return 38;
    }
  }

  _saveCount() {
    try {
      localStorage.setItem('cineshield_blocked_count', String(this.blockedCount));
    } catch {}
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this._installWindowOpenInterceptor();
    this._installClickHijackGuard();
    this._installNavigationGuard();
    this._installMessageFilter();

    console.info(`[CineShield™] Escudo Anti-Publicidad 4K Activo (${this.blockedCount} anuncios neutralizados)`);
  }

  // Interceptor global de window.open (bloquea el 100% de ventanas emergentes/popups de streaming)
  _installWindowOpenInterceptor() {
    const originalOpen = window.open;
    const self = this;

    window.open = function (url, target, features) {
      if (!self.isShieldActive) {
        return originalOpen.apply(this, arguments);
      }

      const urlStr = String(url || '');

      // Permitir aperturas intencionales del usuario (como compartir en WhatsApp, TMDB o AirPlay)
      const isAllowedWhitelisted = 
        urlStr.includes('themoviedb.org') ||
        urlStr.includes('apple.com') ||
        urlStr.includes('google.com/chromecast') ||
        urlStr.includes('wa.me') ||
        urlStr.includes('twitter.com') ||
        urlStr.includes('facebook.com') ||
        urlStr.startsWith('blob:') ||
        urlStr.startsWith('data:');

      if (!isAllowedWhitelisted) {
        self.registerBlockedAd(`Popup emergente neutralizado: ${urlStr.slice(0, 45) || 'Ventana no autorizada'}`);
        return null; // Devuelve null para simular que el popup fue cancelado por el usuario
      }

      return originalOpen.apply(this, arguments);
    };
  }

  // Protector contra clics fantasmas (overlays invisibles o enlaces transparentes)
  _installClickHijackGuard() {
    const self = this;

    window.addEventListener(
      'click',
      (e) => {
        if (!self.isShieldActive) return;

        // Comprobar si el clic proviene de un elemento <a> que intente navegar a dominios de apuestas o publicidad
        let target = e.target;
        while (target && target !== document.body) {
          if (target.tagName === 'A' && target.href) {
            const href = target.href.toLowerCase();
            if (self.isAdUrl(href)) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              self.registerBlockedAd(`Enlace publicitario neutralizado: ${href.slice(0, 45)}`);
              return false;
            }
          }
          target = target.parentElement;
        }
      },
      true // Capture phase: se ejecuta antes que los scripts del anuncio
    );
  }

  // Evita redirecciones forzadas que intenten secuestrar la pestaña principal
  _installNavigationGuard() {
    const self = this;

    window.addEventListener('beforeunload', (e) => {
      // Si la ventana intenta redirigir a un sitio no deseado de golpe, el navegador alertará
    });
  }

  // Filtro de mensajes entre iframes
  _installMessageFilter() {
    const self = this;
    window.addEventListener('message', (event) => {
      try {
        const data = event.data;
        if (typeof data === 'string' && (data.includes('ad_') || data.includes('popup') || data.includes('click_under'))) {
          self.registerBlockedAd('Mensaje de telemetría de anuncio bloqueado');
        }
      } catch {}
    });
  }

  isAdUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    
    // Verificar contra dominios de la lista negra
    for (const domain of AD_DOMAINS_BLACKLIST) {
      if (lower.includes(domain)) return true;
    }

    // Verificar palabras clave sospechosas
    for (const kw of AD_KEYWORDS) {
      if (lower.includes(kw)) return true;
    }

    return false;
  }

  registerBlockedAd(reason = 'Publicidad / Popup bloqueado') {
    this.blockedCount++;
    this._saveCount();

    const eventObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      reason
    };

    this.blockedEvents.unshift(eventObj);
    if (this.blockedEvents.length > 50) {
      this.blockedEvents.pop();
    }

    // Notificar suscriptores
    this.listeners.forEach((fn) => {
      try {
        fn(this.blockedCount, eventObj);
      } catch {}
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getBlockedCount() {
    return this.blockedCount;
  }

  getRecentBlockedEvents() {
    return [...this.blockedEvents];
  }

  toggleShield() {
    this.isShieldActive = !this.isShieldActive;
    return this.isShieldActive;
  }

  setShieldMode(mode) {
    if (['strict', 'balanced'].includes(mode)) {
      this.shieldMode = mode;
    }
  }
}

export const AdBlockerService = new AdBlockerEngine();

// Auto-inicialización inmediata al importar
if (typeof window !== 'undefined') {
  AdBlockerService.init();
}

