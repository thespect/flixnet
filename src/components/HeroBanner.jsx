import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Plus, Check, Volume2, VolumeX, Cast, Youtube, ChevronRight, Star } from 'lucide-react';
import { MovieAPI } from '../services/movieService';

export default function HeroBanner({ 
  movie, 
  featuredPool = [],
  featuredIndex = 0,
  onSelectFeaturedIndex,
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList,
  onRandomizeFeatured,
  onOpenCast
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoTrailer, setShowVideoTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(movie?.trailer_id || null);

  useEffect(() => {
    setShowVideoTrailer(false);
    if (movie) {
      if (movie.trailer_id) {
        setTrailerKey(movie.trailer_id);
      } else {
        MovieAPI.getTrailer(movie.id, movie.isTv).then(key => {
          if (key) setTrailerKey(key);
        });
      }
    }
  }, [movie]);

  // Rotación automática suave estilo Apple TV+ cuando no se está reproduciendo el tráiler
  useEffect(() => {
    if (showVideoTrailer || !onRandomizeFeatured || featuredPool.length <= 1) return;
    const timer = setInterval(() => {
      onRandomizeFeatured();
    }, 9500);
    return () => clearInterval(timer);
  }, [showVideoTrailer, onRandomizeFeatured, featuredPool.length, movie?.id]);

  if (!movie) return null;

  const topCarouselItems = featuredPool.slice(0, 5);

  return (
    <div className="relative h-[86dvh] sm:h-[92dvh] min-h-[580px] sm:min-h-[680px] max-h-[960px] w-full select-none overflow-hidden bg-[#040407]">
      
      {/* Background: High-Res 4K Backdrop with Ken Burns Cinema Motion or On-Demand Video Trailer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {trailerKey && showVideoTrailer ? (
          <div className="relative w-full h-full pointer-events-none scale-125 md:scale-110">
            <iframe 
              key={trailerKey}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1&vq=hd2160&hl=es`}
              title="Tráiler de Fondo 4K"
              className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1]"
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.img 
              key={movie.id}
              initial={{ scale: 1.12, opacity: 0 }}
              animate={{ scale: 1.01, opacity: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{
                opacity: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 11, ease: "linear" }
              }}
              src={movie.backdrop_path || movie.poster_path} 
              alt={movie.title}
              fetchPriority="high"
              className="w-full h-full object-cover object-center filter brightness-[0.86] contrast-[1.09] saturate-[1.15]"
            />
          </AnimatePresence>
        )}

        {/* Cinematic Multi-Layer Vignette Gradients (Apple TV+ / HBO Max Depth) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040407] via-[#040407]/70 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040407] via-[#040407]/25 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#040407]/85 via-[#040407]/30 to-transparent z-10" />
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 sm:pb-28 md:pb-32 z-20">
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          {/* Columna Izquierda: Información Principal de la Película/Serie */}
          <motion.div 
            key={movie.id}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-3.5 sm:space-y-4"
          >
            {/* Editorial Kicker (Estilo Apple TV+ / Max Originals) */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white/85">
              <span className="inline-flex items-center space-x-1.5 bg-white/[0.11] backdrop-blur-2xl border border-white/[0.18] px-3 py-1 rounded-full text-white font-bold shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-netflix-red animate-pulse" />
                <span>{movie.isTv ? 'SERIE DESTACADA' : 'ESTRENO EXCLUSIVO'}</span>
              </span>
              <span className="inline-flex items-center space-x-2 bg-emerald-500/[0.16] backdrop-blur-2xl border border-emerald-500/35 px-3 py-1 rounded-full text-emerald-300 font-bold shadow-[0_0_20px_rgba(16,185,129,0.22)]">
                <span className="flex items-end space-x-0.5 h-3">
                  <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
                  <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-2" />
                  <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-3" />
                </span>
                <span>Español Latino 4K · Auto-Detector Sí o Sí</span>
              </span>
            </div>

            {/* Title with High-Impact Editorial Typography */}
            <h1 className="hero-metallic-text text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-black tracking-tight drop-shadow-[0_14px_38px_rgba(0,0,0,0.95)] leading-[0.96] line-clamp-2 pb-1">
              {movie.title}
            </h1>

            {/* Metadata Bar (Coincidencia, Calificación, Año, 4K Dolby Vision, Géneros) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/85 font-medium">
              <span className="inline-flex items-center space-x-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{Number(movie.vote_average || 8.6).toFixed(1)}</span>
              </span>
              <span className="text-white/30">·</span>
              <span className="text-white/90 font-semibold">{movie.release_date?.slice(0, 4) || '2025'}</span>
              <span className="text-white/30">·</span>
              <span className="bg-white/[0.08] border border-white/[0.16] text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {movie.age_rating || '13+'}
              </span>
              <span className="bg-white/[0.08] border border-white/[0.16] text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded">
                4K UHD
              </span>
              <span className="bg-white/[0.08] border border-white/[0.16] text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded">
                DOLBY ATMOS
              </span>
              {movie.genres?.slice(0, 2).map((genre, idx) => (
                <span key={idx} className="hidden sm:inline text-white/65">
                  · {genre}
                </span>
              ))}
            </div>

            {/* Overview */}
            <p className="text-xs sm:text-sm md:text-[15px] text-white/75 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl font-normal">
              {movie.overview}
            </p>

            {/* Botones de Acción Estilo Apple TV+ / HBO Max */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1.5">
              
              {/* Botón Principal Reproducir con Brillo Dinámico Shimmer */}
              <motion.button 
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onPlay(movie, 1, 1)}
                className="btn-shimmer flex items-center justify-center space-x-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-netflix-red via-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm md:text-base shadow-[0_12px_38px_rgba(229,9,20,0.55)] border border-white/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white shrink-0" />
                <span>{movie.isTv ? 'Ver Episodio 1 (Latino 4K)' : 'Ver Ahora en Latino 4K'}</span>
              </motion.button>

              {/* Botón Secundario: Más Información / Temporadas en Liquid Glass */}
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenDetails(movie)}
                className="flex items-center justify-center space-x-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/[0.1] hover:bg-white/[0.18] backdrop-blur-2xl text-white font-semibold text-xs sm:text-sm md:text-base transition-all border border-white/[0.15] cursor-pointer shadow-lg"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>{movie.isTv ? 'Temporadas y Detalles' : 'Más información'}</span>
              </motion.button>

              {/* Mi Lista */}
              <motion.button 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onToggleMyList(movie)}
                className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl text-white border border-white/[0.15] flex items-center justify-center transition-all shadow-xl cursor-pointer"
                title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
              >
                {isInMyList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              </motion.button>

              {/* Transmitir a Smart TV */}
              {onOpenCast && (
                <motion.button 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onOpenCast(movie)}
                  className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl text-white border border-white/[0.15] flex items-center justify-center transition-all shadow-xl cursor-pointer"
                  title="Transmitir a Smart TV (AirPlay / Chromecast)"
                >
                  <Cast className="w-4 h-4 text-white/90" />
                </motion.button>
              )}

              {/* Tráiler de Fondo */}
              {trailerKey && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowVideoTrailer(!showVideoTrailer)}
                  className={`px-3.5 py-2.5 rounded-full backdrop-blur-2xl text-xs font-semibold border flex items-center space-x-1.5 shadow-xl transition-all cursor-pointer ${
                    showVideoTrailer
                      ? 'bg-white text-black border-white'
                      : 'bg-white/[0.08] hover:bg-white/[0.16] text-white/90 border-white/[0.15]'
                  }`}
                  title="Activar o desactivar avance de fondo"
                >
                  <Youtube className="w-4 h-4 text-netflix-red" />
                  <span className="hidden sm:inline">{showVideoTrailer ? 'Cerrar Avance' : 'Avance'}</span>
                </motion.button>
              )}

              {trailerKey && showVideoTrailer && (
                <motion.button 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl text-white border border-white/[0.15] flex items-center justify-center shadow-xl transition-all cursor-pointer"
                  title={isMuted ? "Activar audio" : "Silenciar"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-white" />}
                </motion.button>
              )}
            </div>

            {/* Selector Rápido de Servidor en 1 Clic desde el Hero Banner */}
            <div className="pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/45 shrink-0 mr-1">
                Nodos Directos:
              </span>
              {[
                { id: 'auto_smart_latino', label: 'Smart Auto 4K' },
                { id: 'native_hls_4k', label: 'Cineflex Directo' },
                { id: 'vidhide_latino', label: 'VidHide FHD' },
                { id: 'streamwish_latino', label: 'StreamWish LAT' },
                { id: 'embed69_latino', label: 'Embed69 Multi' }
              ].map((srv) => (
                <motion.button
                  key={srv.id}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPlay(movie, 1, 1, '', srv.id)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.16] backdrop-blur-xl border border-white/[0.14] hover:border-emerald-400/50 text-[10px] font-bold text-white/85 hover:text-white flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer shadow-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{srv.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Indicadores Móvil / Tablet */}
            {topCarouselItems.length > 1 && onSelectFeaturedIndex && (
              <div className="pt-2 flex lg:hidden items-center space-x-2">
                {topCarouselItems.map((item, idx) => {
                  const isCurr = idx === featuredIndex % topCarouselItems.length;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectFeaturedIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCurr
                          ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                          : 'w-2 bg-white/25 hover:bg-white/50'
                      }`}
                      title={item.title}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Columna Derecha (Desktop): Dock Interactivo de Miniaturas Panorámicas (Estilo Apple TV+ / Disney+) */}
          {topCarouselItems.length > 1 && onSelectFeaturedIndex && (
            <div className="hidden lg:flex items-center space-x-2.5 bg-black/45 backdrop-blur-2xl p-2 rounded-2xl border border-white/[0.1] shadow-2xl shrink-0">
              {topCarouselItems.map((item, idx) => {
                const isCurr = idx === featuredIndex % topCarouselItems.length;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectFeaturedIndex(idx)}
                    className={`group relative w-28 xl:w-32 aspect-video rounded-xl overflow-hidden transition-all duration-300 cursor-pointer border ${
                      isCurr
                        ? 'ring-2 ring-white border-white/80 scale-105 shadow-[0_8px_25px_rgba(0,0,0,0.8)]'
                        : 'border-white/10 opacity-60 hover:opacity-95 hover:scale-102'
                    }`}
                    title={item.title}
                  >
                    <img
                      src={item.backdrop_path || item.poster_path}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute bottom-1.5 inset-x-2 text-[10px] font-bold text-white truncate text-left drop-shadow">
                      {item.title}
                    </span>
                    {isCurr && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 overflow-hidden">
                        <motion.div
                          key={`progress_${movie.id}`}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 9.5, ease: 'linear' }}
                          className="h-full bg-gradient-to-r from-netflix-red via-rose-500 to-amber-400"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
