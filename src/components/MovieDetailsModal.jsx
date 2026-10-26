import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Plus, 
  Check, 
  Star, 
  Calendar, 
  Clock, 
  Sparkles, 
  Tv, 
  Film, 
  Zap,
  Volume2,
  ChevronDown
} from 'lucide-react';
import { STREAM_PROVIDERS, MovieAPI } from '../services/movieService';

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

  useEffect(() => {
    if (movie && movie.isTv) {
      MovieAPI.fetchSeriesDetails(movie.id).then(details => {
        setSeriesDetails(details);
      });
      loadEpisodes(1);
    }
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-4xl bg-[#121217]/95 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/15 text-white my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-lg"
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
              className="w-full h-full object-cover filter brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-[#121217]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121217]/90 via-transparent to-transparent" />

            {/* Title & Quick Actions */}
            <div className="absolute bottom-6 left-6 right-6 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="bg-netflix-red text-white text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                  {movie.isTv ? 'SERIE' : 'PELÍCULA'}
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded">
                  4K ULTRA HD
                </span>
                <span className="text-emerald-400 font-bold text-xs">
                  {movie.audio}
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-2xl">
                {movie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onClose();
                    onPlay(movie, 1, 1);
                  }}
                  className="flex items-center space-x-2 px-7 py-3 rounded-md bg-white text-black font-black text-sm sm:text-base hover:bg-gray-200 transition-colors shadow-2xl"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{movie.isTv ? 'Ver Capítulo 1' : 'Ver Película'}</span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleMyList(movie)}
                  className="flex items-center space-x-2 px-5 py-3 rounded-md bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-all border border-white/20"
                >
                  {isInMyList ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>En Mi Lista</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Añadir a Mi Lista</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold border-b border-white/10 pb-4">
              <span className="text-emerald-400 font-extrabold flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {movie.match || 98}% de coincidencia
              </span>

              <span className="text-gray-300">
                {movie.release_date?.slice(0, 4) || '2024'}
              </span>

              <span className="border border-white/40 text-gray-200 text-xs px-2 py-0.5 rounded font-bold">
                {movie.age_rating || '16+'}
              </span>

              <span className="text-gray-300">
                {movie.duration}
              </span>

              <span className="text-amber-400 font-bold flex items-center space-x-1 ml-auto">
                <Star className="w-4 h-4 fill-current mr-1" />
                <span>{movie.vote_average || '8.2'}</span>
              </span>
            </div>

            {/* Synopsis and Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Sinopsis
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

              <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Géneros
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres?.map((g, i) => (
                      <span key={i} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-gray-200">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 mr-1" /> Idiomas Disponibles
                  </h4>
                  <p className="text-xs text-gray-300">
                    Español Latino (predeterminado), Castellano y Subtítulos en español.
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
                      Temporadas y Episodios
                    </h3>
                  </div>

                  {/* Selector de Temporadas */}
                  {totalSeasons > 1 && (
                    <div className="relative">
                      <select
                        value={selectedSeason}
                        onChange={(e) => loadEpisodes(parseInt(e.target.value))}
                        className="bg-black/80 border border-white/20 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-netflix-red cursor-pointer"
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

                {/* Lista de Episodios */}
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer gap-4 group"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          {/* Thumbnail / Número */}
                          <div className="relative w-28 sm:w-36 aspect-video bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-white/10">
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

            {/* Servidores Conectados */}
            <div className="bg-black/50 rounded-xl p-5 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-2">
                <Tv className="w-4 h-4 text-netflix-red" />
                <span>Servidores de Streaming en Español Latino Disponibles:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {STREAM_PROVIDERS.map((provider) => (
                  <motion.div 
                    key={provider.id}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    onClick={() => {
                      onClose();
                      onPlay(movie, 1, 1);
                    }}
                    className="bg-white/5 p-3 rounded-lg border border-white/10 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{provider.name}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                        {provider.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{provider.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}
