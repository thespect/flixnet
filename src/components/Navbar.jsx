import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Key, 
  X, 
  Film, 
  Cast, 
  ChevronDown, 
  Volume2, 
  Zap, 
  ShieldCheck,
  Download,
  Smartphone,
  Share,
  PlusSquare,
  Monitor,
  CheckCircle2,
  Sparkles
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
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.__CINEFLEX_DEFERRED_PROMPT__ : null
  );
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [showPwaGuideModal, setShowPwaGuideModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalonePwa(Boolean(standalone));
    };
    checkStandalone();

    const onPwaReady = () => {
      setDeferredPrompt(window.__CINEFLEX_DEFERRED_PROMPT__);
    };
    const onPwaInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalonePwa(true);
      setShowPwaGuideModal(false);
    };

    window.addEventListener('cineflex:pwa-ready', onPwaReady);
    window.addEventListener('cineflex:pwa-installed', onPwaInstalled);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cineflex:pwa-ready', onPwaReady);
      window.removeEventListener('cineflex:pwa-installed', onPwaInstalled);
    };
  }, []);

  const handleInstallPwaClick = async () => {
    const promptEvent = deferredPrompt || window.__CINEFLEX_DEFERRED_PROMPT__;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          window.__CINEFLEX_DEFERRED_PROMPT__ = null;
          setDeferredPrompt(null);
          setIsStandalonePwa(true);
        }
        return;
      } catch {}
    }
    setShowPwaGuideModal(true);
  };

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
    { id: 'movies', label: 'Películas 4K', badge: 'Digital UHD' },
    { id: 'series', label: 'Series', badge: 'Temporadas' },
    { id: 'trending', label: 'Tendencias' },
    { id: 'mylist', label: 'Mi Lista', count: myListCount },
  ];

  const profiles = [
    { name: 'Víctor', badge: '4K Master Digital', color: 'from-netflix-red to-rose-600' },
    { name: 'Familia', badge: 'Audio Latino', color: 'from-blue-600 to-indigo-700' },
    { name: 'Kids', badge: 'Animación 4K', color: 'from-amber-500 to-emerald-600' },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 pt-safe ${
          isScrolled 
            ? 'glass-chrome shadow-[0_14px_40px_rgba(0,0,0,0.85)] py-2.5 sm:py-3 border-b border-white/[0.09]' 
            : 'bg-gradient-to-b from-[#040407]/95 via-[#040407]/75 to-transparent py-3 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          
          {/* Left: Brand Identity & Desktop Navigation */}
          <div className="flex items-center space-x-5 lg:space-x-8 min-w-0">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setActiveTab('home'); clearSearch(); }}
              className="flex items-center space-x-2.5 cursor-pointer select-none group shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-netflix-red via-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/60 group-hover:shadow-red-600/80 transition-all border border-white/20">
                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="logo-font text-2xl sm:text-3xl font-black text-white tracking-wider leading-none drop-shadow-md group-hover:text-netflix-red transition-colors">
                  CINE<span className="text-netflix-red">FLEX</span>
                </span>
                <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-amber-400/90 uppercase -mt-0.5">
                  MAX 4K • LATINO
                </span>
              </div>
              <span className="hidden xl:inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full ml-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-400" /> 0% ADS • ANTI-CAM
              </span>
            </motion.div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-5 text-sm font-semibold">
              {navItems.map((item) => {
                const isActive = activeTab === item.id && !searchQuery;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); clearSearch(); }}
                    className={`relative py-1.5 transition-colors flex items-center space-x-1.5 ${
                      isActive ? 'text-white font-black' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-netflix-red to-rose-600 text-white font-black shadow-sm">
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
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-netflix-red via-amber-400 to-netflix-red rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Install PWA, Smart TV Cast, API Key, Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Animated Search Bar */}
            <motion.div 
              layout
              className={`relative flex items-center transition-all ${
                searchOpen || searchQuery 
                  ? 'w-40 sm:w-64 md:w-72 bg-black/90 border border-white/25 rounded-full px-3 py-1.5 shadow-2xl' 
                  : 'w-8 sm:w-9 justify-center'
              }`}
            >
              <Search 
                className="w-4 h-4 text-gray-200 cursor-pointer hover:text-white shrink-0" 
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
                      placeholder="Películas, series, sagas..." 
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

            {/* Botón Instalar App PWA (Celular, Tablet y PC) */}
            {!isStandalonePwa ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallPwaClick}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-netflix-red/90 to-rose-600/90 hover:from-netflix-red hover:to-rose-600 text-white text-[11px] sm:text-xs font-black border border-white/20 shadow-lg shadow-red-950/50 transition-all shrink-0"
                title="Instalar aplicación Cineflex 4K en tu Celular, Tablet o PC"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Instalar App</span>
                <span className="sm:hidden">App</span>
              </motion.button>
            ) : (
              <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <CheckCircle2 className="w-3 h-3" />
                <span>PWA 4K</span>
              </span>
            )}

            {/* Cast Smart TV Button */}
            {onOpenCastModal && (
              <motion.button 
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenCastModal}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/15 transition-all flex items-center justify-center shadow-lg shrink-0"
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
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${
                isApiKeySet 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25' 
                  : 'bg-white/10 border-white/15 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isApiKeySet ? 'TMDB Activo' : 'API TMDB'}</span>
            </motion.button>

            {/* Profile Switcher Menu */}
            <div className="relative shrink-0">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-1.5 cursor-pointer bg-white/5 hover:bg-white/10 p-1 pr-2 rounded-xl border border-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-netflix-red to-rose-600 flex items-center justify-center font-black text-xs shadow-md border border-white/20 text-white">
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
                    className="absolute right-0 top-12 w-64 bg-[#101018]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-2xl z-50 space-y-2"
                  >
                    <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-2 py-1 border-b border-white/10 flex items-center justify-between">
                      <span>Cambiar Perfil</span>
                      <span className="text-[9px] text-emerald-400">0% Ads</span>
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
                      <div className="px-2 py-1 text-[11px] text-emerald-400 font-bold flex items-center space-x-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Audio: Español Latino Directo</span>
                      </div>
                      <div className="px-2 py-1 text-[11px] text-amber-400 font-bold flex items-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Anti-CAM: Master 4K Digital</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleInstallPwaClick();
                        }}
                        className="w-full mt-1 px-2.5 py-2 rounded-xl bg-netflix-red/20 hover:bg-netflix-red/30 border border-netflix-red/40 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-netflix-red" />
                        <span>Instalar App PWA</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </motion.nav>

      {/* Modal Guía de Instalación PWA para iOS, Android, Mac y Windows */}
      <AnimatePresence>
        {showPwaGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowPwaGuideModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0d0d15] border border-white/15 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] space-y-5 relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-netflix-red/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img
                    src="./icons/icon-192.png"
                    alt="Cineflex 4K"
                    className="w-14 h-14 rounded-2xl border border-white/15 shadow-lg"
                  />
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-1">
                      <Sparkles className="w-3 h-3 mr-1" /> PWA OFICIAL 100% ADAPTATIVA
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Instalar Cineflex Max 4K
                    </h3>
                    <p className="text-xs text-gray-400">
                      Acceso directo a pantalla completa en tu Celular, Tablet o PC
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPwaGuideModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                  <div className="font-black text-white flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-netflix-red" />
                    <span>En iPhone / iPad (Safari):</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed flex flex-wrap items-center gap-1">
                    1. Toca el botón <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-white font-bold"><Share className="w-3 h-3 mr-1 text-sky-400" /> Compartir</span> en la barra de Safari y selecciona <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-white font-bold"><PlusSquare className="w-3 h-3 mr-1 text-emerald-400" /> Agregar a inicio</span>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                  <div className="font-black text-white flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>En Android (Chrome / Edge):</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Abre el menú de los tres puntos <span className="text-white font-bold">⋮</span> arriba a la derecha y elige <span className="text-emerald-300 font-bold">"Instalar aplicación"</span> o <span className="text-emerald-300 font-bold">"Agregar a la pantalla principal"</span>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                  <div className="font-black text-white flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span>En Mac / Windows (Chrome, Edge o Safari):</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Haz clic en el icono de instalación <span className="text-white font-bold inline-flex items-center space-x-1"><Download className="w-3 h-3 text-netflix-red inline" /> [Instalar]</span> a la derecha de la barra de direcciones (o en Safari: <span className="text-white font-bold">Archivo → Agregar al Dock</span>).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[11px] text-emerald-400 font-bold flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Sin anuncios • Pantalla completa nativa
                </span>
                <button
                  onClick={() => setShowPwaGuideModal(false)}
                  className="px-5 py-2 rounded-xl bg-netflix-red hover:bg-red-700 text-white font-black text-xs transition-all"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
