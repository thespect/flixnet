import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Tv, 
  Cast, 
  Check, 
  Copy, 
  Smartphone, 
  ShieldCheck,
  Wifi,
  ExternalLink,
  Zap,
  Airplay,
  Radio,
  Share2,
  QrCode,
  Globe
} from 'lucide-react';
import { CastService } from '../services/castService';
import { StreamScannerService } from '../services/streamScannerService';
import { REAL_4K_SOURCES } from '../services/movieService';

export default function CastModal({ 
  isOpen, 
  onClose, 
  movie, 
  season = 1, 
  episode = 1,
  directStreamUrl = '',
  videoElement = null
}) {
  const [devices] = useState(CastService.getNearbySmartTVs());
  const [connectingId, setConnectingId] = useState(null);
  const [connectedId, setConnectedId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedLan, setCopiedLan] = useState(false);
  const [copiedM3u8, setCopiedM3u8] = useState(false);
  const [resolvedLatinoM3u8, setResolvedLatinoM3u8] = useState(directStreamUrl || '');
  const [isScanningStream, setIsScanningStream] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Si se abrió el modal sin un stream .m3u8 directo aún, buscar automáticamente el stream en Español Latino 4K
  useEffect(() => {
    if (!isOpen || !movie) return;
    if (directStreamUrl && !directStreamUrl.startsWith('blob:')) {
      setResolvedLatinoM3u8(directStreamUrl);
      return;
    }

    let cancelled = false;
    setIsScanningStream(true);
    StreamScannerService.scanAllWorkingLinks(movie, season, episode).then((report) => {
      if (cancelled) return;
      setIsScanningStream(false);
      const bestLatino =
        report?.latinoDirectStreams?.[0]?.url ||
        report?.directHlsStreams?.[0]?.url ||
        movie?.real4kSource?.resolutions?.['2160p'] ||
        REAL_4K_SOURCES[0].resolutions['2160p'];
      setResolvedLatinoM3u8(bestLatino);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, movie, season, episode, directStreamUrl]);

  if (!isOpen || !movie) return null;

  const activeStreamUrl =
    resolvedLatinoM3u8 ||
    directStreamUrl ||
    movie?.real4kSource?.resolutions?.['2160p'] ||
    REAL_4K_SOURCES[0].resolutions['2160p'];

  const tvLink = CastService.getLocalTvUrl(movie.id, movie.isTv, season, episode);
  const mobileLinks = CastService.getMobileCastAppLinks(
    activeStreamUrl,
    `${movie.title}${movie.isTv ? ` T${season}:E${episode}` : ''} (4K Español Latino)`
  );

  const handleQuickChromecast = async () => {
    setConnectingId('tv_chromecast');
    setStatusMessage('Iniciando Google Cast / Remote Playback con stream 4K en Español Latino...');
    const res = await CastService.triggerChromecast(
      activeStreamUrl,
      movie,
      season,
      episode,
      videoElement
    );
    setConnectingId(null);
    if (res.ok) {
      setConnectedId('tv_chromecast');
    }
    setStatusMessage(res.message);
  };

  const handleQuickAirPlay = async () => {
    setConnectingId('tv_apple');
    setStatusMessage('Abriendo selector nativo de AirPlay 2 con flujo HLS en Español Latino...');
    const res = await CastService.triggerAirPlay(videoElement, activeStreamUrl);
    setConnectingId(null);
    if (res.ok) {
      setConnectedId('tv_apple');
    }
    setStatusMessage(res.message);
  };

  const handleConnectDevice = async (device) => {
    if (device.type === 'airplay') {
      await handleQuickAirPlay();
    } else {
      await handleQuickChromecast();
    }
  };

  const handleCopyLanLink = () => {
    navigator.clipboard.writeText(tvLink);
    setCopiedLan(true);
    setTimeout(() => setCopiedLan(false), 2200);
  };

  const handleCopyM3u8Link = () => {
    navigator.clipboard.writeText(activeStreamUrl);
    setCopiedM3u8(true);
    setTimeout(() => setCopiedM3u8(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${movie.title} • 4K Español Latino`,
          text: `Transmitir ${movie.title} en 4K Español Latino`,
          url: activeStreamUrl
        });
      } catch {}
    } else {
      handleCopyM3u8Link();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-2.5 sm:p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-xl bg-[#101017] border border-white/15 rounded-3xl p-4 sm:p-6 text-white shadow-2xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 rounded-full text-gray-300 hover:text-white bg-white/10 hover:bg-netflix-red transition-all border border-white/15"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>

        {/* Header */}
        <div className="flex items-center space-x-3 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-netflix-red to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-900/50 shrink-0">
            <Cast className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
              <span>Chromecast & AirPlay 4K</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded flex items-center">
                <Globe className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                <span>ESPAÑOL LATINO DIRECTO</span>
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-400 flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
              <span>
                {isScanningStream
                  ? 'Preparando flujo HLS .m3u8 en Español Latino para tu TV...'
                  : 'Flujo directo .m3u8 en Español Latino listo para enviar a tu TV'}
              </span>
            </p>
          </div>
        </div>

        {/* Película / Serie actual */}
        <div className="bg-black/60 p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-white truncate">{movie.title}</h4>
            <p className="text-[11px] text-emerald-400 font-bold">
              {movie.isTv ? `Temporada ${season} • Capítulo ${episode}` : 'Película Completa'} • Audio Español Latino 4K
            </p>
          </div>
          <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-1 rounded-lg font-black shrink-0">
            HLS NATIVO
          </span>
        </div>

        {/* BOTONES PRINCIPALES DE 1 CLIC (CHROMECAST Y AIRPLAY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleQuickChromecast}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-netflix-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2.5 shadow-xl shadow-red-900/40 border border-red-400/30 cursor-pointer"
          >
            <Cast className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Conectar Chromecast</div>
              <div className="text-[10px] font-semibold text-red-100">Android, Tablet, PC y Google TV</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleQuickAirPlay}
            className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/20 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2.5 border border-white/25 shadow-xl cursor-pointer"
          >
            <Airplay className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Conectar AirPlay 2</div>
              <div className="text-[10px] font-semibold text-gray-300">iPhone, iPad, Mac y Apple TV</div>
            </div>
          </motion.button>
        </div>

        {/* Mensaje de estado en vivo */}
        {statusMessage && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-3 text-xs text-emerald-200 font-bold flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TRANSMISIÓN RÁPIDA DESDE CELULAR O TABLET (1 TOQUE A SMART TV) */}
        <div className="bg-white/[0.04] p-3.5 rounded-2xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center">
              <Smartphone className="w-3.5 h-3.5 mr-1.5" /> Transmisión Directa desde Celular / Tablet:
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Stream .M3U8 Latino</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={mobileLinks.webVideoCaster}
              className="px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 text-xs font-black flex items-center justify-center space-x-1.5 text-center"
              title="Transmitir con Web Video Caster a Samsung, LG, Roku, Chromecast o Fire TV"
            >
              <Tv className="w-3.5 h-3.5 shrink-0" />
              <span>Web Video Caster</span>
            </a>

            <a
              href={mobileLinks.vlc}
              className="px-3 py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-400/30 text-orange-200 text-xs font-black flex items-center justify-center space-x-1.5 text-center"
              title="Abrir stream directo en VLC (con soporte Chromecast integrado)"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Abrir en VLC Cast</span>
            </a>

            <button
              onClick={handleNativeShare}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-black flex items-center justify-center space-x-1.5"
              title="Compartir o enviar a app de Smart TV en tu celular/tablet"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Enviar a App TV</span>
            </button>
          </div>

          {/* Copiar URL directa .m3u8 en Español Latino */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              readOnly
              value={activeStreamUrl}
              className="flex-1 px-3 py-1.5 bg-black/80 border border-white/15 rounded-xl text-[11px] text-emerald-300 font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopyM3u8Link}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 shrink-0 transition-all ${
                copiedM3u8
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {copiedM3u8 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedM3u8 ? 'Copiado' : 'Copiar .M3U8'}</span>
            </button>
          </div>
        </div>

        {/* Lista de Receptores Compatibles */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Receptores Compatibles en Red Wi-Fi</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center">
              <Wifi className="w-3 h-3 mr-1" /> 4K Ultra HD
            </span>
          </h4>

          <div className="space-y-2">
            {devices.map((device) => {
              const isConnecting = connectingId === device.id;
              const isConnected = connectedId === device.id;

              return (
                <div
                  key={device.id}
                  onClick={() => handleConnectDevice(device)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isConnected
                      ? 'bg-emerald-950/40 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isConnected 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/10 text-gray-300'
                    }`}>
                      <Tv className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">{device.name}</h5>
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded font-black text-amber-300 shrink-0">
                          {device.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        {device.room} • {device.quality}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
                    ) : isConnected ? (
                      <span className="flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <Check className="w-3 h-3 mr-1" /> Activo
                      </span>
                    ) : (
                      <button className="text-xs font-bold text-white bg-white/10 hover:bg-netflix-red px-3 py-1.5 rounded-xl border border-white/15 transition-all">
                        Transmitir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enlace Red Local Wi-Fi (con IP LAN real) + Código QR para Smart TV */}
        <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-200 flex items-center space-x-1.5">
              <Tv className="w-4 h-4 text-netflix-red" />
              <span>Enlace Wi-Fi LAN y QR para Navegador de Smart TV</span>
            </h4>
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-[11px] font-black text-amber-300 hover:text-amber-200 flex items-center space-x-1 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/25"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Ocultar QR' : 'Ver Código QR'}</span>
            </button>
          </div>

          {showQr && (
            <div className="flex flex-col items-center justify-center py-2 bg-white rounded-2xl p-3 max-w-[200px] mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(tvLink)}`}
                alt="QR Smart TV"
                className="w-36 h-36 object-contain"
              />
              <span className="text-[10px] font-black text-black mt-1 text-center">
                Escanea con tu Celular, Tablet o Smart TV
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              readOnly 
              value={tvLink}
              className="flex-1 px-3 py-2 bg-black/80 border border-white/15 rounded-xl text-xs text-gray-300 font-mono truncate focus:outline-none"
            />
            
            <button 
              onClick={handleCopyLanLink}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shrink-0 ${
                copiedLan 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              {copiedLan ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLan ? 'Copiado' : 'Copiar'}</span>
            </button>

            <a
              href={tvLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-netflix-red hover:bg-red-700 text-white flex items-center space-x-1 transition-all shrink-0"
              title="Abrir en nueva ventana"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" /> AirPlay 2 • Google Cast • DLNA
          </span>
          <span className="text-emerald-400 font-bold">Audio Oficial Latino 4K</span>
        </div>

      </motion.div>
    </motion.div>
  );
}
