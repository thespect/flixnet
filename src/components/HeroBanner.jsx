import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles, Zap, Cast, ShieldCheck, Radio, Globe, Youtube } from 'lucide-react';
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

  if (!movie) return null;

  return (
    <div className="relative h-[88vh] min-h-[640px] max-h-[920px] w-full select-none overflow-hidden bg-[#040407]">
      
      {/* Background: High-Res 4K Backdrop or On-Demand Video Trailer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {trailerKey && showVideoTrailer ? (
          <div className="relative w-full h-full pointer-events-none scale-125 md:scale-110">
            <iframe 
              key={trailerKey}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1&vq=hd2160&hl=es`}
              title="Tráiler de Fondo 4K"
              className="w-full h-full object-cover filter brightness-[0.72] contrast-[1.12]"
              allow="autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
        ) : (
          <motion.img 
            key={movie.id}
            initial={{ scale: 1.09, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            src={movie.backdrop_path} 
            alt={movie.title}
            fetchPriority="high"
            className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.08] saturate-[1.12]"
          />
        )}

        {/* Cinematic Multi-Layer Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040407] via-[#040407]/85 to-transparent w-full md:w-2/3 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040407] via-[#040407]/35 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#040407]/95 via-[#040407]/50 to-transparent z-10" />
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-28 md:pb-36 z-20">
        
        <motion.div 
          key={movie.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-4"
        >
          {/* Top Franchise Badges Stack */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-netflix-red text-white tracking-widest text-[10px] uppercase shadow-lg shadow-red-900/50">
              <Sparkles className="w-3 h-3 mr-1 inline" /> {movie.isTv ? 'SERIE 4K ESTRELLA' : 'ESTRENO 4K ULTRA HD'}
            </span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center shadow">
              <Zap className="w-3 h-3 mr-1 fill-current" /> 2160p HDR10+
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center shadow">
              <Globe className="w-3 h-3 mr-1 text-emerald-400" /> 🇲🇽 ESPAÑOL LATINO OFICIAL
            </span>
            <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 0% ANUNCIOS
            </span>
          </div>

          {/* Title with High-Impact Typography */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] leading-[0.96]">
            {movie.title}
          </h1>

          {/* Genres & Auto-Verified Indicator */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-200 font-bold">
            <span className="text-emerald-400 font-black flex items-center mr-1">
              <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
              Enlaces Activos Verificados
            </span>
            {movie.genres?.map((genre, idx) => (
              <span key={idx} className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                {genre}
              </span>
            ))}
            <span className="border border-white/30 text-gray-200 text-[10px] px-2 py-0.5 rounded font-black tracking-wider">
              DOLBY ATMOS 5.1
            </span>
          </div>

          {/* Overview */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow-md max-w-xl font-normal">
            {movie.overview}
          </p>

          {/* Buttons CTA */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPlay(movie, 1, 1)}
              className="flex items-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-netflix-red hover:bg-red-700 text-white font-black text-sm sm:text-base shadow-[0_12px_35px_rgba(229,9,20,0.45)] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{movie.isTv ? 'Ver Capítulo 1 (4K)' : 'Ver Ahora en 4K'}</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenDetails(movie)}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white font-bold text-sm sm:text-base transition-colors border border-white/20 cursor-pointer shadow-lg"
            >
              <Info className="w-5 h-5" />
              <span>Servidores y Detalles</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleMyList(movie)}
              className="p-3.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all shadow-xl cursor-pointer"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
            </motion.button>

            {onOpenCast && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onOpenCast(movie)}
                className="p-3.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all shadow-xl cursor-pointer"
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
                className="hidden xl:flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:text-white bg-black/60 hover:bg-white/10 border border-white/15 transition-all ml-auto cursor-pointer"
                title="Explorar otra recomendación 4K"
              >
                <span>Siguiente estreno &gt;</span>
              </motion.button>
            )}
          </div>

        </motion.div>

      </div>

      {/* Bottom Right Controls: Preview Trailer Toggle & Age Rating Badge */}
      <div className="absolute right-0 bottom-28 md:bottom-36 z-20 flex items-center space-x-3 pr-4 sm:pr-8">
        {trailerKey && (
          <motion.button 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowVideoTrailer(!showVideoTrailer)}
            className={`px-3.5 py-2 rounded-full backdrop-blur-md text-xs font-bold border flex items-center space-x-1.5 shadow-xl transition-all cursor-pointer ${
              showVideoTrailer
                ? 'bg-netflix-red text-white border-netflix-red'
                : 'bg-black/65 hover:bg-black/85 text-gray-200 border-white/20'
            }`}
            title="Activar/Desactivar vista previa de tráiler en fondo"
          >
            <Youtube className="w-4 h-4" />
            <span className="hidden sm:inline">{showVideoTrailer ? 'Ocultar Tráiler' : 'Vista Previa 4K'}</span>
          </motion.button>
        )}

        {trailerKey && showVideoTrailer && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-xl transition-all cursor-pointer"
            title={isMuted ? "Activar audio del tráiler" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-gray-300" /> : <Volume2 className="w-5 h-5 text-white" />}
          </motion.button>
        )}

        <div className="border-l-4 border-netflix-red bg-black/80 backdrop-blur-md px-3.5 py-1 text-xs font-black text-gray-200 rounded-r">
          {movie.age_rating || '16+'}
        </div>
      </div>

    </div>
  );
}
