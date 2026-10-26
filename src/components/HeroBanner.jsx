import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles, Star, Zap, Cast, ShieldCheck } from 'lucide-react';
import { MovieAPI } from '../services/movieService';

export default function HeroBanner({ 
  movie, 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList,
  onRandomizeFeatured,
  onOpenCast
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoTrailer, setShowVideoTrailer] = useState(true);
  const [trailerKey, setTrailerKey] = useState(movie?.trailer_id || null);

  useEffect(() => {
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

  if (!movie) return null;

  return (
    <div className="relative h-[90vh] min-h-[660px] max-h-[980px] w-full select-none overflow-hidden bg-black">
      
      {/* Background: Video Trailer or High-Res Backdrop */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {trailerKey && showVideoTrailer ? (
          <div className="relative w-full h-full pointer-events-none scale-125 md:scale-110">
            <iframe 
              key={trailerKey}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1&enablejsapi=1`}
              title="Tráiler de Fondo"
              className="w-full h-full object-cover filter brightness-[0.70] contrast-[1.10]"
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <motion.img 
            key={movie.id}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            src={movie.backdrop_path} 
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-[0.72]"
          />
        )}

        {/* Cinematic Multi-Layer Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent w-full md:w-3/5 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/25 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10" />
      </div>

      {/* Main Content Container with Motion */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-32 md:pb-40 z-20">
        
        <motion.div 
          key={movie.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-4"
        >
          {/* Top Franchise Badges Stack */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap items-center gap-2 text-xs font-black"
          >
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-sm bg-netflix-red text-white tracking-widest text-[11px] uppercase shadow-lg shadow-red-900/50">
              <Sparkles className="w-3 h-3 mr-1 inline" /> {movie.isTv ? 'SERIE DESTACADA' : 'PELÍCULA DESTACADA'}
            </span>
            <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-400/40 text-[10px] font-black px-2 py-0.5 rounded flex items-center shadow">
              <Zap className="w-3 h-3 mr-1 fill-current" /> 4K ULTRA HD
            </span>
            <span className="border border-white/30 text-gray-200 text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider">
              DOLBY VISION
            </span>
            <span className="border border-white/30 text-gray-200 text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider">
              ATMOS 5.1
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[10px] font-black px-2 py-0.5 rounded flex items-center shadow">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 100% SIN ANUNCIOS
            </span>
            <span className="text-emerald-400 font-extrabold flex items-center text-xs">
              {movie.match || 98}% de coincidencia
            </span>
          </motion.div>

          {/* Title with High-Impact Typography */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-2xl leading-none"
          >
            {movie.title}
          </motion.h1>

          {/* Genres row */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap gap-2 text-xs text-gray-300 font-bold"
          >
            {movie.genres?.map((genre, idx) => (
              <span key={idx} className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {genre}
              </span>
            ))}
            <span className="bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold">
              Español Latino Nativo
            </span>
          </motion.div>

          {/* Overview */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow-md max-w-xl font-normal"
          >
            {movie.overview}
          </motion.p>

          {/* Buttons CTA with Spring physics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap items-center gap-3 pt-3"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onPlay(movie, 1, 1)}
              className="flex items-center space-x-2.5 px-8 py-3.5 rounded-md bg-white text-black font-black text-sm sm:text-base hover:bg-gray-200 shadow-2xl shadow-white/20 active:bg-gray-300"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{movie.isTv ? 'Ver Capítulo 1 (4K)' : 'Reproducir 4K'}</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onOpenDetails(movie)}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-md bg-white/25 hover:bg-white/35 backdrop-blur-md text-white font-bold text-sm sm:text-base transition-colors border border-white/10"
            >
              <Info className="w-5 h-5" />
              <span>Más información</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleMyList(movie)}
              className="p-3.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all shadow-xl"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
            </motion.button>

            {onOpenCast && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onOpenCast(movie)}
                className="p-3.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all shadow-xl"
                title="Transmitir a Smart TV"
              >
                <Cast className="w-5 h-5 text-gray-200" />
              </motion.button>
            )}

            {onRandomizeFeatured && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRandomizeFeatured}
                className="hidden xl:flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:text-white bg-black/50 hover:bg-white/10 border border-white/10 transition-all ml-auto"
                title="Explorar otra portada destacada"
              >
                <span>Siguiente destacada &gt;</span>
              </motion.button>
            )}
          </motion.div>

        </motion.div>

      </div>

      {/* Bottom Right Controls: Audio Toggle & Age Rating Badge */}
      <div className="absolute right-0 bottom-32 md:bottom-40 z-20 flex items-center space-x-3 pr-4 sm:pr-8">
        {trailerKey && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-xl transition-all"
            title={isMuted ? "Activar audio del tráiler" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-gray-300" /> : <Volume2 className="w-5 h-5 text-white" />}
          </motion.button>
        )}

        <div className="border-l-4 border-netflix-red bg-black/70 backdrop-blur-md px-3.5 py-1 text-xs font-black text-gray-200">
          {movie.age_rating || '16+'}
        </div>
      </div>

    </div>
  );
}
