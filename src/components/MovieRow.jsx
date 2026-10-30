import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieRow({ 
  title, 
  icon: IconComponent,
  badgeText,
  movies = [], 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList,
  onExplore
}) {
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  if (!movies || movies.length === 0) return null;

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      
      rowRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const checkScrollPosition = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 20);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative py-3 sm:py-4 space-y-2.5 select-none group/row"
    >
      {/* Row Header with Lucide Icon, Title and Explore Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div 
          onClick={onExplore}
          className={`flex items-center space-x-2.5 sm:space-x-3 ${onExplore ? 'cursor-pointer group/title' : ''}`}
        >
          {IconComponent ? (
            <div className="w-8 h-8 rounded-xl bg-netflix-red/15 border border-netflix-red/35 text-netflix-red flex items-center justify-center shadow-lg shadow-red-950/40 shrink-0">
              <IconComponent className="w-4 h-4 text-netflix-red" />
            </div>
          ) : (
            <div className="w-1.5 h-6 bg-netflix-red rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
          )}

          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight group-hover/row:text-white transition-colors">
              {title}
            </h3>
            {badgeText && (
              <span className="hidden sm:inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                {badgeText}
              </span>
            )}
          </div>

          {onExplore && (
            <span className="text-xs text-netflix-red font-bold flex items-center space-x-1 opacity-0 group-hover/row:opacity-100 transition-opacity ml-1.5">
              <span>Explorar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Row Carousel */}
      <div className="relative">
        
        {/* Left Arrow (Desktop / Tablet) */}
        {showLeftArrow && (
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleScroll('left')}
            className="hidden sm:flex absolute left-0 top-0 bottom-6 z-30 w-11 sm:w-12 bg-black/75 hover:bg-black/95 text-white items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 rounded-r-2xl border-y border-r border-white/15 shadow-2xl backdrop-blur-xl"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}

        {/* Horizontal Slider with Touch Momentum */}
        <div 
          ref={rowRef}
          onScroll={checkScrollPosition}
          className="flex items-start space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-2.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id}
              movie={movie}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onToggleMyList={onToggleMyList}
              isInMyList={isInMyList(movie.id)}
            />
          ))}
        </div>

        {/* Right Arrow (Desktop / Tablet) */}
        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handleScroll('right')}
          className="hidden sm:flex absolute right-0 top-0 bottom-6 z-30 w-11 sm:w-12 bg-black/75 hover:bg-black/95 text-white items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 rounded-l-2xl border-y border-l border-white/15 shadow-2xl backdrop-blur-xl"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

      </div>
    </motion.div>
  );
}
