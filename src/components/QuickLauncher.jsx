import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Link2, Sparkles, Film, Tv, Search, Check, AlertCircle } from 'lucide-react';
import { MovieAPI } from '../services/movieService';

export default function QuickLauncher({ onPlayCustomMovie }) {
  const [customInput, setCustomInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isTv, setIsTv] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [isResolving, setIsResolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLaunch = async (e) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    setErrorMsg('');
    setIsResolving(true);

    try {
      // Caso 1: Es una URL directa de video (MP4, M3U8, WEBM o enlace web)
      if (query.startsWith('http://') || query.startsWith('https://')) {
        onPlayCustomMovie(
          {
            id: 999999,
            customUrl: query,
            title: titleInput.trim() || 'Video 4K Directo',
            overview: 'Transmisión directa desde enlace de video externo en alta fidelidad.',
            release_date: '2024',
            duration: 'Transmisión 4K',
            genres: ['Enlace Directo', '4K UHD'],
            match: 100,
            isTv: false,
            audio: 'Audio Original'
          },
          1,
          1,
          ''
        );
        setCustomInput('');
        setTitleInput('');
        setIsResolving(false);
        return;
      }

      // Caso 2: Es un ID numérico de TMDB (ej. 533535)
      const isTmdbId = /^\d+$/.test(query);
      if (isTmdbId) {
        const idNum = parseInt(query, 10);
        const fetched = await MovieAPI.getMediaById(idNum, isTv);

        if (fetched) {
          onPlayCustomMovie(
            fetched,
            isTv ? season : 1,
            isTv ? episode : 1,
            isTv ? `Capítulo ${episode}` : ''
          );
        } else {
          onPlayCustomMovie(
            {
              id: idNum,
              title: titleInput.trim() || `${isTv ? 'Serie' : 'Película'} #${idNum}`,
              overview: 'Transmisión directa por ID de catálogo con escudo anti-anuncios.',
              release_date: '2024',
              duration: isTv ? `Temporada ${season}` : '2h',
              genres: [isTv ? 'Serie' : 'Película', '4K UHD'],
              match: 99,
              isTv: isTv,
              audio: 'Español Latino'
            },
            isTv ? season : 1,
            isTv ? episode : 1,
            isTv ? `Capítulo ${episode}` : ''
          );
        }

        setCustomInput('');
        setTitleInput('');
        setIsResolving(false);
        return;
      }

      // Caso 3: Es el nombre de una película o serie (búsqueda inteligente)
      const results = await MovieAPI.searchMulti(query);
      if (results && results.length > 0) {
        const bestMatch = results[0];
        onPlayCustomMovie(
          bestMatch,
          isTv ? season : 1,
          isTv ? episode : 1,
          isTv ? `Capítulo ${episode}` : ''
        );
        setCustomInput('');
        setTitleInput('');
      } else {
        setErrorMsg('No se encontró el título. Intenta con el ID numérico de TMDB o una URL.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar. Verifica el enlace o ID ingresado.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none"
    >
      <div className="bg-gradient-to-r from-[#121218] via-[#161622] to-[#101018] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-netflix-red/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-netflix-red animate-pulse" />
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-netflix-red" />
                <span>Lanzador Rápido de Películas y Series (Título, TMDB ID o Enlace)</span>
              </h3>
            </div>

            {/* Switch Película / Serie */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsTv(false)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                  !isTv ? 'bg-netflix-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Película</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTv(true)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                  isTv ? 'bg-netflix-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Serie de TV</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-300">
            Escribe el nombre de la película/serie, el ID de TMDB (ej. <code className="text-emerald-400 bg-white/10 px-1.5 py-0.5 rounded font-mono">533535</code> para Deadpool, <code className="text-emerald-400 bg-white/10 px-1.5 py-0.5 rounded font-mono">1396</code> para Breaking Bad) o un enlace directo de video (MP4 / Web):
          </p>

          <form onSubmit={handleLaunch} className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
            <div className="flex-1 min-w-[220px] relative">
              <input 
                type="text"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Nombre, ID de TMDB (ej. 1396) o URL..."
                className="w-full px-4 py-3 bg-black/70 border border-white/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red font-sans transition-all"
              />
            </div>
            
            <input 
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Título opcional"
              className="sm:w-44 px-4 py-3 bg-black/70 border border-white/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red transition-all"
            />

            {isTv && (
              <div className="flex items-center space-x-2">
                <input 
                  type="number"
                  min="1"
                  value={season}
                  onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                  placeholder="Temp"
                  title="Número de Temporada"
                  className="w-20 px-3 py-3 bg-black/70 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:border-netflix-red text-center font-bold"
                />
                <input 
                  type="number"
                  min="1"
                  value={episode}
                  onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                  placeholder="Cap"
                  title="Número de Capítulo"
                  className="w-20 px-3 py-3 bg-black/70 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:border-netflix-red text-center font-bold"
                />
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={!customInput.trim() || isResolving}
              className="px-6 py-3 rounded-xl bg-netflix-red hover:bg-red-700 text-white font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl shadow-red-900/40 disabled:opacity-40"
            >
              {isResolving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Reproducir 4K</span>
                </>
              )}
            </motion.button>
          </form>

          {errorMsg && (
            <div className="text-xs text-red-400 flex items-center space-x-1.5 pt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
