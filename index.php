<?php
// Entrada directa sin redirecciones para XAMPP Apache con carga instantánea de estilos y 0% caché obsoleto
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$distHtmlPath = __DIR__ . '/dist/index.html';
$cssMtime = @filemtime(__DIR__ . '/dist/assets/cineflex.css') ?: time();
$jsMtime = @filemtime(__DIR__ . '/dist/assets/cineflex.js') ?: time();

if (file_exists($distHtmlPath)) {
    $html = file_get_contents($distHtmlPath);
    // Reescribir rutas relativas de assets para servir desde la raíz con bust de caché instantáneo
    $html = str_replace(
        ['href="./assets/cineflex.css"', 'src="./assets/cineflex.js"', 'href="./assets/', 'src="./assets/', 'src="./hls.min.js"'],
        [
            'href="./dist/assets/cineflex.css?v=' . $cssMtime . '"',
            'src="./dist/assets/cineflex.js?v=' . $jsMtime . '"',
            'href="./dist/assets/',
            'src="./dist/assets/',
            'src="./dist/hls.min.js"'
        ],
        $html
    );
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

echo "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><title>Cineflex Max</title><style>body{background:#050508;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><div style='text-align:center;'><h1>Cineflex Max 4K</h1><p>Compilando distribución de alto rendimiento. Por favor ejecuta <code>npm run build</code>.</p></div></body></html>";
