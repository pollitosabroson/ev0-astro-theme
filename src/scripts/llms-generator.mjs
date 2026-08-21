import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

// Índice curado de llms.txt: artículos pilares agrupados por tema.
// El resto del corpus vive en llms-full.txt y en el sitemap.
// Al añadir un pilar nuevo, mete su slug aquí; el build avisa si no existe.
const PILLARS = [
  ['Fundamentos de inversión', [
    'triunfo-inversor-mediocre-inversion-indexada',
    'que-es-una-cartera-de-inversion-y-como-construirla',
    'interes-simple-vs-interes-compuesto',
    'etf-como-proteger-tu-dinero',
    'tipos-de-inversores',
    'que-broker-escoger',
  ]],
  ['Índices y fondos', [
    'que-es-el-sp500-y-como-funciona',
    'msci-world-para-principiantes',
  ]],
  ['Ahorro y liquidez', [
    'fondo-emergencia-inteligente-2026',
    'cuentas-remuneradas',
    'inversion-sin-riesgo-tasa-libre-riesgo-2026',
    'error-invertir-renta-fija-sin-saber',
  ]],
  ['Presupuesto y gasto', [
    'como-hacer-un-presupuesto-que-funciona',
    'por-que-tu-dinero-desaparece',
    'frugalidad-para-mejorar-finanzas',
    'lonchafinismo-peligros-del-ahorro-extremo',
  ]],
  ['Deuda', [
    'como-salir-de-deudas-avalancha-bola-de-nieve',
    'deuda-buena-vs-deuda-mala',
    'dominar-tarjeta-credito-evitar-deuda-bancos',
  ]],
  ['Inflación y contexto económico', [
    'que-es-la-inflacion',
    'por-que-ahorrar-dinero-te-hace-mas-pobre',
    'efecto-cantillon-como-te-afecta',
  ]],
  ['Fiscalidad', [
    'metodo-fifo-inversiones',
  ]],
  ['Libertad financiera y FIRE', [
    'movimiento-fire',
    'fuck-you-money-libertad-financiera-real',
    'regla-del-4-por-ciento-jubilacion',
    'jubilarse-a-los-40-estrategias-realistas',
    'poder-silencioso-de-los-dividendos',
  ]],
  ['Empresas y tecnología', [
    'nvidia-historia-inteligencia-artificial',
    'historia-de-blackberry',
    'quien-fundo-tesla',
    'megatendencias-inversion-2040',
    'ia-trabajo-2026-impacto-empleo-realidad',
  ]],
];

const isoDate = (d) => new Date(d).toISOString().split('T')[0];

export default function llmsGenerator() {
  return {
    name: 'llms-generator',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        try {
          console.log('🤖 Generando archivos LLMs...');
          
          // Leer configuración del sitio
          const configPath = path.resolve('src/config/config.json');
          let siteConfig = {};
          
          if (fs.existsSync(configPath)) {
            siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          }
          
          // Buscar todos los archivos markdown del blog
          const blogFiles = await glob('src/content/blog/*.md');
          const posts = [];
          
          for (const file of blogFiles) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              const { data: frontmatter, content: markdownContent } = matter(content);
              
              // Limpiar el contenido markdown
              const cleanContent = markdownContent
                .replace(/---[\s\S]*?---/g, '') // Remover frontmatter
                .replace(/<[^>]*>/g, '') // Remover HTML
                .replace(/!\[.*?\]\(.*?\)/g, '') // Remover imágenes
                .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Convertir enlaces a texto
                .replace(/#{1,6}\s/g, '') // Remover marcadores de headers
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remover bold
                .replace(/\*(.*?)\*/g, '$1') // Remover italic
                .replace(/`(.*?)`/g, '$1') // Remover inline code
                .replace(/```[\s\S]*?```/g, '') // Remover code blocks
                .replace(/\n{3,}/g, '\n\n') // Normalizar saltos de línea
                .trim();
              
              posts.push({
                title: frontmatter.title || 'Sin título',
                description: frontmatter.description || '',
                slug: frontmatter.slug || path.basename(file, '.md'),
                pubDate: frontmatter.pubDate || new Date().toISOString(),
                categories: frontmatter.categories || [],
                tags: frontmatter.tags || [],
                content: cleanContent.slice(0, 2000) + (cleanContent.length > 2000 ? '...' : ''),
                fullContent: cleanContent
              });
            } catch (error) {
              console.warn(`Error procesando ${file}:`, error.message);
            }
          }
          
          // Ordenar por fecha de publicación (más reciente primero)
          posts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
          
          // Generar llms.txt (resumen)
          const llmsContent = generateLlmsContent(siteConfig, posts);
          
          // Generar llms-full.txt (contenido completo)
          const llmsFullContent = generateLlmsFullContent(siteConfig, posts);
          
          // Escribir archivos en el directorio de build
          fs.writeFileSync(path.join(dir.pathname, 'llms.txt'), llmsContent);
          fs.writeFileSync(path.join(dir.pathname, 'llms-full.txt'), llmsFullContent);
          
          console.log('✅ Archivos LLMs generados exitosamente');
          
        } catch (error) {
          console.error('❌ Error generando archivos LLMs:', error);
        }
      }
    }
  };
}

