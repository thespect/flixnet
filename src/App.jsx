import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import MovieCard from './components/MovieCard';
import Top10Row from './components/Top10Row';
import CategoryPills from './components/CategoryPills';
import MovieDetailsModal from './components/MovieDetailsModal';
import VideoPlayerModal from './components/VideoPlayerModal';
import ApiKeyModal from './components/ApiKeyModal';
import CastModal from './components/CastModal';
import QuickLauncher from './components/QuickLauncher';
import BrandHubs from './components/BrandHubs';
import AdBlockModal from './components/AdBlockModal';
import { AdBlockerService } from './services/adBlockerService';
import { 
  MovieAPI, 
  StorageService,
  CURATED_FALLBACK_MOVIES,
  CURATED_FALLBACK_TV
} from './services/movieService';
import { 
  Film, 
  Sparkles, 
  Heart, 
  Search, 
  ShieldCheck, 
  Zap, 
  Tv, 
  Cast, 
  Home, 
  Flame,
  Rocket,
  Compass,
  Skull,
  Star,
  Clock,
  Radio
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'movies' | 'series' | 'brands' | 'trending' | 'mylist'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [activeBrandHub, setActiveBrandHub] = useState(null);
  const [isApiKeySet, setIsApiKeySet] = useState(StorageService.hasCustomKey());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAdBlockModalOpen, setIsAdBlockModalOpen] = useState(false);
  const [blockedAdsCount, setBlockedAdsCount] = useState(AdBlockerService.getBlockedCount());
  const [castItemForModal, setCastItemForModal] = useState(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  useEffect(() => {
    const unsub = AdBlockerService.subscribe((count) => {
      setBlockedAdsCount(count);
    });
    return () => unsub();
  }, []);
  
  // Categorías de Películas y Series
  const [catalog, setCatalog] = useState({
    trendingMovies: CURATED_FALLBACK_MOVIES,
    nowPlayingMovies: CURATED_FALLBACK_MOVIES,
    actionMovies: CURATED_FALLBACK_MOVIES,
    scifiMovies: CURATED_FALLBACK_MOVIES,
    horrorMovies: CURATED_FALLBACK_MOVIES,
    topRatedMovies: CURATED_FALLBACK_MOVIES,
    trendingTv: CURATED_FALLBACK_TV,
    popularTv: CURATED_FALLBACK_TV,
    topRatedTv: CURATED_FALLBACK_TV,
    actionTv: CURATED_FALLBACK_TV,
    scifiTv: CURATED_FALLBACK_TV,
    animationTv: CURATED_FALLBACK_TV
  });

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [myList, setMyList] = useState(StorageService.getMyList());
  const [history, setHistory] = useState(StorageService.getHistory());
  
  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modales
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState(null);
  const [playingMedia, setPlayingMedia] = useState(null); // { movie, season, episode, episodeTitle }

  // 1. GESTOR DE ENLACES Y ENRUTAMIENTO PROFUNDO (Deep Linking 100% Funcional)
  const syncFromUrl = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const watchId = params.get('watch');
      const isTv = params.get('isTv') === 'true' || params.get('type') === 'tv';
      const season = parseInt(params.get('s') || params.get('season') || '1', 10);
      const episode = parseInt(params.get('e') || params.get('episode') || '1', 10);
      const tab = params.get('tab');
      const cat = params.get('category');
      const query = params.get('q');

      if (tab && ['home', 'movies', 'series', 'brands', 'trending', 'mylist'].includes(tab)) {
        setActiveTab(tab);
      }
      if (cat) {
        setActiveCategoryFilter(cat);
      }
      if (query) {
        setSearchQuery(query);
      }

      if (watchId) {
        const idNum = parseInt(watchId, 10);
        // Buscar primero en el catálogo disponible
        const allItems = [
          ...catalog.trendingMovies,
          ...catalog.popularTv,
          ...catalog.nowPlayingMovies,
          ...catalog.actionMovies,
          ...CURATED_FALLBACK_MOVIES,
          ...CURATED_FALLBACK_TV
        ];
        let found = allItems.find(m => m.id === idNum);

        if (!found && idNum) {
          // Intentar obtener desde la API de TMDB
          found = await MovieAPI.getMediaById(idNum, isTv);
        }

        if (found) {
          setPlayingMedia({
            movie: found,
            season: season,
            episode: episode,
            episodeTitle: `Capítulo ${episode}`
          });
        }
      }
    } catch (e) {
      console.warn('Error leyendo parámetros de URL:', e);
    }
  }, [catalog]);

  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [syncFromUrl]);

  // Actualizar URL cuando cambia la pestaña
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    const url = new URL(window.location.href);
    if (tabId === 'home') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    window.history.pushState({}, '', url.toString());
  };

  // Abrir reproductor y actualizar enlace compartible en la barra del navegador
  const handleStartPlay = (mediaItem, season = 1, episode = 1, episodeTitle = '') => {
    setPlayingMedia({
      movie: mediaItem,
      season: season,
      episode: episode,
      episodeTitle: episodeTitle
    });

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('watch', mediaItem.id);
      url.searchParams.set('type', mediaItem.isTv ? 'tv' : 'movie');
      if (mediaItem.isTv) {
        url.searchParams.set('s', season);
        url.searchParams.set('e', episode);
      }
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
  };

  const handleClosePlayer = () => {
    setPlayingMedia(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('watch');
      url.searchParams.delete('type');
      url.searchParams.delete('s');
      url.searchParams.delete('e');
      url.searchParams.delete('season');
      url.searchParams.delete('episode');
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
  };

  // Carga masiva de catálogo en paralelo
  useEffect(() => {
    loadMegaCatalog();
  }, [isApiKeySet]);

  const loadMegaCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const data = await MovieAPI.fetchAllCategories();
      setCatalog(data);
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Búsqueda multi (películas y series)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      const results = await MovieAPI.searchMulti(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(delayTimer);
  }, [searchQuery]);

  // Manejador de favoritos
  const handleToggleMyList = (item) => {
    const updated = StorageService.toggleMyList(item);
    setMyList([...updated]);
  };

  const isInMyList = (id) => myList.some(i => i.id === id);

  // Película o Serie destacada
  const allFeaturedPool = useMemo(() => {
    if (activeTab === 'series') return catalog.popularTv;
    if (activeTab === 'movies') return catalog.trendingMovies;
    if (activeTab === 'trending') return [...catalog.trendingMovies, ...catalog.trendingTv];
    return [...catalog.trendingMovies, ...catalog.popularTv];
  }, [catalog, activeTab]);

  const featuredItem = allFeaturedPool[featuredIndex % (allFeaturedPool.length || 1)] || null;

  const handleNextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % (allFeaturedPool.length || 1));
  };

  // Filtros responsivos inteligentes
  const showSeriesOnly = activeTab === 'series' || activeCategoryFilter === 'series';
  const showMoviesOnly = activeTab === 'movies' || activeCategoryFilter === 'movies';

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans selection:bg-netflix-red selection:text-white relative overflow-x-hidden">
      {/* Luz ambiental cinemática */}
      <div className="ambient-mesh fixed inset-0 pointer-events-none z-0" />
      
      {/* Navigation Header */}
      <Navbar 
        onSearch={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenCastModal={() => setCastItemForModal(featuredItem || catalog.trendingMovies[0])}
        onOpenAdBlockModal={() => setIsAdBlockModalOpen(true)}
        blockedAdsCount={blockedAdsCount}
        isApiKeySet={isApiKeySet}
        myListCount={myList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-16">
        
        {/* VISTA 1: BÚSQUEDA EN VIVO (PELÍCULAS Y SERIES) */}
        {searchQuery.trim() ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl sm:text-2xl font-black flex items-center space-x-2">
                <Search className="w-6 h-6 text-netflix-red" />
                <span>Resultados para: <span className="text-white italic font-bold">"{searchQuery}"</span></span>
              </h2>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                {isSearching ? 'Buscando en catálogo...' : `${searchResults.length} títulos listos en 4K`}
              </span>
            </div>

            {isSearching ? (
              <div className="py-28 flex flex-col justify-center items-center space-y-3">
                <div className="w-12 h-12 border-4 border-netflix-red/30 border-t-netflix-red rounded-full animate-spin" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Explorando catálogo 4K...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
              >
                {searchResults.map((item) => (
                  <MovieCard 
                    key={item.id}
                    movie={item}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList(item.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="py-28 text-center space-y-3">
                <p className="text-gray-300 text-lg font-bold">No se encontraron películas o series con ese término.</p>
                <p className="text-xs text-gray-500">Prueba con otro título o ingresa el ID de TMDB en el lanzador rápido abajo.</p>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'mylist' ? (
          /* VISTA 2: MI LISTA */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-6"
          >
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl sm:text-4xl font-black text-white flex items-center space-x-3">
                <Heart className="w-8 h-8 text-netflix-red fill-current" />
                <span>Mi Lista Personal</span>
              </h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                Tus películas y series guardadas para ver en Español Latino y 4K Ultra HD
              </p>
            </div>

            {myList.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
              >
                {myList.map((item) => (
                  <MovieCard 
                    key={item.id}
                    movie={item}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={true}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="py-28 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center text-gray-500">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-300">Aún no has agregado títulos a tu lista</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Pasa el cursor sobre cualquier portada y presiona <span className="font-bold text-white">＋</span> para guardarla aquí.
                </p>
                <button 
                  onClick={() => handleTabChange('home')}
                  className="px-6 py-2.5 rounded-lg bg-netflix-red text-white text-sm font-black hover:bg-red-700 transition-all shadow-xl shadow-red-900/40"
                >
                  Explorar Catálogo 4K
                </button>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'brands' ? (
          /* VISTA: UNIVERSOS Y FRANQUICIAS (DISNEY+, MARVEL, HBO MAX, STAR WARS, NETFLIX, DC) */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-y-8"
          >
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-netflix-red bg-netflix-red/10 border border-netflix-red/30 px-2.5 py-0.5 rounded-full inline-block mb-2">
                ESTUDIOS Y FRANQUICIAS OFICIALES
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Universos Cinematográficos 4K
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Explora el catálogo oficial de Marvel, Disney+, Star Wars, HBO Max, DC y Netflix Originals con doblaje al Español Latino y cero publicidad.
              </p>
            </div>

            <BrandHubs 
              activeHub={activeBrandHub}
              onSelectHub={(hub) => {
                setActiveBrandHub(hub.id);
                if (hub.filterKey) {
                  setActiveCategoryFilter(hub.filterKey);
                }
              }}
            />

            {/* Filas destacadas según el universo */}
            <div className="space-y-6">
              <MovieRow 
                icon={Zap}
                title="Marvel Cinematic Universe (UCM 4K)"
                badgeText="Acción 4K"
                movies={catalog.actionMovies}
                onPlay={(m) => handleStartPlay(m, 1, 1)}
                onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                onToggleMyList={handleToggleMyList}
                isInMyList={isInMyList}
              />
              <MovieRow 
                icon={Flame}
                title="Warner Bros & HBO Max Originals"
                badgeText="Prestige TV"
                movies={catalog.topRatedTv}
                onPlay={(m) => handleStartPlay(m, 1, 1)}
                onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                onToggleMyList={handleToggleMyList}
                isInMyList={isInMyList}
              />
              <MovieRow 
                icon={Sparkles}
                title="Disney & Animación Pixar 4K"
                badgeText="Familiar"
                movies={catalog.animationTv}
                onPlay={(m) => handleStartPlay(m, 1, 1)}
                onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                onToggleMyList={handleToggleMyList}
                isInMyList={isInMyList}
              />
              <MovieRow 
                icon={Compass}
                title="Star Wars Saga & Ficción Espacial"
                badgeText="Digital UHD"
                movies={catalog.scifiMovies}
                onPlay={(m) => handleStartPlay(m, 1, 1)}
                onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                onToggleMyList={handleToggleMyList}
                isInMyList={isInMyList}
              />
            </div>
          </motion.div>
        ) : isLoadingCatalog ? (
          /* SKELETON SCREEN FLUIDO ESTILO APPLE DESIGN */
          <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
            <div className="w-full h-80 sm:h-[480px] rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden flex items-end p-6 sm:p-12">
              <div className="space-y-4 max-w-xl w-full">
                <div className="h-5 w-32 bg-white/10 rounded-full" />
                <div className="h-10 sm:h-14 w-3/4 bg-white/15 rounded-xl" />
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="flex space-x-3 pt-3">
                  <div className="h-11 w-36 bg-white/20 rounded-xl" />
                  <div className="h-11 w-32 bg-white/10 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="space-y-6 pt-2">
              <div className="h-7 w-60 bg-white/15 rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/5" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* VISTA 3: CATÁLOGO COMPLETO */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Billboard Hero con Tráiler 4K, Audio Latino y Transmisión */}
            {featuredItem && (
              <HeroBanner 
                movie={featuredItem}
                featuredPool={allFeaturedPool}
                featuredIndex={featuredIndex}
                onSelectFeaturedIndex={(idx) => setFeaturedIndex(idx)}
                onPlay={(m) => handleStartPlay(m, 1, 1)}
                onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                onToggleMyList={handleToggleMyList}
                isInMyList={isInMyList(featuredItem.id)}
                onRandomizeFeatured={handleNextFeatured}
                onOpenCast={(m) => setCastItemForModal(m)}
              />
            )}

            {/* Píldoras de Filtro con Enlaces Rápidos */}
            <div className="-mt-10 sm:-mt-14 relative z-30 mb-3">
              <CategoryPills 
                activeCategory={activeCategoryFilter}
                onSelectCategory={setActiveCategoryFilter}
              />
            </div>

            {/* Franquicias y Estudios Oficiales Estilo Disney+ y HBO Max */}
            <BrandHubs 
              activeHub={activeBrandHub}
              onSelectHub={(hub) => {
                setActiveBrandHub(hub.id);
                if (hub.filterKey) {
                  setActiveCategoryFilter(hub.filterKey);
                }
              }}
            />

            {/* Barra de Estado de Calidad Digital 4K, Anti-CAM y CineShield 0% Anuncios */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 relative z-20">
              <div className="glass-card rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs border border-white/10 shadow-xl">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="inline-flex items-center space-x-1.5 text-amber-300 font-black">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span>Filtro Anti-CAM Activo: Prioriza Master 4K Digital</span>
                  </span>
                  <span className="hidden md:inline text-white/20">|</span>
                  <button 
                    onClick={() => setIsAdBlockModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 text-emerald-300 font-bold hover:text-emerald-200 transition-colors cursor-pointer"
                    title="Ver registro de anuncios bloqueados"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>CineShield™ Activo: {blockedAdsCount} Popups y Anuncios Bloqueados</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    onClick={() => setIsAdBlockModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-black border border-emerald-500/35 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bloqueador 4K</span>
                  </button>
                  <button
                    onClick={() => setCastItemForModal(featuredItem || catalog.trendingMovies[0])}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold border border-white/10 transition-colors"
                  >
                    <Cast className="w-3.5 h-3.5 text-sky-400" />
                    <span>Chromecast & AirPlay 2</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filas de Contenido Dinámico */}
            <div className="relative z-20 space-y-6">
              
              {/* Continuar Viendo */}
              {history.length > 0 && activeCategoryFilter === 'all' && (
                <MovieRow 
                  icon={Clock}
                  title="Continuar Viendo"
                  badgeText="Historial"
                  movies={history}
                  onPlay={(m) => handleStartPlay(m, m.lastSeason || 1, m.lastEpisode || 1)}
                  onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                  onToggleMyList={handleToggleMyList}
                  isInMyList={isInMyList}
                />
              )}

              {/* FILTROS ESPECÍFICOS DE CATEGORÍA */}
              {activeCategoryFilter === 'action' ? (
                <>
                  <MovieRow 
                    icon={Rocket}
                    title="Películas de Acción y Adrenalina"
                    badgeText="Master 4K"
                    movies={catalog.actionMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <MovieRow 
                    icon={Rocket}
                    title="Series de Acción y Aventura Épica"
                    badgeText="Temporadas"
                    movies={catalog.actionTv}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                </>
              ) : activeCategoryFilter === 'scifi' ? (
                <>
                  <MovieRow 
                    icon={Compass}
                    title="Ciencia Ficción & Multiversos"
                    badgeText="Digital UHD"
                    movies={catalog.scifiMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <MovieRow 
                    icon={Compass}
                    title="Series de Ficción Futurista"
                    badgeText="Completas"
                    movies={catalog.scifiTv}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                </>
              ) : activeCategoryFilter === 'horror' ? (
                <MovieRow 
                  icon={Skull}
                  title="Terror, Suspenso y Misterio"
                  badgeText="HDR10+"
                  movies={catalog.horrorMovies}
                  onPlay={(m) => handleStartPlay(m, 1, 1)}
                  onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                  onToggleMyList={handleToggleMyList}
                  isInMyList={isInMyList}
                />
              ) : activeCategoryFilter === 'animation' ? (
                <MovieRow 
                  icon={Sparkles}
                  title="Animación 3D, Dibujos y Anime"
                  badgeText="Audio Latino"
                  movies={catalog.animationTv}
                  onPlay={(m) => handleStartPlay(m, 1, 1)}
                  onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                  onToggleMyList={handleToggleMyList}
                  isInMyList={isInMyList}
                />
              ) : activeCategoryFilter === 'topRated' ? (
                <>
                  <MovieRow 
                    icon={Star}
                    title="Obras Maestras del Cine"
                    badgeText="Aclamadas"
                    movies={catalog.topRatedMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <MovieRow 
                    icon={Tv}
                    title="Series de TV Aclamadas por la Crítica"
                    badgeText="Premios de Oro"
                    movies={catalog.topRatedTv}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                </>
              ) : activeCategoryFilter === 'top10' ? (
                <>
                  <Top10Row 
                    title="Top 10 Películas Más Vistas Hoy"
                    movies={catalog.trendingMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <Top10Row 
                    title="Top 10 Series en Tendencia Hoy"
                    movies={catalog.popularTv}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                </>
              ) : (
                /* VISTA COMPLETA (HOME, MOVIES, SERIES, TRENDING) */
                <>
                  {/* TOP 10 NETFLIX OFICIAL */}
                  {(!showSeriesOnly || activeCategoryFilter === 'top10') && (
                    <Top10Row 
                      title={showSeriesOnly ? "Top 10 Series Más Vistas Hoy" : "Las 10 Más Vistas Hoy en 4K Ultra HD"}
                      movies={showSeriesOnly ? catalog.popularTv : catalog.trendingMovies}
                      onPlay={(m) => handleStartPlay(m, 1, 1)}
                      onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                      onToggleMyList={handleToggleMyList}
                      isInMyList={isInMyList}
                    />
                  )}

                  {/* SECCIÓN ESPECIAL: SERIES DE TV COMPLETAS */}
                  {(!showMoviesOnly) && (
                    <>
                      <MovieRow 
                        icon={Tv}
                        title="Series Más Aclamadas en 4K"
                        badgeText="Temporadas"
                        movies={catalog.popularTv}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => handleTabChange('series')}
                      />

                      <MovieRow 
                        icon={Flame}
                        title="Series en Tendencia Global"
                        badgeText="Top Latino"
                        movies={catalog.trendingTv}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => handleTabChange('series')}
                      />

                      <MovieRow 
                        icon={Rocket}
                        title="Series de Acción y Aventura Épica"
                        badgeText="Temporadas"
                        movies={catalog.actionTv}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => setActiveCategoryFilter('action')}
                      />
                    </>
                  )}

                  {/* Lanzador Rápido por TMDB o Enlace */}
                  <QuickLauncher 
                    onPlayCustomMovie={(m, s, e, epTitle) => handleStartPlay(m, s, e, epTitle)}
                  />

                  {/* SECCIÓN DE PELÍCULAS 4K */}
                  {(!showSeriesOnly) && (
                    <>
                      <MovieRow 
                        icon={Film}
                        title="Estrenos en Cine y Cartelera"
                        badgeText="Digital 4K"
                        movies={catalog.nowPlayingMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => handleTabChange('movies')}
                      />

                      <MovieRow 
                        icon={Rocket}
                        title="Películas de Acción y Adrenalina Pura"
                        badgeText="Master 4K"
                        movies={catalog.actionMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => setActiveCategoryFilter('action')}
                      />

                      <MovieRow 
                        icon={Compass}
                        title="Ciencia Ficción y Multiversos Cinemáticos"
                        badgeText="Digital UHD"
                        movies={catalog.scifiMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => setActiveCategoryFilter('scifi')}
                      />

                      <MovieRow 
                        icon={Skull}
                        title="Noches de Terror, Suspenso y Misterio"
                        badgeText="HDR10+"
                        movies={catalog.horrorMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => setActiveCategoryFilter('horror')}
                      />

                      <MovieRow 
                        icon={Star}
                        title="Obras Maestras Mejor Calificadas de la Historia"
                        badgeText="Aclamadas"
                        movies={catalog.topRatedMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                        onExplore={() => setActiveCategoryFilter('topRated')}
                      />
                    </>
                  )}

                  {/* Series de Animación & Anime */}
                  {(!showMoviesOnly) && (
                    <MovieRow 
                      icon={Sparkles}
                      title="Series Animadas y Anime Populares"
                      badgeText="Audio Latino"
                      movies={catalog.animationTv}
                      onPlay={(m) => handleStartPlay(m, 1, 1)}
                      onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                      onToggleMyList={handleToggleMyList}
                      isInMyList={isInMyList}
                      onExplore={() => setActiveCategoryFilter('animation')}
                    />
                  )}
                </>
              )}

            </div>
          </motion.div>
        )}

      </main>

      {/* Barra de Navegación Inferior Flotante Móvil y Tablet (Apple Liquid Glass PWA) */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-40 pointer-events-none">
        <div className="pointer-events-auto bg-[#0a0a14]/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_14px_45px_rgba(0,0,0,0.92)] flex items-center justify-around text-[10px] font-bold">
          {[
            { id: 'home', label: 'Inicio', icon: Home },
            { id: 'movies', label: 'Películas', icon: Film },
            { id: 'series', label: 'Series', icon: Tv },
            { id: 'brands', label: 'Estudios', icon: Sparkles },
            { id: 'mylist', label: 'Mi Lista', icon: Heart, badgeCount: myList.length }
          ].map((nav) => {
            const IconComp = nav.icon;
            const isActive = activeTab === nav.id && !searchQuery;
            return (
              <button
                key={nav.id}
                onClick={() => handleTabChange(nav.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive ? 'text-white font-black' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomNavPill"
                    className="absolute inset-0 bg-netflix-red rounded-xl shadow-lg shadow-red-950/50"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <div className="relative z-10">
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  {nav.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-netflix-red text-white text-[9px] font-black px-1.5 rounded-full border border-black">
                      {nav.badgeCount}
                    </span>
                  )}
                </div>
                <span className="relative z-10 mt-0.5 text-[10px] tracking-tight">{nav.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Estilo Apple TV+ / Netflix */}
      <footer className="bg-black/95 border-t border-white/[0.08] py-12 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Film className="w-5 h-5 text-netflix-red" />
              <span className="logo-font text-2xl text-white font-black tracking-wider">CINEFLEX</span>
              <span className="text-amber-400 font-bold border border-amber-400/30 px-2 py-0.5 rounded text-[10px]">
                4K ULTRA HD • 100% SIN ANUNCIOS
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsApiKeyModalOpen(true)}
                className="hover:text-white transition-colors underline"
              >
                Configurar Llave Personal
              </button>
              <span>•</span>
              <button 
                onClick={() => setCastItemForModal(featuredItem || catalog.trendingMovies[0])}
                className="hover:text-white transition-colors flex items-center text-emerald-400 font-bold"
              >
                <Cast className="w-3.5 h-3.5 mr-1" /> Transmitir a Smart TV
              </button>
            </div>
          </div>

          <p className="leading-relaxed max-w-4xl text-gray-400">
            <strong>Cineflex Max:</strong> Reproducción cinemática 4K Ultra HD adaptativa con escudo anti-popups y cero ventanas emergentes. Compatible con Smart TVs (Samsung Tizen, LG webOS, Apple TV 4K, Android TV, Chromecast y Fire TV).
          </p>

          <p>© {new Date().getFullYear()} Cineflex Max. Experiencia de cine 4K de nivel internacional.</p>
        </div>
      </footer>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {selectedMovieForDetails && (
          <MovieDetailsModal 
            movie={selectedMovieForDetails}
            onClose={() => setSelectedMovieForDetails(null)}
            onPlay={(m, s, e, epTitle) => handleStartPlay(m, s, e, epTitle)}
            onToggleMyList={handleToggleMyList}
            isInMyList={isInMyList(selectedMovieForDetails.id)}
          />
        )}
      </AnimatePresence>

      {/* Reproductor de Video 4K Adaptativo con AirPlay & Chromecast */}
      <AnimatePresence>
        {playingMedia && (
          <VideoPlayerModal 
            movie={playingMedia.movie}
            initialSeason={playingMedia.season}
            initialEpisode={playingMedia.episode}
            initialEpisodeTitle={playingMedia.episodeTitle}
            onClose={handleClosePlayer}
          />
        )}
      </AnimatePresence>

      {/* Modal de Transmitir a Smart TV (AirPlay / Chromecast) */}
      <AnimatePresence>
        {castItemForModal && (
          <CastModal 
            isOpen={Boolean(castItemForModal)}
            onClose={() => setCastItemForModal(null)}
            movie={castItemForModal}
            season={1}
            episode={1}
          />
        )}
      </AnimatePresence>

      {/* Modal de API Key */}
      <AnimatePresence>
        {isApiKeyModalOpen && (
          <ApiKeyModal 
            isOpen={isApiKeyModalOpen}
            onClose={() => setIsApiKeyModalOpen(false)}
            onKeySaved={(hasKey) => setIsApiKeySet(hasKey)}
          />
        )}
      </AnimatePresence>

      {/* Modal de Control CineShield™ AdBlocker */}
      <AnimatePresence>
        {isAdBlockModalOpen && (
          <AdBlockModal 
            isOpen={isAdBlockModalOpen}
            onClose={() => setIsAdBlockModalOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
