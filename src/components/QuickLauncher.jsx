import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Link2, Sparkles, Film, Tv } from 'lucide-react';

export default function QuickLauncher({ onPlayCustomMovie }) {
  const [customInput, setCustomInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isTv, setIsTv] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleLaunch = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const isTmdbId = /^\d+$/.test(customInput.trim());

    if (isTmdbId) {
      onPlayCustomMovie(
        {
          id: parseInt(customInput.trim(), 10),
          title: titleInput.trim() || `${isTv ? 'Serie' : 'Película'} TMDB #${customInput.trim()}`,
          overview: 'Transmisión directa a través de la red de servidores en Español Latino.',
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
    } else {
      onPlayCustomMovie(
        {
          id: 999999,
          customUrl: customInput.trim(),
          title: titleInput.trim() || 'Enlace Directo de Video',
          overview: 'Transmisión desde enlace externo.',
          release_date: '2024',
          duration: 'Stream',
          genres: ['Directo'],
          match: 100,
          isTv: false
        },
        1,
        1,
        ''
      );
    }

    setCustomInput('');
    setTitleInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <div className="bg-gradient-to-r from-[#181818] via-[#1a1a1a] to-[#141414] p-6 sm:p-8 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-netflix-red/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-netflix-red animate-pulse" />
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-netflix-red" />
                <span>Reproductor Instantáneo de Películas y Series (TMDB / Enlace)</span>
              </h3>
            </div>

            {/* Switch Película / Serie */}
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsTv(false)}
                className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1 ${
                  !isTv ? 'bg-netflix-red text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Película</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTv(true)}
                className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1 ${
                  isTv ? 'bg-netflix-red text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Serie de TV</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-400">
            Ingresa el ID de TMDB (ej. <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded font-mono">100088</code> para The Last of Us, <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded font-mono">1396</code> para Breaking Bad) o un enlace web de video:
          </p>

          <form onSubmit={handleLaunch} className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
            <input 
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Ingresa TMDB ID (ej. 1396) o URL..."
              className="flex-1 min-w-[200px] px-4 py-3 bg-black/60 border border-white/20 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red font-mono"
            />
            
            <input 
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Título opcional"
              className="sm:w-44 px-4 py-3 bg-black/60 border border-white/20 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red"
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
                  className="w-20 px-3 py-3 bg-black/60 border border-white/20 rounded-md text-sm text-white focus:outline-none focus:border-netflix-red text-center font-bold"
                />
                <input 
                  type="number"
                  min="1"
                  value={episode}
                  onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                  placeholder="Cap"
                  title="Número de Capítulo"
                  className="w-20 px-3 py-3 bg-black/60 border border-white/20 rounded-md text-sm text-white focus:outline-none focus:border-netflix-red text-center font-bold"
                />
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!customInput.trim()}
              className="px-6 py-3 rounded-md bg-netflix-red hover:bg-red-700 text-white font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl shadow-red-900/40 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ver Ahora</span>
            </motion.button>
          </form>

        </div>
      </div>
    </motion.div>
  );
}
