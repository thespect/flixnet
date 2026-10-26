import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Key, Check, AlertCircle, ExternalLink, Sparkles, Trash2 } from 'lucide-react';
import { StorageService } from '../services/movieService';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState(StorageService.getApiKey());
  const [status, setStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      StorageService.removeApiKey();
      setStatus('cleared');
      onKeySaved(false);
      setTimeout(() => onClose(), 800);
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${apiKey.trim()}`);
      if (res.ok) {
        StorageService.setApiKey(apiKey);
        setStatus('success');
        onKeySaved(true);
        setTimeout(() => onClose(), 1000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    StorageService.removeApiKey();
    setApiKey('');
    setStatus('cleared');
    onKeySaved(false);
    setTimeout(() => onClose(), 600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-lg bg-[#181818] border border-white/10 rounded-xl p-6 sm:p-8 text-white shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-netflix-red/20 border border-netflix-red/40 flex items-center justify-center text-netflix-red">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Conexión TMDB API</h3>
            <p className="text-xs text-gray-400">Catálogo infinito de millones de películas en vivo</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
          Cineflex ya incluye un catálogo curado de respaldo listo para ver. Si deseas buscar y ver <strong>cualquier título del mundo en tiempo real</strong>, ingresa tu API Key gratuita de The Movie Database.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Clave de API (v3 auth)
            </label>
            <input 
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ejemplo: 3fd2beeb0e52b5a319f372863..."
              className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red font-mono"
            />
          </div>

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡API Key validada con éxito! Conectado con TMDB.</span>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-md bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Clave no válida. Verifica que no tenga espacios extra.</span>
            </motion.div>
          )}

          <div className="flex items-center space-x-3 pt-2">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-3 rounded-md bg-netflix-red hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-900/40 transition-all disabled:opacity-50"
            >
              {isVerifying ? 'Verificando...' : 'Guardar y Conectar'}
            </motion.button>

            {apiKey && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleClear}
                className="p-3 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 hover:text-red-400 border border-white/10"
                title="Quitar API Key"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </form>

        <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-2 text-xs text-gray-400">
          <p className="font-bold text-gray-300 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-netflix-red" />
            ¿Dónde conseguir tu clave gratuita?
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
            <li>Crea una cuenta en <a href="https://www.themoviedb.org/signup" target="_blank" rel="noreferrer" className="text-netflix-red underline inline-flex items-center">themoviedb.org <ExternalLink className="w-3 h-3 ml-0.5" /></a></li>
            <li>En tu perfil, ve a Configuración &gt; <strong>API</strong> y solicita una clave de desarrollador.</li>
            <li>Copia la clave y pégala aquí.</li>
          </ol>
        </div>

      </motion.div>
    </motion.div>
  );
}
