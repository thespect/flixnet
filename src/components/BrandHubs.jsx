import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, Compass, Shield, Zap, Flame } from 'lucide-react';

export const BRAND_HUBS = [
  {
    id: 'disney',
    title: 'DISNEY+',
    subtitle: 'Clásicos, Pixar & Magia',
    badge: 'ANIMACIÓN 4K',
    gradient: 'from-[#031b4e] via-[#082b75] to-[#020d26]',
    glowColor: 'rgba(0, 114, 210, 0.45)',
    borderColor: 'border-sky-500/40 hover:border-sky-400',
    icon: Sparkles,
    filterKey: 'animation',
    searchTerm: 'Disney'
  },
  {
    id: 'marvel',
    title: 'MARVEL',
    subtitle: 'Universo Cinemático UCM',
    badge: 'SUPERHÉROES',
    gradient: 'from-[#540d12] via-[#350609] to-[#140102]',
    glowColor: 'rgba(237, 29, 36, 0.45)',
    borderColor: 'border-red-600/40 hover:border-red-500',
    icon: Zap,
    filterKey: 'action',
    searchTerm: 'Spider-Man'
  },
  {
    id: 'starwars',
    title: 'STAR WARS',
    subtitle: 'Lucasfilm & Galaxia',
    badge: 'CIENCIA FICCIÓN',
    gradient: 'from-[#1a1c2e] via-[#0d1021] to-[#04050a]',
    glowColor: 'rgba(255, 215, 0, 0.35)',
    borderColor: 'border-amber-400/30 hover:border-amber-300',
    icon: Compass,
    filterKey: 'scifi',
    searchTerm: 'Star Wars'
  },
  {
    id: 'hbomax',
    title: 'MAX',
    subtitle: 'Warner Bros & HBO Original',
    badge: 'PRESTIGE TV',
    gradient: 'from-[#3c0863] via-[#23033d] to-[#0c0117]',
    glowColor: 'rgba(157, 43, 230, 0.45)',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    icon: Flame,
    filterKey: 'topRated',
    searchTerm: 'House of the Dragon'
  },
  {
    id: 'netflix',
    title: 'NETFLIX',
    subtitle: 'Originals & Blockbusters',
    badge: 'ESTRENOS MUNDIALES',
    gradient: 'from-[#380b0e] via-[#1f0406] to-[#0a0102]',
    glowColor: 'rgba(229, 9, 20, 0.45)',
    borderColor: 'border-netflix-red/40 hover:border-netflix-red',
    icon: Film,
    filterKey: 'top10',
    searchTerm: 'Stranger Things'
  },
  {
    id: 'dc',
    title: 'DC',
    subtitle: 'Batman, Joker & Multiverso',
    badge: 'CÓMICS 4K',
    gradient: 'from-[#062433] via-[#04151e] to-[#01080c]',
    glowColor: 'rgba(0, 180, 216, 0.45)',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    icon: Shield,
    filterKey: 'action',
    searchTerm: 'Batman'
  }
];

export default function BrandHubs({ activeHub, onSelectHub }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 select-none relative z-20">
      
      {/* Header Estilo Disney+ / HBO Max */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-5 bg-gradient-to-b from-netflix-red via-purple-500 to-sky-400 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
          <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-wide uppercase flex items-center space-x-2">
            <span>Franquicias y Estudios Oficiales</span>
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider hidden sm:inline">
          Formatos Master 4K Ultra HD • Sin Publicidad
        </span>
      </div>

      {/* Grid de Brand Hubs (Responsive: 2 columnas en móvil, 3 en tablet, 6 en desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {BRAND_HUBS.map((hub) => {
          const isActive = activeHub === hub.id;
          const IconComp = hub.icon;

          return (
            <motion.div
              key={hub.id}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => onSelectHub(hub)}
              className={`relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between group shadow-xl ${
                hub.borderColor
              } ${
                isActive
                  ? 'ring-2 ring-white/80 shadow-[0_10px_30px_rgba(255,255,255,0.25)]'
                  : 'bg-white/[0.03]'
              }`}
              style={{
                background: `linear-gradient(145deg, var(--tw-gradient-stops))`,
              }}
            >
              {/* Fondo Degradado Específico de la Marca */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${hub.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Reflejo / Brillo Especular de Vidrio Líquido */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/[0.08] pointer-events-none" />

              {/* Resplandor Ambiental al Pasar el Cursor */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-xl"
                style={{ backgroundColor: hub.glowColor }}
              />

              {/* Insignia Superior */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-gray-300/90 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/10 backdrop-blur-md">
                  {hub.badge}
                </span>
                <IconComp className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
              </div>

              {/* Logo / Nombre Central en Tipografía Emblemática */}
              <div className="relative z-10 text-center py-1">
                <h4 
                  className="font-black text-xl sm:text-2xl md:text-3xl text-white tracking-wider leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-105"
                  style={{
                    fontFamily: hub.id === 'disney' ? "'Plus Jakarta Sans', sans-serif" : hub.id === 'marvel' ? "'Bebas Neue', 'Impact', sans-serif" : hub.id === 'starwars' ? "'Inter', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: hub.id === 'marvel' ? '3px' : '1.5px'
                  }}
                >
                  {hub.title}
                </h4>
                <p className="text-[9px] sm:text-[10px] text-gray-300 font-medium truncate mt-0.5 opacity-80 group-hover:opacity-100">
                  {hub.subtitle}
                </p>
              </div>

              {/* Línea de Acento Inferior */}
              <div className="relative z-10 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full w-0 group-hover:w-full transition-all duration-300 ${
                    hub.id === 'marvel' ? 'bg-red-500' :
                    hub.id === 'disney' ? 'bg-sky-400' :
                    hub.id === 'starwars' ? 'bg-amber-400' :
                    hub.id === 'hbomax' ? 'bg-purple-400' :
                    hub.id === 'dc' ? 'bg-cyan-400' : 'bg-netflix-red'
                  }`}
                />
              </div>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

