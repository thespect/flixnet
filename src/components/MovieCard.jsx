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

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
          <span className="bg-netflix-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md tracking-wider">
            {movie.isTv ? 'SERIE' : '4K'}
          </span>
          <span className="bg-black/85 backdrop-blur-md text-[9px] font-black px-1.5 py-0.5 rounded-md text-emerald-300 border border-emerald-400/30 flex items-center shadow">
            <Globe className="w-2.5 h-2.5 mr-1 text-emerald-400 shrink-0" />
            <span>LAT</span>
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-black/85 backdrop-blur-md text-white text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center border border-white/10 shadow">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-current inline mr-1" />
            {movie.vote_average || '8.4'}
          </span>
        </div>

        {/* Bottom subtle shadow vignette */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85" />

        {/* Hover Quick Action Panel */}
        <motion.div 
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-[#09090f]/90 to-transparent flex flex-col justify-end p-3.5 z-20 pointer-events-auto"
        >
          {/* Action Buttons Row */}
          <div className="flex items-center space-x-2 mb-2.5">
            <motion.button 
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(movie);
              }}
              className="flex-1 h-8 px-2.5 rounded-xl bg-netflix-red text-white flex items-center justify-center space-x-1.5 hover:bg-red-700 shadow-xl shadow-red-900/50 text-[10px] font-black"
              title={movie.isTv ? "Seleccionar Temporada y Capítulo" : "Seleccionar Versión / Reproducir"}
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="truncate">{movie.isTv ? 'Temp / Cap' : 'Ver / Elegir'}</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMyList(movie);
              }}
              className="w-7 h-7 rounded-full bg-[#1e1e2a] hover:bg-[#2e2e3e] text-white flex items-center justify-center border border-white/20 transition-all shrink-0"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(movie);
              }}
              className="w-7 h-7 rounded-full bg-[#1e1e2a] hover:bg-[#2e2e3e] text-white flex items-center justify-center border border-white/20 transition-all shrink-0"
              title="Seleccionar temporada, capítulo y servidor"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Title */}
          <h4 className="text-white text-xs sm:text-sm font-black leading-tight line-clamp-1 drop-shadow">
            {movie.title}
          </h4>

          {/* Metadata badges row */}
          <div className="flex items-center space-x-1.5 text-[10px] text-gray-300 mt-1">
            <span className="text-emerald-400 font-extrabold">0% Ads</span>
            <span>•</span>
            <span className="text-amber-300 font-bold flex items-center">
              <Zap className="w-2.5 h-2.5 mr-0.5 fill-current" /> 4K HDR
            </span>
            <span>•</span>
            <span className="text-gray-200 font-bold">Latino</span>
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
