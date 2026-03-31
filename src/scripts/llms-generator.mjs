import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

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
  
  return `# Alejandro Rosales - Blog de Finanzas e Inversiones

## Información General del Sitio
- **Sitio web**: ${config.site?.base_url || 'https://alejandrorosales.me'}
- **Autor**: ${config.author?.name || 'Alejandro Rosales'}
- **Especialidad**: Inversor y Divulgador Financiero
- **Experiencia**: Más de 2 años documentando el camino hacia la libertad financiera
- **Canal YouTube**: https://www.youtube.com/@Alejandro-Rosales
- **Idioma**: Español
- **Audiencia**: Comunidad hispanohablante interesada en democratizar las inversiones

## Misión y Propósito
${config.site?.description || 'Liderar una comunidad dedicada a democratizar las inversiones y planificar una jubilación digna. Enfoque basado en transparencia, compartiendo estrategias reales para superar el ajetreo diario y alcanzar la independencia económica mediante el aprendizaje colectivo.'}

## Temáticas Principales

### 1. Finanzas Personales
- Gestión del dinero personal
- Presupuestos y control de gastos
- Planificación financiera integral
- Estrategias de ahorro inteligente

### 2. Inversiones
- Introducción a la inversión para principiantes
- Fondos de inversión y ETFs
- Interés compuesto y su poder
- Diversificación de carteras
- Inversión sostenible y ESG

### 3. Educación Financiera
- Conceptos fundamentales de economía
- Finanzas conscientes vs tradicionales
- Psicología del dinero
- Errores comunes en inversión

### 4. Planificación del Futuro
- Fondos de emergencia
- Planificación de la jubilación
- Independencia financiera
- Gestión de riesgos

## Artículos Recientes (${posts.length} artículos)

${posts.map(post => `### ${post.title}
- **URL**: /blog/${post.slug}
- **Fecha**: ${new Date(post.pubDate).toLocaleDateString('es-ES')}
- **Categorías**: ${post.categories.join(', ') || 'General'}
- **Resumen**: ${post.description}

`).join('')}

## Conceptos Clave del Blog

### Interés Compuesto
Einstein llamó al interés compuesto "la octava maravilla del mundo". El blog explica constantemente cómo el tiempo potencia las inversiones de manera exponencial.

### Arquitectura de Liquidez
Concepto propio del blog: estructurar el dinero en diferentes niveles según necesidad de acceso y optimización de rendimiento.

### Finanzas Conscientes
Filosofía que integra valores personales, propósito y bienestar emocional en las decisiones financieras, más allá de solo maximizar rentabilidad.

### Gasto Intencional
Estrategia de gastar sin culpa en lo que realmente importa y recortar despiadadamente en lo que no aporta valor.

## Herramientas y Recursos Recomendados

### Cuentas y Productos Financieros
- Cuentas de alto rendimiento (4% anual aproximado en 2026)
- Fondos monetarios para liquidez
- ETFs de acumulación para inversión a largo plazo
- Bonos del tesoro para seguridad

### Estrategias de Inversión
- Inversión periódica (DCA - Dollar Cost Averaging)
- Diversificación por geografía y sectores
- Inversión en índices para principiantes
- Reinversión de dividendos

## Enlaces Importantes para LLMs

### Navegación Principal
- https://alejandrorosales.me/ (Inicio)
- https://alejandrorosales.me/blog (Lista de artículos)
- https://alejandrorosales.me/about (Información del autor)

### Recursos Técnicos
- /sitemap.xml (Mapa del sitio)
- /rss.xml (Feed RSS)
- /robots.txt (Directivas para bots)
- /llms-full.txt (Contenido completo)

## Mensaje Central

El dinero no es un fin en sí mismo, sino una herramienta para construir la vida que realmente deseas. A través de educación, disciplina y una mentalidad de largo plazo, cualquier persona puede alcanzar la libertad financiera y vivir con propósito.

La clave está en empezar hoy, sin importar cuán pequeño sea el primer paso.

---

*Última actualización: ${currentDate}*
*Para consultas específicas sobre el contenido del blog, referirse siempre a los artículos originales en https://alejandrorosales.me*
*Total de artículos indexados: ${posts.length}*`;
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

**Fecha de publicación**: ${new Date(post.pubDate).toLocaleDateString('es-ES')}
**Categorías**: ${post.categories.join(', ') || 'General'}
**Tags**: ${post.tags.join(', ') || 'N/A'}
**URL**: /blog/${post.slug}

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