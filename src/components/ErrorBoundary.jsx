import React from 'react';
import { RotateCw, AlertTriangle, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Cineflex Recovery] Error capturado en el árbol de componentes:', error, errorInfo);
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(229,9,20,0.3)]">
            <AlertTriangle className="w-10 h-10 text-netflix-red" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Optimizando Experiencia Cineflex
          </h1>
          <p className="text-gray-400 max-w-md text-sm mb-8 leading-relaxed">
            Se detectó una interrupción en la carga dinámica. Hemos asegurado la sesión y puedes reiniciar el reproductor al instante.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={this.handleReload}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-netflix-red hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/40"
            >
              <RotateCw className="w-4 h-4" />
              <span>Reiniciar Cineflex</span>
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = window.location.pathname;
              }}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10"
            >
              <Home className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
