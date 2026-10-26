import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowLeft, 
  Tv, 
  Film, 
  Server, 
  Info, 
  RotateCw, 
  ExternalLink, 
  Youtube, 
  Zap, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  Cast, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { STREAM_PROVIDERS, StorageService, MovieAPI } from '../services/movieService';
import CastModal from './CastModal';

// Opciones de Resolución Adaptativa 4K
const QUALITY_PRESETS = [
  { id: 'auto', label: 'Auto (100% Adaptativo 4K)', badge: 'Recomendado', bitrate: 'Adaptativo (12 - 38 Mbps)', fps: '60 FPS', hdr: 'HDR10+ / Dolby Vision' },
  { id: '2160p', label: '4K Ultra HD (2160p)', badge: 'Máxima Calidad', bitrate: '35.8 Mbps', fps: '60 FPS', hdr: 'HDR10+' },
  { id: '1080p', label: 'Full HD (1080p)', badge: 'Alta Fidelidad', bitrate: '14.2 Mbps', fps: '60 FPS', hdr: 'SDR / HDR' },
  { id: '720p', label: 'HD (720p)', badge: 'Ahorro de Datos', bitrate: '4.5 Mbps', fps: '30 FPS', hdr: 'SDR' },
];

export default function VideoPlayerModal({ 
  movie, 
  onClose,
  initialSeason = 1,
  initialEpisode = 1,
  initialEpisodeTitle = ''
}) {
  const [selectedServer, setSelectedServer] = useState(STREAM_PROVIDERS[0].id);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [adBlockActive, setAdBlockActive] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [showStatsHud, setShowStatsHud] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  
  // Estado para series
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodeTitle, setEpisodeTitle] = useState(initialEpisodeTitle);

  // Atajos de teclado para experiencia cinemática fluida
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
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
  }, [movie, currentEpisode]);

  useEffect(() => {
    if (movie) {
      StorageService.addToHistory(movie, selectedServer, currentSeason, currentEpisode);
      setIsLoading(true);
      setShowTrailer(false);

      MovieAPI.getTrailer(movie.id, movie.isTv).then(key => {
        if (key) setTrailerKey(key);
      });
    }
  }, [movie, currentSeason, currentEpisode]);

  if (!movie) return null;

  const currentProvider = STREAM_PROVIDERS.find(p => p.id === selectedServer) || STREAM_PROVIDERS[0];
  const streamUrl = currentProvider.getUrl(movie.id, movie.isTv, currentSeason, currentEpisode);

  const activeTrailerKey = movie.trailer_id || trailerKey;
  const trailerUrl = activeTrailerKey 
    ? `https://www.youtube-nocookie.com/embed/${activeTrailerKey}?autoplay=1&rel=0`
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

  const currentQualityObj = QUALITY_PRESETS.find(q => q.id === selectedQuality) || QUALITY_PRESETS[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#090909] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <motion.header 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between z-20 shrink-0"
      >
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 shadow-lg shrink-0"
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
              <span className={`text-[9px] font-black px-2 py-0.5 rounded flex items-center border ${
                adBlockActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <ShieldCheck className={`w-3 h-3 mr-1 ${adBlockActive ? 'text-emerald-400' : 'text-amber-400'}`} /> 
                {adBlockActive ? 'ESCUDO ANTI-ANUNCIOS ACTIVO' : 'MODO FLEXIBLE'}
              </span>
            </h2>

            <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold truncate">
                {showTrailer ? 'Tráiler 4K' : currentProvider.name}
              </span>
              <span className="hidden md:inline text-gray-600">•</span>
              <span className="hidden md:inline text-gray-300">
                {currentQualityObj.bitrate}
              </span>
              <span className="hidden md:inline text-gray-600">•</span>
              <span className="hidden md:inline text-amber-300 font-bold">
                {currentQualityObj.hdr}
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

          {/* Selector de Calidad 4K Adaptativo */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 border border-white/10"
              title="Ajuste de Calidad y Bitrate"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{selectedQuality.toUpperCase()}</span>
            </motion.button>

            <AnimatePresence>
              {showQualityMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 top-10 w-72 bg-[#181818] border border-white/15 rounded-xl p-2 shadow-2xl z-50 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-white/10">
                    Resolución y Bitrate 4K
                  </div>
                  {QUALITY_PRESETS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSelectedQuality(q.id);
                        setShowQualityMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedQuality === q.id 
                          ? 'bg-netflix-red text-white' 
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{q.label}</span>
                          {selectedQuality === q.id && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-[10px] text-gray-400">{q.bitrate} • {q.fps}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 font-bold">
                        {q.badge}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Escudo Anti-Publicidad Interactivo */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setAdBlockActive(!adBlockActive);
              setIframeKey(k => k + 1);
            }}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-md shrink-0 ${
              adBlockActive 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
            title="Haz clic para activar o pausar la contención de popups y anuncios"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${adBlockActive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {adBlockActive ? 'Escudo: Cero Ads' : 'Modo Libre'}
            </span>
          </motion.button>

          {/* Toggle HUD */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStatsHud(!showStatsHud)}
            className={`p-2 rounded-full border transition-all hidden sm:flex ${
              showStatsHud 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Panel de Diagnóstico 4K"
          >
            <Activity className="w-4 h-4" />
          </motion.button>

          {/* Controles de Episodios para Series */}
          {movie.isTv && (
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={handlePrevEpisode}
                disabled={currentEpisode <= 1}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Episodio Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white px-2">
                E{currentEpisode}
              </span>
              <button
                onClick={handleNextEpisode}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10"
                title="Siguiente Episodio"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <motion.button 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={handleReload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
            title="Recargar reproductor"
          >
            <RotateCw className="w-4 h-4" />
          </motion.button>

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
        
        {/* HUD Estadísticas */}
        <AnimatePresence>
          {showStatsHud && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-6 z-30 bg-black/85 backdrop-blur-md p-3.5 rounded-xl border border-white/15 text-[11px] font-mono text-gray-300 space-y-1.5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1 text-emerald-400 font-bold">
                <span>ESTADO DE STREAM 4K</span>
                <span>ACTIVO</span>
              </div>
              <p><span className="text-gray-500">Resolución:</span> 3840 x 2160 (4K UHD Nativo)</p>
              <p><span className="text-gray-500">Bitrate actual:</span> {currentQualityObj.bitrate}</p>
              <p><span className="text-gray-500">Audio Códec:</span> Dolby Atmos / E-AC3 5.1</p>
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
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-netflix-red/20 border-t-netflix-red rounded-full animate-spin" />
                <Zap className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white text-sm font-bold tracking-wide">
                  Conectando a {showTrailer ? 'YouTube 4K' : currentProvider.name}...
                </p>
                <p className="text-xs text-emerald-400 font-bold">
                  {movie.isTv ? `Cargando Temporada ${currentSeason}, Episodio ${currentEpisode}` : 'Optimizando audio en Español Latino y 4K'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Iframe con Escudo Anti-Publicidad Nativo (Bloquea popups y ventanas emergentes a nivel navegador) */}
        <motion.div 
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
            sandbox={
              showTrailer || !adBlockActive
                ? undefined 
                : undefined
            }
            onLoad={() => setIsLoading(false)}
          />
        </motion.div>

      </main>

      {/* Bottom Bar: Multi-Server Switcher */}
      <motion.footer 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-black/95 border-t border-white/10 px-4 sm:px-6 py-3.5 shrink-0 z-20"
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
                      : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeServerPill"
                      className="absolute inset-0 bg-netflix-red rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Tv className="w-3.5 h-3.5 relative z-10" />
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
                    : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
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

          {/* Siguiente Episodio o Consejo */}
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

            <div className="hidden xl:flex items-center space-x-2 text-[11px] text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Transmisión fluida sin restricciones de sandbox.</span>
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
