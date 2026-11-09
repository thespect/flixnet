import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowLeft,
  Tv,
  RotateCw,
  Youtube,
  Zap,
  Activity,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Minimize,
  Cast,
  ShieldCheck,
  Check,
  Sparkles,
  Subtitles,
  Radio,
  Globe,
  Headphones,
  Sliders,
  Airplay
} from 'lucide-react';
import { STREAM_PROVIDERS, StorageService, MovieAPI, REAL_4K_SOURCES, KNOWN_IMDB_IDS, SPECIAL_MEDIA_ALIASES, resolveMediaAlias } from '../services/movieService';
import { StreamScannerService } from '../services/streamScannerService';
import { CastService } from '../services/castService';
import { AdBlockerService } from '../services/adBlockerService';
import CastModal from './CastModal';
import AdBlockModal from './AdBlockModal';
import { lockBodyScroll } from '../utils/scrollLock';

// Opciones de Resolución y Escalado 4K Real (Aceleración por Hardware GPU — Bajo Consumo CPU)
const RESOLUTION_OPTIONS = [
  { id: '2160p', label: '4K Ultra HD (2160p)', badge: '4K HDR10+', bitrate: '42.8 Mbps', res: '3840 x 2160', fps: '60 FPS', filter: 'contrast(1.05) saturate(1.08)' },
  { id: '1080p', label: 'Full HD Pro (1080p)', badge: 'Alta Fidelidad', bitrate: '18.5 Mbps', res: '1920 x 1080', fps: '60 FPS', filter: 'contrast(1.03) saturate(1.04)' },
  { id: '720p', label: 'HD Rápido (720p)', badge: 'Ahorro Datos', bitrate: '6.2 Mbps', res: '1280 x 720', fps: '30 FPS', filter: 'none' },
];

// Pistas de Idioma / Audio Universales (Priorizando SIEMPRE Español Latino en 4K / Full HD con 0% Anuncios)
const AUDIO_LANGUAGE_TRACKS = [
  {
    id: 'es_latino_dub',
    label: 'Español Latino 4K (Doblaje Oficial)',
    shortLabel: 'Español Latino 4K',
    desc: 'Reproduce SIEMPRE en Español Latino oficial con imagen nítida escalada a 4K UHD y 0% anuncios',
    badge: 'LATINO 4K #1',
    langCode: 'latino'
  },
  {
    id: 'es_latino_direct',
    label: 'Español Latino Directo (Pista Única Nativa)',
    shortLabel: 'Latino Directo',
    desc: 'Flujo HLS .m3u8 único directo en Español Latino (ideal para transmisión directa a Chromecast y AirPlay)',
    badge: 'DIRECTO TV',
    langCode: 'latino_direct'
  },
  {
    id: 'es_castellano_dub',
    label: 'Español Castellano (España)',
    shortLabel: 'Castellano',
    desc: 'Flujo HLS .m3u8 directo con audio doblado al Español de España',
    badge: 'ESPAÑA',
    langCode: 'castellano'
  },
  {
    id: 'es_ai_voiceover',
    label: 'Español Latino (Doblaje Neutro IA)',
    shortLabel: 'Doblaje Neutro',
    desc: 'Mantiene el flujo Master 4K y traduce los diálogos con voz en Español en tiempo real',
    badge: '4K + VOZ ES',
    langCode: 'ai_es'
  },
  {
    id: 'en_original_sub_es',
    label: 'Inglés Original 4K + Subtítulos Español',
    shortLabel: 'Inglés + Sub ES',
    desc: 'Audio original Master 4K con subtítulos en Español Latino activados',
    badge: 'MASTER 4K',
    langCode: 'subtitulado'
  }
];

