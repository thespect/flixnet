import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Tv, 
  Cast, 
  Radio, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Smartphone, 
  ShieldCheck,
  Wifi,
  Zap
} from 'lucide-react';
import { CastService } from '../services/castService';

export default function CastModal({ 
  isOpen, 
  onClose, 
  movie, 
  season = 1, 
  episode = 1 
}) {
  const [devices, setDevices] = useState(CastService.getNearbySmartTVs());
  const [connectingId, setConnectingId] = useState(null);
  const [connectedId, setConnectedId] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !movie) return null;

  const tvLink = CastService.getLocalTvUrl(movie.id, movie.isTv, season, episode);

  const handleConnectDevice = async (device) => {
    setConnectingId(device.id);

    if (device.type === 'airplay') {
      const videoEl = document.querySelector('video');
      CastService.triggerAirPlay(videoEl);
    } else if (device.type === 'chromecast') {
      await CastService.triggerPresentation(tvLink);
    }

    setTimeout(() => {
      setConnectingId(null);
      setConnectedId(device.id);
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tvLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-xl bg-[#161616] border border-white/10 rounded-2xl p-6 sm:p-8 text-white shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-netflix-red to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-900/50">
            <Cast className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center space-x-2">
              <span>Transmitir a Smart TV</span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded">
                4K HDR
              </span>
            </h3>
            <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Buscando pantallas compatibles en tu red Wi-Fi...</span>
            </p>
          </div>
        </div>

        {/* Currently playing title badge */}
        <div className="bg-black/50 p-3 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <h4 className="text-sm font-bold text-white truncate">{movie.title}</h4>
            <p className="text-[11px] text-gray-400">
              {movie.isTv ? `Temporada ${season} • Capítulo ${episode}` : 'Película 4K Ultra HD'} • Audio Latino
            </p>
          </div>
          <span className="text-[10px] bg-netflix-red/20 text-netflix-red border border-netflix-red/30 px-2 py-1 rounded font-black shrink-0">
            SIN ANUNCIOS
          </span>
        </div>

        {/* Discovered Smart TVs list */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Dispositivos Detectados</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center">
              <Wifi className="w-3 h-3 mr-1" /> Misma red Wi-Fi
            </span>
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
            {devices.map((device) => {
              const isConnecting = connectingId === device.id;
              const isConnected = connectedId === device.id;

              return (
                <motion.div
                  key={device.id}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
                  onClick={() => handleConnectDevice(device)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isConnected
                      ? 'bg-emerald-950/40 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isConnected 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/10 text-gray-300'
                    }`}>
                      <Tv className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-bold text-white truncate">{device.name}</h5>
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded font-black text-gray-300">
                          {device.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        {device.room} • {device.quality}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3">
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
                    ) : isConnected ? (
                      <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5 mr-1" /> Conectado
                      </span>
                    ) : (
                      <button className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-all">
                        Vincular
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Remote Smart TV Pairing Link & Browser Remote */}
        <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-netflix-red" />
              <span>Abrir directo en el Navegador de tu Smart TV</span>
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Adaptativo</span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            También puedes abrir el navegador integrado de tu Smart TV (Samsung Tizen, LG webOS, Android TV o Fire TV) e ingresar este enlace para reproducir directo en pantalla grande:
          </p>

          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              readOnly 
              value={tvLink}
              className="flex-1 px-3 py-2 bg-black/70 border border-white/15 rounded-lg text-xs text-gray-300 font-mono truncate focus:outline-none"
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </motion.button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" /> Compatible con AirPlay 2 y Google Cast
          </span>
          <span className="text-amber-400 font-bold">Tasa de bits: 35 Mbps 4K</span>
        </div>

      </motion.div>
    </motion.div>
  );
}
