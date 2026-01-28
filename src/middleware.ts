import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const { url, redirect } = context;
  
  // Si la URL no termina en slash y no es un archivo estático
  if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
    // Redirigir a la versión con trailing slash
    return redirect(url.pathname + '/' + url.search, 301);
  }
  
  return next();
});
