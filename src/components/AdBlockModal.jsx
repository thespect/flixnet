import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, X, Zap, CheckCircle2, Lock, Radio, Sparkles, RefreshCw } from 'lucide-react';
import { AdBlockerService } from '../services/adBlockerService';

export default function AdBlockModal({ isOpen, onClose }) {
  const [blockedCount, setBlockedCount] = useState(AdBlockerService.getBlockedCount());
  const [isShieldActive, setIsShieldActive] = useState(AdBlockerService.isShieldActive);
  const [shieldMode, setShieldMode] = useState(AdBlockerService.shieldMode);
  const [recentEvents, setRecentEvents] = useState(AdBlockerService.getRecentBlockedEvents());

  useEffect(() => {
    const unsubscribe = AdBlockerService.subscribe((count, newEvent) => {
      setBlockedCount(count);
      setRecentEvents(AdBlockerService.getRecentBlockedEvents());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleToggleShield = () => {
    const newState = AdBlockerService.toggleShield();
    setIsShieldActive(newState);
  };

  const handleChangeMode = (mode) => {
    AdBlockerService.setShieldMode(mode);
    setShieldMode(mode);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0c0c14] border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] space-y-5 relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-netflix-red/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    CineShield™ 4K AdBlock
                  </h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Nativo Activo
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Bloqueo estricto de anuncios, popups, redirecciones y minería en streaming
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contador de Anuncios Neutralizados */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Anuncios y Popups Neutralizados
              </span>
              <div className="text-3xl font-black text-emerald-400 flex items-center space-x-2">
                <span>{blockedCount}</span>
                <span className="text-xs text-emerald-500/80 font-bold">amenazas</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Estado del Blindaje
              </span>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-black flex items-center space-x-1.5 ${
                  isShieldActive ? 'text-emerald-300' : 'text-rose-400'
                }`}>
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{isShieldActive ? '100% Protegido' : 'Pausado'}</span>
                </span>
                <button
                  onClick={handleToggleShield}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-colors ${
                    isShieldActive ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {isShieldActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>

          {/* Niveles de Protección */}
          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Modo de Blindaje
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleChangeMode('strict')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  shieldMode === 'strict'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-white">Máximo (Estricto)</span>
                  {shieldMode === 'strict' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">
                  Bloquea 100% popups, redirecciones de pestaña y rastreadores
                </p>
              </button>

              <button
                onClick={() => handleChangeMode('balanced')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  shieldMode === 'balanced'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-white">Equilibrado</span>
                  {shieldMode === 'balanced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">
                  Protección estándar compatible con reproductores externos
                </p>
              </button>
            </div>
          </div>

          {/* Registro en Vivo de Eventos Bloqueados */}
          <div className="space-y-1.5 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Registro de Seguridad en Vivo</span>
              <span className="text-[9px] text-emerald-400 font-mono">0 clics fantasma</span>
            </span>
            <div className="bg-black/50 rounded-2xl p-2.5 max-h-28 overflow-y-auto space-y-1 border border-white/10 text-[11px] font-mono text-gray-300">
              {recentEvents.length > 0 ? (
                recentEvents.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between py-0.5 border-b border-white/5 last:border-0">
                    <span className="truncate pr-2 text-emerald-300">{ev.reason}</span>
                    <span className="text-[9px] text-gray-500 shrink-0">{ev.timestamp}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-gray-500 text-xs font-sans">
                  El escudo está activo y vigilando la conexión. Cero anuncios detectados en este momento.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10 text-xs">
            <span className="text-gray-400 text-[11px] flex items-center">
              <Lock className="w-3.5 h-3.5 text-emerald-400 mr-1" /> Protección de Navegación Activa
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-netflix-red hover:bg-red-700 text-white font-black text-xs transition-all shadow-lg"
            >
              Listo
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