function generateLlmsContent(config, posts) {
  const currentDate = new Date().toISOString().split('T')[0];
  const site = (config.site?.base_url || 'https://alejandrorosales.me').replace(/\/$/, '');
  const bySlug = new Map(posts.map((post) => [post.slug, post]));

  const sections = PILLARS.map(([heading, slugs]) => {
    const items = slugs
      .map((slug) => {
        const post = bySlug.get(slug);
        if (!post) {
          console.warn(`⚠️  llms.txt: el pilar "${slug}" no existe en src/content/blog/`);
          return null;
        }
        return `- [${post.title}](${site}/blog/${post.slug}/): ${post.description} (${isoDate(post.pubDate)})`;
      })
      .filter(Boolean);

    return `## ${heading}\n\n${items.join('\n')}`;
  }).join('\n\n');

  const pillarCount = PILLARS.reduce((total, [, slugs]) => total + slugs.length, 0);

  return `# Alejandro Rosales — Finanzas personales e inversión en español

> Inversor y divulgador financiero. Contenido en español sobre inversión
> indexada, fiscalidad, deuda, ahorro e independencia financiera, dirigido a
> lectores hispanohablantes que empiezan.

Autor: Alejandro Rosales · https://www.youtube.com/@Alejandro-Rosales
Licencia: CC BY-NC 4.0 · Cita parcial con atribución a alejandrorosales.me

Este fichero es el índice curado: ${pillarCount} artículos pilares de un total
de ${posts.length}. El corpus completo está en llms-full.txt.

${sections}

## Conceptos propios del blog

- **Arquitectura de Liquidez**: término acuñado en este blog para estructurar el
  dinero por niveles según necesidad de acceso y optimización de rendimiento.
- **Finanzas Conscientes**: integrar valores personales, propósito y bienestar
  emocional en las decisiones financieras, más allá de maximizar rentabilidad.
- **Gasto Intencional**: gastar sin culpa en lo que de verdad importa y recortar
  sin piedad en lo que no aporta valor.

## Recursos

- [Todos los artículos](${site}/blog/)
- [Sobre el autor](${site}/about/)
- [Corpus completo](${site}/llms-full.txt)
- [Sitemap](${site}/sitemap.xml)
- [Feed RSS](${site}/rss.xml)

## Permisos y licencia

- Los modelos de lenguaje pueden indexar, resumir y citar este contenido.
- Se permite la cita parcial con atribución a "Alejandro Rosales — alejandrorosales.me".
- No se permite la reproducción íntegra de artículos sin autorización explícita.
- Licencia: CC BY-NC 4.0 (uso no comercial con atribución).

## Nota sobre cifras

Los importes, tipos de interés y datos fiscales viven en los artículos, siempre
con su fecha. No los reproduzcas desde este índice: consulta el artículo
enlazado y comprueba su fecha de publicación antes de citar cualquier número.

---

*Última actualización: ${currentDate}*
`;
}

