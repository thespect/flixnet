import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { STREAM_PROVIDERS, StorageService, MovieAPI, REAL_4K_SOURCES, KNOWN_IMDB_IDS } from '../services/movieService';
import { StreamScannerService } from '../services/streamScannerService';
import { CastService } from '../services/castService';
import CastModal from './CastModal';

// Opciones de Resolución y Escalado 4K Real
const RESOLUTION_OPTIONS = [
  { id: '2160p', label: '4K Ultra HD (2160p)', badge: '4K HDR10+', bitrate: '42.8 Mbps', res: '3840 x 2160', fps: '60 FPS', filter: 'url(#cineflex-4k-upscaler) contrast(1.06) saturate(1.12)' },
  { id: '1080p', label: 'Full HD Pro (1080p)', badge: 'Alta Fidelidad', bitrate: '18.5 Mbps', res: '1920 x 1080', fps: '60 FPS', filter: 'contrast(1.03) saturate(1.05)' },
  { id: '720p', label: 'HD Rápido (720p)', badge: 'Ahorro Datos', bitrate: '6.2 Mbps', res: '1280 x 720', fps: '30 FPS', filter: 'none' },
];

// Pistas de Idioma / Audio Universales (Priorizando Español Latino Directo en 4K compatible con Chromecast y AirPlay)
const AUDIO_LANGUAGE_TRACKS = [
  {
    id: 'es_latino_dub',
    label: '🇲🇽 Español Latino (Doblaje Oficial 4K)',
    shortLabel: '🇲🇽 Español Latino',
    desc: 'Flujo HLS .m3u8 directo con doblaje Español Latino oficial (100% compatible con Chromecast y AirPlay)',
    badge: 'DOBLAJE OFICIAL',
    langCode: 'latino'
  },
  {
    id: 'es_castellano_dub',
    label: '🇪🇸 Español Castellano (España)',
    shortLabel: '🇪🇸 Castellano',
    desc: 'Flujo HLS .m3u8 directo con audio doblado al Español de España',
    badge: 'ESPAÑA',
    langCode: 'castellano'
  },
  {
    id: 'es_ai_voiceover',
    label: '🇲🇽 Español Latino (Voz IA en Servidor 1)',
    shortLabel: '🇲🇽 Voz IA Español',
    desc: 'Mantiene el flujo Master 4K y traduce los diálogos con voz en Español en tiempo real',
    badge: '4K + VOZ ES',
    langCode: 'ai_es'
  },
  {
    id: 'en_original_sub_es',
    label: '🇺🇸 Inglés Original + Subtítulos Español',
    shortLabel: '🇺🇸 Inglés + Sub ES',
    desc: 'Audio original Master 4K en Servidor 1 con subtítulos en Español Latino activados',
    badge: 'MASTER 4K',
    langCode: 'subtitulado'
  }
];

