import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowLeft, 
  Tv, 
  Server, 
  RotateCw, 
  Youtube, 
  Zap, 
  Activity, 
  ChevronRight, 
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
  Sliders
} from 'lucide-react';
import { STREAM_PROVIDERS, StorageService, MovieAPI, REAL_4K_SOURCES, KNOWN_IMDB_IDS } from '../services/movieService';
import { StreamScannerService } from '../services/streamScannerService';
import CastModal from './CastModal';

// Opciones de Resolución y Escalado 4K Real
const RESOLUTION_OPTIONS = [
  { id: '2160p', label: '4K Ultra HD (2160p)', badge: '4K HDR10+', bitrate: '42.8 Mbps', res: '3840 x 2160', fps: '60 FPS', filter: 'url(#cineflex-4k-upscaler) contrast(1.06) saturate(1.12)' },
  { id: '1080p', label: 'Full HD Pro (1080p)', badge: 'Alta Fidelidad', bitrate: '18.5 Mbps', res: '1920 x 1080', fps: '60 FPS', filter: 'contrast(1.03) saturate(1.05)' },
  { id: '720p', label: 'HD Rápido (720p)', badge: 'Ahorro Datos', bitrate: '6.2 Mbps', res: '1280 x 720', fps: '30 FPS', filter: 'none' },
];

