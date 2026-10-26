<?php
// Entrada directa para XAMPP Apache
$distHtml = __DIR__ . '/dist/index.html';

if (file_exists($distHtml)) {
    // Redirigir limpiamente a la carpeta de distribución si no está ya en ella
    header('Location: dist/');
    exit;
}

echo "<h1>Cineflex</h1><p>Por favor ejecuta <code>npm run build</code> dentro del directorio cineflex.</p>";