export default function VideoPlayerModal({ 
  movie, 
  onClose,
  initialSeason = 1,
  initialEpisode = 1,
  initialEpisodeTitle = ''
}) {
  const [selectedServer, setSelectedServer] = useState(STREAM_PROVIDERS[0].id);
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
  const [resolvedImdbId, setResolvedImdbId] = useState(movie?.imdb_id || KNOWN_IMDB_IDS[movie?.id] || null);

  // Estado de Serie y Selector de Temporadas / Capítulos dentro del Reproductor
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodeTitle, setEpisodeTitle] = useState(initialEpisodeTitle);
  const [pickerSeason, setPickerSeason] = useState(initialSeason);
  const [totalSeasonsCount, setTotalSeasonsCount] = useState(movie?.isTv ? 4 : 1);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [isLoadingSeasonEpisodes, setIsLoadingSeasonEpisodes] = useState(false);

  // Estados del Auto-Detector Inteligente de Links y Streams HLS
  const [isScanningLinks, setIsScanningLinks] = useState(true);
  const [scanReport, setScanReport] = useState(null);
  const [directHlsStreams, setDirectHlsStreams] = useState([]);
  const [activeHlsIndex, setActiveHlsIndex] = useState(0);
  const [subtitlesList, setSubtitlesList] = useState([]);
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
      } catch {}
    }
  }, []);

  useEffect(() => {
    return () => stopSpeechSynthesis();
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

  // 1. AUTO-DETECTOR INTELIGENTE DE LINKS Y SERVIDORES FUNCIONALES
  useEffect(() => {
    if (!movie) return;
    let cancelled = false;

    setIsScanningLinks(true);
    setIsLoading(true);
    StorageService.addToHistory(movie, selectedServer, currentSeason, currentEpisode);

    MovieAPI.getTrailer(movie.id, movie.isTv).then((key) => {
      if (!cancelled && key) setTrailerKey(key);
    });

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
      const streams = report.directHlsStreams || [];
      setDirectHlsStreams(streams);
      setSubtitlesList(report.subtitles || []);
      setIsScanningLinks(false);

      // Priorizar siempre el nodo HLS directo en Español Latino (isLatinoDub) si existe
      const latinoIdx = streams.findIndex((s) => s.isLatinoDub);
      if (latinoIdx >= 0) {
        setActiveHlsIndex(latinoIdx);
        setSelectedAudioMode('es_latino_dub');
        if (selectedServer === 'native_hls_4k') {
          showToast('🇲🇽 Español Latino 4K Directo conectado (Compatible con Chromecast y AirPlay)');
        }
      } else if (streams.length > 0) {
        setActiveHlsIndex(0);
        setSelectedAudioMode('en_original_sub_es');
        if (selectedServer === 'native_hls_4k') {
          showToast(
            `⚡ 4K Directo listo (${streams.length} nodos). Puedes cambiar idioma en "Audio / Idioma"`
          );
        }
      } else if (!movie.customUrl && selectedServer === 'native_hls_4k') {
        setSelectedServer('embed69_latino');
        setSelectedAudioMode('es_latino_dub');
        showToast('🇲🇽 Auto-Detector: Conectado a Embed69 Español Latino 4K');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [movie, currentSeason, currentEpisode]);

  // 2. ESCUCHAR EVENTOS EN TIEMPO REAL DE PLAYLATIN (Detección automática de idioma y fallos)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      const type = String(event.data.type || '');

      if (type === 'meinecloud:ready') {
        setIsLoading(false);
        const versions = event.data.versions || ['latino'];
        showToast(`🎧 Pista activa: ${versions.map(v => v.toUpperCase()).join(' / ')}`);
      } else if (type === 'meinecloud:error') {
        if (selectedServer === 'playlatin_es') {
          if (directHlsStreams.length > 0) {
            setSelectedServer('native_hls_4k');
            showToast('🔄 Auto-Detector: Conmutando a Cineflex 4K Latino Directo...');
          } else {
            setSelectedServer('embed69_latino');
            showToast('🔄 Auto-Detector: Conmutando a Embed69 Latino 4K...');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedServer, directHlsStreams, showToast]);

  // 3. CAMBIO DE PISTA DE AUDIO / IDIOMA (Prioriza Streams HLS .m3u8 Directos en Español Latino para Chromecast/AirPlay)
  const handleSelectAudioTrack = (trackId) => {
    stopSpeechSynthesis();
    setSelectedAudioMode(trackId);
    setActiveMenu(null);

    if (trackId === 'es_latino_dub') {
      setPlayLatinLang('latino');
      // 1. Buscar primero si tenemos un flujo HLS .m3u8 directo con doblaje Español Latino (Embed69 LAT)
      const directLatinoIdx = directHlsStreams.findIndex((s) => s.isLatinoDub);
      const esNativeIdx = hlsAudioTracks.findIndex((t) =>
        /es|spa|lat|español|spanish/i.test(`${t.name || ''} ${t.lang || ''}`)
      );

      if (directLatinoIdx >= 0) {
        setSelectedServer('native_hls_4k');
        setShowTrailer(false);
        setActiveHlsIndex(directLatinoIdx);
        loadSubtitleTrack(-1);
        showToast('🇲🇽 Pista activa: Español Latino Oficial (4K Directo • Chromecast & AirPlay)');
      } else if (selectedServer === 'native_hls_4k' && esNativeIdx >= 0 && hlsRef.current) {
        hlsRef.current.audioTrack = esNativeIdx;
        setActiveHlsAudioTrack(esNativeIdx);
        loadSubtitleTrack(-1);
        showToast('🇲🇽 Pista de Audio HLS Español Latino activada');
      } else {
        setSelectedServer('embed69_latino');
        setShowTrailer(false);
        setIsLoading(true);
        setIframeKey((prev) => prev + 1);
        showToast('🇲🇽 Cambiado a Servidor Español Latino (Doblaje Oficial)');
      }
    } else if (trackId === 'es_castellano_dub') {
      setPlayLatinLang('castellano');
      const directCastIdx = directHlsStreams.findIndex((s) => s.isCastellanoDub);
      if (directCastIdx >= 0) {
        setSelectedServer('native_hls_4k');
        setShowTrailer(false);
        setActiveHlsIndex(directCastIdx);
        loadSubtitleTrack(-1);
        showToast('🇪🇸 Pista activa: Español Castellano (4K Directo)');
      } else {
        setSelectedServer('playlatin_es');
        setShowTrailer(false);
        setIsLoading(true);
        setIframeKey((prev) => prev + 1);
        showToast('🇪🇸 Cambiado a Pista de Audio: Español Castellano (España)');
      }
    } else if (trackId === 'es_ai_voiceover') {
      if (selectedServer !== 'native_hls_4k') {
        setSelectedServer('native_hls_4k');
        setShowTrailer(false);
      }
      if (activeSubIndex < 0 && subtitlesList.length > 0) {
        const esIdx = subtitlesList.findIndex((s) => s.isLatino || s.isSpanish);
        loadSubtitleTrack(esIdx >= 0 ? esIdx : 0);
      }
      showToast('🇲🇽 Voz IA en Español Latino activada sobre Servidor 1 (4K Nativo)');
    } else if (trackId === 'en_original_sub_es') {
      if (selectedServer !== 'native_hls_4k') {
        setSelectedServer('native_hls_4k');
        setShowTrailer(false);
      }
      const origIdx = directHlsStreams.findIndex((s) => !s.isLatinoDub && !s.isCastellanoDub);
      if (origIdx >= 0) {
        setActiveHlsIndex(origIdx);
      }
      if (videoRef.current) {
        videoRef.current.volume = volume;
      }
      if (subtitlesList.length > 0) {
        const esIdx = subtitlesList.findIndex((s) => s.isLatino || s.isSpanish);
        loadSubtitleTrack(esIdx >= 0 ? esIdx : 0);
      }
      showToast('🇺🇸 Pista activa: Inglés Original 4K + Subtítulos en Español');
    }
  };

  // Doblaje Voz IA en Español sincronizado con subtítulos cuando el usuario elige 'es_ai_voiceover' en Servidor 1
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

        // Atenuar suavemente el audio original en inglés (ducking) mientras habla la voz en español
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
      } catch {}
    }
  }, [activeCueText, selectedAudioMode, isPlaying, isMuted, volume]);

  // 4. MOTOR DE REPRODUCCIÓN NATIVA HLS.JS (0% ANUNCIOS, 0% IFRAMES, ESCALADO 4K)
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
    setHlsAudioTracks([]);

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

      hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
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

        video.play().catch(() => {});
      });

      hls.on(HlsClass.Events.AUDIO_TRACKS_UPDATED, () => {
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setHlsAudioTracks([...hls.audioTracks]);
        }
      });

      hls.on(HlsClass.Events.ERROR, (_, errData) => {
        if (errData.fatal) {
          if (activeHlsIndex + 1 < directHlsStreams.length) {
            const nextIdx = activeHlsIndex + 1;
            setActiveHlsIndex(nextIdx);
            showToast(`⚡ Auto-Detector: Conmutando a ${directHlsStreams[nextIdx].name}...`);
          } else {
            setSelectedServer('playlatin_es');
            setSelectedAudioMode('es_latino_dub');
            showToast('🇲🇽 Auto-Detector: Conmutando a PlayLatin Oficial (Español Latino)');
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

  // 5. CARGAR SUBTÍTULOS EN ESPAÑOL LATINO AUTOMÁTICAMENTE CUANDO EL AUDIO ES INGLÉS O VOZ IA
  useEffect(() => {
    if (!isNativeServer || showTrailer || !videoRef.current || subtitlesList.length === 0) {
      setActiveCueText('');
      return;
    }

    // Si el nodo actual ya tiene Doblaje Español Latino o Castellano real, no forzar subtítulos encima a menos que sea Voz IA
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

  // Stream URL con soporte de idioma dinámico (latino / castellano / subtitulado)
  const streamUrl = currentProvider.getUrl(
    movie.id,
    movie.isTv,
    currentSeason,
    currentEpisode,
    resolvedImdbId,
    playLatinLang
  );

  const activeTrailerKey = movie.trailer_id || trailerKey;
  const trailerUrl = activeTrailerKey 
    ? `https://www.youtube-nocookie.com/embed/${activeTrailerKey}?autoplay=1&rel=0&vq=hd2160&modestbranding=1&hl=es`
    : null;

  const handleServerChange = (serverId) => {
    stopSpeechSynthesis();
    setShowTrailer(false);
    setSelectedServer(serverId);
    setActiveMenu(null);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    if (serverId === 'playlatin_es' && selectedAudioMode === 'en_original_sub_es') {
      setSelectedAudioMode('es_latino_dub');
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
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSelectSeasonAndEpisode = (seasonNum, epNum, epName = '') => {
    stopSpeechSynthesis();
    setCurrentSeason(seasonNum);
    setPickerSeason(seasonNum);
    setCurrentEpisode(epNum);
    setEpisodeTitle(epName || `Capítulo ${epNum}`);
    setActiveMenu(null);
    setShowTrailer(false);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    showToast(`📺 Reproduciendo Temporada ${seasonNum} • Capítulo ${epNum}`);
  };

  const handleNextEpisode = () => {
    stopSpeechSynthesis();
    const nextEp = currentEpisode + 1;
    setCurrentEpisode(nextEp);
    setEpisodeTitle(`Capítulo ${nextEp}`);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    showToast(`📺 Siguiente: Temporada ${currentSeason} • Capítulo ${nextEp}`);
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      stopSpeechSynthesis();
      const prevEp = currentEpisode - 1;
      setCurrentEpisode(prevEp);
      setEpisodeTitle(`Capítulo ${prevEp}`);
      setIsLoading(true);
      setIframeKey(prev => prev + 1);
      showToast(`📺 Anterior: Temporada ${currentSeason} • Capítulo ${prevEp}`);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      stopSpeechSynthesis();
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
          window.screen.orientation.lock('landscape').catch(() => {});
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
    } catch {}
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

      {/* BARRA SUPERIOR 100% RESPONSIVA (Celular, Tablet y Desktop) */}
      <motion.header 
        animate={{ y: controlsVisible ? 0 : -110, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="bg-black/92 backdrop-blur-2xl border-b border-white/[0.08] px-3 sm:px-6 py-2.5 sm:py-3 pt-safe flex items-center justify-between gap-2 z-30 shrink-0 shadow-2xl"
      >
        {/* Izquierda: Volver y Título */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0 flex-1">
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            className="flex items-center space-x-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 shrink-0"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </motion.button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h2 className="text-white text-xs sm:text-base md:text-lg font-black truncate">
                {movie.title}
              </h2>
              {movie.isTv && (
                <span className="bg-netflix-red text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                  T{currentSeason}:E{currentEpisode}
                </span>
              )}
              <span className="hidden md:inline-flex bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full items-center shrink-0">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 
                0% ANUNCIOS
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-400 font-bold truncate">
                {showTrailer ? 'Tráiler 4K Español' : currentProvider.name}
              </span>
              <span>•</span>
              <span className="text-amber-300 font-bold truncate">
                {currentAudioObj.shortLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Botón de Temporadas/Capítulos + Audio/Idioma + Subtítulos + Calidad 4K + Cerrar */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          
          {/* BOTÓN DE TEMPORADAS Y CAPÍTULOS (Permite cambiar de Temporada o Capítulo sin salir del reproductor) */}
          <button
            onClick={() => {
              setPickerSeason(currentSeason);
              setActiveMenu(activeMenu === 'episodes' ? null : 'episodes');
            }}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-black border transition-all shadow-lg ${
              activeMenu === 'episodes'
                ? 'bg-netflix-red text-white border-netflix-red shadow-red-900/50'
                : 'bg-netflix-red/20 hover:bg-netflix-red/35 text-white border-netflix-red/50'
            }`}
            title="Seleccionar Temporada y Capítulo"
          >
            <Tv className="w-3.5 h-3.5 text-netflix-red shrink-0" />
            <span>
              {movie.isTv ? `T${currentSeason}:E${currentEpisode} • Capítulos` : 'Temp / Cap'}
            </span>
          </button>

          {/* BOTÓN DESTACADO DE PISTA DE AUDIO / IDIOMA (Siempre visible en Celular, Tablet y PC) */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'audio' ? null : 'audio')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-black border transition-all shadow-lg ${
              activeMenu === 'audio' || selectedAudioMode.startsWith('es_')
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-900/40'
                : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
            }`}
            title="Cambiar Pista de Audio / Idioma (Español Latino, Castellano, Inglés)"
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[95px] sm:max-w-none">
              {currentAudioObj.shortLabel}
            </span>
          </button>

          {/* Botón de Subtítulos */}
          {isNativeServer && !showTrailer && (
            <button
              onClick={() => setActiveMenu(activeMenu === 'subs' ? null : 'subs')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all ${
                activeSubIndex >= 0
                  ? 'bg-white/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/10 text-gray-300 border-white/15'
              }`}
              title="Subtítulos en Español"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Subtítulos</span>
            </button>
          )}

          {/* Botón de Calidad 4K */}
          <button 
            onClick={() => setActiveMenu(activeMenu === 'quality' ? null : 'quality')}
            className="hidden sm:flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-[11px] sm:text-xs font-black text-amber-300 border border-amber-400/30"
            title="Resolución 4K y Nitidez HDR"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
            <span>{selectedResolution}</span>
          </button>

          {/* Botón Chromecast & AirPlay (Siempre visible en Celular, Tablet y PC) */}
          <button 
            onClick={() => setIsCastModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-[11px] sm:text-xs font-black shadow-lg"
            title="Transmitir por Chromecast o AirPlay a Smart TV"
          >
            <Cast className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">TV Cast</span>
          </button>

          {/* Recargar */}
          <button 
            onClick={handleReload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10"
            title="Recargar reproductor"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Cerrar */}
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-netflix-red hover:bg-red-700 text-white shadow-lg shadow-red-900/50"
            title="Cerrar"
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all border ${
                          pickerSeason === sNum
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
                            className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center gap-3 group ${
                              isCurrentEp
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
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
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
                            showToast(`🎧 Pista HLS seleccionada: ${t.name || t.lang || `Audio ${idx + 1}`}`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                            activeHlsAudioTrack === idx ? 'bg-netflix-red text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                      activeSubIndex === -1 ? 'bg-netflix-red text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                          activeSubIndex === idx ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      enhance4kEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-gray-400'
                    }`}>
                      {enhance4kEnabled ? 'ACTIVO' : 'APAGADO'}
                    </span>
                  </button>

                  {RESOLUTION_OPTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQualitySelect(q.id)}
                      className={`w-full text-left p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors border ${
                        selectedResolution === q.id 
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

      {/* VIEWPORT CENTRAL DE VIDEO 100% RESPONSIVO (Se adapta a vertical y horizontal en celular, tablet y PC) */}
      <main className="relative flex-1 w-full min-h-0 bg-black flex items-center justify-center overflow-hidden">
        
        {/* Notificación Flotante del Auto-Detector */}
        <AnimatePresence>
          {autoSwitchNotice && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute top-3 inset-x-3 mx-auto w-fit max-w-[92vw] sm:max-w-lg z-30 bg-black/90 backdrop-blur-2xl border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-2xl text-[11px] sm:text-xs font-bold shadow-2xl flex items-center space-x-2 pointer-events-none text-center"
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

        {/* Loading Spinner */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md space-y-3 p-4 pointer-events-none"
            >
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-netflix-red/20 border-t-netflix-red rounded-full animate-spin" />
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1 max-w-sm">
                <p className="text-white text-xs sm:text-sm font-black tracking-wide">
                  {isScanningLinks
                    ? 'Auto-detectando enlaces activos en 4K y Español...'
                    : `Conectando a ${showTrailer ? 'Tráiler 4K Español' : currentProvider.name}...`}
                </p>
                <p className="text-[11px] text-emerald-400 font-bold">
                  {currentAudioObj.label} • 0% Anuncios
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REPRODUCTOR 1: MODO NATIVO HLS / MP4 4K (100% Responsivo en Celular, Tablet y PC) */}
        {isNativeServer && !showTrailer ? (
          <div 
            onClick={handleVideoTouchOrClick}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              x-webkit-airplay="allow"
              crossOrigin="anonymous"
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
              className="w-full h-full max-h-full max-w-full object-contain"
            />

            {/* Overlay de Subtítulos Cinema 4K Responsivo */}
            {activeCueText && (
              <div
                className={`absolute inset-x-0 z-20 flex justify-center px-3 sm:px-8 pointer-events-none transition-all duration-200 ${
                  controlsVisible ? 'bottom-28 sm:bottom-32' : 'bottom-6 sm:bottom-10'
                }`}
              >
                <div className="bg-black/80 backdrop-blur-md text-white font-bold text-xs sm:text-base md:text-xl px-3.5 py-1.5 rounded-xl border border-white/10 text-center max-w-[92vw] sm:max-w-3xl shadow-2xl leading-snug whitespace-pre-line">
                  {activeCueText}
                </div>
              </div>
            )}

            {/* Selector rápido de Nodos HLS Directos (arriba a la derecha) */}
            {selectedServer === 'native_hls_4k' && directHlsStreams.length > 1 && controlsVisible && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2.5 right-3 sm:right-6 z-20 flex items-center space-x-1 bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/15 max-w-[90vw] overflow-x-auto no-scrollbar"
              >
                <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase mr-1 shrink-0">Nodos:</span>
                {directHlsStreams.slice(0, 4).map((node, idx) => (
                  <button
                    key={node.id}
                    onClick={() => setActiveHlsIndex(idx)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                      activeHlsIndex === idx
                        ? 'bg-netflix-red text-white'
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
                  className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-netflix-red/90 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white cursor-pointer shadow-[0_0_40px_rgba(229,9,20,0.7)] z-20"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* BARRA DE CONTROLES FLOTANTE DEL REPRODUCTOR NATIVO (Adaptada a Móvil, Tablet y PC) */}
            <motion.div 
              animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 30 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-20 max-w-5xl mx-auto bg-black/88 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 sm:p-4 shadow-2xl space-y-2 ${
                controlsVisible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              {/* Fila 1: Línea de Tiempo Táctil + Tiempo */}
              <div className="flex items-center space-x-2.5">
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

              {/* Fila 2: Controles de Reproducción, Volumen, Selector de Idioma/Audio y Pantalla Completa */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                {/* Controles Izquierdos */}
                <div className="flex items-center space-x-1.5 sm:space-x-3">
                  <button 
                    onClick={togglePlayPause}
                    className="text-white hover:text-netflix-red transition-colors p-1.5 rounded-lg bg-white/10 sm:bg-transparent"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
                  </button>

                  <button 
                    onClick={() => skipTime(-10)}
                    className="text-gray-200 hover:text-white transition-colors text-[11px] font-black px-2 py-1 rounded-lg bg-white/10 active:scale-95"
                    title="Retroceder 10s"
                  >
                    -10s
                  </button>
                  <button 
                    onClick={() => skipTime(10)}
                    className="text-gray-200 hover:text-white transition-colors text-[11px] font-black px-2 py-1 rounded-lg bg-white/10 active:scale-95"
                    title="Adelantar 10s"
                  >
                    +10s
                  </button>

                  {/* Volumen */}
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
                      className="hidden sm:block w-16 h-1 bg-white/25 rounded accent-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* Controles Derechos: Selector de Pista de Audio / Idioma directo en la barra del reproductor */}
                <div className="flex items-center space-x-1.5 sm:space-x-2.5 ml-auto">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'audio' ? null : 'audio')}
                    className="px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-black flex items-center space-x-1 active:scale-95"
                    title="Cambiar Pista de Audio / Idioma"
                  >
                    <Headphones className="w-3.5 h-3.5 shrink-0" />
                    <span>Audio: {currentAudioObj.shortLabel}</span>
                  </button>

                  <button
                    onClick={() => setActiveMenu(activeMenu === 'subs' ? null : 'subs')}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-gray-200 text-[10px] sm:text-xs font-bold flex items-center space-x-1 active:scale-95"
                    title="Subtítulos"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Sub</span>
                  </button>

                  {/* Botón Directo AirPlay 2 / Chromecast en la Barra del Reproductor */}
                  <button
                    onClick={() => {
                      if (CastService.isAirPlayAvailable() && videoRef.current) {
                        CastService.triggerAirPlay(videoRef.current, resolvedNativeUrl);
                      } else {
                        setIsCastModalOpen(true);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-[10px] sm:text-xs font-black flex items-center space-x-1 active:scale-95"
                    title="Transmitir a Smart TV por AirPlay o Chromecast"
                  >
                    <Airplay className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">AirPlay / Cast</span>
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-netflix-red p-1.5 rounded-lg bg-white/10 sm:bg-transparent transition-colors"
                    title="Pantalla Completa"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* REPRODUCTOR 2: SERVIDORES EXTERNOS EN ESPAÑOL LATINO (100% Responsivo en Celular, Tablet y PC) */
          <div className="relative w-full h-full flex items-center justify-center p-0 sm:p-3 md:p-5">
            <div className="relative w-full h-full max-w-7xl sm:aspect-video flex items-center justify-center">
              <iframe 
                key={`${selectedServer}_${playLatinLang}_${iframeKey}_${resolvedImdbId || ''}`}
                src={showTrailer ? trailerUrl : streamUrl}
                title={`Reproductor ${movie.title}`}
                className="w-full h-full sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-white/10 bg-[#050508]"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                referrerPolicy="origin"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          </div>
        )}

      </main>

      {/* BARRA INFERIOR DE SERVIDORES Y EPISODIOS (Carrusel horizontal táctil en celular/tablet, sin apilarse) */}
      <motion.footer 
        animate={{ y: controlsVisible ? 0 : 100, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="bg-black/95 border-t border-white/[0.08] px-3 sm:px-6 py-2.5 pb-safe shrink-0 z-30 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Carrusel Horizontal Deslizable de Servidores (No ocupa media pantalla en celular) */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center shrink-0">
              <Radio className="w-3 h-3 mr-1 animate-pulse" /> Servidores:
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
                  className={`relative px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-300 hover:text-white bg-white/[0.06] hover:bg-white/10 border border-white/10'
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
                    className={`w-2 h-2 rounded-full relative z-10 shrink-0 ${
                      isVerifiedOnline ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="relative z-10">{provider.name}</span>
                  <span className={`relative z-10 text-[9px] px-1.5 py-0.2 rounded font-black ${
                    isActive ? 'bg-black/40 text-amber-300' : 'bg-white/10 text-gray-300'
                  }`}>
                    {provider.badge}
                  </span>
                  <span className="relative z-10 text-[9px] font-mono text-emerald-300/90 hidden md:inline">
                    {livePing}
                  </span>
                </button>
              );
            })}

            {activeTrailerKey && (
              <button
                onClick={handleOpenTrailer}
                className={`relative px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 whitespace-nowrap ${
                  showTrailer
                    ? 'text-white shadow-lg shadow-red-900/50'
                    : 'text-gray-300 hover:text-white bg-white/[0.06] hover:bg-white/10 border border-white/10'
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
                <span className="relative z-10">Tráiler 4K</span>
              </button>
            )}
          </div>

          {/* Controles Rápidos de Temporadas y Capítulos en la Barra Inferior */}
          {movie.isTv && (
            <div className="flex items-center space-x-1.5 shrink-0">
              {currentEpisode > 1 && (
                <button
                  onClick={handlePrevEpisode}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] sm:text-xs flex items-center space-x-0.5 border border-white/15"
                  title="Capítulo Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>E{currentEpisode - 1}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setPickerSeason(currentSeason);
                  setActiveMenu(activeMenu === 'episodes' ? null : 'episodes');
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-[11px] sm:text-xs flex items-center space-x-1 border border-white/20"
                title="Elegir Temporada o Capítulo"
              >
                <Tv className="w-3.5 h-3.5 text-netflix-red shrink-0" />
                <span className="hidden md:inline">Capítulos</span>
                <span>(T{currentSeason}:E{currentEpisode})</span>
              </button>

              <button
                onClick={handleNextEpisode}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-netflix-red hover:bg-red-700 text-white font-black text-[11px] sm:text-xs flex items-center space-x-1 shadow-lg shadow-red-900/40"
                title="Siguiente Capítulo"
              >
                <span className="hidden sm:inline">Sig.</span>
                <span>E{currentEpisode + 1}</span>
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

    </motion.div>
  );
}
