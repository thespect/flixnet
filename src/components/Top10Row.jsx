import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Plus, Check, ChevronDown, Star } from 'lucide-react';

export default function Top10Row({ 
  title = "Las 10 Más Vistas Hoy en 4K",
  movies = [], 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList 
}) {
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  // Tomamos solo los 10 primeros
  const top10List = movies.slice(0, 10);
  if (top10List.length === 0) return null;

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      rowRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  const checkScroll = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 20);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative py-6 space-y-2 select-none group/top10"
    >
      {/* Title with Badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-netflix-red rounded-full shadow-[0_0_12px_rgba(229,9,20,0.8)]" />
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            {title}
          </h3>
          <span className="bg-netflix-red/20 text-netflix-red border border-netflix-red/40 text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-widest uppercase hidden sm:inline-block shadow-[0_0_10px_rgba(229,9,20,0.3)]">
            TOP 10 OFICIAL
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-8 z-30 w-12 bg-black/85 hover:bg-black text-white flex items-center justify-center transition-all opacity-0 group-hover/top10:opacity-100 rounded-r-xl border-r border-white/10 shadow-2xl backdrop-blur-md"
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>
        )}

        {/* Carousel with Big Numbers */}
        <div 
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-4"
        >
          {top10List.map((movie, index) => {
            const rank = index + 1;
            return (
              <motion.div 
                key={movie.id}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="relative shrink-0 flex items-center group/card cursor-pointer"
                onClick={() => onOpenDetails(movie)}
              >
                {/* Netflix / Apple TV Stylized Giant Rank Number */}
                <div className="relative -mr-5 sm:-mr-8 z-0 pointer-events-none select-none">
                  <span 
                    className="text-8xl sm:text-9xl md:text-[145px] font-black tracking-tighter leading-none text-[#070709] transition-all duration-300 drop-shadow-2xl group-hover/card:text-[#0f0f14]"
                    style={{
                      WebkitTextStroke: '4px rgba(255, 255, 255, 0.28)',
                      paintOrder: 'stroke fill',
                    }}
                  >
                    {rank}
                  </span>
                </div>

                {/* Poster Card */}
                <div className="relative w-36 sm:w-44 md:w-52 aspect-[2/3] rounded-xl overflow-hidden bg-[#121216] border border-white/10 shadow-2xl z-10 transition-all duration-400 group-hover/card:border-netflix-red/70 group-hover/card:shadow-[0_12px_32px_rgba(229,9,20,0.25)]">
                  <img 
                    src={movie.poster_path} 
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover filter brightness-[0.9] group-hover/card:brightness-105 transition-all duration-500 group-hover/card:scale-105"
                  />

                  {/* Top 10 Corner Ribbon */}
                  <div className="absolute top-0 right-0 bg-netflix-red text-white text-[9px] font-black px-2 py-1 rounded-bl-lg shadow-md uppercase tracking-wider">
                    TOP {rank}
                  </div>

                  {/* 4K Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/70 backdrop-blur-md text-[9px] font-black px-1.5 py-0.5 rounded text-amber-400 border border-amber-400/30 flex items-center">
                      4K UHD
                    </span>
                  </div>

                  {/* Hover Quick Action Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center space-x-1.5 mb-2">
                      <motion.button 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(movie);
                        }}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 shadow-md"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </motion.button>

                      <motion.button 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMyList(movie);
                        }}
                        className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center border border-white/20"
                      >
                        {isInMyList(movie.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      </motion.button>

                      <motion.button 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(movie);
                        }}
                        className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center border border-white/20 ml-auto"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.button>
                    </div>

                    <h4 className="text-white text-xs sm:text-sm font-bold line-clamp-1">
                      {movie.title}
                    </h4>

                    <div className="flex items-center space-x-2 text-[10px] text-gray-300 mt-1">
                      <span className="text-emerald-400 font-bold">{movie.match}% coincidencia</span>
                      <span className="text-gray-400">•</span>
                      <span>4K HDR</span>
                    </div>
                  </div>

                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-8 z-30 w-12 bg-black/80 hover:bg-black text-white flex items-center justify-center transition-all opacity-0 group-hover/top10:opacity-100 rounded-l-md border-l border-white/10"
        >
          <ChevronRight className="w-8 h-8" />
        </motion.button>
      </div>
    </motion.div>
  );
}
