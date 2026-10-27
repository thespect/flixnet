<?php
// Entrada directa sin redirecciones para XAMPP Apache con preservación total de URL y rutas
$distHtmlPath = __DIR__ . '/dist/index.html';

if (file_exists($distHtmlPath)) {
    $html = file_get_contents($distHtmlPath);
    // Reescribir rutas relativas de assets para servir desde la raíz sin redireccionar a /dist/
    $html = str_replace(['href="./assets/', 'src="./assets/', 'src="./hls.min.js"'], ['href="./dist/assets/', 'src="./dist/assets/', 'src="./dist/hls.min.js"'], $html);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

echo "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><title>Cineflex Max</title><style>body{background:#050508;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><div style='text-align:center;'><h1>Cineflex Max 4K</h1><p>Compilando distribución de alto rendimiento. Por favor ejecuta <code>npm run build</code>.</p></div></body></html>";
