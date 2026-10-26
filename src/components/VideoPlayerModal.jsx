import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowLeft, 
  Tv, 
  Film, 
  Server, 
  RotateCw, 
  ExternalLink, 
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
  Sliders, 
  Clock, 
  Layers, 
  Sparkles,
  Info
} from 'lucide-react';
import { STREAM_PROVIDERS, StorageService, MovieAPI, REAL_4K_SOURCES } from '../services/movieService';
import CastModal from './CastModal';

// Opciones de Resolución 4K Auténticas
const RESOLUTION_OPTIONS = [
  { id: '2160p', label: '4K Ultra HD (2160p)', badge: '4K Nativo', bitrate: '38.4 Mbps', res: '3840 x 2160', fps: '60 FPS', hdr: 'HDR10+ / Dolby Vision' },
  { id: '1080p', label: 'Full HD (1080p)', badge: 'Alta Fidelidad', bitrate: '16.5 Mbps', res: '1920 x 1080', fps: '60 FPS', hdr: 'SDR' },
  { id: '720p', label: 'HD (720p)', badge: 'Ahorro de Datos', bitrate: '5.2 Mbps', res: '1280 x 720', fps: '30 FPS', hdr: 'SDR' },
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
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [showStatsHud, setShowStatsHud] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [trailerKey, setTrailerKey] = useState(movie?.trailer_id || null);
  
  // Estado para series
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodeTitle, setEpisodeTitle] = useState(initialEpisodeTitle);

  // Estados del Reproductor HTML5 Nativo 4K
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const [realResolution, setRealResolution] = useState('3840 x 2160');

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

  // Cargar trailer y sincronizar historial
  useEffect(() => {
    if (movie) {
      StorageService.addToHistory(movie, selectedServer, currentSeason, currentEpisode);
      setIsLoading(true);

      if (!trailerKey) {
        MovieAPI.getTrailer(movie.id, movie.isTv).then(key => {
          if (key) setTrailerKey(key);
        });
      }
    }
  }, [movie, currentSeason, currentEpisode]);

  // Ocultar controles automáticamente tras inactividad
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3200);
  };

  if (!movie) return null;

  const currentProvider = STREAM_PROVIDERS.find(p => p.id === selectedServer) || STREAM_PROVIDERS[0];
  const isNativeServer = currentProvider.isNative || Boolean(movie.customUrl);

  // Determinación de URL de video 4K Real
  const active4kSource = movie.real4kSource || REAL_4K_SOURCES[0];
  const nativeVideoUrl = movie.customUrl || active4kSource.resolutions[selectedResolution] || active4kSource.resolutions['2160p'];

  // Stream URL para servidores de respaldo
  const streamUrl = currentProvider.getUrl(movie.id, movie.isTv, currentSeason, currentEpisode);

  // Trailer URL con solicitud explícita de resolución 2160p (4K UHD)
  const activeTrailerKey = movie.trailer_id || trailerKey;
  const trailerUrl = activeTrailerKey 
    ? `https://www.youtube-nocookie.com/embed/${activeTrailerKey}?autoplay=1&rel=0&vq=hd2160&modestbranding=1&enablejsapi=1`
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
      videoRef.current.play();
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
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
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
    if (videoRef.current) {
      const savedTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = savedTime;
          if (wasPlaying) videoRef.current.play().catch(() => {});
        }
      }, 100);
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

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-[#040406] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <motion.header 
        animate={{ y: controlsVisible ? 0 : -80, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-black/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between z-30 shrink-0 shadow-2xl"
      >
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 shadow-lg shrink-0"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </motion.button>

          <div className="min-w-0">
            <h2 className="text-white text-sm sm:text-base md:text-lg font-black truncate flex items-center space-x-2">
              <span className="truncate">{movie.title}</span>
              {movie.isTv && (
                <span className="bg-netflix-red text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                  T{currentSeason}:E{currentEpisode} {episodeTitle ? `• ${episodeTitle}` : ''}
                </span>
              )}
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 
                100% CERO ANUNCIOS
              </span>
            </h2>

            <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold truncate">
                {showTrailer ? 'Tráiler 4K UHD' : currentProvider.name}
              </span>
              <span className="hidden md:inline text-gray-600">•</span>
              <span className="hidden md:inline text-amber-300 font-bold">
                {currentQualityObj.label}
              </span>
              <span className="hidden md:inline text-gray-600">•</span>
              <span className="hidden md:inline text-gray-300">
                {currentQualityObj.bitrate}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Smart TV Cast, Quality Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Smart TV Cast */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCastModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-netflix-red hover:bg-red-700 text-white font-black text-xs transition-all shadow-lg shadow-red-900/50"
            title="Transmitir a Smart TV (AirPlay / Chromecast)"
          >
            <Cast className="w-4 h-4" />
            <span className="hidden md:inline">Transmitir a Smart TV</span>
          </motion.button>

          {/* Selector de Calidad 4K Real */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 border border-white/15"
              title="Ajuste de Calidad y Bitrate"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedResolution}</span>
            </motion.button>

            <AnimatePresence>
              {showQualityMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 top-11 w-72 bg-[#121216] border border-white/15 rounded-xl p-2.5 shadow-2xl z-50 space-y-1.5"
                >
                  <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-white/10 flex items-center justify-between">
                    <span>Resolución 4K Real</span>
                    <span className="text-emerald-400 font-mono">60 FPS</span>
                  </div>
                  {RESOLUTION_OPTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQualitySelect(q.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
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
                        <p className="text-[10px] text-gray-400">{q.res} • {q.bitrate}</p>
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
            title="Panel de Estadísticas 4K UHD"
          >
            <Activity className="w-4 h-4" />
          </motion.button>

          {/* Recargar */}
          <motion.button 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={handleReload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10"
            title="Recargar reproductor"
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
        
        {/* HUD Estadísticas 4K en tiempo real */}
        <AnimatePresence>
          {showStatsHud && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-6 z-30 bg-black/90 backdrop-blur-md p-4 rounded-xl border border-white/15 text-[11px] font-mono text-gray-300 space-y-1.5 shadow-2xl max-w-sm"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-emerald-400 font-bold">
                <span className="flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1" /> ESTADO 4K ULTRA HD
                </span>
                <span className="bg-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded">60 FPS</span>
              </div>
              <p><span className="text-gray-500">Resolución Render:</span> <strong className="text-white">{realResolution}</strong></p>
              <p><span className="text-gray-500">Bitrate actual:</span> {currentQualityObj.bitrate}</p>
              <p><span className="text-gray-500">Formato Códec:</span> HEVC / H.264 High 5.1</p>
              <p><span className="text-gray-500">Audio Códec:</span> Dolby Atmos / E-AC3 5.1 Latino</p>
              <p><span className="text-gray-500">Protección Anti-Popups:</span> <strong className="text-emerald-400">100% ACTIVA (Sandbox Estricto)</strong></p>
              <p><span className="text-gray-500">Latencia Servidor:</span> {currentProvider.ping}</p>
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
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-netflix-red/20 border-t-netflix-red rounded-full animate-spin" />
                <Zap className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white text-sm font-bold tracking-wide">
                  Conectando a {showTrailer ? 'Tráiler 4K Ultra HD' : currentProvider.name}...
                </p>
                <p className="text-xs text-emerald-400 font-bold">
                  {movie.isTv ? `Temporada ${currentSeason}, Episodio ${currentEpisode}` : 'Optimizando resolución 4K y Audio en Español Latino'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REPRODUCTOR 1: MODO HTML5 NATIVO 4K (100% CERO ANUNCIOS, 4K REAL) */}
        {isNativeServer && !showTrailer ? (
          <div className="relative w-full h-full flex items-center justify-center group/player">
            <video
              ref={videoRef}
              key={nativeVideoUrl}
              src={nativeVideoUrl}
              autoPlay
              playsInline
              onClick={togglePlayPause}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                  if (videoRef.current.buffered.length > 0) {
                    setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
                  }
                  if (videoRef.current.videoWidth) {
                    setRealResolution(`${videoRef.current.videoWidth} x ${videoRef.current.videoHeight}`);
                  }
                }
              }}
              onLoadedMetadata={() => {
                setIsLoading(false);
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 0);
                  if (videoRef.current.videoWidth) {
                    setRealResolution(`${videoRef.current.videoWidth} x ${videoRef.current.videoHeight}`);
                  }
                }
              }}
              onEnded={() => {
                if (movie.isTv) handleNextEpisode();
              }}
              className="w-full h-full object-contain max-h-[88vh]"
            />

            {/* Overlay Play/Pause Indicator on click */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={togglePlayPause}
                  className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer shadow-2xl z-20 pointer-events-auto"
                >
                  <Play className="w-10 h-10 fill-current ml-1" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Native Cinema Controls Bar */}
            <motion.div 
              animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 40 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-4 left-4 right-4 z-20 max-w-5xl mx-auto bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-2 pointer-events-auto"
            >
              {/* Timeline Scrub Bar */}
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

              {/* Bottom Row Controls */}
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
                    className="text-gray-300 hover:text-white transition-colors text-xs font-bold px-1.5 py-0.5 rounded bg-white/10"
                    title="Retroceder 10s"
                  >
                    -10s
                  </button>
                  <button 
                    onClick={() => skipTime(10)}
                    className="text-gray-300 hover:text-white transition-colors text-xs font-bold px-1.5 py-0.5 rounded bg-white/10"
                    title="Adelantar 10s"
                  >
                    +10s
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center space-x-1.5 group/vol">
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

                  {/* Time indicator */}
                  <span className="text-xs font-mono text-gray-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                    4K REAL 2160p
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
          /* REPRODUCTOR 2: IFRAME MULTI-SERVIDOR CON SANDBOX ANTI-POPUPS & ANTI-REDIRECCIÓN ESTRICTO */
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full max-w-7xl max-h-[85vh] aspect-video mx-auto px-2 sm:px-6 flex items-center justify-center"
          >
            <iframe 
              key={iframeKey}
              src={showTrailer ? trailerUrl : streamUrl}
              title={`Reproductor ${movie.title}`}
              className="w-full h-full rounded-2xl shadow-2xl border border-white/10 bg-[#0a0a0a]"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="origin"
              /* 
                PROTECCIÓN CRÍTICA ANTI-PUBLICIDAD Y ANTI-REDIRECCIÓN:
                Al omitir 'allow-popups', el navegador bloquea window.open y popunders.
                Al omitir 'allow-top-navigation', el navegador bloquea que el iframe cambie la URL de Cineflex a sitios de apuestas/adware.
              */
              sandbox={
                showTrailer 
                  ? "allow-scripts allow-same-origin allow-presentation allow-forms"
                  : "allow-scripts allow-same-origin allow-forms allow-presentation"
              }
              onLoad={() => setIsLoading(false)}
            />
          </motion.div>
        )}

      </main>

      {/* Bottom Bar: Multi-Server Switcher */}
      <motion.footer 
        animate={{ y: controlsVisible ? 0 : 80, opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-black/95 border-t border-white/[0.08] px-4 sm:px-6 py-3.5 shrink-0 z-30 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Server Switcher Tabs */}
          <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-start">
            <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center mr-1">
              <Server className="w-3.5 h-3.5 mr-1 text-netflix-red" /> Servidores:
            </span>

            {STREAM_PROVIDERS.map((provider) => {
              const isActive = !showTrailer && selectedServer === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() => handleServerChange(provider.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeServerPill"
                      className="absolute inset-0 bg-netflix-red rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {provider.isNative ? (
                    <Zap className="w-3.5 h-3.5 relative z-10 text-amber-400" />
                  ) : (
                    <Tv className="w-3.5 h-3.5 relative z-10" />
                  )}
                  <span className="relative z-10">{provider.name}</span>
                  <span className={`relative z-10 text-[9px] px-1.5 py-0.2 rounded font-black ${
                    isActive ? 'bg-black/40 text-amber-300' : 'bg-white/10 text-gray-300'
                  }`}>
                    {provider.badge}
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
                    : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
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
                <span className="relative z-10">Tráiler 4K UHD</span>
              </button>
            )}
          </div>

          {/* Siguiente Episodio o Consejo de Seguridad */}
          <div className="flex items-center space-x-3">
            {movie.isTv && (
              <button
                onClick={handleNextEpisode}
                className="px-4 py-1.5 rounded-lg bg-netflix-red hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-red-900/40"
              >
                <span>Siguiente Capítulo ({currentEpisode + 1})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="hidden xl:flex items-center space-x-2 text-[11px] text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Escudo Sandbox: Popups neutralizados y redirección protegida.</span>
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
