import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieRow({ 
  title, 
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative py-4 space-y-2 select-none group/row"
    >
      {/* Row Title with Functional Explore Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div 
          onClick={onExplore}
          className={`flex items-center space-x-2.5 ${onExplore ? 'cursor-pointer group/title' : ''}`}
        >
          <div className="w-1.5 h-5 bg-netflix-red rounded-full shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wide group-hover/row:text-netflix-red transition-colors flex items-center space-x-2">
            <span>{title}</span>
          </h3>
          {onExplore && (
            <span className="text-xs text-netflix-red font-bold flex items-center space-x-1 opacity-0 group-hover/row:opacity-100 transition-opacity ml-2">
              <span>Explorar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Row Carousel */}
      <div className="relative">
        
        {/* Left Arrow */}
        {showLeftArrow && (
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-8 z-30 w-10 sm:w-12 bg-black/80 hover:bg-black text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 rounded-r-xl border-r border-white/10 shadow-2xl backdrop-blur-md"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-7 h-7" />
          </motion.button>
        )}

        {/* Horizontal Slider */}
        <div 
          ref={rowRef}
          onScroll={checkScrollPosition}
          className="flex items-start space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-3"
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

        {/* Right Arrow */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-8 z-30 w-10 sm:w-12 bg-black/80 hover:bg-black text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 rounded-l-xl border-l border-white/10 shadow-2xl backdrop-blur-md"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight className="w-7 h-7" />
        </motion.button>

      </div>
    </motion.div>
  );
}
