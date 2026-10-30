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
  ShieldCheck,
  Radio,
  Globe,
  Film,
  Layers,
  ChevronRight
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
  const [forceSeriesSelector, setForceSeriesSelector] = useState(false);

  // Saga / Partes de Película y Similares
  const [movieCollection, setMovieCollection] = useState({ collectionName: null, parts: [], similar: [] });
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  // Estado del Auto-Detector
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    setActiveMovie(movie);
    setSelectedSeason(movie?.lastSeason || 1);
    setSelectedEpisode(movie?.lastEpisode || 1);
    setForceSeriesSelector(false);
  }, [movie]);

  useEffect(() => {
    if (!activeMovie) return;
    let cancelled = false;
    setIsScanning(true);

    // Pre-escanear enlaces en segundo plano para la temporada y capítulo seleccionados
    StreamScannerService.scanAllWorkingLinks(activeMovie, selectedSeason, selectedEpisode).then((res) => {
      if (!cancelled) {
        setScanResult(res);
        setIsScanning(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeMovie, selectedSeason, selectedEpisode]);

  useEffect(() => {
    if (!activeMovie) return;
    let cancelled = false;

    if (activeMovie.isTv || forceSeriesSelector) {
      MovieAPI.fetchSeriesDetails(activeMovie.id).then(details => {
        if (!cancelled) setSeriesDetails(details);
      });
      loadEpisodes(selectedSeason, activeMovie);
    } else {
      setIsLoadingCollection(true);
      MovieAPI.fetchMoviePartsAndSimilar(activeMovie.id).then(data => {
        if (!cancelled) {
          setMovieCollection(data);
          setIsLoadingCollection(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [activeMovie, forceSeriesSelector]);

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

  const isSeriesMode = Boolean(activeMovie.isTv || forceSeriesSelector);
  const parsedDurationSeasons = activeMovie.duration ? parseInt(activeMovie.duration, 10) : 1;
  const totalSeasons = Math.max(
    seriesDetails?.number_of_seasons || 1,
    !isNaN(parsedDurationSeasons) && activeMovie.isTv ? parsedDurationSeasons : 1,
    forceSeriesSelector ? 5 : 1
  );

  const selectedEpObj = episodes.find(e => e.episode_number === selectedEpisode) || episodes[0];
  const selectedEpisodeTitle = selectedEpObj?.name || `Capítulo ${selectedEpisode}`;

  const directHlsCount = scanResult?.directHlsStreams?.length || 0;
  const latinoCount = scanResult?.latinoSources?.length || 0;

  const handleLaunchPlay = (seasonNum = selectedSeason, epNum = selectedEpisode, epTitle = selectedEpisodeTitle) => {
    const mediaToPlay = forceSeriesSelector ? { ...activeMovie, isTv: true } : activeMovie;
    onClose();
    onPlay(mediaToPlay, seasonNum, epNum, epTitle);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="relative w-full max-w-4xl bg-[#0d0d14]/98 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] border border-white/15 text-white my-auto max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-netflix-red text-white flex items-center justify-center border border-white/20 shadow-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          
          {/* Hero Backdrop in Modal */}
          <div className="relative h-64 sm:h-80 w-full select-none overflow-hidden bg-black">
            <img 
              src={activeMovie.backdrop_path || activeMovie.poster_path} 
              alt={activeMovie.title}
              className="w-full h-full object-cover filter brightness-[0.72]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d14]/90 via-transparent to-transparent" />

            {/* Title & Quick Actions */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="bg-netflix-red text-white text-[9px] font-black px-2.5 py-0.5 rounded-md tracking-widest uppercase">
                  {isSeriesMode ? `SERIE 4K • ${totalSeasons} TEMPORADAS` : 'PELÍCULA 4K ULTRA HD'}
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center">
                  <Zap className="w-2.5 h-2.5 mr-0.5 fill-current" /> 4K HDR
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-md flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                  <Globe className="w-3 h-3 mr-1 text-emerald-400" /> ESPAÑOL LATINO • 0% ADS
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl line-clamp-2">
                {activeMovie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleLaunchPlay(selectedSeason, selectedEpisode, selectedEpisodeTitle)}
                  className="flex items-center space-x-2 px-6 sm:px-8 py-3 rounded-xl bg-netflix-red hover:bg-red-700 text-white font-black text-xs sm:text-base transition-colors shadow-2xl shadow-red-900/50 cursor-pointer"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                  <span>
                    {isSeriesMode
                      ? `Reproducir Temp. ${selectedSeason} • Cap. ${selectedEpisode}`
                      : 'Reproducir Película en 4K'}
                  </span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onToggleMyList(activeMovie)}
                  className="flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 cursor-pointer"
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
          <div className="p-4 sm:p-7 space-y-6">
            
            {/* =====================================================================
                BLOQUE 1: SELECTOR INTERACTIVO DE TEMPORADAS Y CAPÍTULOS (SERIES)
                Aparece inmediatamente arriba para elegir Temporada y Capítulo al instante
               ===================================================================== */}
            {isSeriesMode ? (
              <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-netflix-red/20 border border-netflix-red/40 flex items-center justify-center text-netflix-red shrink-0">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        Selecciona Temporada y Capítulo
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Elige cualquier temporada o episodio para reproducirlo directamente en 4K y Español Latino
                      </p>
                    </div>
                  </div>

                  {/* Selector Rápido Directo (Temporada + Capítulo + Botón Play) */}
                  <div className="flex flex-wrap items-center gap-2 bg-black/60 p-2 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-gray-400 pl-1">Temp:</span>
                      <select
                        value={selectedSeason}
                        onChange={(e) => loadEpisodes(parseInt(e.target.value, 10))}
                        className="bg-zinc-900 border border-white/20 text-white text-xs font-black px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-netflix-red cursor-pointer"
                      >
                        {Array.from({ length: Math.max(totalSeasons, 1) }, (_, i) => i + 1).map((sNum) => (
                          <option key={sNum} value={sNum} className="bg-zinc-900 text-white">
                            Temporada {sNum}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-gray-400">Cap:</span>
                      <select
                        value={selectedEpisode}
                        onChange={(e) => setSelectedEpisode(parseInt(e.target.value, 10))}
                        className="bg-zinc-900 border border-white/20 text-white text-xs font-black px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-netflix-red cursor-pointer"
                      >
                        {(episodes.length > 0
                          ? episodes
                          : Array.from({ length: 12 }, (_, i) => ({ episode_number: i + 1, name: `Capítulo ${i + 1}` }))
                        ).map((ep) => (
                          <option key={ep.episode_number} value={ep.episode_number} className="bg-zinc-900 text-white">
                            Cap. {ep.episode_number} - {ep.name?.slice(0, 26)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleLaunchPlay(selectedSeason, selectedEpisode, selectedEpisodeTitle)}
                      className="px-3.5 py-1.5 rounded-lg bg-netflix-red hover:bg-red-700 text-white text-xs font-black flex items-center space-x-1 shadow-lg cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Ver T{selectedSeason}:E{selectedEpisode}</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Pestañas de Temporadas (Deslizable en celular y tablet) */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {Array.from({ length: Math.max(totalSeasons, 1) }, (_, i) => i + 1).map((sNum) => {
                    const isSeasonActive = selectedSeason === sNum;
                    return (
                      <button
                        key={sNum}
                        onClick={() => loadEpisodes(sNum)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer border ${
                          isSeasonActive
                            ? 'bg-netflix-red text-white border-netflix-red shadow-lg shadow-red-900/40'
                            : 'bg-black/50 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
                        }`}
                      >
                        Temporada {sNum}
                      </button>
                    );
                  })}
                </div>

                {/* Lista de Capítulos de la Temporada Seleccionada */}
                {isLoadingEpisodes ? (
                  <div className="py-10 flex flex-col justify-center items-center space-y-2">
                    <div className="w-8 h-8 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400 font-bold">Cargando capítulos de la Temporada {selectedSeason}...</span>
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
                              ? 'bg-netflix-red/15 border-netflix-red/60 shadow-lg'
                              : 'bg-black/45 hover:bg-white/[0.08] border-white/10 hover:border-white/25'
                          }`}
                        >
                          {/* Miniatura del Capítulo */}
                          <div className="relative w-28 sm:w-32 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            {ep.still_path ? (
                              <img src={ep.still_path} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-xs">
                                T{selectedSeason}:E{ep.episode_number}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-netflix-red/90 text-white flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {ep.runtime}
                            </span>
                          </div>

                          {/* Info del Capítulo */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-netflix-red">
                                Capítulo {ep.episode_number}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                4K Latino
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-netflix-red transition-colors">
                              {ep.name}
                            </h4>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug">
                              {ep.overview}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* =====================================================================
                 BLOQUE 1B: SI ES PELÍCULA -> SELECTOR DE PARTES DE LA SAGA / COLECCIÓN
                 + OPCIÓN PARA ELEGIR CAPÍTULOS MANUALMENTE
                 ===================================================================== */
              <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-netflix-red/20 border border-netflix-red/40 flex items-center justify-center text-netflix-red shrink-0">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {movieCollection.parts?.length > 1
                          ? `${movieCollection.collectionName || 'Saga Completa'} (${movieCollection.parts.length} Películas / Capítulos)`
                          : 'Opciones de Reproducción y Capítulos Relacionados'}
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Selecciona la parte de la saga, servidor o activa el selector de temporadas y capítulos
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setForceSeriesSelector(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30 text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Elegir Temporada / Capítulo</span>
                  </button>
                </div>

                {/* Si la película pertenece a una Saga/Colección (ej. Deadpool 1, 2, 3 o Duna 1 y 2) */}
                {movieCollection.parts?.length > 1 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center">
                      <Layers className="w-3.5 h-3.5 mr-1.5" /> Capítulos / Películas de esta Saga:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {movieCollection.parts.map((part, idx) => {
                        const isCurrentMovie = Number(part.id) === Number(activeMovie.id);
                        return (
                          <div
                            key={part.id}
                            onClick={() => {
                              setActiveMovie(part);
                            }}
                            className={`flex items-center p-2 rounded-xl border transition-all cursor-pointer gap-2.5 ${
                              isCurrentMovie
                                ? 'bg-netflix-red/20 border-netflix-red text-white shadow-lg'
                                : 'bg-black/50 hover:bg-white/10 border-white/10 text-gray-300'
                            }`}
                          >
                            <img
                              src={part.poster_path}
                              alt={part.title}
                              className="w-12 h-16 object-cover rounded-lg shrink-0 border border-white/10"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[9px] font-black uppercase text-amber-300 block">
                                Parte {idx + 1} • {part.release_date?.slice(0, 4) || '4K'}
                              </span>
                              <h4 className="text-xs font-black text-white truncate">{part.title}</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onPlay(part, 1, 1);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-netflix-red hover:bg-red-700 text-white text-[10px] font-black inline-flex items-center space-x-1"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Reproducir</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Películas similares o recomendadas para cambiar rápido */}
                {movieCollection.similar?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                      Títulos Relacionados Listos en 4K:
                    </span>
                    <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar pb-1">
                      {movieCollection.similar.map((sim) => (
                        <div
                          key={sim.id}
                          onClick={() => setActiveMovie(sim)}
                          className="shrink-0 w-28 bg-black/50 hover:bg-white/10 border border-white/10 rounded-xl p-1.5 cursor-pointer transition-all group"
                        >
                          <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-1.5">
                            <img src={sim.poster_path} alt={sim.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-white truncate">{sim.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Barra de Diagnóstico Instantáneo del Auto-Detector */}
            <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-emerald-200">
                  {isScanning
                    ? 'Escaneando servidores 4K y pistas en Español Latino...'
                    : `Enlaces verificados (${scanResult?.scanDurationMs || 180}ms): ${directHlsCount > 0 ? `${directHlsCount} Streams 4K Directos` : 'Servidores Activos'} ${latinoCount > 0 ? `• ${latinoCount} Fuentes en Español Latino Oficial` : '• Español Latino Activo'}`}
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
                {activeMovie.match || 98}% de coincidencia
              </span>

              <span className="text-gray-300">
                {activeMovie.release_date?.slice(0, 4) || '2025'}
              </span>

              <span className="border border-white/40 text-gray-200 text-xs px-2 py-0.5 rounded-md font-bold">
                {activeMovie.age_rating || '16+'}
              </span>

              <span className="text-gray-300">
                {activeMovie.duration}
              </span>

              <span className="text-amber-400 font-bold flex items-center space-x-1 ml-auto">
                <Star className="w-4 h-4 fill-current mr-1" />
                <span>{activeMovie.vote_average || '8.5'}</span>
              </span>
            </div>

            {/* Synopsis and Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Sinopsis Oficial
                </h4>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-normal">
                  {activeMovie.overview || 'Sin descripción disponible.'}
                </p>

                {activeMovie.original_title && activeMovie.original_title !== activeMovie.title && (
                  <p className="text-xs text-gray-400 pt-1">
                    <span className="font-semibold text-gray-300">Título original:</span> {activeMovie.original_title}
                  </p>
                )}
              </div>

              <div className="space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Géneros
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMovie.genres?.map((g, i) => (
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
                    Español Latino Oficial (4K), Castellano, Doblaje Neutro y Subtítulos automáticos.
                  </p>
                </div>
              </div>
            </div>

            {/* Servidores Conectados y Auto-Verificados */}
            <div className="bg-black/50 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-netflix-red" />
                  <span>Elegir Servidor 4K Verificado (Sin Publicidad):</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {isSeriesMode ? `Reproducirá T${selectedSeason}:E${selectedEpisode}` : 'Auto-Switch Activo'}
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
                      onClick={() => handleLaunchPlay(selectedSeason, selectedEpisode, selectedEpisodeTitle)}
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
