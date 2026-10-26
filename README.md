# 🎬 Cineflex • Plataforma de Streaming Inteligente Estilo Netflix

Cineflex es una plataforma web moderna inspirada visualmente en Netflix, diseñada para indexar y reproducir enlaces de películas gratuitas a través de servidores multi-embed y metadatos de The Movie Database (TMDB).

---

## ✨ Características Principales

* 🍿 **Interfaz UI/UX Estilo Netflix**:
  * Hero Banner con tráiler y carátula en alta definición.
  * Carruseles horizontales deslizables por géneros y tendencias (Acción, Ciencia Ficción, Terror, Comedia, Clásicos).
  * Tarjetas interactivas con previsualización al hacer hover, porcentaje de coincidencia y rating.
  * Modal detallado con sinopsis completa, duración, año y reparto.
  * Sección "Mi Lista" para guardar películas favoritas (persistente en `localStorage`).
  * Sección "Continuar Viendo" con historial y barra de progreso.

* ⚡ **Arquitectura de Streaming Multi-Servidor**:
  * **Servidor 1 (VidLink HD)**: Múltiples pistas de audio (Latino, Castellano, Inglés) y subtítulos sincronizados.
  * **Servidor 2 (VidSrc To)**: Servidor ultrarrápido con balanceo de carga internacional.
  * **Servidor 3 (MultiEmbed)**: Agregador inteligente multihost.
  * **Servidor 4 (VidSrc Mirror)**: Espejo de respaldo.
  * **Tráiler Oficial 4K**: Integración directa con YouTube sin cookies invasivas.

* 🛡️ **Escudo Anti-Popups (Sandbox)**:
  * Control activable/desactivable en el reproductor para bloquear ventanas emergentes y redirecciones molestas de los servidores externos.

* 🔍 **Buscador Instantáneo & Reproductor Rápido**:
  * Búsqueda en tiempo real con debounce.
  * Lanzador rápido para ingresar cualquier ID de TMDB (ejemplo: `27205` para Inception) o enlace URL personalizado de video.

* 🔑 **Soporte Híbrido TMDB API + Catálogo Curado**:
  * Funciona inmediatamente sin configurar nada gracias a un catálogo integrado de películas taquilleras.
  * Opción en la barra superior para ingresar tu API Key gratuita de TMDB y desbloquear millones de películas y estrenos en vivo.

---

## 🚀 Cómo Ejecutar el Proyecto

### Opción 1: Servidor de Desarrollo Rápido (Recomendado)
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
cd cineflex
npm run dev
```

Abre tu navegador en: **`http://localhost:3000`**

### Opción 2: A través de tu XAMPP Apache local
Ya está construida la versión de producción optimizada en la carpeta `dist`.
Simplemente abre tu navegador y visita:
**`http://localhost/requi/cineflex/`** (o `http://localhost/requi/cineflex/dist/`)

Para compilar cambios futuros:
```bash
npm run build
```

---

## 📁 Estructura del Código

```text
cineflex/
├── dist/                  # Build listo para producción en Apache/XAMPP
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Barra de navegación, búsqueda y perfil
│   │   ├── HeroBanner.jsx       # Portada principal destacada
│   │   ├── MovieRow.jsx         # Carrusel horizontal con flechas deslizables
│   │   ├── MovieCard.jsx        # Tarjeta de película con hover y acciones rápidas
│   │   ├── MovieDetailsModal.jsx# Modal de detalles y sinopsis
│   │   ├── VideoPlayerModal.jsx # Reproductor con conmutador multi-servidor y escudo
│   │   ├── ApiKeyModal.jsx      # Conexión con TMDB API
│   │   └── QuickLauncher.jsx    # Reproductor por TMDB ID o URL directa
│   ├── services/
│   │   └── movieService.js      # Catálogo, lógica de TMDB, storage y URLs de embeds
│   ├── App.jsx                  # Estado global y orquestación de vistas
│   ├── index.css                # Estilos globales y scrollbars Netflix
│   └── main.jsx                 # Entrada React
├── index.php              # Redirección automática para XAMPP
├── package.json
└── vite.config.js
```

---

## ⚖️ Nota Legal
Esta aplicación es un proyecto educativo de indexación de enlaces multimedia. No aloja, distribuye ni almacena ningún contenido audiovisual en servidores propios.
# flixnet
