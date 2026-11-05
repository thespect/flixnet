import React from 'react';
import { motion } from 'motion/react';

export const BRAND_HUBS = [
  {
    id: 'disney',
    title: 'DISNEY+',
    subtitle: 'Pixar · Clásicos · Animación',
    gradient: 'from-[#041d56]/90 via-[#072a78]/75 to-[#020b21]/95',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    borderColor: 'border-white/[0.12] hover:border-sky-400/70',
    backdrop: 'https://image.tmdb.org/t/p/w780/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg',
    filterKey: 'animation',
    searchTerm: 'Disney'
  },
  {
    id: 'marvel',
    title: 'MARVEL',
    subtitle: 'Universo Cinematográfico',
    gradient: 'from-[#5c0b10]/90 via-[#380609]/75 to-[#120102]/95',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    borderColor: 'border-white/[0.12] hover:border-red-500/70',
    backdrop: 'https://image.tmdb.org/t/p/w780/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
    filterKey: 'action',
    searchTerm: 'Spider-Man'
  },
  {
    id: 'starwars',
    title: 'STAR WARS',
    subtitle: 'Lucasfilm · Saga Galáctica',
    gradient: 'from-[#1c2038]/90 via-[#0d1021]/75 to-[#04050a]/95',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    borderColor: 'border-white/[0.12] hover:border-amber-400/70',
    backdrop: 'https://image.tmdb.org/t/p/w780/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
    filterKey: 'scifi',
    searchTerm: 'Star Wars'
  },
  {
    id: 'hbomax',
    title: 'MAX',
    subtitle: 'HBO Originals · Warner Bros',
    gradient: 'from-[#390861]/90 via-[#21033a]/75 to-[#090112]/95',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    borderColor: 'border-white/[0.12] hover:border-purple-400/70',
    backdrop: 'https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    filterKey: 'topRated',
    searchTerm: 'Dune'
  },
  {
    id: 'netflix',
    title: 'NETFLIX',
    subtitle: 'Series & Estrenos Globales',
    gradient: 'from-[#42090d]/90 via-[#210406]/75 to-[#080102]/95',
    glowColor: 'rgba(229, 9, 20, 0.4)',
    borderColor: 'border-white/[0.12] hover:border-netflix-red/80',
    backdrop: 'https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    filterKey: 'top10',
    searchTerm: 'Stranger Things'
  },
  {
    id: 'dc',
    title: 'DC STUDIOS',
    subtitle: 'Gotham · Multiverso',
    gradient: 'from-[#062638]/90 via-[#041520]/75 to-[#01070b]/95',
    glowColor: 'rgba(34, 211, 238, 0.35)',
    borderColor: 'border-white/[0.12] hover:border-cyan-400/70',
    backdrop: 'https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    filterKey: 'action',
    searchTerm: 'Batman'
  }
];

export default function BrandHubs({ activeHub, onSelectHub }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 select-none relative z-20">
      {/* Grid de Brand Hubs con Fotografía Cinematográfica y Liquid Glass (Estilo Disney+ / Max) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {BRAND_HUBS.map((hub) => {
          const isActive = activeHub === hub.id;

          return (
            <motion.button
              key={hub.id}
              type="button"
              whileHover={{ scale: 1.045, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              onClick={() => onSelectHub(hub)}
              className={`relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 p-3 sm:p-4 flex flex-col items-center justify-center group shadow-[0_12px_32px_rgba(0,0,0,0.65)] ${
                hub.borderColor
              } ${
                isActive
                  ? 'ring-2 ring-white shadow-[0_12px_36px_rgba(255,255,255,0.35)] scale-105'
                  : 'bg-white/[0.04] hover:shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
              }`}
            >
              {/* Fotografía Key-Art de Fondo con Zoom Cinematográfico en Hover */}
              {hub.backdrop && (
                <img
                  src={hub.backdrop}
                  alt={hub.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700 ease-out filter saturate-[1.15]"
                />
              )}

              {/* Degradado Atmosférico del Estudio */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${hub.gradient} transition-opacity duration-300`}
              />

              {/* Brillo Especular Superior (Apple Liquid Glass) */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

              {/* Resplandor Ambiental al Pasar el Cursor */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl"
                style={{ backgroundColor: hub.glowColor }}
              />

              {/* Wordmark Central en Tipografía Emblemática */}
              <div className="relative z-10 text-center">
                <h4 
                  className="cinema-metallic-title font-black text-lg sm:text-xl md:text-2xl text-white tracking-wider leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] transition-transform duration-300 group-hover:scale-105"
                  style={{
                    fontFamily: hub.id === 'marvel' ? "'Bebas Neue', 'Impact', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: hub.id === 'marvel' ? '3px' : '1.5px'
                  }}
                >
                  {hub.title}
                </h4>
                <p className="text-[9px] sm:text-[10px] text-white/65 font-medium truncate mt-1 group-hover:text-white/95 transition-colors">
                  {hub.subtitle}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