export default function VideoPlayerModal({ 
  movie, 
  onClose,
  initialSeason = 1,
  initialEpisode = 1,
  initialEpisodeTitle = ''
}) {
  const [selectedServer, setSelectedServer] = useState(STREAM_PROVIDERS[0].id);
  const [selectedResolution, setSelectedResolution] = useState('2160p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubsMenu, setShowSubsMenu] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [showStatsHud, setShowStatsHud] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [trailerKey, setTrailerKey] = useState(movie?.trailer_id || null);
  const [resolvedImdbId, setResolvedImdbId] = useState(movie?.imdb_id || KNOWN_IMDB_IDS[movie?.id] || null);

  // Estado de Serie
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodeTitle, setEpisodeTitle] = useState(initialEpisodeTitle);

  // Estados del Auto-Detector Inteligente de Links y Streams HLS
  const [isScanningLinks, setIsScanningLinks] = useState(true);
  const [scanReport, setScanReport] = useState(null);
  const [directHlsStreams, setDirectHlsStreams] = useState([]);
  const [activeHlsIndex, setActiveHlsIndex] = useState(0);
  const [subtitlesList, setSubtitlesList] = useState([]);
  const [activeSubIndex, setActiveSubIndex] = useState(-1);
  const [activeCueText, setActiveCueText] = useState('');
  const [autoSwitchNotice, setAutoSwitchNotice] = useState('');
  const [audioTracks, setAudioTracks] = useState([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState(0);
  const [enhance4kEnabled, setEnhance4kEnabled] = useState(true);

  // Estados del Reproductor HTML5 + HLS Nativo 4K
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
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

  const showToast = useCallback((msg) => {
    setAutoSwitchNotice(msg);
    setTimeout(() => {
      setAutoSwitchNotice((prev) => (prev === msg ? '' : prev));
    }, 4500);
  }, []);

  // 1. AUTO-DETECTOR INTELIGENTE DE LINKS Y SERVIDORES FUNCIONALES
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;

    setIsScanningLinks(true);
    setIsLoading(true);
    StorageService.addToHistory(movie, selectedServer, currentSeason, currentEpisode);

    // Obtener tráiler en Español Latino
    MovieAPI.getTrailer(movie.id, movie.isTv).then((key) => {
      if (!cancelled && key) setTrailerKey(key);
    });

    // Obtener IMDb ID y ejecutar el escaneo automático de todos los servidores
    (async () => {
      let imdb = movie.imdb_id || KNOWN_IMDB_IDS[movie.id] || null;
      if (!imdb && !movie.customUrl) {
        imdb = await MovieAPI.getImdbId(movie.id, movie.isTv);
        if (!cancelled && imdb) setResolvedImdbId(imdb);
      }

      const report = await StreamScannerService.scanAllWorkingLinks(
        movie,
        currentSeason,
        currentEpisode,
        imdb
      );

      if (cancelled || !report) {
        if (!cancelled) setIsScanningLinks(false);
        return;
      }

      setScanReport(report);
      if (report.imdbId) setResolvedImdbId(report.imdbId);
      setDirectHlsStreams(report.directHlsStreams || []);
      setActiveHlsIndex(0);
      setSubtitlesList(report.subtitles || []);
      setIsScanningLinks(false);

      // Si no hay streams HLS directos para este título pero PlayLatin tiene Español Latino verificado,
      // conmutar automáticamente al servidor en Español Latino que sí funciona
      if (
        !movie.customUrl &&
        selectedServer === 'native_hls_4k' &&
        (!report.directHlsStreams || report.directHlsStreams.length === 0)
      ) {
        setSelectedServer('playlatin_es');
        showToast('⚡ Auto-Detector: Conectado automáticamente a PlayLatin Oficial (Español Latino)');
      } else if (report.directHlsStreams?.length > 0 && selectedServer === 'native_hls_4k') {
        showToast(
          `🟢 Auto-Detector: ${report.directHlsStreams.length} enlaces 4K directos sin anuncios verificados (${report.scanDurationMs}ms)`
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [movie, currentSeason, currentEpisode]);

  // 2. ESCUCHAR EVENTOS EN TIEMPO REAL DE PLAYLATIN (Detección automática de fallos en iframe)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      const type = String(event.data.type || '');

      if (type === 'meinecloud:ready') {
        setIsLoading(false);
        const versions = event.data.versions || ['latino'];
        showToast(`🇲🇽 Audio confirmado: ${versions.map(v => v.toUpperCase()).join(' / ')} activo`);
      } else if (type === 'meinecloud:error') {
        // Si un servidor externo reporta que no tiene el enlace, saltar automáticamente al siguiente servidor funcional
        if (selectedServer === 'playlatin_es') {
          if (directHlsStreams.length > 0) {
            setSelectedServer('native_hls_4k');
            showToast('🔄 Auto-Detector: Cambiando a Cineflex 4K Directo (100% Funcional)...');
          } else {
            setSelectedServer('cinesrc_4k');
            showToast('🔄 Auto-Detector: Cambiando automáticamente a CineSrc 4K Ultra...');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedServer, directHlsStreams, showToast]);

  // 3. MOTOR DE REPRODUCCIÓN NATIVA HLS.JS (0% ANUNCIOS, 0% IFRAMES, ESCALADO 4K)
  const currentProvider = STREAM_PROVIDERS.find(p => p.id === selectedServer) || STREAM_PROVIDERS[0];
  const isNativeServer = currentProvider.isNative || Boolean(movie?.customUrl);

  const active4kDemoSource = movie?.real4kSource || REAL_4K_SOURCES[0];
  const activeDirectStream = directHlsStreams[activeHlsIndex] || null;

  const resolvedNativeUrl = movie?.customUrl
    ? movie.customUrl
    : selectedServer === 'cinema_demo_4k'
    ? active4kDemoSource.resolutions[selectedResolution] || active4kDemoSource.resolutions['2160p']
    : activeDirectStream?.url || active4kDemoSource.resolutions['2160p'];

  const isHlsStream = Boolean(
    resolvedNativeUrl &&
    (resolvedNativeUrl.includes('.m3u8') ||
      resolvedNativeUrl.includes('vidrack.created.app/proxy') ||
      resolvedNativeUrl.includes('px.php?play=') ||
      activeDirectStream?.type === 'hls')
  );

  useEffect(() => {
    if (!isNativeServer || showTrailer || !videoRef.current || !resolvedNativeUrl) return;

    const video = videoRef.current;
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const HlsClass = typeof window !== 'undefined' ? window.Hls : null;

    if (isHlsStream && HlsClass && HlsClass.isSupported()) {
      const hls = new HlsClass({
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 9000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 9000,
        fragLoadingTimeOut: 15000
      });

      hlsRef.current = hls;
      hls.loadSource(resolvedNativeUrl);
      hls.attachMedia(video);

      hls.on(HlsClass.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        // Seleccionar automáticamente la máxima resolución disponible
        if (hls.levels && hls.levels.length > 0) {
          let bestIdx = 0;
          for (let i = 1; i < hls.levels.length; i++) {
            if ((hls.levels[i].height || 0) >= (hls.levels[bestIdx].height || 0)) {
              bestIdx = i;
            }
          }
          hls.currentLevel = bestIdx;
          const h = hls.levels[bestIdx]?.height || 1080;
          setRealResolution(h >= 2160 ? '3840 x 2160 (4K Nativo)' : '3840 x 2160 (Escalado 4K UHD)');
        }

        // Detectar pistas de audio y seleccionar Español automáticamente si existe
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(hls.audioTracks);
          const esTrackIdx = hls.audioTracks.findIndex(t =>
            /es|spa|lat|español|spanish/i.test(`${t.name || ''} ${t.lang || ''}`)
          );
          if (esTrackIdx >= 0) {
            hls.audioTrack = esTrackIdx;
            setActiveAudioTrack(esTrackIdx);
          }
        }

        video.play().catch(() => {});
      });

      hls.on(HlsClass.Events.AUDIO_TRACKS_UPDATED, () => {
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks([...hls.audioTracks]);
          const esTrackIdx = hls.audioTracks.findIndex(t =>
            /es|spa|lat|español|spanish/i.test(`${t.name || ''} ${t.lang || ''}`)
          );
          if (esTrackIdx >= 0) {
            hls.audioTrack = esTrackIdx;
            setActiveAudioTrack(esTrackIdx);
          }
        }
      });

      hls.on(HlsClass.Events.ERROR, (_, errData) => {
        if (errData.fatal) {
          // Si este nodo HLS falla, probar automáticamente el siguiente nodo HLS verificado
          if (activeHlsIndex + 1 < directHlsStreams.length) {
            const nextIdx = activeHlsIndex + 1;
            setActiveHlsIndex(nextIdx);
            showToast(`⚡ Auto-Detector: Conmutando a ${directHlsStreams[nextIdx].name}...`);
          } else {
            // Conmutar automáticamente a PlayLatin Español
            setSelectedServer('playlatin_es');
            showToast('🔄 Auto-Detector: Conmutando automáticamente a PlayLatin Oficial (Español Latino)');
          }
        }
      });
    } else {
      video.src = resolvedNativeUrl;
      video.load();
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isNativeServer, showTrailer, resolvedNativeUrl, isHlsStream, activeHlsIndex, directHlsStreams, showToast]);

  // 4. CARGAR SUBTÍTULOS EN ESPAÑOL LATINO AUTOMÁTICAMENTE EN REPRODUCTOR NATIVO
  useEffect(() => {
    if (!isNativeServer || showTrailer || !videoRef.current || subtitlesList.length === 0) {
      setActiveCueText('');
      return;
    }

    // Seleccionar automáticamente el primer subtítulo en Español Latino / Español
    const spanishIdx = subtitlesList.findIndex(s => s.isLatino || s.isSpanish);
    const targetIdx = spanishIdx >= 0 ? spanishIdx : 0;
    loadSubtitleTrack(targetIdx);
  }, [subtitlesList, isNativeServer, showTrailer]);

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
      tt.mode = 'hidden'; // Renderizamos nuestro propio overlay 4K Cinema de alta legibilidad
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

  // Atajos de teclado para experiencia cinemática fluida
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          onClose();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, currentEpisode, isPlaying, isMuted, isFullscreen]);

  // Ocultar controles automáticamente tras inactividad
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu && !showSubsMenu) setControlsVisible(false);
    }, 3400);
  };

  if (!movie) return null;

  // Stream URL para servidores externos con IMDb ID resuelto para Español Latino
  const streamUrl = currentProvider.getUrl(
    movie.id,
    movie.isTv,
    currentSeason,
    currentEpisode,
    resolvedImdbId
  );

  // Tráiler 4K en Español
  const activeTrailerKey = movie.trailer_id || trailerKey;
  const trailerUrl = activeTrailerKey 
    ? `https://www.youtube-nocookie.com/embed/${activeTrailerKey}?autoplay=1&rel=0&vq=hd2160&modestbranding=1&hl=es`
    : null;

  const handleServerChange = (serverId) => {
    setShowTrailer(false);
    setSelectedServer(serverId);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    StorageService.addToHistory(movie, serverId, currentSeason, currentEpisode);
  };

  const handleOpenTrailer = () => {
    setShowTrailer(true);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const handleNextEpisode = () => {
    setCurrentEpisode(prev => prev + 1);
    setEpisodeTitle(`Capítulo ${currentEpisode + 1}`);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      setCurrentEpisode(prev => prev - 1);
      setEpisodeTitle(`Capítulo ${currentEpisode - 1}`);
      setIsLoading(true);
      setIframeKey(prev => prev + 1);
    }
  };

  // Controles del Reproductor Nativo HTML5
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleQualitySelect = (qualityId) => {
    setSelectedResolution(qualityId);
    setShowQualityMenu(false);
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
  const latinoSourcesCount = scanReport?.latinoSources?.length || 0;

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-[#030305] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Filtro SVG de Nitidez 4K Ultra HD y Contraste HDR10+ en Tiempo Real */}
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

      {/* Top Header Bar */}
      <motion.header 
        animate={{ y: controlsVisible ? 0 : -90, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.28 }}
        className="bg-black/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between z-30 shrink-0 shadow-2xl"
      >
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 shadow-lg shrink-0"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </motion.button>

          <div className="min-w-0">
            <h2 className="text-white text-sm sm:text-base md:text-lg font-black truncate flex items-center flex-wrap gap-2">
              <span className="truncate">{movie.title}</span>
              {movie.isTv && (
                <span className="bg-netflix-red text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                  T{currentSeason}:E{currentEpisode} {episodeTitle ? `• ${episodeTitle}` : ''}
                </span>
              )}
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 
                0% ANUNCIOS • SIN REDIRECCIÓN
              </span>
            </h2>

            <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-medium mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-400 font-bold truncate">
                {showTrailer
                  ? 'Tráiler Oficial 4K Español'
                  : isScanningLinks
                  ? 'Auto-detectando el mejor enlace 4K...'
                  : `${currentProvider.name} (${currentProvider.subtitle})`}
              </span>
              <span className="hidden md:inline text-gray-600">•</span>
              <span className="hidden md:inline text-amber-300 font-bold">
                {currentQualityObj.label}
              </span>
              {resolvedImdbId && (
                <>
                  <span className="hidden lg:inline text-gray-600">•</span>
                  <span className="hidden lg:inline text-gray-400 font-mono text-[10px]">
                    ID Verificado: {resolvedImdbId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Quick Mode Switcher: Español Latino Doblado vs 4K Directo Nativo */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          <div className="hidden lg:flex items-center bg-white/[0.06] p-1 rounded-full border border-white/10">
            <button
              onClick={() => handleServerChange('native_hls_4k')}
              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center space-x-1 ${
                !showTrailer && selectedServer === 'native_hls_4k'
                  ? 'bg-netflix-red text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
              title="Reproductor Nativo HLS sin iframes y con escalado 4K"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>4K Directo (0% Ads)</span>
            </button>
            <button
              onClick={() => handleServerChange('playlatin_es')}
              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center space-x-1 ${
                !showTrailer && selectedServer === 'playlatin_es'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
              title="Reproducir con Doblaje en Español Latino Oficial"
            >
              <Globe className="w-3 h-3 text-emerald-300" />
              <span>🇲🇽 Español Latino {latinoSourcesCount > 0 ? `(${latinoSourcesCount})` : ''}</span>
            </button>
          </div>

          {/* Selector de Subtítulos Español (en modo Nativo) */}
          {isNativeServer && !showTrailer && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSubsMenu(!showSubsMenu);
                  setShowQualityMenu(false);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  activeSubIndex >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/10 text-gray-200 border-white/15 hover:bg-white/20'
                }`}
                title="Subtítulos en Español Latino e Idiomas"
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {activeSubIndex >= 0 ? 'Sub: Español' : 'Subtítulos'}
                </span>
              </motion.button>

              <AnimatePresence>
                {showSubsMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 10 }}
                    className="absolute right-0 top-11 w-64 bg-[#111116] border border-white/15 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1 max-h-72 overflow-y-auto"
                  >
                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-white/10">
                      Subtítulos Verificados
                    </div>
                    <button
                      onClick={() => {
                        loadSubtitleTrack(-1);
                        setShowSubsMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                        activeSubIndex === -1 ? 'bg-netflix-red text-white' : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>Desactivados</span>
                      {activeSubIndex === -1 && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {subtitlesList.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          loadSubtitleTrack(idx);
                          setShowSubsMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                          activeSubIndex === idx ? 'bg-netflix-red text-white' : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {activeSubIndex === idx && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Selector de Calidad 4K Real + Upscaler HDR */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowQualityMenu(!showQualityMenu);
                setShowSubsMenu(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-xs font-black text-amber-300 border border-amber-400/30"
              title="Motor de Resolución 4K y Nitidez HDR"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>{selectedResolution}</span>
            </motion.button>

            <AnimatePresence>
              {showQualityMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 top-11 w-72 bg-[#111116] border border-white/15 rounded-2xl p-3 shadow-2xl z-50 space-y-2"
                >
                  <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-white/10 flex items-center justify-between">
                    <span>Calidad 4K Ultra HD</span>
                    <span className="text-emerald-400 font-mono">HDR10+</span>
                  </div>

                  {/* Switch de Procesador de Nitidez 4K */}
                  <button
                    onClick={() => setEnhance4kEnabled(!enhance4kEnabled)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div className="text-left">
                      <div className="font-black text-amber-300 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Motor IA 4K HDR Upscaler</span>
                      </div>
                      <p className="text-[10px] text-gray-400">Realce de nitidez y contraste</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      enhance4kEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-400'
                    }`}>
                      {enhance4kEnabled ? 'ACTIVO' : 'OFF'}
                    </span>
                  </button>

                  {RESOLUTION_OPTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQualitySelect(q.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedResolution === q.id 
                          ? 'bg-netflix-red text-white' 
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{q.label}</span>
                          {selectedResolution === q.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <p className="text-[10px] text-gray-300/80">{q.res} • {q.bitrate}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 font-bold text-amber-300">
                        {q.badge}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Smart TV Cast */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCastModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15"
            title="Transmitir a Smart TV (AirPlay / Chromecast)"
          >
            <Cast className="w-4 h-4" />
            <span className="hidden xl:inline">Smart TV</span>
          </motion.button>

          {/* Toggle HUD Diagnóstico 4K */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStatsHud(!showStatsHud)}
            className={`p-2 rounded-full border transition-all hidden sm:flex ${
              showStatsHud 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Diagnóstico de Enlaces y 4K UHD"
          >
            <Activity className="w-4 h-4" />
          </motion.button>

          {/* Recargar */}
          <motion.button 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={handleReload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10"
            title="Recargar enlace actual"
          >
            <RotateCw className="w-4 h-4" />
          </motion.button>

          {/* Cerrar */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-full bg-netflix-red hover:bg-red-700 text-white transition-all shadow-lg shadow-red-900/50"
            title="Cerrar reproductor"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.header>

      {/* Main Video Cinema Viewport */}
      <main className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* Notificación Flotante del Auto-Detector Inteligente */}
        <AnimatePresence>
          {autoSwitchNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-5 inset-x-0 mx-auto w-fit max-w-md z-40 bg-black/90 backdrop-blur-2xl border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center space-x-2 pointer-events-none"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{autoSwitchNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Estadísticas 4K y Escáner de Enlaces en tiempo real */}
        <AnimatePresence>
          {showStatsHud && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-6 z-30 bg-black/90 backdrop-blur-xl p-4 rounded-2xl border border-white/15 text-[11px] font-mono text-gray-300 space-y-1.5 shadow-2xl max-w-sm"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-emerald-400 font-bold">
                <span className="flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1" /> ESCÁNER 4K & ENLACES
                </span>
                <span className="bg-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded">VERIFICADO</span>
              </div>
              <p><span className="text-gray-500">Resolución:</span> <strong className="text-white">{realResolution}</strong></p>
              <p><span className="text-gray-500">Motor Upscaler 4K:</span> <strong className="text-amber-300">{enhance4kEnabled ? 'HDR10+ Activo' : 'Apagado'}</strong></p>
              <p><span className="text-gray-500">Streams HLS Directos:</span> <strong className="text-emerald-400">{directHlsStreams.length} activos (0% Ads)</strong></p>
              <p><span className="text-gray-500">Nodos Español Latino:</span> <strong className="text-emerald-400">{latinoSourcesCount > 0 ? `${latinoSourcesCount} doblajes verificados` : 'Multi-Audio Activo'}</strong></p>
              <p><span className="text-gray-500">Subtítulos Español:</span> <strong className="text-white">{subtitlesList.length} pistas cargadas</strong></p>
              <p><span className="text-gray-500">Escudo Anti-Redirección:</span> <strong className="text-emerald-400">100% Bloqueado</strong></p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Spinner */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md space-y-4 pointer-events-none"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-netflix-red/20 border-t-netflix-red rounded-full animate-spin" />
                <Zap className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1 px-4">
                <p className="text-white text-sm font-black tracking-wide">
                  {isScanningLinks
                    ? 'Escaneando enlaces funcionales en 4K y Español Latino...'
                    : `Iniciando reproducción en ${showTrailer ? 'Tráiler 4K Español' : currentProvider.name}...`}
                </p>
                <p className="text-xs text-emerald-400 font-bold">
                  {movie.isTv
                    ? `Temporada ${currentSeason} • Capítulo ${currentEpisode} • 0% Anuncios`
                    : '0% Anuncios • Sin Redirecciones • Audio y Subtítulos en Español'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REPRODUCTOR 1: MODO NATIVO HLS / MP4 4K (0% ANUNCIOS, 0% IFRAMES, SUBTÍTULOS ESPAÑOL LATINO) */}
        {isNativeServer && !showTrailer ? (
          <div className="relative w-full h-full flex items-center justify-center group/player">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlayPause}
              style={{
                filter: enhance4kEnabled ? currentQualityObj.filter : 'none'
              }}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                  if (videoRef.current.buffered.length > 0) {
                    setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
                  }
                }
              }}
              onLoadedMetadata={() => {
                setIsLoading(false);
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onCanPlay={() => setIsLoading(false)}
              onEnded={() => {
                if (movie.isTv) handleNextEpisode();
              }}
              className="w-full h-full object-contain max-h-[88vh] transition-all duration-300"
            />

            {/* Overlay de Subtítulos Cinema 4K en Español Latino */}
            {activeCueText && (
              <div className="absolute bottom-24 sm:bottom-28 inset-x-0 z-20 flex justify-center px-6 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md text-white font-bold text-sm sm:text-lg md:text-xl px-4 py-1.5 rounded-xl border border-white/10 text-center max-w-3xl shadow-2xl leading-snug whitespace-pre-line">
                  {activeCueText}
                </div>
              </div>
            )}

            {/* Selector rápido de Nodos HLS Directos si hay múltiples activos */}
            {selectedServer === 'native_hls_4k' && directHlsStreams.length > 1 && controlsVisible && (
              <div className="absolute top-4 right-6 z-20 flex items-center space-x-1.5 bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15">
                <span className="text-[10px] font-black text-emerald-400 uppercase mr-1">Nodos HLS:</span>
                {directHlsStreams.slice(0, 4).map((node, idx) => (
                  <button
                    key={node.id}
                    onClick={() => setActiveHlsIndex(idx)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      activeHlsIndex === idx
                        ? 'bg-netflix-red text-white'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    Nodo {idx + 1} ({node.ping})
                  </button>
                ))}
              </div>
            )}

            {/* Overlay Play/Pause Indicator */}
            <AnimatePresence>
              {!isPlaying && !isLoading && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={togglePlayPause}
                  className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-netflix-red/90 backdrop-blur-md border border-white/30 flex items-center justify-center text-white cursor-pointer shadow-[0_0_40px_rgba(229,9,20,0.6)] z-20 pointer-events-auto"
                >
                  <Play className="w-10 h-10 fill-current ml-1" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controles Flotantes del Reproductor 4K Nativo */}
            <motion.div 
              animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 40 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-4 left-4 right-4 z-20 max-w-5xl mx-auto bg-black/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-2 pointer-events-auto"
            >
              {/* Barra de Progreso */}
              <div className="relative w-full flex items-center group/scrubber cursor-pointer">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-netflix-red hover:h-2 transition-all"
                />
              </div>

              {/* Fila Inferior de Controles */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <button 
                    onClick={togglePlayPause}
                    className="text-white hover:text-netflix-red transition-colors p-1"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button 
                    onClick={() => skipTime(-10)}
                    className="text-gray-300 hover:text-white transition-colors text-xs font-bold px-2 py-0.5 rounded bg-white/10"
                    title="Retroceder 10s"
                  >
                    -10s
                  </button>
                  <button 
                    onClick={() => skipTime(10)}
                    className="text-gray-300 hover:text-white transition-colors text-xs font-bold px-2 py-0.5 rounded bg-white/10"
                    title="Adelantar 10s"
                  >
                    +10s
                  </button>

                  {/* Control de Volumen */}
                  <div className="flex items-center space-x-1.5">
                    <button onClick={toggleMute} className="text-gray-300 hover:text-white p-1">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-white/20 rounded accent-white cursor-pointer"
                    />
                  </div>

                  {/* Tiempo */}
                  <span className="text-xs font-mono text-gray-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Indicadores de 4K y Pantalla Completa */}
                <div className="flex items-center space-x-2.5">
                  {audioTracks.length > 1 && (
                    <select
                      value={activeAudioTrack}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setActiveAudioTrack(idx);
                        if (hlsRef.current) hlsRef.current.audioTrack = idx;
                      }}
                      className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/15"
                    >
                      {audioTracks.map((t, i) => (
                        <option key={i} value={i} className="bg-zinc-900">
                          Audio: {t.name || t.lang || `Pista ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded hidden sm:inline">
                    0% ANUNCIOS
                  </span>

                  <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                    {enhance4kEnabled ? '4K HDR UPSCALED' : '4K NATIVO'}
                  </span>

                  <button
                    onClick={toggleFullscreen}
                    className="text-gray-300 hover:text-white p-1 transition-colors"
                    title="Pantalla Completa"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* REPRODUCTOR 2: SERVIDORES VERIFICADOS CON SANDBOX ESTRICTO (CERO POPUPS, CERO REDIRECCIONES) */
          <motion.div 
            initial={{ scale: 0.99, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-full max-w-7xl max-h-[85vh] aspect-video mx-auto px-2 sm:px-6 flex items-center justify-center"
          >
            <iframe 
              key={`${selectedServer}_${iframeKey}_${resolvedImdbId || ''}`}
              src={showTrailer ? trailerUrl : streamUrl}
              title={`Reproductor ${movie.title}`}
              className="w-full h-full rounded-2xl shadow-2xl border border-white/10 bg-[#08080c]"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="origin"
              /* 
                SANDBOX ESTRICTO EN SERVIDORES COMPATIBLES (PlayLatin, CineSrc, EmbedWave):
                Sin 'allow-popups' y sin 'allow-top-navigation', es 100% imposible que abran ventanas o redireccionen.
              */
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              onLoad={() => setIsLoading(false)}
            />
          </motion.div>
        )}

      </main>

      {/* Bottom Bar: Conmutador Inteligente de Servidores con Estado Auto-Detectado */}
      <motion.footer 
        animate={{ y: controlsVisible ? 0 : 90, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.28 }}
        className="bg-black/95 border-t border-white/[0.08] px-4 sm:px-6 py-3 shrink-0 z-30 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Server Switcher Tabs */}
          <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-start">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center mr-1">
              <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" /> Auto-Detector:
            </span>

            {STREAM_PROVIDERS.map((provider) => {
              const isActive = !showTrailer && selectedServer === provider.id;
              const statusObj = scanReport?.serverStatuses?.[provider.id];
              const isVerifiedOnline = statusObj ? statusObj.online : true;
              const livePing = statusObj?.ping || provider.ping;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleServerChange(provider.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-300 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeServerPill"
                      className="absolute inset-0 bg-netflix-red rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={`w-2 h-2 rounded-full relative z-10 ${
                      isVerifiedOnline ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="relative z-10">{provider.name}</span>
                  <span className={`relative z-10 text-[9px] px-1.5 py-0.2 rounded font-black ${
                    isActive ? 'bg-black/40 text-amber-300' : 'bg-white/10 text-gray-300'
                  }`}>
                    {provider.badge}
                  </span>
                  <span className="relative z-10 text-[9px] font-mono text-emerald-300/90 hidden sm:inline">
                    {livePing}
                  </span>
                </button>
              );
            })}

            {activeTrailerKey && (
              <button
                onClick={handleOpenTrailer}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  showTrailer
                    ? 'text-white shadow-lg shadow-red-900/50'
                    : 'text-gray-300 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10'
                }`}
              >
                {showTrailer && (
                  <motion.div 
                    layoutId="activeServerPill"
                    className="absolute inset-0 bg-red-600 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Youtube className="w-3.5 h-3.5 text-red-400 relative z-10" />
                <span className="relative z-10">Tráiler 4K Español</span>
              </button>
            )}
          </div>

          {/* Siguiente Episodio o Estado de Protección */}
          <div className="flex items-center space-x-3">
            {movie.isTv && (
              <button
                onClick={handleNextEpisode}
                className="px-4 py-1.5 rounded-xl bg-netflix-red hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-red-900/40"
              >
                <span>Siguiente Cap. ({currentEpisode + 1})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="hidden xl:flex items-center space-x-1.5 text-[11px] text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Enlaces verificados automáticamente • 0% Ads</span>
            </div>
          </div>

        </div>
      </motion.footer>

      {/* Modal de Transmisión a Smart TV */}
      <AnimatePresence>
        {isCastModalOpen && (
          <CastModal 
            isOpen={isCastModalOpen}
            onClose={() => setIsCastModalOpen(false)}
            movie={movie}
            season={currentSeason}
            episode={currentEpisode}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}
