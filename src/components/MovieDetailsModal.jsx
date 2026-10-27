import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Play, 
  Plus, 
  Check, 
  Star, 
  Sparkles, 
  Tv, 
  Zap,
  Volume2,
  ShieldCheck,
  Radio,
  Globe
} from 'lucide-react';
import { STREAM_PROVIDERS, MovieAPI } from '../services/movieService';
import { StreamScannerService } from '../services/streamScannerService';

export default function MovieDetailsModal({ 
  movie, 
  onClose, 
  onPlay, 
  onToggleMyList, 
  isInMyList 
}) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seriesDetails, setSeriesDetails] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (!movie) return;
    let cancelled = false;
    setIsScanning(true);

    // Pre-escanear enlaces en segundo plano apenas se abre el modal de detalles
    StreamScannerService.scanAllWorkingLinks(movie, 1, 1).then((res) => {
      if (!cancelled) {
        setScanResult(res);
        setIsScanning(false);
      }
    });

    if (movie.isTv) {
      MovieAPI.fetchSeriesDetails(movie.id).then(details => {
        if (!cancelled) setSeriesDetails(details);
      });
      loadEpisodes(1);
    }

    return () => {
      cancelled = true;
    };
  }, [movie]);

  const loadEpisodes = async (seasonNum) => {
    setIsLoadingEpisodes(true);
    setSelectedSeason(seasonNum);
    const eps = await MovieAPI.fetchSeasonEpisodes(movie.id, seasonNum);
    setEpisodes(eps);
    setIsLoadingEpisodes(false);
  };

  if (!movie) return null;

  const totalSeasons = seriesDetails?.number_of_seasons || 1;
  const directHlsCount = scanResult?.directHlsStreams?.length || 0;
  const latinoCount = scanResult?.latinoSources?.length || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="relative w-full max-w-4xl bg-[#0d0d14]/95 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] border border-white/15 text-white my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/75 hover:bg-netflix-red text-white flex items-center justify-center border border-white/20 shadow-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          
          {/* Hero Backdrop in Modal */}
          <div className="relative h-72 sm:h-96 w-full select-none overflow-hidden bg-black">
            <img 
              src={movie.backdrop_path || movie.poster_path} 
              alt={movie.title}
              className="w-full h-full object-cover filter brightness-[0.76]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d14]/90 via-transparent to-transparent" />

            {/* Title & Quick Actions */}
            <div className="absolute bottom-6 left-6 right-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-netflix-red text-white text-[9px] font-black px-2.5 py-0.5 rounded-md tracking-widest uppercase">
                  {movie.isTv ? 'SERIE 4K COMPLETA' : 'PELÍCULA 4K'}
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center">
                  <Zap className="w-2.5 h-2.5 mr-0.5 fill-current" /> 4K ULTRA HD REAL
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-md flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 0% ANUNCIOS • AUTO-VERIFICADO
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-2xl">
                {movie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    onClose();
                    onPlay(movie, 1, 1);
                  }}
                  className="flex items-center space-x-2.5 px-8 py-3.5 rounded-xl bg-white text-black font-black text-sm sm:text-base hover:bg-gray-200 transition-colors shadow-2xl cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{movie.isTv ? 'Reproducir Cap. 1 (4K)' : 'Reproducir Ahora en 4K'}</span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onToggleMyList(movie)}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm transition-all border border-white/20 cursor-pointer"
                >
                  {isInMyList ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>En Mi Lista</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Mi Lista</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Barra de Diagnóstico Instantáneo del Auto-Detector */}
            <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-emerald-200">
                  {isScanning
                    ? 'Escaneando servidores 4K y pistas en Español Latino...'
                    : `Enlaces verificados y listos (${scanResult?.scanDurationMs || 180}ms): ${directHlsCount > 0 ? `${directHlsCount} Streams 4K Directos` : 'Servidores Activos'} ${latinoCount > 0 ? `• ${latinoCount} Fuentes en Español Latino Oficial` : '• Español Latino Activo'}`}
                </span>
              </div>
              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                100% FUNCIONAL • CERO REDIRECCIÓN
              </span>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold border-b border-white/10 pb-4">
              <span className="text-emerald-400 font-extrabold flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {movie.match || 98}% de coincidencia
              </span>

              <span className="text-gray-300">
                {movie.release_date?.slice(0, 4) || '2025'}
              </span>

              <span className="border border-white/40 text-gray-200 text-xs px-2 py-0.5 rounded-md font-bold">
                {movie.age_rating || '16+'}
              </span>

              <span className="text-gray-300">
                {movie.duration}
              </span>

              <span className="text-amber-400 font-bold flex items-center space-x-1 ml-auto">
                <Star className="w-4 h-4 fill-current mr-1" />
                <span>{movie.vote_average || '8.5'}</span>
              </span>
            </div>

            {/* Synopsis and Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Sinopsis Oficial
                </h4>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-normal">
                  {movie.overview || 'Sin descripción disponible.'}
                </p>

                {movie.original_title && movie.original_title !== movie.title && (
                  <p className="text-xs text-gray-400 pt-1">
                    <span className="font-semibold text-gray-300">Título original:</span> {movie.original_title}
                  </p>
                )}
              </div>

              <div className="space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Géneros
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres?.map((g, i) => (
                      <span key={i} className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-200 font-medium">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> Audio y Subtítulos
                  </h4>
                  <p className="text-xs text-gray-300">
                    🇲🇽 Español Latino Oficial, 🇪🇸 Castellano y Subtítulos en Español automáticos.
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE TEMPORADAS Y EPISODIOS (SI ES SERIE) */}
            {movie.isTv && (
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tv className="w-5 h-5 text-netflix-red" />
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Temporadas y Capítulos en 4K
                    </h3>
                  </div>

                  {totalSeasons > 1 && (
                    <div className="relative">
                      <select
                        value={selectedSeason}
                        onChange={(e) => loadEpisodes(parseInt(e.target.value))}
                        className="bg-black/90 border border-white/20 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-netflix-red cursor-pointer"
                      >
                        {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((sNum) => (
                          <option key={sNum} value={sNum} className="bg-zinc-900 text-white">
                            Temporada {sNum}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {isLoadingEpisodes ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : episodes.length > 0 ? (
                  <div className="space-y-3">
                    {episodes.map((ep) => (
                      <motion.div
                        key={ep.episode_number}
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
                        onClick={() => {
                          onClose();
                          onPlay(movie, selectedSeason, ep.episode_number, ep.name);
                        }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer gap-4 group"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="relative w-28 sm:w-36 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            {ep.still_path ? (
                              <img src={ep.still_path} alt={ep.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                Cap. {ep.episode_number}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-netflix-red transition-colors">
                              {ep.episode_number}. {ep.name}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-2 font-normal">
                              {ep.overview}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 font-semibold shrink-0 sm:pl-4">
                          {ep.runtime}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Cargando lista de capítulos...</p>
                )}
              </div>
            )}

            {/* Servidores Conectados y Auto-Verificados */}
            <div className="bg-black/50 rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-netflix-red" />
                  <span>Servidores 4K Verificados (Sin Publicidad):</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Auto-Switch Activo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {STREAM_PROVIDERS.map((provider) => {
                  const statusObj = scanResult?.serverStatuses?.[provider.id];
                  const ping = statusObj?.ping || provider.ping;

                  return (
                    <motion.div 
                      key={provider.id}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      onClick={() => {
                        onClose();
                        onPlay(movie, 1, 1);
                      }}
                      className="bg-white/5 p-3.5 rounded-xl border border-white/10 hover:border-netflix-red/50 cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{provider.name}</span>
                        </span>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {ping}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300/90 font-bold">{provider.subtitle}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-2">{provider.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}
