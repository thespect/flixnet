import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Key, 
  Heart, 
  X, 
  Film, 
  Tv, 
  Cast, 
  User, 
  ChevronDown, 
  Settings, 
  Volume2, 
  Zap, 
  Check, 
  ShieldCheck 
} from 'lucide-react';

export default function Navbar({ 
  onSearch, 
  activeTab, 
  setActiveTab, 
  onOpenApiKeyModal, 
  onOpenCastModal,
  isApiKeySet,
  myListCount
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentProfile, setCurrentProfile] = useState('Víctor');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
    setSearchOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'movies', label: 'Películas' },
    { id: 'series', label: 'Series', badge: 'Completo' },
    { id: 'trending', label: 'Tendencias' },
    { id: 'mylist', label: 'Mi Lista', count: myListCount },
  ];

  const profiles = [
    { name: 'Víctor', badge: '4K Ultra HD', color: 'from-netflix-red to-rose-600' },
    { name: 'Familia', badge: 'Audio Latino', color: 'from-blue-600 to-indigo-700' },
    { name: 'Kids', badge: 'Animación', color: 'from-amber-500 to-emerald-600' },
  ];

  return (
    <motion.nav 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 ${
        isScrolled 
          ? 'bg-[#0e0e0e]/95 backdrop-blur-2xl shadow-2xl py-3 border-b border-white/[0.08]' 
          : 'bg-gradient-to-b from-black/95 via-black/60 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Franchise Logo & Navigation */}
        <div className="flex items-center space-x-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab('home'); clearSearch(); }}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-netflix-red to-red-600 flex items-center justify-center shadow-lg shadow-red-900/60 group-hover:shadow-red-700/80 transition-shadow">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="logo-font text-3xl font-black text-netflix-red tracking-wider leading-none drop-shadow-md">
                CINEFLEX
              </span>
              <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase -mt-0.5">
                MAX 4K
              </span>
            </div>
            <span className="hidden lg:inline-block bg-gradient-to-r from-amber-500/20 to-netflix-red/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded-full ml-1">
              LATINO 4K
            </span>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
            {navItems.map((item) => {
              const isActive = activeTab === item.id && !searchQuery;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); clearSearch(); }}
                  className={`relative py-1 transition-colors flex items-center space-x-1.5 ${
                    isActive ? 'text-white font-black' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-netflix-red text-white font-black">
                      {item.badge}
                    </span>
                  )}
                  {item.count > 0 && (
                    <span className="bg-netflix-red text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {item.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-netflix-red rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Search, Smart TV Cast, API Key, Franchise Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Animated Search Bar with Motion */}
          <motion.div 
            layout
            className={`relative flex items-center transition-all ${
              searchOpen || searchQuery 
                ? 'w-48 sm:w-72 bg-black/80 border border-white/20 rounded-full px-3 py-1.5 shadow-xl' 
                : 'w-8 justify-center'
            }`}
          >
            <Search 
              className="w-4 h-4 text-gray-300 cursor-pointer hover:text-white shrink-0" 
              onClick={() => setSearchOpen(true)}
            />
            
            <AnimatePresence>
              {(searchOpen || searchQuery) && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center w-full"
                >
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Películas, series, actores..." 
                    className="bg-transparent text-xs sm:text-sm text-white px-2 focus:outline-none w-full placeholder-gray-400 font-medium"
                    autoFocus
                  />
                  <X 
                    className="w-3.5 h-3.5 text-gray-400 hover:text-white cursor-pointer shrink-0"
                    onClick={clearSearch}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Cast Smart TV Button in Navbar */}
          {onOpenCastModal && (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenCastModal}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 transition-all flex items-center justify-center"
              title="Transmitir a Smart TV (AirPlay / Chromecast)"
            >
              <Cast className="w-4 h-4" />
            </motion.button>
          )}

          {/* TMDB Key Pill */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenApiKeyModal}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isApiKeySet 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isApiKeySet ? 'TMDB Conectado' : 'Configurar Llave'}</span>
          </motion.button>

          {/* Profile Switcher Menu (Netflix / Apple TV+ Style) */}
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1.5 cursor-pointer bg-white/5 hover:bg-white/10 p-1 pr-2 rounded-lg border border-white/10 transition-colors"
            >
              <div className="w-7 h-7 rounded bg-gradient-to-tr from-netflix-red to-rose-600 flex items-center justify-center font-black text-xs shadow-md border border-white/20 text-white">
                {currentProfile[0]}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.div>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 top-12 w-64 bg-[#161616] border border-white/15 rounded-2xl p-3 shadow-2xl z-50 space-y-2"
                >
                  <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-2 py-1 border-b border-white/10">
                    Cambiar Perfil
                  </div>

                  <div className="space-y-1">
                    {profiles.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setCurrentProfile(p.name);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                          currentProfile === p.name ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-md bg-gradient-to-tr ${p.color} flex items-center justify-center font-black text-xs text-white`}>
                            {p.name[0]}
                          </div>
                          <span className="font-bold text-xs">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{p.badge}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-2 space-y-1 text-xs">
                    <div className="px-2 py-1 text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio Predeterminado: Latino</span>
                    </div>
                    <div className="px-2 py-1 text-[11px] text-amber-400 font-bold flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Calidad: 4K UHD Adaptativo</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </motion.nav>
  );
}
