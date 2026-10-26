<?php
// Entrada directa para XAMPP Apache con preservación total de parámetros y enlaces profundos
$distHtml = __DIR__ . '/dist/index.html';

if (file_exists($distHtml)) {
    $queryString = !empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '';
    header('Location: dist/' . $queryString);
    exit;
}

echo "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><title>Cineflex Max</title><style>body{background:#050508;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><div style='text-align:center;'><h1>Cineflex Max 4K</h1><p>Compilando distribución de alto rendimiento. Por favor ejecuta <code>npm run build</code>.</p></div></body></html>";
