// Construye la URL de la portada pidiendo al CDN (img.pro) el ancho que toca.
// Sin `q` explícito el CDN reencoda con una calidad pésima: pasa siempre.
export const heroUrl = (src: string, width: number) => `${src}?w=${width}&q=72`;