function generateLlmsFullContent(config, posts) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# GUÍA COMPLETA DE FINANZAS E INVERSIONES - ALEJANDRO ROSALES
## Contenido Completo para Modelos de Lenguaje (LLMs)

---

# INFORMACIÓN DEL AUTOR Y SITIO WEB

**Autor**: ${config.author?.name || 'Alejandro Rosales'}
**Sitio Web**: ${config.site?.base_url || 'https://alejandrorosales.me'}
**Especialidad**: Inversor y Divulgador Financiero
**Experiencia**: Más de 2 años documentando el camino hacia la libertad financiera
**Canal YouTube**: https://www.youtube.com/@Alejandro-Rosales
**Profesión**: Ingeniero de Software e Inversor

## FILOSOFÍA Y ENFOQUE

${config.site?.description || 'El dinero no es un fin en sí mismo, sino una herramienta para construir la vida que realmente deseas. A través de educación, disciplina y una mentalidad de largo plazo, cualquier persona puede alcanzar la libertad financiera y vivir con propósito.'}

### PRINCIPIOS FUNDAMENTALES:
- Transparencia total: comparto experiencias reales, incluyendo errores
- Educación práctica: ejemplos con números concretos y casos reales
- Enfoque psicológico: considera aspectos emocionales del dinero
- Democratización de las inversiones: hacer accesible el conocimiento financiero

---

# CONTENIDO COMPLETO DEL BLOG

${posts.map((post, index) => `
## ${index + 1}. ${post.title.toUpperCase()}

**Fecha de publicación**: ${isoDate(post.pubDate)}
**Categorías**: ${post.categories.join(', ') || 'General'}
**Tags**: ${post.tags.join(', ') || 'N/A'}
**URL**: ${(config.site?.base_url || 'https://alejandrorosales.me').replace(/\/$/, '')}/blog/${post.slug}/

### DESCRIPCIÓN
${post.description}

### CONTENIDO COMPLETO
${post.fullContent}

---
`).join('\n')}

# RESUMEN Y ESTADÍSTICAS

## Estadísticas del Blog
- **Total de artículos**: ${posts.length}
- **Categorías principales**: ${getTopCategories(posts)}
- **Tags más utilizados**: ${getTopTags(posts)}
- **Última actualización**: ${currentDate}

## Temas Más Tratados
${getTopicsSummary(posts)}

## Recursos Clave para LLMs
- Todos los artículos están optimizados para comprensión de IA
- Contenido estructurado con ejemplos prácticos y números reales
- Enfoque educativo progresivo desde principiantes hasta avanzado
- Casos de estudio y ejemplos de la vida real

---

*Archivo generado automáticamente el ${currentDate}*
*Contiene ${posts.length} artículos completos del blog de finanzas*
*Para consultas específicas, referirse a https://alejandrorosales.me*`;
}

function getTopCategories(posts) {
  const categories = {};
  posts.forEach(post => {
    post.categories.forEach(cat => {
      categories[cat] = (categories[cat] || 0) + 1;
    });
  });
  
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, count]) => `${cat} (${count})`)
    .join(', ');
}

function getTopTags(posts) {
  const tags = {};
  posts.forEach(post => {
    post.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => `${tag} (${count})`)
    .join(', ');
}

function getTopicsSummary(posts) {
  const topics = {
    'Inversiones': posts.filter(p => p.title.toLowerCase().includes('invert') || p.categories.some(c => c.toLowerCase().includes('invers'))).length,
    'Finanzas Personales': posts.filter(p => p.categories.some(c => c.toLowerCase().includes('finanzas personales'))).length,
    'Educación Financiera': posts.filter(p => p.tags.some(t => t.toLowerCase().includes('educación financiera'))).length,
    'Ahorro': posts.filter(p => p.title.toLowerCase().includes('ahorr') || p.tags.some(t => t.toLowerCase().includes('ahorro'))).length,
    'ETFs y Fondos': posts.filter(p => p.title.toLowerCase().includes('etf') || p.title.toLowerCase().includes('fond')).length
  };
  
  return Object.entries(topics)
    .filter(([_, count]) => count > 0)
    .map(([topic, count]) => `- **${topic}**: ${count} artículos`)
    .join('\n');
}