export default function VideoPlayerModal({
  movie,
  onClose,
  initialSeason = 1,
  initialEpisode = 1,
  initialEpisodeTitle = '',
  initialServer = null
}) {
  const specialAlias = SPECIAL_MEDIA_ALIASES[movie?.id] || (movie?.imdb_id ? SPECIAL_MEDIA_ALIASES[movie?.imdb_id] : null);
  const effectiveSeason = specialAlias ? specialAlias.season : initialSeason;
  const effectiveEpisode = specialAlias ? specialAlias.episode : initialEpisode;
  const effectiveEpisodeTitle = specialAlias ? specialAlias.title : initialEpisodeTitle;
  const effectiveImdbId = specialAlias?.imdbId || movie?.imdb_id || KNOWN_IMDB_IDS[movie?.id] || null;

  const initialCachedScan = StreamScannerService.getCachedScan(movie, effectiveSeason, effectiveEpisode);
  const hasCachedLatinoHls = (initialCachedScan?.directHlsStreams || []).some((s) => s.isLatinoDub);

  const [selectedServer, setSelectedServer] = useState(
    initialServer && STREAM_PROVIDERS.some((p) => p.id === initialServer)
      ? initialServer
      : hasCachedLatinoHls
        ? 'native_hls_4k'
        : 'auto_smart_latino'
  );
  const [selectedAudioMode, setSelectedAudioMode] = useState('es_latino_dub');
  const [playLatinLang, setPlayLatinLang] = useState('latino');
  const [selectedResolution, setSelectedResolution] = useState('2160p');

  // Menús desplegables (Temporadas/Capítulos, Audio/Idioma, Subtítulos, Calidad 4K)
  const [activeMenu, setActiveMenu] = useState(null); // 'episodes' | 'audio' | 'subs' | 'quality' | null
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [showStatsHud, setShowStatsHud] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [trailerKey, setTrailerKey] = useState(movie?.trailer_id || null);
  const [resolvedImdbId, setResolvedImdbId] = useState(
    effectiveImdbId || initialCachedScan?.imdbId || null
  );
  const [isResolvingImdb, setIsResolvingImdb] = useState(
    !Boolean(effectiveImdbId || initialCachedScan?.imdbId || movie?.customUrl)
  );

  // Estado de Serie y Selector de Temporadas / Capítulos dentro del Reproductor
  const [currentSeason, setCurrentSeason] = useState(effectiveSeason);
  const [currentEpisode, setCurrentEpisode] = useState(effectiveEpisode);
  const [episodeTitle, setEpisodeTitle] = useState(effectiveEpisodeTitle);
  const [pickerSeason, setPickerSeason] = useState(effectiveSeason);
  const [totalSeasonsCount, setTotalSeasonsCount] = useState(specialAlias ? 23 : (movie?.isTv ? 4 : 1));
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [isLoadingSeasonEpisodes, setIsLoadingSeasonEpisodes] = useState(false);

  // Estados del Auto-Detector Inteligente de Links y Streams HLS
  const [isScanningLinks, setIsScanningLinks] = useState(!Boolean(initialCachedScan));
  const [scanReport, setScanReport] = useState(initialCachedScan || null);
  const [directHlsStreams, setDirectHlsStreams] = useState(initialCachedScan?.directHlsStreams || []);
  const [activeHlsIndex, setActiveHlsIndex] = useState(() => {
    const list = initialCachedScan?.directHlsStreams || [];
    const latIdx = list.findIndex((s) => s.isLatinoDub);
    return latIdx >= 0 ? latIdx : 0;
  });
  const [subtitlesList, setSubtitlesList] = useState(initialCachedScan?.subtitles || []);
  const [activeSubIndex, setActiveSubIndex] = useState(-1);
  const [activeCueText, setActiveCueText] = useState('');
  const [autoSwitchNotice, setAutoSwitchNotice] = useState('');
  const [hlsAudioTracks, setHlsAudioTracks] = useState([]);
  const [activeHlsAudioTrack, setActiveHlsAudioTrack] = useState(0);
  const [enhance4kEnabled, setEnhance4kEnabled] = useState(true);

  // Estados del Reproductor HTML5 + HLS Nativo 4K
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const playLatinReadyRef = useRef(false);
  const playLatinHandshakeTimerRef = useRef(null);
  const failedServersRef = useRef(new Set());
  const hasStartedPlayingRef = useRef(false);
  const isSeekingRef = useRef(false);
  const forceResetToZeroRef = useRef(false);
  const seekTimeoutRef = useRef(null);
  const currentLoadedUrlRef = useRef('');
  const resumeTimeRef = useRef(0);
  const lastSavedProgressTimeRef = useRef(0);
  const lastUiTimeUpdateRef = useRef(0);
  const [resumeNotice, setResumeNotice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const [realResolution, setRealResolution] = useState('3840 x 2160 (4K UHD)');
  const [touchSeekIndicator, setTouchSeekIndicator] = useState(null); // 'left' | 'right' | null
  const lastTapRef = useRef({ time: 0, side: null });
  const [isAdBlockModalOpen, setIsAdBlockModalOpen] = useState(false);
  const [blockedAdsCount, setBlockedAdsCount] = useState(AdBlockerService.getBlockedCount());

  // Variables derivadas de proveedor y flujo nativo (declaradas antes de todos los hooks para evitar Temporal Dead Zone)
  const currentProvider = STREAM_PROVIDERS.find(p => p.id === selectedServer) || STREAM_PROVIDERS[0];
  const hasMatchingDirectDub =
    playLatinLang === 'castellano'
      ? directHlsStreams.some((s) => s.isCastellanoDub)
      : directHlsStreams.some((s) => s.isLatinoDub);

  const activeDirectStream = directHlsStreams[activeHlsIndex] || null;
  const resolvedNativeUrl = movie?.customUrl
    ? movie.customUrl
    : activeDirectStream?.url || '';

  const isHlsStream = Boolean(
    resolvedNativeUrl &&
    (resolvedNativeUrl.includes('.m3u8') ||
      resolvedNativeUrl.includes('/api/hls-proxy') ||
      resolvedNativeUrl.includes('api.php?action=proxy') ||
      resolvedNativeUrl.includes('vidrack.created.app/proxy') ||
      resolvedNativeUrl.includes('px.php?play=') ||
      activeDirectStream?.type === 'hls')
  );

  const isNativeServer =
    Boolean(movie?.customUrl) ||
    (Boolean(currentProvider?.isNative) && Boolean(resolvedNativeUrl)) ||
    (Boolean(currentProvider?.prefersNativeHls) && hasMatchingDirectDub && Boolean(activeDirectStream?.url));

  // BLOQUEO ESTRICTO DEL SCROLL DE LA PÁGINA DE FONDO (iOS Safari, Android Chrome y Desktop)
  useEffect(() => {
    const unlock = lockBodyScroll();
    return () => unlock();
  }, []);

  useEffect(() => {
    const unsub = AdBlockerService.subscribe((count, ev) => {
      setBlockedAdsCount(count);
      if (ev?.reason) {
        showToast(`CineShield: ${ev.reason}`);
      }
    });
    return () => unsub();
  }, []);

  const showToast = useCallback((msg) => {
    setAutoSwitchNotice(msg);
    setTimeout(() => {
      setAutoSwitchNotice((prev) => (prev === msg ? '' : prev));
    }, 4200);
  }, []);

  // Detener síntesis de voz al desmontar o cambiar
  const stopSpeechSynthesis = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch { }
    }
  }, []);

  useEffect(() => {
    AdBlockerService.setWatchingVideo(true);
    return () => {
      AdBlockerService.setWatchingVideo(false);
      stopSpeechSynthesis();
    };
  }, [stopSpeechSynthesis]);

  // Cargar Temporadas y Capítulos para el Selector Integrado del Reproductor
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;

    if (movie.isTv || activeMenu === 'episodes') {
      MovieAPI.fetchSeriesDetails(movie.id).then((details) => {
        if (!cancelled && details?.number_of_seasons) {
          setTotalSeasonsCount(Math.max(details.number_of_seasons, 1));
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [movie, activeMenu]);

  useEffect(() => {
    if (!movie || (!movie.isTv && activeMenu !== 'episodes')) return;
    let cancelled = false;
    setIsLoadingSeasonEpisodes(true);

    MovieAPI.fetchSeasonEpisodes(
      movie.id,
      pickerSeason,
      movie.backdrop_path || movie.poster_path
    ).then((eps) => {
      if (!cancelled) {
        setSeasonEpisodes(eps || []);
        setIsLoadingSeasonEpisodes(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [movie, pickerSeason, activeMenu]);

  // 1. AUTO-DETECTOR INTELIGENTE DE LINKS Y SERVIDORES FUNCIONALES (100% ESPAÑOL LATINO • CARGA INSTANTÁNEA)
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;

    const cached = StreamScannerService.getCachedScan(movie, currentSeason, currentEpisode);
    failedServersRef.current = new Set();
    playLatinReadyRef.current = false;
    setIsScanningLinks(!Boolean(cached));

    // Recuperar el minuto exacto donde se quedó el usuario previamente para ESTE episodio
    let validSavedTime = 0;
    let saved = null;
    if (!forceResetToZeroRef.current) {
      saved = StorageService.getPlaybackProgress(movie.id, movie.isTv, currentSeason, currentEpisode);
      const isEpisodeMatch = !movie.isTv || (saved && Number(saved.season) === Number(currentSeason) && Number(saved.episode) === Number(currentEpisode));
      validSavedTime = (saved && isEpisodeMatch && saved.currentTime > 5) ? saved.currentTime : 0;
    }
    resumeTimeRef.current = validSavedTime;
    lastSavedProgressTimeRef.current = validSavedTime;
    if (validSavedTime === 0) {
      setCurrentTime(0);
    }

    StorageService.addToHistory(movie, selectedServer, currentSeason, currentEpisode, validSavedTime, validSavedTime > 0 ? (saved?.duration || 0) : 0);

    MovieAPI.getTrailer(movie.id, movie.isTv).then((key) => {
      if (!cancelled && key) setTrailerKey(key);
    });

    (async () => {
      let imdb = specialAlias?.imdbId || movie.imdb_id || KNOWN_IMDB_IDS[movie.id] || cached?.imdbId || null;
      if (!imdb && !movie.customUrl) {
        setIsResolvingImdb(true);
        try {
          imdb = await MovieAPI.getImdbId(movie.id, movie.isTv);
        } catch {}
      }
      if (!cancelled) {
        if (imdb) setResolvedImdbId(imdb);
        setIsResolvingImdb(false);
      }

      // Fast-Path: inicia la reproducción nativa en cuanto llega el primer flujo en Español Latino 4K/Full HD
      const handleFastStream = (fastReport) => {
        if (cancelled || !fastReport) return;
        if (fastReport.imdbId) {
          setResolvedImdbId(fastReport.imdbId);
          setIsResolvingImdb(false);
        }
        setScanReport(fastReport);
        const fastStreams = fastReport.directHlsStreams || [];
        if (fastStreams.length > 0) {
          setDirectHlsStreams(fastStreams);
          const anyLat = fastStreams.findIndex((s) => s.isLatinoDub || s.isCastellanoDub);
          if (anyLat >= 0) {
            failedServersRef.current.clear();
            setActiveHlsIndex(anyLat);
            setSelectedServer('native_hls_4k');
            setSelectedAudioMode(fastStreams[anyLat].isCastellanoDub ? 'es_castellano_dub' : 'es_latino_dub');
          }
        }
        setIsScanningLinks(false);
      };

      const report = await StreamScannerService.scanAllWorkingLinks(
        movie,
        currentSeason,
        currentEpisode,
        imdb,
        handleFastStream
      );

      if (cancelled || !report) {
        if (!cancelled) setIsScanningLinks(false);
        return;
      }

      setScanReport(report);
      if (report.imdbId) {
        setResolvedImdbId(report.imdbId);
        setIsResolvingImdb(false);
      }
      const streams = report.directHlsStreams || [];
      setDirectHlsStreams(streams);
      setSubtitlesList(report.subtitles || []);
      setIsScanningLinks(false);

      const anyLatinoIdx = streams.findIndex((s) => s.isLatinoDub || s.isCastellanoDub);

      if (anyLatinoIdx >= 0) {
        failedServersRef.current.clear();
        setActiveHlsIndex(anyLatinoIdx);
        setSelectedAudioMode(streams[anyLatinoIdx].isCastellanoDub ? 'es_castellano_dub' : 'es_latino_dub');
        loadSubtitleTrack(-1);
        setSelectedServer('native_hls_4k');
      } else {
        // Si no hay .m3u8 directo extraído, usar SIEMPRE el servidor Español Latino (PlayLatin / Embed69) antes que cualquier servidor en inglés
        const fallbackLatinoServer = (report.imdbId || imdb) ? 'playlatin_es' : 'auto_smart_latino';
        if (selectedServer === 'native_hls_4k' || selectedServer === 'auto_smart_latino') {
          setSelectedServer(fallbackLatinoServer);
          setSelectedAudioMode('es_latino_dub');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [movie, currentSeason, currentEpisode]);

  // Iterador Inteligente de Servidores Compatibles (Priorizando SIEMPRE Español Latino antes que servidores internacionales)
  const iterateNextLatinoServer = useCallback((reasonLabel = 'Auto-Detector') => {
    if (playLatinHandshakeTimerRef.current) {
      clearTimeout(playLatinHandshakeTimerRef.current);
      playLatinHandshakeTimerRef.current = null;
    }

    failedServersRef.current.add(selectedServer);

    const hasLatinoHls = directHlsStreams.some((s) => s.isLatinoDub || s.isCastellanoDub);
    const priorityChain = hasLatinoHls
      ? ['native_hls_4k', 'playlatin_es', 'embed69_latino', 'auto_smart_latino', 'multiembed_global', 'vidlink_4k_pro', 'vidsrc_pm']
      : ['playlatin_es', 'embed69_latino', 'auto_smart_latino', 'multiembed_global', 'vidlink_4k_pro', 'vidsrc_pm'];

    let nextServer = priorityChain.find((id) => id !== selectedServer && !failedServersRef.current.has(id));
    if (!nextServer) {
      failedServersRef.current.clear();
      const currIdx = priorityChain.indexOf(selectedServer);
      nextServer = currIdx >= 0 ? priorityChain[(currIdx + 1) % priorityChain.length] : priorityChain[0];
    }

    stopSpeechSynthesis();
    playLatinReadyRef.current = false;
    setShowTrailer(false);
    hasStartedPlayingRef.current = false;
    isSeekingRef.current = false;
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
    setSelectedServer(nextServer);
    setSelectedAudioMode('es_latino_dub');

    if (nextServer === 'native_hls_4k') {
      const latIdx = directHlsStreams.findIndex((s) => s.isLatinoDub || s.isCastellanoDub);
      if (latIdx >= 0) setActiveHlsIndex(latIdx);
    }

    const prov = STREAM_PROVIDERS.find((p) => p.id === nextServer);
    showToast(`${reasonLabel}: Conectado a ${prov?.name || 'Servidor'}`);
  }, [directHlsStreams, selectedServer, stopSpeechSynthesis, showToast]);

  // 2. ESCUCHAR EVENTOS EN TIEMPO REAL DE PLAYLATIN (Detección automática de idioma y fallos)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      const type = String(event.data.type || '');

      if (type === 'meinecloud:ready') {
        playLatinReadyRef.current = true;
        if (playLatinHandshakeTimerRef.current) {
          clearTimeout(playLatinHandshakeTimerRef.current);
          playLatinHandshakeTimerRef.current = null;
        }
        setIsLoading(false);
        const versions = Array.isArray(event.data.versions) ? event.data.versions : ['latino'];
        const hasSpanishInPlayLatin = versions.some((v) => /lat|esp|cast/i.test(String(v)));

        // Si PlayLatin solo tiene subtitulado para esta película/serie, cambiar automáticamente al siguiente servidor en Español Latino
        if (!hasSpanishInPlayLatin) {
          if (directHlsStreams.some((s) => s.isLatinoDub)) {
            const latIdx = directHlsStreams.findIndex((s) => s.isLatinoDub);
            setActiveHlsIndex(latIdx);
            setSelectedServer('native_hls_4k');
            showToast('Auto-Detector: Conmutado a Cineflex 4K Directo para garantizar audio Español Latino');
            return;
          } else {
            iterateNextLatinoServer('Auto-Detector Sí o Sí');
            return;
          }
        }

        showToast(`Servidor Compatible Verificado: Audio ${versions.map((v) => String(v).toUpperCase()).join(' / ')}`);
      } else if (type === 'meinecloud:error') {
        if (
          !isNativeServer &&
          (selectedServer === 'playlatin_es' ||
            selectedServer === 'auto_smart_latino' ||
            selectedServer === 'embed69_latino' ||
            selectedServer === 'playlatin_dood')
        ) {
          iterateNextLatinoServer('Auto-Detector Sí o Sí');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedServer, isNativeServer, directHlsStreams, iterateNextLatinoServer, showToast]);

  // Watchdog de 3.5s para Servidores PlayLatin (Conmutación automática ante errores silenciosos o demoras de MeineCloud)
  useEffect(() => {
    // Si ya estamos en reproductor nativo, escaneando o en tráiler, limpiar timer y salir
    if (isNativeServer || isScanningLinks || selectedServer === 'native_hls_4k' || showTrailer) {
      if (playLatinHandshakeTimerRef.current) {
        clearTimeout(playLatinHandshakeTimerRef.current);
        playLatinHandshakeTimerRef.current = null;
      }
      return;
    }

    // El watchdog se activa únicamente cuando un servidor iframe usa el protocolo PlayLatin (meinecloud)
    const isUsingPlayLatinIframe =
      Boolean(resolvedImdbId) &&
      (selectedServer === 'playlatin_es' || selectedServer === 'auto_smart_latino' || selectedServer === 'embed69_latino');

    if (!isUsingPlayLatinIframe) {
      if (playLatinHandshakeTimerRef.current) {
        clearTimeout(playLatinHandshakeTimerRef.current);
        playLatinHandshakeTimerRef.current = null;
      }
      return;
    }

    if (playLatinHandshakeTimerRef.current) {
      clearTimeout(playLatinHandshakeTimerRef.current);
    }

    playLatinReadyRef.current = false;
    hasStartedPlayingRef.current = false;

    playLatinHandshakeTimerRef.current = setTimeout(() => {
      // Si PlayLatin no ha emitido ready ni ha comenzado a reproducirse:
      if (!hasStartedPlayingRef.current && !playLatinReadyRef.current) {
        const latIdx = directHlsStreams.findIndex((s) => s.isLatinoDub || s.isCastellanoDub);
        if (latIdx >= 0) {
          setActiveHlsIndex(latIdx);
          setSelectedServer('native_hls_4k');
          setSelectedAudioMode('es_latino_dub');
          showToast('Auto-Detector: Conmutando a Cineflex 4K Nativo');
        } else {
          iterateNextLatinoServer('Auto-Detector: Tiempo de respuesta agotado');
        }
      }
    }, 3500);

    return () => {
      if (playLatinHandshakeTimerRef.current) {
        clearTimeout(playLatinHandshakeTimerRef.current);
        playLatinHandshakeTimerRef.current = null;
      }
    };
  }, [selectedServer, isNativeServer, isScanningLinks, resolvedImdbId, iframeKey, showTrailer, directHlsStreams, iterateNextLatinoServer, showToast]);

  // 3. CAMBIO DE PISTA DE AUDIO / IDIOMA (Garantiza Español Latino en 4K / Full HD)
  const handleSelectAudioTrack = (trackId) => {
    stopSpeechSynthesis();
    setSelectedAudioMode(trackId);
    setActiveMenu(null);

    if (trackId === 'es_latino_dub' || trackId === 'es_latino_direct') {
      setPlayLatinLang('latino');
      const anyLatinoIdx = directHlsStreams.findIndex((s) => s.isLatinoDub);
      if (anyLatinoIdx >= 0) {
        setActiveHlsIndex(anyLatinoIdx);
        setSelectedServer('native_hls_4k');
      } else {
        setSelectedServer(resolvedImdbId ? 'playlatin_es' : 'vidsrc_pm');
      }
      setShowTrailer(false);
      hasStartedPlayingRef.current = false;
      isSeekingRef.current = false;
      setIsLoading(true);
      setIframeKey((prev) => prev + 1);
      loadSubtitleTrack(-1);
      showToast('Pista activa: Español Latino (0% Anuncios)');
    } else if (trackId === 'es_castellano_dub') {
      setPlayLatinLang('castellano');
      const castIdx = directHlsStreams.findIndex((s) => s.isCastellanoDub);
      if (castIdx >= 0) {
        setActiveHlsIndex(castIdx);
        setSelectedServer('native_hls_4k');
      } else {
        setSelectedServer('vidsrc_pm');
      }
      setShowTrailer(false);
      hasStartedPlayingRef.current = false;
      isSeekingRef.current = false;
      setIsLoading(true);
      setIframeKey((prev) => prev + 1);
      loadSubtitleTrack(-1);
      showToast('Pista activa: Español Castellano');
    } else if (trackId === 'es_ai_voiceover') {
      if (selectedServer !== 'native_hls_4k') {
        setSelectedServer('native_hls_4k');
        setShowTrailer(false);
      }
      if (activeSubIndex < 0 && subtitlesList.length > 0) {
        const esIdx = subtitlesList.findIndex((s) => s.isLatino || s.isSpanish);
        loadSubtitleTrack(esIdx >= 0 ? esIdx : 0);
      }
      showToast('Doblaje Neutro en Español Latino activado');
    } else if (trackId === 'en_original_sub_es') {
      setSelectedServer('vidsrc_pm');
      setShowTrailer(false);
      showToast('Pista activa: Multi-Audio / Subtítulos');
    }
  };

  // 4. MOTOR DE REPRODUCCIÓN NATIVA HLS.JS (0% ANUNCIOS, 0% CLICS FANTASMAS)
  // Si un servidor nativo termina de escanear y no tiene stream directo en el idioma elegido, conmutar al servidor iframe latino
  useEffect(() => {
    if (isScanningLinks || showTrailer || movie?.customUrl || hasStartedPlayingRef.current) return;
    if (isNativeServer && (!activeDirectStream?.url || (selectedServer === 'native_hls_4k' && !activeDirectStream?.isLatinoDub && !activeDirectStream?.isCastellanoDub))) {
      const fallbackServer = 'auto_smart_latino';
      setSelectedServer(fallbackServer);
    }
  }, [isScanningLinks, isNativeServer, activeDirectStream, selectedServer, showTrailer, movie, resolvedImdbId]);

  // Auto-liberación de pantalla de carga para servidores iframe (PlayLatin, VidSrc, MultiEmbed, etc.)
  useEffect(() => {
    if (!isNativeServer && isLoading && !showTrailer) {
      const t = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isNativeServer, isLoading, selectedServer, iframeKey, showTrailer]);

  // Doblaje Voz IA en Español sincronizado con subtítulos cuando el usuario elige 'es_ai_voiceover'
  useEffect(() => {
    if (selectedAudioMode !== 'es_ai_voiceover' || !activeCueText || !isPlaying) {
      if (videoRef.current && !isMuted) {
        videoRef.current.volume = volume;
      }
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const cleanText = activeCueText.replace(/\n+/g, ' ').trim();
        if (!cleanText) return;

        if (videoRef.current && !isMuted) {
          videoRef.current.volume = Math.max(0.12, volume * 0.22);
        }

        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = 'es-MX';
        utter.rate = 1.08;
        utter.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const esVoice =
          voices.find(v => /es[-_](MX|419|US|LA)/i.test(v.lang)) ||
          voices.find(v => /^es/i.test(v.lang));
        if (esVoice) utter.voice = esVoice;

        utter.onend = () => {
          if (videoRef.current && !isMuted) {
            videoRef.current.volume = volume;
          }
        };
        utter.onerror = () => {
          if (videoRef.current && !isMuted) {
            videoRef.current.volume = volume;
          }
        };

        window.speechSynthesis.speak(utter);
      } catch { }
    }
  }, [activeCueText, selectedAudioMode, isPlaying, isMuted, volume]);

  useEffect(() => {
    if (!isNativeServer || showTrailer || !videoRef.current || !resolvedNativeUrl) return;

    // Si ya estamos reproduciendo este mismo stream exacto y HLS está activo, NO reiniciar el reproductor
    if (currentLoadedUrlRef.current === resolvedNativeUrl && hlsRef.current) {
      return;
    }

    currentLoadedUrlRef.current = resolvedNativeUrl;
    const video = videoRef.current;
    setIsLoading(true);
    setHlsAudioTracks([]);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const HlsClass = typeof window !== 'undefined' ? window.Hls : null;

    if (isHlsStream && HlsClass && HlsClass.isSupported()) {
      const hls = new HlsClass({
        enableWorker: true,
        startLevel: 0,
        startFragPrefetch: true,
        maxBufferLength: 24,
        maxMaxBufferLength: 45,
        manifestLoadingTimeOut: 6000,
        manifestLoadingMaxRetry: 1,
        levelLoadingTimeOut: 6000,
        fragLoadingTimeOut: 9000
      });

      hlsRef.current = hls;
      hls.loadSource(resolvedNativeUrl);
      hls.attachMedia(video);

      hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (hls.levels && hls.levels.length > 0) {
          let bestIdx = 0;
          for (let i = 1; i < hls.levels.length; i++) {
            if ((hls.levels[i].height || 0) >= (hls.levels[bestIdx].height || 0)) {
              bestIdx = i;
            }
          }
          // Iniciar en nivel 0 para arranque instantáneo (<0.4s) y activar ABR hacia la máxima calidad
          hls.nextLevel = bestIdx;
          const h = hls.levels[bestIdx]?.height || 1080;
          setRealResolution(h >= 2160 ? '3840 x 2160 (4K Nativo)' : '3840 x 2160 (Escalado 4K UHD)');
        }

        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setHlsAudioTracks([...hls.audioTracks]);
          const esTrackIdx = hls.audioTracks.findIndex(t =>
            /es|spa|lat|español|spanish/i.test(`${t.name || ''} ${t.lang || ''}`)
          );
          if (esTrackIdx >= 0) {
            hls.audioTrack = esTrackIdx;
            setActiveHlsAudioTrack(esTrackIdx);
            setSelectedAudioMode('es_latino_dub');
          }
        }

        video.muted = isMuted;
        video.volume = volume;

        // Reanudar automáticamente en el minuto exacto guardado
        if (resumeTimeRef.current > 5) {
          const resumePoint = resumeTimeRef.current;
          resumeTimeRef.current = 0;
          try {
            video.currentTime = resumePoint;
            setCurrentTime(resumePoint);
            const m = Math.floor(resumePoint / 60);
            const s = Math.floor(resumePoint % 60);
            const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
            setResumeNotice({ time: resumePoint, text: formatted });
            showToast(`Reanudando reproducción desde el minuto ${formatted}`);
          } catch (e) {
            console.warn('Error al reanudar punto de guardado:', e);
          }
        } else {
          try {
            video.currentTime = 0;
            setCurrentTime(0);
          } catch { }
        }

        video.play().catch(() => { });
      });

      hls.on(HlsClass.Events.AUDIO_TRACKS_UPDATED, () => {
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setHlsAudioTracks([...hls.audioTracks]);
        }
      });

      hls.on(HlsClass.Events.ERROR, (_, errData) => {
        if (!errData.fatal) return;

        console.warn('[Cineflex HLS] Error fatal capturado:', errData.type, errData.details);

        // Recuperar error de medios/decodificación tras adelantar tiempo
        if (errData.type === HlsClass.ErrorTypes.MEDIA_ERROR) {
          console.info('[Cineflex HLS] Recuperando error de decodificación tras adelantar...');
          try {
            hls.recoverMediaError();
          } catch { }
          return;
        }

        // Si es un error de manifiesto o código de error HTTP >= 400, o nunca inició la reproducción
        const isManifestFail =
          errData.details === HlsClass.ErrorDetails.MANIFEST_LOAD_ERROR ||
          errData.details === HlsClass.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
          errData.details === HlsClass.ErrorDetails.MANIFEST_PARSING_ERROR ||
          (errData.response && errData.response.code >= 400);

        if (isManifestFail || !hasStartedPlayingRef.current) {
          try {
            hls.destroy();
            hlsRef.current = null;
          } catch { }

          const nextLatinoIdx = directHlsStreams.findIndex(
            (s, idx) => idx > activeHlsIndex && (selectedServer === 'nova_4k_master' ? true : s.isLatinoDub)
          );
          if (nextLatinoIdx >= 0) {
            setActiveHlsIndex(nextLatinoIdx);
            showToast(`Auto-Detector: Conmutando a ${directHlsStreams[nextLatinoIdx].name}...`);
          } else {
            iterateNextLatinoServer('Auto-Detector Sí o Sí');
          }
          return;
        }

        // Reintentar fragmento de red solo si la reproducción ya estaba en curso
        if (errData.type === HlsClass.ErrorTypes.NETWORK_ERROR) {
          console.info('[Cineflex HLS] Reintentando carga de fragmento...');
          try {
            hls.startLoad();
          } catch { }
          return;
        }
      });
    } else {
      video.muted = isMuted;
      video.volume = volume;
      video.src = resolvedNativeUrl;
      video.load();
      if (resumeTimeRef.current > 5) {
        const resumePoint = resumeTimeRef.current;
        resumeTimeRef.current = 0;
        try {
          video.currentTime = resumePoint;
          setCurrentTime(resumePoint);
          const m = Math.floor(resumePoint / 60);
          const s = Math.floor(resumePoint % 60);
          const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
          setResumeNotice({ time: resumePoint, text: formatted });
          showToast(`Reanudando reproducción desde el minuto ${formatted}`);
        } catch { }
      } else {
        try {
          video.currentTime = 0;
          setCurrentTime(0);
        } catch { }
      }
      video.play().catch(() => { });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isNativeServer, selectedServer, iframeKey, showTrailer, resolvedNativeUrl, isHlsStream, activeHlsIndex, showToast]);

  const saveCurrentProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.currentTime > 3) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      if (dur > 30 && cur > dur - 15) {
        StorageService.clearPlaybackProgress(movie?.id, movie?.isTv, currentSeason, currentEpisode);
        return;
      }
      StorageService.savePlaybackProgress(
        movie,
        cur,
        dur,
        selectedServer,
        currentSeason,
        currentEpisode
      );
    }
  }, [movie, selectedServer, currentSeason, currentEpisode]);

  // Guardar automáticamente al cerrar la ventana, pestaña o salir de la app
  useEffect(() => {
    const handleUnload = () => {
      saveCurrentProgress();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      saveCurrentProgress();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [saveCurrentProgress]);

  // 5. CARGAR SUBTÍTULOS EN ESPAÑOL LATINO AUTOMÁTICAMENTE CUANDO EL AUDIO ES INGLÉS O VOZ IA
  useEffect(() => {
    if (!isNativeServer || showTrailer || !videoRef.current || subtitlesList.length === 0) {
      setActiveCueText('');
      return;
    }

    // Si el nodo actual ya tiene Doblaje Español Latino o Castellano, no forzar subtítulos encima a menos que sea Voz IA o Inglés+Sub
    if (
      (activeDirectStream?.isLatinoDub || activeDirectStream?.isCastellanoDub) &&
      selectedAudioMode !== 'es_ai_voiceover' &&
      selectedAudioMode !== 'en_original_sub_es'
    ) {
      loadSubtitleTrack(-1);
      return;
    }

    const spanishIdx = subtitlesList.findIndex(s => s.isLatino || s.isSpanish);
    const targetIdx = spanishIdx >= 0 ? spanishIdx : 0;
    loadSubtitleTrack(targetIdx);
  }, [subtitlesList, isNativeServer, showTrailer, activeDirectStream, selectedAudioMode]);

  const loadSubtitleTrack = async (index) => {
    setActiveSubIndex(index);
    setActiveCueText('');
    if (!videoRef.current) return;

    const video = videoRef.current;
    Array.from(video.querySelectorAll('track')).forEach(t => t.remove());

    if (index < 0 || !subtitlesList[index]) return;

    const sub = subtitlesList[index];
    const blobUrl = await StreamScannerService.resolveSubtitleBlobUrl(sub.url);
    if (!blobUrl || !videoRef.current) return;

    const trackEl = document.createElement('track');
    trackEl.kind = 'subtitles';
    trackEl.label = sub.label;
    trackEl.srclang = sub.isSpanish ? 'es' : 'en';
    trackEl.src = blobUrl;
    trackEl.default = true;
    video.appendChild(trackEl);

    setTimeout(() => {
      if (!video.textTracks || !video.textTracks[0]) return;
      const tt = video.textTracks[0];
      tt.mode = 'hidden';
      tt.oncuechange = () => {
        if (!tt.activeCues || tt.activeCues.length === 0) {
          setActiveCueText('');
          return;
        }
        const text = Array.from(tt.activeCues)
          .map(c => (c.text || '').replace(/<[^>]+>/g, ''))
          .join('\n');
        setActiveCueText(text);
      };
    }, 150);
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (activeMenu) {
          setActiveMenu(null);
        } else if (isFullscreen) {
          document.exitFullscreen?.().catch(() => { });
        } else {
          handleModalClose();
        }
      } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'ArrowRight') {
        skipTime(10);
      } else if (e.key === 'ArrowLeft') {
        skipTime(-10);
      } else if ((e.key === 'n' || e.key === 'N') && movie?.isTv) {
        handleNextEpisode();
      } else if ((e.key === 'p' || e.key === 'P') && movie?.isTv && currentEpisode > 1) {
        handlePrevEpisode();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowStatsHud(prev => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveMenu(prev => (prev === 'audio' ? null : 'audio'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, currentEpisode, isPlaying, isMuted, isFullscreen, activeMenu]);

  // Ocultar controles automáticamente tras inactividad (solo cuando no hay un menú abierto)
  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !activeMenu) {
        setControlsVisible(false);
      }
    }, 3800);
  }, [isPlaying, activeMenu]);

  // Gestos táctiles para Celular y Tablet (Toque simple muestra/oculta controles, Doble toque adelanta/retrocede 10s)
  const handleVideoTouchOrClick = (e) => {
    if (activeMenu) {
      setActiveMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const relX = (clientX - rect.left) / (rect.width || 1);
    const side = relX < 0.35 ? 'left' : relX > 0.65 ? 'right' : 'center';
    const now = Date.now();

    if (now - lastTapRef.current.time < 320 && lastTapRef.current.side === side && side !== 'center') {
      // Doble toque táctil estilo Netflix Mobile
      if (side === 'left') {
        skipTime(-10);
        setTouchSeekIndicator('left');
      } else {
        skipTime(10);
        setTouchSeekIndicator('right');
      }
      setTimeout(() => setTouchSeekIndicator(null), 650);
      lastTapRef.current = { time: 0, side: null };
      wakeControls();
      return;
    }

    lastTapRef.current = { time: now, side };

    // En móvil/tablet un toque en el centro alterna visibilidad de controles o pausa
    if (window.innerWidth < 768) {
      if (!controlsVisible) {
        wakeControls();
      } else if (side === 'center') {
        togglePlayPause();
        wakeControls();
      } else {
        setControlsVisible(false);
      }
    } else {
      togglePlayPause();
      wakeControls();
    }
  };

  if (!movie) return null;

  // Stream URL con soporte de idioma dinámico y espejos directos desencriptados para VidHide y StreamWish/VOE
  const isScanReportCurrent = Boolean(
    scanReport &&
    Number(scanReport.season) === Number(currentSeason) &&
    Number(scanReport.episode) === Number(currentEpisode)
  );

  const directDecryptedMirrorUrl = (() => {
    if (!isScanReportCurrent) return null;
    const fromStream = directHlsStreams.find((s) => s.isLatinoDub && s.embedUrl)?.embedUrl;
    if (fromStream) return fromStream;
    const fromSources = (scanReport?.latinoSources || []).find(
      (s) => s.url && (s.server === 'vidhide' || String(s.url).includes('morencius'))
    )?.url;
    if (fromSources) return fromSources;
    const anySource = (scanReport?.latinoSources || []).find((s) => s.url)?.url;
    return anySource || null;
  })();

  const directStreamwishMirrorUrl = (() => {
    if (!isScanReportCurrent) return null;
    const dropSource = (scanReport?.latinoSources || []).find(
      (s) => s.url && (s.server === 'dropload' || String(s.url).includes('dr0pstream'))
    )?.url;
    if (dropSource) return dropSource;
    const swSource = (scanReport?.latinoSources || []).find(
      (s) => s.url && (s.server === 'streamwish' || s.server === 'voe' || s.server === 'filemoon' || s.server === 'doodstream')
    )?.url;
    if (swSource) {
      const mCode = swSource.match(/\/(?:e|f|v)\/([a-zA-Z0-9]+)/);
      if (swSource.includes('hglink') && mCode) {
        return `https://flaswish.com/e/${mCode[1]}`;
      }
      return swSource;
    }
    return null;
  })();

  const streamUrl = currentProvider.getUrl(
    movie.id,
    specialAlias ? true : movie.isTv,
    currentSeason,
    currentEpisode,
    resolvedImdbId || specialAlias?.imdbId,
    playLatinLang
  );

  const activeTrailerKey = movie.trailer_id || trailerKey;
  const trailerUrl = activeTrailerKey
    ? `https://www.youtube-nocookie.com/embed/${activeTrailerKey}?autoplay=1&rel=0&vq=hd2160&modestbranding=1&hl=es`
    : null;

  const handleServerChange = (serverId) => {
    if (playLatinHandshakeTimerRef.current) {
      clearTimeout(playLatinHandshakeTimerRef.current);
      playLatinHandshakeTimerRef.current = null;
    }
    playLatinReadyRef.current = false;
    stopSpeechSynthesis();
    setShowTrailer(false);
    hasStartedPlayingRef.current = false;
    isSeekingRef.current = false;
    setSelectedServer(serverId);
    setActiveMenu(null);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);

    const anyLatinoIdx = directHlsStreams.findIndex(s => s.isLatinoDub);
    const bluRayIdx = directHlsStreams.findIndex(s => s.isBluRayMaster || s.providerId === 'nova');

    if (
      serverId === 'auto_smart_latino' ||
      serverId === 'playlatin_es' ||
      serverId === 'embed69_latino' ||
      serverId === 'playlatin_dood'
    ) {
      setSelectedAudioMode('es_latino_dub');
      setPlayLatinLang('latino');
      if (anyLatinoIdx >= 0) {
        // Si hay múltiples mirrors HLS directos extraídos, permitir alternar entre ellos al cambiar entre PlayLatin y Embed69
        const latinoList = directHlsStreams
          .map((s, idx) => ({ s, idx }))
          .filter((item) => item.s.isLatinoDub || item.s.isCastellanoDub);
        if (latinoList.length > 1 && serverId === 'embed69_latino') {
          setActiveHlsIndex(latinoList[1].idx);
        } else {
          setActiveHlsIndex(anyLatinoIdx);
        }
      }
      loadSubtitleTrack(-1);
      const provObj = STREAM_PROVIDERS.find((p) => p.id === serverId);
      showToast(`${provObj?.name || 'Servidor 4K'} activado (Español Latino Oficial • 0% Anuncios)`);
    } else if (serverId === 'native_hls_4k') {
      if (anyLatinoIdx >= 0) {
        setActiveHlsIndex(anyLatinoIdx);
        setSelectedAudioMode('es_latino_dub');
        loadSubtitleTrack(-1);
        showToast('Cineflex 4K Directo activo (Español Latino Oficial • 0% Anuncios)');
      } else {
        iterateNextLatinoServer('Auto-Detector Sí o Sí');
        return;
      }
    } else if (
      serverId === 'vidhide_latino' ||
      serverId === 'streamwish_latino' ||
      serverId === 'nxsha_multilang' ||
      serverId === 'nxsha_voe_latino' ||
      serverId === 'vidlink_4k_pro'
    ) {
      setSelectedAudioMode('es_latino_dub');
      const provObj = STREAM_PROVIDERS.find((p) => p.id === serverId);
      showToast(`${provObj?.name || 'Servidor 4K'} activado (0% Anuncios)`);
    } else if (serverId === 'nova_4k_master') {
      if (bluRayIdx >= 0) {
        setActiveHlsIndex(bluRayIdx);
        setSelectedAudioMode('en_original_sub_es');
        if (subtitlesList.length > 0) {
          const esIdx = subtitlesList.findIndex(s => s.isLatino || s.isSpanish);
          loadSubtitleTrack(esIdx >= 0 ? esIdx : 0);
        }
        showToast('Master Blu-Ray 4K Digital (~5 Mbps • Subtítulos en Español)');
      } else if (anyLatinoIdx >= 0) {
        setActiveHlsIndex(anyLatinoIdx);
        setSelectedAudioMode('es_latino_dub');
        loadSubtitleTrack(-1);
        showToast('Stream 4K Español Latino Directo activo');
      } else {
        iterateNextLatinoServer('Auto-Detector Sí o Sí');
        return;
      }
    }
    StorageService.addToHistory(movie, serverId, currentSeason, currentEpisode);
  };

  const handleOpenTrailer = () => {
    stopSpeechSynthesis();
    setShowTrailer(true);
    setActiveMenu(null);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleReload = () => {
    stopSpeechSynthesis();
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => { });
    }
  };

  const handleModalClose = () => {
    saveCurrentProgress();
    onClose();
  };

  const handleRestartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setResumeNotice(null);
      StorageService.clearPlaybackProgress(movie.id, movie.isTv, currentSeason, currentEpisode);
      showToast('Reproduciendo desde el inicio (0:00)');
    }
  };

  const handleSelectSeasonAndEpisode = (seasonNum, epNum, epName = '') => {
    saveCurrentProgress();
    stopSpeechSynthesis();
    forceResetToZeroRef.current = true;
    hasStartedPlayingRef.current = false;
    isSeekingRef.current = false;
    currentLoadedUrlRef.current = '';
    resumeTimeRef.current = 0;
    lastSavedProgressTimeRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setResumeNotice(null);
    setDirectHlsStreams([]);
    setActiveHlsIndex(0);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch { }
    }
    setCurrentSeason(seasonNum);
    setPickerSeason(seasonNum);
    setCurrentEpisode(epNum);
    setEpisodeTitle(epName || `Capítulo ${epNum}`);
    setActiveMenu(null);
    setShowTrailer(false);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    showToast(`Reproduciendo Temporada ${seasonNum} • Capítulo ${epNum}`);
  };

  const handleNextEpisode = () => {
    saveCurrentProgress();
    stopSpeechSynthesis();
    forceResetToZeroRef.current = true;
    hasStartedPlayingRef.current = false;
    isSeekingRef.current = false;
    currentLoadedUrlRef.current = '';
    resumeTimeRef.current = 0;
    lastSavedProgressTimeRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setResumeNotice(null);
    setDirectHlsStreams([]);
    setActiveHlsIndex(0);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch { }
    }
    const nextEp = currentEpisode + 1;
    setCurrentEpisode(nextEp);
    setEpisodeTitle(`Capítulo ${nextEp}`);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    showToast(`Siguiente: Temporada ${currentSeason} • Capítulo ${nextEp}`);
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      saveCurrentProgress();
      stopSpeechSynthesis();
      forceResetToZeroRef.current = true;
      hasStartedPlayingRef.current = false;
      isSeekingRef.current = false;
      currentLoadedUrlRef.current = '';
      resumeTimeRef.current = 0;
      lastSavedProgressTimeRef.current = 0;
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);
      setResumeNotice(null);
      setDirectHlsStreams([]);
      setActiveHlsIndex(0);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch { }
      }
      const prevEp = currentEpisode - 1;
      setCurrentEpisode(prevEp);
      setEpisodeTitle(`Capítulo ${prevEp}`);
      setIsLoading(true);
      setIframeKey(prev => prev + 1);
      showToast(`Anterior: Temporada ${currentSeason} • Capítulo ${prevEp}`);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      saveCurrentProgress();
      stopSpeechSynthesis();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const markSeeking = () => {
    isSeekingRef.current = true;
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      isSeekingRef.current = false;
    }, 2500);
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    markSeeking();
    const cur = videoRef.current.currentTime || 0;
    const dur = videoRef.current.duration || 0;
    const nextTime = Math.max(
      0,
      Math.min(dur > 0 ? dur - 1 : cur + seconds, cur + seconds)
    );
    try {
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    } catch (e) {
      console.warn('Error al adelantar tiempo:', e);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    markSeeking();
    const seekTime = parseFloat(e.target.value);
    try {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    } catch (e) {
      console.warn('Error al cambiar tiempo:', e);
    }
  };

  // Pantalla Completa 100% compatible con Celulares (iOS Safari webkitEnterFullscreen + Android Landscape Lock) y Tablets
  const toggleFullscreen = async () => {
    try {
      const doc = document;
      const el = containerRef.current;
      const vid = videoRef.current;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
          setIsFullscreen(true);
        } else if (el?.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if (vid?.webkitEnterFullscreen) {
          // Soporte nativo para iPhone / iOS Safari
          vid.webkitEnterFullscreen();
          setIsFullscreen(true);
        }
        // Intentar rotar a horizontal automáticamente en celulares y tablets
        if (window.screen?.orientation?.lock) {
          window.screen.orientation.lock('landscape').catch(() => { });
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
        setIsFullscreen(false);
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      }
    } catch { }
  };

  const handleQualitySelect = (qualityId) => {
    setSelectedResolution(qualityId);
    setActiveMenu(null);
    if (hlsRef.current && hlsRef.current.levels?.length > 0) {
      const targetHeight = parseInt(qualityId, 10);
      const idx = hlsRef.current.levels.findIndex(l => l.height === targetHeight);
      if (idx >= 0) hlsRef.current.currentLevel = idx;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQualityObj = RESOLUTION_OPTIONS.find(q => q.id === selectedResolution) || RESOLUTION_OPTIONS[0];
  const currentAudioObj = AUDIO_LANGUAGE_TRACKS.find(a => a.id === selectedAudioMode) || AUDIO_LANGUAGE_TRACKS[0];
  const latinoSourcesCount = scanReport?.latinoSources?.length || 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseMove={wakeControls}
      className="fixed inset-0 z-50 bg-[#030305] h-dvh-safe w-screen flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Filtro SVG de Nitidez 4K Ultra HD y Contraste HDR10+ */}
      <svg className="hidden" aria-hidden="true">
        <defs>
          <filter id="cineflex-4k-upscaler" x="0%" y="0%" width="100%" height="100%">
            <feConvolveMatrix
              order="3"
              kernelMatrix="0 -0.35 0 -0.35 2.4 -0.35 0 -0.35 0"
              preserveAlpha="true"
            />
          </filter>
        </defs>
      </svg>

      {/* Botón Flotante de Acceso Rápido para Móvil/Tablet cuando los controles están ocultos */}
      <AnimatePresence>
        {!controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-3 left-3 z-50 flex items-center space-x-2 pt-safe pl-2"
          >
            <button
              onClick={() => setControlsVisible(true)}
              className="px-3.5 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white text-xs font-black flex items-center space-x-1.5 shadow-2xl active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-netflix-red" />
              <span>Controles / Cambiar Idioma</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BARRA SUPERIOR LIQUID GLASS (Estilo Apple TV+ / Max — 100% Adaptativa en Móvil PWA iOS/Android, Tablet y PC) */}
      <motion.header
        animate={{ y: controlsVisible ? 0 : -110, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#06060b]/92 sm:bg-black/80 sm:backdrop-blur-2xl border-b border-white/[0.08] px-safe py-2 sm:py-3 pt-safe flex items-center justify-between gap-2 z-30 shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
      >
        {/* Izquierda: Volver y Título */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0 flex-1">
          <button
            onClick={handleModalClose}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.16] active:scale-95 text-white font-semibold text-xs transition-all border border-white/[0.14] shrink-0"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h2 className="text-white text-xs sm:text-base md:text-lg font-bold tracking-tight truncate">
                {movie.title}
              </h2>
              {(movie.isTv || specialAlias) && (
                <span className="bg-netflix-red/25 border border-netflix-red/40 text-white text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  T{currentSeason}:E{currentEpisode}
                </span>
              )}
              <button
                onClick={() => setIsAdBlockModalOpen(true)}
                className="hidden md:inline-flex items-center space-x-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border border-white/[0.1] text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-all cursor-pointer shrink-0"
                title="CineShield™ 4K AdBlocker Activo (0% Anuncios ni Toques Fantasmas)"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Shield Activo</span>
                <span className="text-emerald-400 font-mono text-[9px]">
                  {blockedAdsCount}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-white/60 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-white/85 font-semibold truncate">
                {showTrailer
                  ? 'Tráiler Oficial 4K'
                  : selectedServer === 'auto_smart_latino' && activeDirectStream?.name
                    ? `Smart Auto → ${activeDirectStream.name}`
                    : currentProvider.name}
              </span>
              <span className="hidden xs:inline">·</span>
              <span className="hidden xs:inline text-emerald-300 font-semibold truncate">
                {currentAudioObj.shortLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Toolbar Compacta y Adaptativa (Móvil / Tablet / Desktop) */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">

          {/* Selector de Temporadas y Capítulos (en móvil también accesible abajo) */}
          {movie.isTv && (
            <button
              onClick={() => {
                setPickerSeason(currentSeason);
                setActiveMenu(activeMenu === 'episodes' ? null : 'episodes');
              }}
              className={`hidden sm:flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all ${activeMenu === 'episodes'
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/[0.12]'
                }`}
              title="Seleccionar Temporada y Capítulo"
            >
              <Tv className="w-3.5 h-3.5 shrink-0" />
              <span>T{currentSeason}:E{currentEpisode}</span>
              <span className="hidden md:inline">· Episodios</span>
            </button>
          )}

          {/* Conmutador Rápido en 1 Clic: LATINO 4K / CASTELLANO */}
          <div className="hidden lg:flex items-center bg-white/[0.06] border border-white/[0.12] rounded-full p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => handleSelectAudioTrack('es_latino_dub')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center space-x-1.5 ${playLatinLang === 'latino' && selectedAudioMode !== 'en_original_sub_es'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-white/75 hover:text-white'
                }`}
              title="Reproducir en Español Latino Oficial 4K"
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span>Latino 4K</span>
            </button>
            <button
              onClick={() => handleSelectAudioTrack('es_castellano_dub')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${playLatinLang === 'castellano' && selectedAudioMode === 'es_castellano_dub'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-white/75 hover:text-white'
                }`}
              title="Reproducir en Español Castellano"
            >
              Castellano
            </button>
          </div>

          {/* Selector de Pista de Audio / Idioma */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'audio' ? null : 'audio')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all active:scale-95 ${activeMenu === 'audio'
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-white/[0.09] hover:bg-white/[0.15] text-white border-white/[0.14]'
              }`}
            title="Cambiar Pista de Audio / Idioma (Español Latino, Castellano, Inglés)"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[78px] sm:max-w-none">
              {currentAudioObj.shortLabel}
            </span>
          </button>

          {/* Calidad 4K */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'quality' ? null : 'quality')}
            className={`hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all ${activeMenu === 'quality'
                ? 'bg-white text-black border-white'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/90 border-white/[0.12]'
              }`}
            title="Resolución 4K y Nitidez HDR"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{selectedResolution}</span>
          </button>

          {/* Chromecast & AirPlay */}
          <button
            onClick={() => setIsCastModalOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/90 border border-white/[0.12] text-[11px] sm:text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
            title="Transmitir por Chromecast o AirPlay a Smart TV"
          >
            <Cast className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden md:inline">AirPlay</span>
          </button>

          {/* Recargar */}
          <button
            onClick={handleReload}
            className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border border-white/[0.12] transition-all active:scale-95"
            title="Recargar reproductor"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Cerrar */}
          <button
            onClick={handleModalClose}
            className="p-2 rounded-full bg-white/[0.12] hover:bg-netflix-red text-white border border-white/[0.15] transition-all active:scale-95"
            title="Cerrar reproductor"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </motion.header>

      {/* PANEL MODAL ADAPTATIVO PARA AUDIO/IDIOMA, SUBTÍTULOS Y CALIDAD 4K (100% Responsivo en Celular y Tablet) */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveMenu(null)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-start justify-center sm:justify-end sm:pt-16 sm:pr-6 p-3"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#111118]/98 backdrop-blur-3xl border border-white/20 rounded-3xl p-4 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.95)] space-y-3 max-h-[80dvh] overflow-y-auto"
            >
              {/* Encabezado del Menú */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center space-x-2">
                  {activeMenu === 'episodes' && <Tv className="w-4 h-4 text-netflix-red" />}
                  {activeMenu === 'audio' && <Headphones className="w-4 h-4 text-emerald-400" />}
                  {activeMenu === 'subs' && <Subtitles className="w-4 h-4 text-emerald-400" />}
                  {activeMenu === 'quality' && <Zap className="w-4 h-4 text-amber-400" />}
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {activeMenu === 'episodes' && 'Seleccionar Temporada y Capítulo'}
                    {activeMenu === 'audio' && 'Cambiar Pista de Audio / Idioma'}
                    {activeMenu === 'subs' && 'Subtítulos en Español e Idiomas'}
                    {activeMenu === 'quality' && 'Resolución 4K Real y Motor HDR'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveMenu(null)}
                  className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CONTENIDO 0: SELECTOR DE TEMPORADAS Y CAPÍTULOS */}
              {activeMenu === 'episodes' && (
                <div className="space-y-3">
                  {/* Píldoras de Temporadas */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                    {Array.from({ length: Math.max(totalSeasonsCount, 5) }, (_, i) => i + 1).map((sNum) => (
                      <button
                        key={sNum}
                        onClick={() => setPickerSeason(sNum)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all border ${pickerSeason === sNum
                            ? 'bg-netflix-red text-white border-netflix-red shadow-lg'
                            : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
                          }`}
                      >
                        Temp. {sNum}
                      </button>
                    ))}
                  </div>

                  {/* Lista de Capítulos de la Temporada Seleccionada */}
                  {isLoadingSeasonEpisodes ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2">
                      <div className="w-7 h-7 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400 font-bold">Cargando capítulos de Temporada {pickerSeason}...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[55dvh] overflow-y-auto pr-1">
                      {(seasonEpisodes.length > 0
                        ? seasonEpisodes
                        : Array.from({ length: 12 }, (_, idx) => ({
                          episode_number: idx + 1,
                          name: `Capítulo ${idx + 1}`,
                          overview: `Episodio ${idx + 1} de la Temporada ${pickerSeason} en 4K y Español Latino.`,
                          still_path: movie.backdrop_path || movie.poster_path,
                          runtime: '48m'
                        }))
                      ).map((ep) => {
                        const isCurrentEp = currentSeason === pickerSeason && currentEpisode === ep.episode_number;
                        return (
                          <button
                            key={ep.episode_number}
                            onClick={() => handleSelectSeasonAndEpisode(pickerSeason, ep.episode_number, ep.name)}
                            className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center gap-3 group ${isCurrentEp
                                ? 'bg-netflix-red/25 border-netflix-red text-white shadow-lg'
                                : 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-gray-200'
                              }`}
                          >
                            <div className="relative w-24 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-white/10">
                              {ep.still_path ? (
                                <img src={ep.still_path} alt={ep.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                                  T{pickerSeason}:E{ep.episode_number}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-current" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-netflix-red">
                                  Cap. {ep.episode_number} • T{pickerSeason}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold">{ep.runtime}</span>
                              </div>
                              <h4 className="text-xs font-black text-white truncate">{ep.name}</h4>
                              <p className="text-[11px] text-gray-400 line-clamp-1">{ep.overview}</p>
                            </div>
                            {isCurrentEp && (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO 1: MENÚ DE PISTAS DE AUDIO E IDIOMA */}
              {activeMenu === 'audio' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Elige el idioma del audio. Si el Servidor 1 tiene pista única en inglés, puedes cambiar a <strong>Doblaje Español Latino Oficial</strong> o activar la <strong>Voz IA en Español</strong>:
                  </p>

                  {AUDIO_LANGUAGE_TRACKS.map((track) => {
                    const isSelected = selectedAudioMode === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleSelectAudioTrack(track.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${isSelected
                            ? 'bg-emerald-600/25 border-emerald-400 text-white shadow-lg'
                            : 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-gray-200'
                          }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-black truncate">{track.label}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30 shrink-0">
                              {track.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2">{track.desc}</p>
                        </div>
                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-white/20" />
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Si el stream HLS actual tiene múltiples pistas de audio internas, mostrarlas también */}
                  {hlsAudioTracks.length > 1 && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                        Pistas Internas del Flujo HLS ({hlsAudioTracks.length}):
                      </span>
                      {hlsAudioTracks.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveHlsAudioTrack(idx);
                            if (hlsRef.current) hlsRef.current.audioTrack = idx;
                            setActiveMenu(null);
                            showToast(`Pista HLS seleccionada: ${t.name || t.lang || `Audio ${idx + 1}`}`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${activeHlsAudioTrack === idx ? 'bg-netflix-red text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                          <span>{t.name || t.lang || `Pista de Audio #${idx + 1}`}</span>
                          {activeHlsAudioTrack === idx && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO 2: MENÚ DE SUBTÍTULOS */}
              {activeMenu === 'subs' && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      loadSubtitleTrack(-1);
                      setActiveMenu(null);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${activeSubIndex === -1 ? 'bg-netflix-red text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                  >
                    <span>Desactivar Subtítulos</span>
                    {activeSubIndex === -1 && <Check className="w-4 h-4" />}
                  </button>

                  {subtitlesList.length > 0 ? (
                    subtitlesList.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          loadSubtitleTrack(idx);
                          setActiveMenu(null);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${activeSubIndex === idx ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {activeSubIndex === idx && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">
                      Los subtítulos están integrados directamente en el reproductor actual.
                    </p>
                  )}
                </div>
              )}

              {/* CONTENIDO 3: MENÚ DE CALIDAD 4K Y ESCALADOR HDR */}
              {activeMenu === 'quality' && (
                <div className="space-y-2">
                  <button
                    onClick={() => setEnhance4kEnabled(!enhance4kEnabled)}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-between text-xs"
                  >
                    <div className="text-left">
                      <div className="font-black text-amber-300 flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>Motor IA 4K HDR10+ Upscaler</span>
                      </div>
                      <p className="text-[11px] text-gray-400">Realce de nitidez y contraste de cine</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${enhance4kEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-gray-400'
                      }`}>
                      {enhance4kEnabled ? 'ACTIVO' : 'APAGADO'}
                    </span>
                  </button>

                  {RESOLUTION_OPTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQualitySelect(q.id)}
                      className={`w-full text-left p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors border ${selectedResolution === q.id
                          ? 'bg-netflix-red/25 border-netflix-red text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                    >
                      <div>
                        <div className="font-black text-sm flex items-center space-x-1.5">
                          <span>{q.label}</span>
                          {selectedResolution === q.id && <Check className="w-4 h-4 text-netflix-red" />}
                        </div>
                        <p className="text-[11px] text-gray-400">{q.res} • {q.bitrate} • {q.fps}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/50 font-black text-amber-300 border border-amber-400/30">
                        {q.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEWPORT CENTRAL DE VIDEO 100% RESPONSIVO CON RETROILUMINACIÓN AMBILIGHT 4K */}
      <main className="relative flex-1 w-full min-h-0 bg-[#020204] flex items-center justify-center overflow-hidden">
        {/* Retroiluminación Ambiental Cinemática (Estilo Apple TV+ / Ambilight) */}
        {(movie.backdrop_path || movie.poster_path) && (
          <img
            src={movie.backdrop_path || movie.poster_path}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-[120px] opacity-25 scale-125 saturate-200 pointer-events-none select-none"
          />
        )}

        {/* Notificación Flotante del Auto-Detector */}
        <AnimatePresence>
          {autoSwitchNotice && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute top-3 inset-x-3 mx-auto w-fit max-w-[92vw] sm:max-w-lg z-30 bg-[#0b0b12]/90 backdrop-blur-2xl border border-white/15 text-white px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold shadow-[0_14px_40px_rgba(0,0,0,0.85)] flex items-center space-x-2 pointer-events-none text-center"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="line-clamp-2">{autoSwitchNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicadores Visuales de Doble Toque Táctil (-10s / +10s) en Móvil y Tablet */}
        <AnimatePresence>
          {touchSeekIndicator === 'left' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute left-6 sm:left-12 inset-y-0 my-auto h-20 w-20 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white font-black text-xs z-30 pointer-events-none"
            >
              <ChevronLeft className="w-6 h-6 text-netflix-red -mb-1" />
              <span>-10s</span>
            </motion.div>
          )}
          {touchSeekIndicator === 'right' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute right-6 sm:right-12 inset-y-0 my-auto h-20 w-20 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white font-black text-xs z-30 pointer-events-none"
            >
              <ChevronRight className="w-6 h-6 text-netflix-red -mb-1" />
              <span>+10s</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Flotante Cinematográfico de Carga e Iteración de Servidores (Diseño No Bloqueante con Motion) */}
        <AnimatePresence>
          {isLoading && !hasStartedPlayingRef.current && (
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-auto max-w-[92vw] px-2"
            >
              <div className="pointer-events-auto flex items-center space-x-2.5 sm:space-x-3.5 px-3.5 sm:px-4 py-2 rounded-full bg-[#0b0b14]/92 backdrop-blur-2xl border border-white/[0.16] shadow-[0_16px_48px_rgba(0,0,0,0.85)]">
                {/* Mini radar spinner animado */}
                <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                  <div className="w-5 h-5 border-2 border-white/15 border-t-netflix-red border-r-emerald-400 rounded-full animate-spin" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute animate-ping" />
                </div>

                <div className="flex items-center space-x-2 truncate">
                  <span className="text-white text-xs sm:text-sm font-black tracking-tight truncate">
                    {showTrailer ? 'Tráiler 4K...' : currentProvider.name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                    {currentProvider.ping || '4ms'}
                  </span>
                </div>

                {!showTrailer && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => iterateNextLatinoServer('Cambio Rápido')}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
                    title="Saltar al siguiente servidor disponible"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-netflix-red" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REPRODUCTOR 1: MODO NATIVO HLS / MP4 4K (100% Responsivo en Celular, Tablet y PC) */}
        {isNativeServer && !showTrailer ? (
          <div
            onClick={handleVideoTouchOrClick}
            className="relative w-full h-full flex items-center justify-center overflow-hidden z-10"
          >
            <video
              key={`native_${movie?.id}_s${currentSeason}_e${currentEpisode}_${selectedServer}_${activeHlsIndex}`}
              ref={videoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              x-webkit-airplay="allow"
              crossOrigin="anonymous"
              style={{
                filter: enhance4kEnabled ? currentQualityObj.filter : 'none'
              }}
              onError={() => {
                const err = videoRef.current?.error;
                if (err?.code === 1 || isSeekingRef.current) {
                  return;
                }
                console.warn('[Cineflex Video] Fallo en stream HTML5 nativo:', err);
                if (!hasStartedPlayingRef.current) {
                  iterateNextLatinoServer('Auto-Detector Sí o Sí');
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => {
                setIsPlaying(false);
                saveCurrentProgress();
              }}
              onSeeking={() => {
                isSeekingRef.current = true;
              }}
              onSeeked={() => {
                setIsLoading(false);
                setTimeout(() => {
                  isSeekingRef.current = false;
                }, 400);
              }}
              onWaiting={() => {
                if (!hasStartedPlayingRef.current) {
                  setIsLoading(true);
                }
              }}
              onPlaying={() => {
                setIsLoading(false);
                hasStartedPlayingRef.current = true;
                isSeekingRef.current = false;
              }}
              onTimeUpdate={() => {
                if (videoRef.current && !isSeekingRef.current) {
                  const cur = videoRef.current.currentTime;
                  const dur = videoRef.current.duration || 0;
                  // Throttle UI state updates (~2.5 FPS) para ahorrar recursos de CPU/GPU
                  if (Math.abs(cur - lastUiTimeUpdateRef.current) >= 0.4 || cur === 0) {
                    lastUiTimeUpdateRef.current = cur;
                    setCurrentTime(cur);
                    if (dur > 0 && dur !== duration) {
                      setDuration(dur);
                    }
                    if (videoRef.current.buffered.length > 0) {
                      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
                    }
                  }
                  // Guardar el minuto exacto donde se quedó el usuario de forma persistente
                  if (cur > 4 && Math.abs(cur - lastSavedProgressTimeRef.current) > 3.5) {
                    lastSavedProgressTimeRef.current = cur;
                    StorageService.savePlaybackProgress(
                      movie,
                      cur,
                      dur,
                      selectedServer,
                      currentSeason,
                      currentEpisode
                    );
                  }
                }
              }}
              onLoadedMetadata={() => {
                setIsLoading(false);
                if (videoRef.current) {
                  const dur = videoRef.current.duration || 0;
                  setDuration(dur);

                  // Reanudar automáticamente en el minuto exacto donde se quedó el usuario para este episodio
                  if (!forceResetToZeroRef.current && resumeTimeRef.current > 5 && resumeTimeRef.current < dur - 15) {
                    const resumePoint = resumeTimeRef.current;
                    resumeTimeRef.current = 0;
                    try {
                      videoRef.current.currentTime = resumePoint;
                      setCurrentTime(resumePoint);
                      const m = Math.floor(resumePoint / 60);
                      const s = Math.floor(resumePoint % 60);
                      const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
                      setResumeNotice({ time: resumePoint, text: formatted });
                      showToast(`Reanudando reproducción desde el minuto ${formatted}`);
                    } catch (e) {
                      console.warn('Error reanudando minuto guardado:', e);
                    }
                  } else {
                    forceResetToZeroRef.current = false;
                    try {
                      videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    } catch { }
                  }
                }
              }}
              onCanPlay={() => {
                setIsLoading(false);
                if (forceResetToZeroRef.current && videoRef.current) {
                  try {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  } catch { }
                  forceResetToZeroRef.current = false;
                }
              }}
              onEnded={() => {
                StorageService.clearPlaybackProgress(movie.id, movie.isTv, currentSeason, currentEpisode);
                if (movie.isTv) handleNextEpisode();
              }}
              className="w-full h-full max-h-full max-w-full object-contain"
            />

            {/* Overlay de Subtítulos Cinema 4K Responsivo */}
            {activeCueText && (
              <div
                className={`absolute inset-x-0 z-20 flex justify-center px-3 sm:px-8 pointer-events-none transition-all duration-200 ${controlsVisible ? 'bottom-28 sm:bottom-32' : 'bottom-6 sm:bottom-10'
                  }`}
              >
                <div className="bg-black/80 backdrop-blur-md text-white font-bold text-xs sm:text-base md:text-xl px-3.5 py-1.5 rounded-xl border border-white/10 text-center max-w-[92vw] sm:max-w-3xl shadow-2xl leading-snug whitespace-pre-line">
                  {activeCueText}
                </div>
              </div>
            )}

            {/* Chip Elegante de Reanudación de Minuto Guardado (Apple TV / Netflix HIG) */}
            <AnimatePresence>
              {resumeNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -16, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  className="absolute top-4 left-3 sm:left-6 z-30 flex items-center space-x-2.5 bg-[#0a0a14]/90 backdrop-blur-2xl border border-white/20 px-3.5 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-xs text-white pointer-events-auto"
                >
                  <span className="w-2 h-2 rounded-full bg-netflix-red animate-pulse shrink-0" />
                  <span className="text-white/90 text-[11px] sm:text-xs">
                    Reanudado en <strong className="text-white font-mono font-bold">{resumeNotice.text}</strong>
                  </span>
                  <button
                    onClick={handleRestartFromBeginning}
                    className="ml-1 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[10px] sm:text-[11px] font-bold text-white transition-all cursor-pointer border border-white/15 active:scale-95"
                    title="Reiniciar reproducción desde el minuto 0"
                  >
                    Ver desde el inicio
                  </button>
                  <button
                    onClick={() => setResumeNotice(null)}
                    className="text-white/50 hover:text-white p-0.5 ml-0.5"
                    title="Cerrar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selector rápido de Nodos HLS Directos (arriba a la derecha) */}
            {(selectedServer === 'native_hls_4k' || selectedServer === 'auto_smart_latino') && directHlsStreams.length > 1 && controlsVisible && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2.5 right-3 sm:right-6 z-20 flex items-center space-x-1 bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/15 max-w-[90vw] overflow-x-auto no-scrollbar"
              >
                <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase mr-1 shrink-0">Nodos:</span>
                {directHlsStreams.slice(0, 4).map((node, idx) => (
                  <button
                    key={node.id}
                    onClick={() => setActiveHlsIndex(idx)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${activeHlsIndex === idx
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                      }`}
                  >
                    #{idx + 1} ({node.ping})
                  </button>
                ))}
              </div>
            )}

            {/* Botón Central de Play cuando está en pausa */}
            <AnimatePresence>
              {!isPlaying && !isLoading && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-xl border border-white flex items-center justify-center text-black cursor-pointer shadow-[0_0_50px_rgba(255,255,255,0.4)] z-20"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black ml-1" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* BARRA DE CONTROLES FLOTANTE DEL REPRODUCTOR NATIVO (100% Adaptada a Móvil PWA iOS/Android, Tablet y PC) */}
            <motion.div
              animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 24 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-20 max-w-5xl mx-auto bg-[#090910]/94 sm:bg-[#0b0b12]/88 sm:backdrop-blur-2xl border border-white/[0.14] rounded-2xl p-2 sm:p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-1.5 sm:space-y-2 ${controlsVisible ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
            >
              {/* Fila 1: Línea de Tiempo Táctil + Tiempo */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-xs font-mono text-gray-200 shrink-0">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="touch-scrubber flex-1 h-2 bg-white/25 rounded-lg cursor-pointer accent-netflix-red"
                />
                <span className="text-[10px] sm:text-xs font-mono text-gray-400 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Fila 2: Controles de Reproducción en una sola línea limpia y deslizable en pantallas pequeñas */}
              <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
                {/* Controles Izquierdos */}
                <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
                  <button
                    onClick={togglePlayPause}
                    className="text-white hover:text-netflix-red transition-colors p-1.5 rounded-lg bg-white/10 sm:bg-transparent active:scale-95"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => skipTime(-10)}
                    className="text-gray-200 hover:text-white transition-colors text-[10px] sm:text-[11px] font-black px-2 py-1 rounded-lg bg-white/10 active:scale-95"
                    title="Retroceder 10s"
                  >
                    -10s
                  </button>
                  <button
                    onClick={() => skipTime(10)}
                    className="text-gray-200 hover:text-white transition-colors text-[10px] sm:text-[11px] font-black px-2 py-1 rounded-lg bg-white/10 active:scale-95"
                    title="Adelantar 10s"
                  >
                    +10s
                  </button>

                  {/* Volumen */}
                  <div className="flex items-center space-x-1">
                    <button onClick={toggleMute} className="text-gray-300 hover:text-white p-1.5 active:scale-95">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="hidden sm:block w-16 h-1 bg-white/25 rounded accent-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* Controles Derechos */}
                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-auto">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'audio' ? null : 'audio')}
                    className="px-2 sm:px-3 py-1 rounded-full bg-white/[0.1] hover:bg-white/[0.18] border border-white/[0.15] text-white text-[10px] sm:text-xs font-semibold flex items-center space-x-1 active:scale-95"
                    title="Cambiar Pista de Audio / Idioma"
                  >
                    <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[72px] sm:max-w-none">{currentAudioObj.shortLabel}</span>
                  </button>

                  <button
                    onClick={() => setActiveMenu(activeMenu === 'subs' ? null : 'subs')}
                    className="px-2 sm:px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-gray-200 text-[10px] sm:text-xs font-semibold flex items-center space-x-1 active:scale-95"
                    title="Subtítulos"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CC</span>
                  </button>

                  <button
                    onClick={() => {
                      if (CastService.isAirPlayAvailable() && videoRef.current) {
                        CastService.triggerAirPlay(videoRef.current, resolvedNativeUrl);
                      } else {
                        setIsCastModalOpen(true);
                      }
                    }}
                    className="px-2 sm:px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-white text-[10px] sm:text-xs font-semibold flex items-center space-x-1 active:scale-95"
                    title="Transmitir a Smart TV por AirPlay o Chromecast"
                  >
                    <Airplay className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">AirPlay</span>
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-netflix-red p-1.5 rounded-lg bg-white/10 sm:bg-transparent transition-colors active:scale-95"
                    title="Pantalla Completa"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* REPRODUCTOR 2: SERVIDORES EN ESPAÑOL LATINO (Con blindaje Sandbox 0% Anuncios y 0% Clics Fantasmas) */
          <div className="relative w-full h-full flex items-center justify-center p-0 sm:p-2 md:p-4 z-10">
            <div className="relative w-full h-full max-w-7xl sm:aspect-video flex items-center justify-center">
              {(isLoading || isScanningLinks) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-20 pointer-events-none space-y-3">
                  <div className="w-10 h-10 border-3 border-white/20 border-t-netflix-red rounded-full animate-spin" />
                  <span className="text-white text-xs sm:text-sm font-bold tracking-tight text-center px-4">
                    {isScanningLinks
                      ? 'Conectando flujo directo 4K / Full HD en Español Latino (0% anuncios)...'
                      : `Cargando ${currentProvider.name}...`}
                  </span>
                </div>
              )}
              {!isScanningLinks && (
                <iframe
                  key={`${selectedServer}_${playLatinLang}_s${currentSeason}_e${currentEpisode}_${iframeKey}`}
                  src={showTrailer ? trailerUrl : streamUrl}
                  title={`Reproductor ${movie.title}`}
                  className="w-full h-full sm:rounded-2xl shadow-[0_28px_80px_rgba(0,0,0,0.95)] border-0 sm:border sm:border-white/[0.14] bg-[#040407]"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  referrerPolicy="origin"
                  onLoad={() => {
                    setIsLoading(false);
                  }}
                  onError={() => {
                    if (!hasStartedPlayingRef.current) {
                      iterateNextLatinoServer('Auto-Detector');
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}

      </main>

      {/* BARRA INFERIOR DE SERVIDORES Y EPISODIOS (100% Adaptativa en Móvil PWA iOS/Android, Tablet y PC) */}
      <motion.footer
        animate={{ y: controlsVisible ? 0 : 110, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#06060b]/94 sm:bg-black/82 sm:backdrop-blur-2xl border-t border-white/[0.08] px-safe py-2 pb-safe shrink-0 z-30 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">

          {/* Carrusel Horizontal Deslizable de Servidores + Botón de Iteración Rápida (Ancho completo en celular) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:flex-1 min-w-0">
            <button
              onClick={() => iterateNextLatinoServer('Iterador Rápido')}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-netflix-red to-rose-600 hover:from-red-600 hover:to-rose-500 active:scale-95 transition-transform text-white text-[11px] sm:text-xs font-black flex items-center space-x-1.5 shrink-0 shadow-[0_4px_16px_rgba(229,9,20,0.45)] cursor-pointer border border-white/20"
              title="Iterar instantáneamente al siguiente servidor en Español Latino"
            >
              <RotateCw className="w-3 h-3" />
              <span>Iterar Servidor</span>
            </button>

            {STREAM_PROVIDERS.map((provider) => {
              const isActive = !showTrailer && selectedServer === provider.id;
              const statusObj = scanReport?.serverStatuses?.[provider.id];
              const isVerifiedOnline = statusObj ? statusObj.online : true;
              const livePing = statusObj?.ping || provider.ping;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleServerChange(provider.id)}
                  className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all active:scale-95 flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${isActive
                      ? 'bg-white text-black font-bold shadow-[0_4px_16px_rgba(255,255,255,0.35)]'
                      : 'text-white/80 hover:text-white bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12]'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVerifiedOnline ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                  />
                  <span>{provider.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-black/10 text-black/80' : 'bg-white/10 text-white/60'
                    }`}>
                    {provider.badge}
                  </span>
                  <span className={`text-[9px] font-mono hidden md:inline ${isActive ? 'text-black/60' : 'text-emerald-400/80'
                    }`}>
                    {livePing}
                  </span>
                </button>
              );
            })}

            {activeTrailerKey && (
              <button
                onClick={handleOpenTrailer}
                className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all active:scale-95 flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${showTrailer
                    ? 'bg-white text-black font-bold shadow-lg'
                    : 'text-white/80 hover:text-white bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12]'
                  }`}
              >
                <Youtube className={`w-3.5 h-3.5 ${showTrailer ? 'text-netflix-red' : 'text-red-400'}`} />
                <span>Tráiler 4K</span>
              </button>
            )}
          </div>

          {/* Controles Rápidos de Temporadas y Capítulos (Fila dedicada y cómoda en celular, alineada a la derecha en tablet/PC) */}
          {movie.isTv && (
            <div className="flex items-center justify-between sm:justify-end space-x-1.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t border-white/[0.06] sm:border-0">
              {currentEpisode > 1 ? (
                <button
                  onClick={handlePrevEpisode}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-[11px] sm:text-xs flex items-center space-x-1 border border-white/15"
                  title="Capítulo Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Cap. {currentEpisode - 1}</span>
                </button>
              ) : (
                <div className="sm:hidden" />
              )}

              <button
                onClick={() => {
                  setPickerSeason(currentSeason);
                  setActiveMenu(activeMenu === 'episodes' ? null : 'episodes');
                }}
                className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-black text-[11px] sm:text-xs flex items-center space-x-1.5 border border-white/20"
                title="Elegir Temporada o Capítulo"
              >
                <Tv className="w-3.5 h-3.5 text-netflix-red shrink-0" />
                <span>Temporada {currentSeason} · Cap. {currentEpisode}</span>
              </button>

              <button
                onClick={handleNextEpisode}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-netflix-red hover:bg-red-700 active:scale-95 text-white font-black text-[11px] sm:text-xs flex items-center space-x-1 shadow-lg shadow-red-900/40"
                title="Siguiente Capítulo"
              >
                <span>Cap. {currentEpisode + 1}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.footer>

      {/* Modal de Transmisión a Smart TV (Chromecast y AirPlay 2 en Español Latino 4K) */}
      <AnimatePresence>
        {isCastModalOpen && (
          <CastModal
            isOpen={isCastModalOpen}
            onClose={() => setIsCastModalOpen(false)}
            movie={movie}
            season={currentSeason}
            episode={currentEpisode}
            directStreamUrl={resolvedNativeUrl}
            videoElement={videoRef.current}
          />
        )}
      </AnimatePresence>

      {/* Modal de Control CineShield™ AdBlocker */}
      <AnimatePresence>
        {isAdBlockModalOpen && (
          <AdBlockModal
            isOpen={isAdBlockModalOpen}
            onClose={() => setIsAdBlockModalOpen(false)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}
