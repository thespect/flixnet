import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Check, ChevronDown, Star, Zap, Globe } from 'lucide-react';
import { StreamScannerService } from '../services/streamScannerService';

export default function MovieCard({ 
  movie, 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Pre-detectar y almacenar en caché los enlaces funcionales al pasar el cursor
    // para que al dar clic en Reproducir inicie de inmediato
    if (movie?.id) {
      StreamScannerService.scanAllWorkingLinks(movie, 1, 1).catch(() => {});
    }
  };

  return (
    <motion.div 
      className="relative shrink-0 w-36 sm:w-44 md:w-52 select-none cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      {/* Main Card Container - Al dar clic abre el selector de Temporadas, Capítulos y Versiones */}
      <div 
        onClick={() => onOpenDetails(movie)}
        className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0d0d14] border border-white/[0.08] shadow-xl transition-all duration-300 group hover:border-netflix-red/70 hover:shadow-[0_16px_36px_rgba(229,9,20,0.25)]"
      >
        <img 
          src={movie.poster_path} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-[0.94] group-hover:brightness-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
          }}
        />

        {/* Top Badges — Minimalist Apple Liquid Glass */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="bg-black/65 backdrop-blur-xl text-white/95 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/[0.15] tracking-wider uppercase shadow">
            {movie.isTv ? 'SERIE · LAT' : '4K · LAT'}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-black/65 backdrop-blur-xl text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center border border-white/[0.12] shadow">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-current inline mr-1" />
            {Number(movie.vote_average || 8.4).toFixed(1)}
          </span>
        </div>

        {/* Bottom subtle shadow vignette */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85" />

        {/* Hover Quick Action Panel */}
        <motion.div 
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 bg-gradient-to-t from-[#060609] via-[#060609]/85 to-transparent flex flex-col justify-end p-3.5 z-20 pointer-events-auto"
        >
          {/* Action Buttons Row: 1-Click Direct Play + My List + Episodes/Details */}
          <div className="flex items-center space-x-2 mb-2.5">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(movie, 1, 1);
              }}
              className="flex-1 h-8 px-3 rounded-full bg-white text-black flex items-center justify-center space-x-1.5 hover:bg-neutral-200 shadow-lg text-[11px] font-bold cursor-pointer"
              title="Reproducir ahora en Español Latino 4K"
            >
              <Play className="w-3.5 h-3.5 fill-black text-black shrink-0" />
              <span className="truncate">Reproducir</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMyList(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/[0.12] hover:bg-white/[0.22] backdrop-blur-xl text-white flex items-center justify-center border border-white/20 transition-all shrink-0 cursor-pointer"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/[0.12] hover:bg-white/[0.22] backdrop-blur-xl text-white flex items-center justify-center border border-white/20 transition-all shrink-0 cursor-pointer"
              title={movie.isTv ? "Temporadas y Episodios" : "Detalles y Servidores"}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Title */}
          <h4 className="text-white text-xs sm:text-sm font-black leading-tight line-clamp-1 drop-shadow">
            {movie.title}
          </h4>

          {/* Metadata badges row estilo Netflix / Disney+ */}
          <div className="flex items-center space-x-1.5 text-[10px] text-gray-300 mt-1">
            <span className="text-emerald-400 font-extrabold">98% para ti</span>
            <span>•</span>
            <span className="text-white font-bold">{movie.release_date ? movie.release_date.slice(0, 4) : '2024'}</span>
            <span>•</span>
            <span className="text-gray-300 font-bold">4K UHD</span>
            <span>•</span>
            <span className="text-gray-300 font-bold">Latino</span>
          </div>

          {/* Genres */}
          <div className="flex items-center space-x-1 text-[10px] text-gray-400 mt-1 truncate font-medium">
            {movie.genres?.slice(0, 2).map((g, i) => (
              <React.Fragment key={i}>
                <span>{g}</span>
                {i < 1 && <span className="text-gray-600">•</span>}
              </React.Fragment>
            ))}
          </div>

        </motion.div>

      </div>

      {/* Title Below for rapid scanning */}
      <div className="mt-2.5 px-1" onClick={() => onOpenDetails(movie)}>
        <h4 className="text-gray-200 text-xs sm:text-sm font-bold truncate hover:text-white transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5 font-medium">
          <span>{movie.release_date?.slice(0, 4) || '2025'}</span>
          <span className="text-emerald-400 font-bold">{movie.genres?.[0] || '4K Latino'}</span>
        </div>
      </div>
    </motion.div>
  );
}
