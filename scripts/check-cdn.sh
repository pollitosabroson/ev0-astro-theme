#!/bin/sh
# Valida que las portadas se sirven desde img.pro y no desde el repo.
# Uso: npm run build && npm run check:cdn
set -e
[ -d dist ] || { echo "No hay dist/. Ejecuta antes: npm run build"; exit 1; }

locales=$(grep -rho '/blogs/[a-zA-Z0-9._-]*' dist --include='*.html' | sort -u | wc -l | tr -d ' ')
cdn=$(grep -rho 'src\.img\.pro/[^"?]*' dist --include='*.html' | sort -u | wc -l | tr -d ' ')
astro=$(grep -rho 'src="/_astro/[^"]*\.\(webp\|png\|jpg\|jpeg\|avif\)"' dist --include='*.html' | sort -u | wc -l | tr -d ' ')
ficheros=$(ls dist/blogs 2>/dev/null | wc -l | tr -d ' ')

echo "rutas locales /blogs/ en el HTML : $locales   (objetivo: 0)"
echo "portadas desde src.img.pro       : $cdn"
echo "reoptimizadas por Astro          : $astro   (objetivo: 0 portadas)"
echo "copias en dist/blogs/            : $ficheros   (informativo: se mantienen como respaldo)"

if [ "$locales" -eq 0 ] && [ "$cdn" -gt 0 ]; then
  echo "OK — todas las portadas salen del CDN"
else
  echo "FALLO — todavía se sirven portadas desde el repo"
  exit 1
fi
