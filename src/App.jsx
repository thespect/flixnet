import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  MovieAPI, 
  StorageService 
} from './services/movieService';
import { Film, Sparkles, Heart, Search, ShieldCheck, Zap, Tv, Cast } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'movies' | 'series' | 'trending' | 'mylist'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [isApiKeySet, setIsApiKeySet] = useState(StorageService.hasCustomKey());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [castItemForModal, setCastItemForModal] = useState(null); // Para abrir CastModal
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  
  // Categorías de Películas y Series
  const [catalog, setCatalog] = useState({
    trendingMovies: [],
    nowPlayingMovies: [],
    actionMovies: [],
    scifiMovies: [],
    horrorMovies: [],
    topRatedMovies: [],
    trendingTv: [],
    popularTv: [],
    topRatedTv: [],
    actionTv: [],
    scifiTv: [],
    animationTv: []
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
    }, 250);

    return () => clearTimeout(delayTimer);
  }, [searchQuery]);

  // Manejador de favoritos
  const handleToggleMyList = (item) => {
    const updated = StorageService.toggleMyList(item);
    setMyList([...updated]);
  };

  const isInMyList = (id) => myList.some(i => i.id === id);

  // Abrir reproductor con episodio específico si es serie
  const handleStartPlay = (mediaItem, season = 1, episode = 1, episodeTitle = '') => {
    setPlayingMedia({
      movie: mediaItem,
      season: season,
      episode: episode,
      episodeTitle: episodeTitle
    });
  };

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
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans selection:bg-netflix-red selection:text-white relative overflow-x-hidden">
      {/* Luz ambiental Apple Glass Mesh */}
      <div className="ambient-mesh fixed inset-0 pointer-events-none z-0" />
      
      {/* Navigation Header */}
      <Navbar 
        onSearch={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenCastModal={() => setCastItemForModal(featuredItem || catalog.trendingMovies[0])}
        isApiKeySet={isApiKeySet}
        myListCount={myList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        
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
              <span className="text-xs text-gray-400 font-bold">
                {isSearching ? 'Buscando en catálogo global...' : `${searchResults.length} títulos en 4K y Español Latino`}
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
                <p className="text-xs text-gray-500">Prueba con otro título o revisa la ortografía.</p>
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
                Tus películas y series favoritas guardadas para ver en Español Latino y 4K
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
                  onClick={() => setActiveTab('home')}
                  className="px-6 py-2.5 rounded-md bg-white text-black text-sm font-black hover:bg-gray-200 transition-all shadow-xl"
                >
                  Explorar Catálogo
                </button>
              </div>
            )}
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
          /* VISTA 3: CATÁLOGO COMPLETO ESTILO FRANCHISE */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Billboard Hero con Tráiler, Audio y Transmisión */}
            {featuredItem && (
              <HeroBanner 
                movie={featuredItem}
                onPlay={(m) => handleStartPlay(m, 1, 1)}
                onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                onToggleMyList={handleToggleMyList}
                isInMyList={isInMyList(featuredItem.id)}
                onRandomizeFeatured={handleNextFeatured}
                onOpenCast={(m) => setCastItemForModal(m)}
              />
            )}

            {/* Píldoras de Filtro */}
            <div className="-mt-10 sm:-mt-14 relative z-30 mb-4">
              <CategoryPills 
                activeCategory={activeCategoryFilter}
                onSelectCategory={setActiveCategoryFilter}
              />
            </div>

            {/* Filas de Contenido Dinámico */}
            <div className="relative z-20 space-y-6">
              
              {/* Continuar Viendo */}
              {history.length > 0 && activeCategoryFilter === 'all' && (
                <MovieRow 
                  title="🕒 Continuar Viendo"
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
                    title="💥 Películas de Acción y Adrenalina Pura"
                    movies={catalog.actionMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <MovieRow 
                    title="💥 Series de Acción y Aventura Épica"
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
                    title="🌌 Ciencia Ficción y Multiversos Cinemáticos"
                    movies={catalog.scifiMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <MovieRow 
                    title="🚀 Series de Ficción Futurista"
                    movies={catalog.scifiTv}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                </>
              ) : activeCategoryFilter === 'horror' ? (
                <MovieRow 
                  title="🎃 Noches de Terror, Suspenso y Misterio"
                  movies={catalog.horrorMovies}
                  onPlay={(m) => handleStartPlay(m, 1, 1)}
                  onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                  onToggleMyList={handleToggleMyList}
                  isInMyList={isInMyList}
                />
              ) : activeCategoryFilter === 'animation' ? (
                <MovieRow 
                  title="🎨 Series Animadas, Animación 3D y Anime"
                  movies={catalog.animationTv}
                  onPlay={(m) => handleStartPlay(m, 1, 1)}
                  onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                  onToggleMyList={handleToggleMyList}
                  isInMyList={isInMyList}
                />
              ) : activeCategoryFilter === 'topRated' ? (
                <>
                  <MovieRow 
                    title="⭐ Obras Maestras del Cine (Mejor Calificadas)"
                    movies={catalog.topRatedMovies}
                    onPlay={(m) => handleStartPlay(m, 1, 1)}
                    onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                    onToggleMyList={handleToggleMyList}
                    isInMyList={isInMyList}
                  />
                  <MovieRow 
                    title="⭐ Series de TV Aclamadas por la Crítica"
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
                      title={showSeriesOnly ? "Top 10 Series Más Vistas Hoy" : "Las 10 Más Vistas Hoy en 4K"}
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
                        title="📺 Series Más Aclamadas en 4K (Temporadas Completas)"
                        movies={catalog.popularTv}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />

                      <MovieRow 
                        title="🔥 Series en Tendencia Global (Español Latino)"
                        movies={catalog.trendingTv}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />

                      <MovieRow 
                        title="💥 Series de Acción y Aventura Épica"
                        movies={catalog.actionTv}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
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
                        title="💎 Estrenos en Cine y Cartelera (4K Ultra HD)"
                        movies={catalog.nowPlayingMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />

                      <MovieRow 
                        title="💥 Películas de Acción y Adrenalina Pura"
                        movies={catalog.actionMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />

                      <MovieRow 
                        title="🌌 Ciencia Ficción y Multiversos Cinemáticos"
                        movies={catalog.scifiMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />

                      <MovieRow 
                        title="🎃 Noches de Terror y Suspenso"
                        movies={catalog.horrorMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />

                      <MovieRow 
                        title="⭐ Obras Maestras Mejor Calificadas de la Historia"
                        movies={catalog.topRatedMovies}
                        onPlay={(m) => handleStartPlay(m, 1, 1)}
                        onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                        onToggleMyList={handleToggleMyList}
                        isInMyList={isInMyList}
                      />
                    </>
                  )}

                  {/* Series de Animación & Anime */}
                  {(!showMoviesOnly) && (
                    <MovieRow 
                      title="🎨 Series Animadas y Anime Populares"
                      movies={catalog.animationTv}
                      onPlay={(m) => handleStartPlay(m, 1, 1)}
                      onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                      onToggleMyList={handleToggleMyList}
                      isInMyList={isInMyList}
                    />
                  )}
                </>
              )}

            </div>
          </motion.div>
        )}

      </main>

      {/* Footer Estilo Apple TV+ / Netflix */}
      <footer className="bg-black border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Film className="w-5 h-5 text-netflix-red" />
              <span className="logo-font text-2xl text-white font-black tracking-wider">CINEFLEX</span>
              <span className="text-amber-400 font-bold border border-amber-400/30 px-2 py-0.5 rounded text-[10px]">
                4K ADAPTATIVO • AIRPLAY & CHROMECAST
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

          <p className="leading-relaxed max-w-4xl text-gray-500">
            <strong>Aviso Legal y Descargo de Responsabilidad:</strong> Cineflex es un indexador de metadatos audiovisuales. No aloja archivos de video en servidores propios. Compatible con transmisión inalámbrica AirPlay 2 y Google Cast.
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
            onClose={() => setPlayingMedia(null)}
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

    </div>
  );
}
