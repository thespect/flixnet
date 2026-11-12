import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Plus, Check, ChevronDown } from 'lucide-react';

export default function Top10Row({ 
  title = "Top 10 Hoy",
  movies = [], 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList 
}) {
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

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
      const shouldShow = rowRef.current.scrollLeft > 20;
      if (shouldShow !== showLeftArrow) {
        setShowLeftArrow(shouldShow);
      }
    }
  };

  return (
    <div 
      className="relative py-4 sm:py-5 space-y-2 select-none group/top10"
    >
      {/* Editorial Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <span className="w-1.5 h-7 rounded-full bg-gradient-to-b from-netflix-red via-rose-500 to-amber-400 shadow-[0_0_18px_rgba(229,9,20,0.9)] shrink-0" />
          <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-netflix-red to-rose-600 text-white text-[10px] font-black tracking-widest uppercase shadow-lg shrink-0">
            TOP 10
          </span>
          <h3 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight truncate">
            {title}
          </h3>
          <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-widest hidden sm:inline shrink-0">
            • Español Latino 4K
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button 
            onClick={() => handleScroll('left')}
            className="hidden sm:flex absolute left-0 top-0 bottom-6 z-30 w-11 bg-black/80 hover:bg-black/95 text-white items-center justify-center transition-all opacity-0 group-hover/top10:opacity-100 rounded-r-2xl border-y border-r border-white/15 shadow-2xl cursor-pointer active:scale-95"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Carousel with Sculptural Rank Numbers (sin scroll-smooth para inercia táctil nativa en iOS/Android) */}
        <div 
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center space-x-3 sm:space-x-5 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 py-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {top10List.map((movie, index) => {
            const rank = index + 1;
            return (
              <div 
                key={movie.id}
                className="relative shrink-0 flex items-baseline group/card cursor-pointer transition-transform duration-200 sm:hover:-translate-y-1.5 active:scale-[0.97]"
                onClick={() => onOpenDetails(movie)}
              >
                {/* Sculptural Rank Number */}
                <div className="relative -mr-4 sm:-mr-6 z-0 pointer-events-none select-none">
                  <span 
                    className="text-7xl sm:text-8xl md:text-[136px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/25 via-netflix-red/20 to-transparent transition-all duration-300 sm:group-hover/card:scale-105 inline-block"
                    style={{
                      WebkitTextStroke: '2.5px rgba(255, 255, 255, 0.45)',
                      paintOrder: 'stroke fill',
                    }}
                  >
                    {rank}
                  </span>
                </div>

                {/* Clean Poster Card */}
                <div className="specular-card cinema-card-glow relative w-32 sm:w-40 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden bg-[#0b0b12] border border-white/[0.12] z-10 transition-colors duration-200 sm:group-hover/card:border-netflix-red/60">
                  <img 
                    src={movie.poster_path} 
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                    width="192"
                    height="288"
                    className="w-full h-full object-cover transition-transform duration-300 sm:group-hover/card:scale-105"
                  />
                  <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
                    <span className="bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                      LATINO 4K
                    </span>
                    <span className="bg-black/80 text-amber-300 border border-white/15 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      ★ {Number(movie.vote_average || 8.4).toFixed(1)}
                    </span>
                  </div>

                  {/* Hover Quick Action Overlay (Desktop only) */}
                  <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex-col justify-end p-3">
                    <div className="flex items-center space-x-1.5 mb-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(movie, 1, 1);
                        }}
                        className="btn-primary-cinema w-8 h-8 rounded-full text-white flex items-center justify-center cursor-pointer shadow-md active:scale-95"
                        title="Reproducir ahora"
                      >
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMyList(movie);
                        }}
                        className="w-7 h-7 rounded-full bg-black/75 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 cursor-pointer active:scale-95"
                        title="Mi Lista"
                      >
                        {isInMyList(movie.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(movie);
                        }}
                        className="w-7 h-7 rounded-full bg-black/75 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 ml-auto cursor-pointer active:scale-95"
                        title="Más información"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-white text-xs font-bold truncate">
                      {movie.title}
                    </h4>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => handleScroll('right')}
          className="hidden sm:flex absolute right-0 top-0 bottom-6 z-30 w-11 bg-black/80 hover:bg-black/95 text-white items-center justify-center transition-all opacity-0 group-hover/top10:opacity-100 rounded-l-2xl border-y border-l border-white/15 shadow-2xl cursor-pointer active:scale-95"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
