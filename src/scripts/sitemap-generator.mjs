import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

export default function sitemapGenerator() {
  return {
    name: 'sitemap-generator',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        try {
          console.log('🗺️  Generando sitemap optimizado para agent-first...');
          
          // Leer configuración del sitio
          const configPath = path.resolve('src/config/config.json');
          let siteConfig = {};
          
          if (fs.existsSync(configPath)) {
            siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          }
          
          const baseUrl = siteConfig.site?.base_url || 'https://alejandrorosales.me';
          
          // Buscar todos los archivos markdown del blog
          const blogFiles = await glob('src/content/blog/*.md');
          const posts = [];
          
          // Procesar todos los posts para obtener fechas
          for (const file of blogFiles) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              const { data: frontmatter } = matter(content);
              
              posts.push({
                slug: frontmatter.slug || path.basename(file, '.md'),
                pubDate: frontmatter.pubDate || new Date().toISOString(),
                updateDate: frontmatter.updateDate || frontmatter.pubDate || new Date().toISOString(),
              });
            } catch (error) {
              console.warn(`Error procesando ${file}:`, error.message);
            }
          }
          
          // Definir estructura de URLs con prioridades y frecuencias
          const urlStructure = [
            // Páginas principales - máxima prioridad
            {
              loc: baseUrl,
              priority: 1.0,
              changefreq: 'daily',
              lastmod: new Date().toISOString(),
            },
            {
              loc: `${baseUrl}/about/`,
              priority: 0.8,
              changefreq: 'monthly',
              lastmod: new Date().toISOString(),
            },
            
            // Posts del blog - alta prioridad con fechas reales
            ...posts.map(post => ({
              loc: `${baseUrl}/blog/${post.slug}/`,
              priority: 0.9,
              changefreq: 'weekly',
              lastmod: new Date(post.updateDate).toISOString(),
            })),
            
            // Páginas de paginación del blog
            {
              loc: `${baseUrl}/blog/`,
              priority: 0.8,
              changefreq: 'daily',
              lastmod: new Date().toISOString(),
            },
            
            // Categorías - media prioridad
            {
              loc: `${baseUrl}/categories/`,
              priority: 0.6,
              changefreq: 'weekly',
              lastmod: new Date().toISOString(),
            },
            
            // Tags - baja prioridad
            {
              loc: `${baseUrl}/tags/`,
              priority: 0.4,
              changefreq: 'weekly',
              lastmod: new Date().toISOString(),
            },
          ];
          
          // Ordenar: home primero, luego posts por fecha descendente, luego resto
          urlStructure.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            // Dentro de la misma prioridad, más reciente primero
            return new Date(b.lastmod) - new Date(a.lastmod);
          });
          
          // Generar XML del sitemap
          const sitemapXml = generateSitemapXml(urlStructure);
          
          // Escribir sitemap.xml en la raíz de dist
          const sitemapPath = path.join(dir.pathname, 'sitemap.xml');
          fs.writeFileSync(sitemapPath, sitemapXml);
          
          console.log('✅ Sitemap optimizado generado exitosamente');
          console.log(`📊 URLs incluidas: ${urlStructure.length}`);
          console.log(`📝 Posts del blog: ${posts.length}`);
          
        } catch (error) {
          console.error('❌ Error generando sitemap:', error);
        }
      }
    }
  };
}

function generateSitemapXml(urls) {
  const urlEntries = urls.map(url => {
    const lastmod = url.lastmod ? new Date(url.lastmod).toISOString().split('T')[0] : '';
    
    return `  <url>
    <loc>${url.loc}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority ? `
    <priority>${url.priority.toFixed(1)}</priority>` : ''}
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlEntries}
</urlset>`;
}
