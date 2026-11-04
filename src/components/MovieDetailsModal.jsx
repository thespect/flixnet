import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Play, 
  Plus, 
  Check, 
  Star, 
  Tv, 
  Zap,
  Globe,
  Layers
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
  const [activeMovie, setActiveMovie] = useState(movie);
  const [selectedSeason, setSelectedSeason] = useState(movie?.lastSeason || 1);
  const [selectedEpisode, setSelectedEpisode] = useState(movie?.lastEpisode || 1);
  const [seriesDetails, setSeriesDetails] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [movieCollection, setMovieCollection] = useState({ collectionName: null, parts: [], similar: [] });

  useEffect(() => {
    setActiveMovie(movie);
    setSelectedSeason(movie?.lastSeason || 1);
    setSelectedEpisode(movie?.lastEpisode || 1);
  }, [movie]);

  // Pre-calentar en segundo plano el Smart Auto-Node para que al pulsar "Ver Ahora" inicie en 0ms
  useEffect(() => {
    if (!activeMovie) return;
    StreamScannerService.scanAllWorkingLinks(activeMovie, selectedSeason, selectedEpisode).catch(() => {});
  }, [activeMovie, selectedSeason, selectedEpisode]);

  useEffect(() => {
    if (!activeMovie) return;
    let cancelled = false;

    if (activeMovie.isTv) {
      MovieAPI.fetchSeriesDetails(activeMovie.id).then(details => {
        if (!cancelled) setSeriesDetails(details);
      });
      loadEpisodes(selectedSeason, activeMovie);
    } else {
      MovieAPI.fetchMoviePartsAndSimilar(activeMovie.id).then(data => {
        if (!cancelled && data) {
          setMovieCollection(data);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [activeMovie]);

  const loadEpisodes = async (seasonNum, targetMedia = activeMovie) => {
    if (!targetMedia) return;
    setIsLoadingEpisodes(true);
    setSelectedSeason(seasonNum);
    const eps = await MovieAPI.fetchSeasonEpisodes(
      targetMedia.id,
      seasonNum,
      targetMedia.backdrop_path || targetMedia.poster_path
    );
    setEpisodes(eps);
    if (eps.length > 0 && !eps.some(e => e.episode_number === selectedEpisode)) {
      setSelectedEpisode(eps[0].episode_number);
    }
    setIsLoadingEpisodes(false);
  };

  if (!activeMovie) return null;

  const isSeriesMode = Boolean(activeMovie.isTv);
  const parsedDurationSeasons = activeMovie.duration ? parseInt(activeMovie.duration, 10) : 1;
  const totalSeasons = Math.max(
    seriesDetails?.number_of_seasons || 1,
    !isNaN(parsedDurationSeasons) && activeMovie.isTv ? parsedDurationSeasons : 1
  );

  const selectedEpObj = episodes.find(e => e.episode_number === selectedEpisode) || episodes[0];
  const selectedEpisodeTitle = selectedEpObj?.name || `Episodio ${selectedEpisode}`;

  const handleLaunchPlay = (seasonNum = selectedSeason, epNum = selectedEpisode, epTitle = selectedEpisodeTitle, serverId = null) => {
    onClose();
    onPlay(activeMovie, seasonNum, epNum, epTitle, serverId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative w-full max-w-4xl bg-[#09090e] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_32px_90px_rgba(0,0,0,0.96)] border-t sm:border border-white/[0.12] text-white max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar en Liquid Glass */}
        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 hover:bg-white/20 backdrop-blur-2xl text-white flex items-center justify-center border border-white/15 shadow-xl transition-all cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Contenedor Deslizable */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          
          {/* Portada Cinematográfica del Modal */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full select-none overflow-hidden bg-[#09090e]">
            <img 
              src={activeMovie.backdrop_path || activeMovie.poster_path} 
              alt={activeMovie.title}
              className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090e] via-[#09090e]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090e]/85 via-[#09090e]/25 to-transparent" />

            {/* Título y Acciones Principales */}
            <div className="absolute bottom-5 sm:bottom-7 left-5 sm:left-8 right-5 sm:right-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/80">
                <span className="inline-flex items-center space-x-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(activeMovie.vote_average || 8.5).toFixed(1)}</span>
                </span>
                <span className="text-white/30">·</span>
                <span>{activeMovie.release_date?.slice(0, 4) || '2025'}</span>
                <span className="text-white/30">·</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.1] border border-white/[0.15] text-[10px] font-bold text-white">
                  {activeMovie.age_rating || '13+'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.1] border border-white/[0.15] text-[10px] font-bold text-white">
                  4K UHD
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.1] border border-white/[0.15] text-[10px] font-semibold text-emerald-300 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Español Latino</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl line-clamp-2 leading-[1.02]">
                {activeMovie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleLaunchPlay(selectedSeason, selectedEpisode, selectedEpisodeTitle)}
                  className="flex items-center space-x-2 px-6 sm:px-8 py-3 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm md:text-base transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] cursor-pointer"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black shrink-0" />
                  <span>
                    {isSeriesMode
                      ? `Ver T${selectedSeason}:E${selectedEpisode}`
                      : 'Ver Ahora'}
                  </span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onToggleMyList(activeMovie)}
                  className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/[0.1] hover:bg-white/[0.18] backdrop-blur-xl text-white font-semibold text-xs sm:text-sm transition-all border border-white/[0.15] cursor-pointer"
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

          {/* Cuerpo del Modal — Espaciado Editorial Limpio */}
          <div className="p-5 sm:p-8 space-y-7">
            
            {/* Sinopsis y Ficha Técnica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2.5">
                <p className="text-white/80 text-xs sm:text-sm md:text-[15px] leading-relaxed font-normal">
                  {activeMovie.overview || 'Disfruta de este título en resolución 4K Ultra HD con audio en Español Latino.'}
                </p>
              </div>

              <div className="space-y-3 text-xs text-white/60 border-t md:border-t-0 md:border-l border-white/[0.08] pt-3 md:pt-0 md:pl-6">
                {activeMovie.genres?.length > 0 && (
                  <div>
                    <span className="text-white/40 font-medium">Géneros: </span>
                    <span className="text-white/85 font-medium">{activeMovie.genres.join(', ')}</span>
                  </div>
                )}
                <div>
                  <span className="text-white/40 font-medium">Audio: </span>
                  <span className="text-white/85 font-medium">Español Latino, Castellano, Original</span>
                </div>
                <div>
                  <span className="text-white/40 font-medium">Formato: </span>
                  <span className="text-white/85 font-medium">{activeMovie.duration || '4K Dolby Vision'}</span>
                </div>
              </div>
            </div>

            {/* Selector Rápido de Nodo en 1 Clic (Compacto y Minimalista) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Servidores Español Latino 4K (Carga en 0ms)</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                {STREAM_PROVIDERS.map((provider, idx) => (
                  <button
                    key={provider.id}
                    onClick={() => handleLaunchPlay(selectedSeason, selectedEpisode, selectedEpisodeTitle, provider.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all cursor-pointer border ${
                      idx === 0
                        ? 'bg-white text-black border-white shadow-[0_8px_24px_rgba(255,255,255,0.2)]'
                        : 'bg-white/[0.06] hover:bg-white/[0.14] text-white/85 hover:text-white border-white/[0.12]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
                    <span>{provider.name}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold bg-black/15 text-black px-1.5 py-0.5 rounded-full">
                        Auto Latino
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN DE TEMPORADAS Y EPISODIOS (SOLO PARA SERIES) */}
            {isSeriesMode && (
              <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                    <Tv className="w-4 h-4 text-white/70" />
                    <span>Episodios</span>
                  </h3>

                  {/* Píldoras de Temporada */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {Array.from({ length: Math.max(totalSeasons, 1) }, (_, i) => i + 1).map((sNum) => {
                      const isSeasonActive = selectedSeason === sNum;
                      return (
                        <button
                          key={sNum}
                          onClick={() => loadEpisodes(sNum)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                            isSeasonActive
                              ? 'bg-white text-black border-white font-bold shadow'
                              : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1] border-white/[0.08]'
                          }`}
                        >
                          Temporada {sNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista Limpia de Episodios */}
                {isLoadingEpisodes ? (
                  <div className="py-10 flex flex-col justify-center items-center space-y-2">
                    <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-xs text-white/50 font-medium">Cargando Temporada {selectedSeason}...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {episodes.map((ep) => {
                      const isEpSelected = selectedEpisode === ep.episode_number;
                      return (
                        <motion.div
                          key={ep.episode_number}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setSelectedEpisode(ep.episode_number);
                            handleLaunchPlay(selectedSeason, ep.episode_number, ep.name);
                          }}
                          className={`flex items-center p-2.5 rounded-2xl border transition-all cursor-pointer gap-3 group ${
                            isEpSelected
                              ? 'bg-white/[0.1] border-white/30 shadow-lg'
                              : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07]'
                          }`}
                        >
                          <div className="relative w-28 sm:w-32 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            {ep.still_path ? (
                              <img src={ep.still_path} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-xs">
                                E{ep.episode_number}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-md text-white/90 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                              {ep.runtime}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className="text-[10px] font-semibold text-white/50">
                              Episodio {ep.episode_number}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {ep.name}
                            </h4>
                            <p className="text-[11px] text-white/55 line-clamp-2 leading-snug">
                              {ep.overview}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SAGA / COLECCIÓN Y TÍTULOS SIMILARES (SOLO PARA PELÍCULAS) */}
            {!isSeriesMode && (
              <>
                {movieCollection.parts?.length > 1 && (
                  <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-white/70" />
                      <span>{movieCollection.collectionName || 'Colección Completa'}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {movieCollection.parts.map((part) => {
                        const isCurrentMovie = Number(part.id) === Number(activeMovie.id);
                        return (
                          <div
                            key={part.id}
                            onClick={() => setActiveMovie(part)}
                            className={`flex items-center p-2 rounded-2xl border transition-all cursor-pointer gap-3 ${
                              isCurrentMovie
                                ? 'bg-white/[0.1] border-white/30 text-white'
                                : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-white/80'
                            }`}
                          >
                            <img
                              src={part.poster_path}
                              alt={part.title}
                              className="w-11 h-16 object-cover rounded-xl shrink-0 border border-white/10"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[10px] font-medium text-white/50 block">
                                {part.release_date?.slice(0, 4) || '4K'}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate">{part.title}</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onPlay(part, 1, 1);
                                }}
                                className="px-2.5 py-1 rounded-full bg-white text-black text-[10px] font-bold inline-flex items-center space-x-1"
                              >
                                <Play className="w-2.5 h-2.5 fill-black" />
                                <span>Ver</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {movieCollection.similar?.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Más títulos similares
                    </h3>
                    <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1">
                      {movieCollection.similar.map((sim) => (
                        <div
                          key={sim.id}
                          onClick={() => setActiveMovie(sim)}
                          className="shrink-0 w-28 sm:w-32 cursor-pointer transition-all group"
                        >
                          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-1.5 border border-white/[0.08] bg-zinc-900">
                            <img src={sim.poster_path} alt={sim.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-white/85 truncate group-hover:text-white">{sim.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}
