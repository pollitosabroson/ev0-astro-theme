import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

export default function jsonLdGenerator() {
  return {
    name: 'jsonld-generator',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        try {
          console.log('🔍 Generando JSON-LD estructurado...');
          
          // Leer configuración del sitio
          const configPath = path.resolve('src/config/config.json');
          let siteConfig = {};
          
          if (fs.existsSync(configPath)) {
            siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          }
          
          // Buscar todos los archivos markdown del blog
          const blogFiles = await glob('src/content/blog/*.md');
          const posts = [];
          const topics = new Set();
          const skills = new Set();
          
          // Procesar todos los posts
          for (const file of blogFiles) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              const { data: frontmatter, content: markdownContent } = matter(content);
              
              // Extraer información del post
              const postData = {
                title: frontmatter.title || 'Sin título',
                description: frontmatter.description || '',
                slug: frontmatter.slug || path.basename(file, '.md'),
                pubDate: frontmatter.pubDate || new Date().toISOString(),
                categories: frontmatter.categories || [],
                tags: frontmatter.tags || [],
                author: frontmatter.author || ['Alejandro Rosales'],
                heroImage: frontmatter.heroImage || null,
                video: frontmatter.video || null
              };
              
              // Extraer temas y habilidades de categorías y tags
              [...postData.categories, ...postData.tags].forEach(item => {
                if (item) {
                  const normalizedItem = item.toLowerCase().trim();
                  
                  // Agregar temas específicos conocidos
                  if (normalizedItem.includes('etf')) topics.add('ETF');
                  if (normalizedItem.includes('inversión') || normalizedItem.includes('invert')) topics.add('Inversión');
                  if (normalizedItem.includes('interés compuesto')) topics.add('Interés Compuesto');
                  if (normalizedItem.includes('finanzas personales')) topics.add('Finanzas Personales');
                  if (normalizedItem.includes('educación financiera')) topics.add('Educación Financiera');
                  if (normalizedItem.includes('ahorro')) topics.add('Ahorro');
                  if (normalizedItem.includes('presupuesto')) topics.add('Presupuestos');
                  if (normalizedItem.includes('jubilación')) topics.add('Planificación de Jubilación');
                  if (normalizedItem.includes('fondos')) topics.add('Fondos de Inversión');
                  if (normalizedItem.includes('bonos')) topics.add('Bonos');
                  if (normalizedItem.includes('acciones')) topics.add('Mercado de Acciones');
                  if (normalizedItem.includes('renta fija')) topics.add('Renta Fija');
                  if (normalizedItem.includes('renta variable')) topics.add('Renta Variable');
                  if (normalizedItem.includes('diversificación')) topics.add('Diversificación');
                  if (normalizedItem.includes('broker')) topics.add('Brokers');
                  if (normalizedItem.includes('hipoteca')) topics.add('Hipotecas');
                  if (normalizedItem.includes('deuda')) topics.add('Gestión de Deudas');
                  
                  // Habilidades profesionales
                  skills.add('Análisis Financiero');
                  skills.add('Planificación Financiera');
                  skills.add('Educación Financiera');
                  skills.add('Gestión de Inversiones');
                  skills.add('Divulgación Financiera');
                }
              });
              
              posts.push(postData);
            } catch (error) {
              console.warn(`Error procesando ${file}:`, error.message);
            }
          }
          
          // Extraer temas adicionales de títulos de posts
          posts.forEach(post => {
            const title = post.title.toLowerCase();
            
            if (title.includes('s&p 500') || title.includes('sp500')) topics.add('S&P 500');
            if (title.includes('msci world')) topics.add('MSCI World');
            if (title.includes('regla del 4')) topics.add('Regla del 4%');
            if (title.includes('fire')) topics.add('Movimiento FIRE');
            if (title.includes('independencia financiera')) topics.add('Independencia Financiera');
            if (title.includes('fondo de emergencia')) topics.add('Fondos de Emergencia');
            if (title.includes('cartera')) topics.add('Construcción de Carteras');
            if (title.includes('dividendos')) topics.add('Dividendos');
            if (title.includes('inflación')) topics.add('Inflación');
            if (title.includes('bitcoin') || title.includes('crypto')) topics.add('Criptomonedas');
            if (title.includes('oro')) topics.add('Metales Preciosos');
          });
          
          // Generar JSON-LD para Person
          const personJsonLd = generatePersonJsonLd(siteConfig, Array.from(topics), Array.from(skills), posts);
          
          // Generar JSON-LD para Website
          const websiteJsonLd = generateWebsiteJsonLd(siteConfig, posts);
          
          // Generar JSON-LD para Organization
          const organizationJsonLd = generateOrganizationJsonLd(siteConfig);
          
          // Generar JSON-LD para Blog
          const blogJsonLd = generateBlogJsonLd(siteConfig, posts);
          
          // Escribir archivos JSON-LD
          fs.writeFileSync(path.join(dir.pathname, 'person.jsonld'), JSON.stringify(personJsonLd, null, 2));
          fs.writeFileSync(path.join(dir.pathname, 'website.jsonld'), JSON.stringify(websiteJsonLd, null, 2));
          fs.writeFileSync(path.join(dir.pathname, 'organization.jsonld'), JSON.stringify(organizationJsonLd, null, 2));
          fs.writeFileSync(path.join(dir.pathname, 'blog.jsonld'), JSON.stringify(blogJsonLd, null, 2));
          
          // Generar archivo combinado para insertar en HTML
          const combinedJsonLd = {
            "@context": "https://schema.org",
            "@graph": [personJsonLd, websiteJsonLd, organizationJsonLd, blogJsonLd]
          };
          
          fs.writeFileSync(path.join(dir.pathname, 'structured-data.json'), JSON.stringify(combinedJsonLd, null, 2));
          
          console.log('✅ JSON-LD estructurado generado exitosamente');
          console.log(`📊 Temas identificados: ${Array.from(topics).length}`);
          console.log(`🎯 Habilidades: ${Array.from(skills).length}`);
          console.log(`📝 Posts procesados: ${posts.length}`);
          
        } catch (error) {
          console.error('❌ Error generando JSON-LD:', error);
        }
      }
    }
  };
}

function generatePersonJsonLd(config, topics, skills, posts) {
  const baseUrl = config.site?.base_url || 'https://alejandrorosales.me';
  const authorName = config.author?.name || 'Alejandro Rosales';
  
  // Calcular estadísticas de experiencia
  const oldestPost = posts.reduce((oldest, post) => {
    const postDate = new Date(post.pubDate);
    const oldestDate = new Date(oldest.pubDate);
    return postDate < oldestDate ? post : oldest;
  }, posts[0]);
  
  const yearsOfExperience = oldestPost ? 
    Math.ceil((new Date() - new Date(oldestPost.pubDate)) / (1000 * 60 * 60 * 24 * 365)) : 2;
  
  return {
    "@type": "Person",
    "@id": `${baseUrl}/#person`,
    "name": authorName,
    "givenName": "Alejandro",
    "familyName": "Rosales",
    "jobTitle": [
      "Inversor",
      "Divulgador Financiero", 
      "Ingeniero de Software",
      "Educador Financiero"
    ],
    "description": config.site?.description || "Inversor y divulgador financiero con más de 2 años de experiencia documentando el camino hacia la libertad financiera.",
    "url": baseUrl,
    "image": `${baseUrl}${config.author?.avatar || '/autor.jpeg'}`,
    "sameAs": [
      "https://youtube.com/@alejandrorosales",
      `${baseUrl}/about`
    ],
    "knowsAbout": topics.sort(),
    "hasSkill": skills.sort(),
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Divulgador Financiero",
      "description": "Especialista en educación financiera e inversiones",
      "occupationLocation": {
        "@type": "Country",
        "name": "España"
      },
      "skills": skills.sort()
    },
    "alumniOf": {
      "@type": "EducationalOrganization",
      "name": "Ingeniería de Software"
    },
    "author": posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.description,
      "url": `${baseUrl}/blog/${post.slug}`,
      "datePublished": post.pubDate,
      "author": {
        "@type": "Person",
        "name": authorName
      }
    })),
    "expertise": [
      {
        "@type": "DefinedTerm",
        "name": "Planificación Financiera",
        "description": "Desarrollo de estrategias financieras personalizadas para alcanzar objetivos de inversión y jubilación"
      },
      {
        "@type": "DefinedTerm", 
        "name": "Educación en Inversiones",
        "description": "Enseñanza de conceptos de inversión, desde principiantes hasta estrategias avanzadas"
      },
      {
        "@type": "DefinedTerm",
        "name": "Análisis de Mercados",
        "description": "Análisis de tendencias de mercado, índices bursátiles y productos financieros"
      }
    ],
    "award": [
      `Más de ${posts.length} artículos educativos publicados`,
      `Canal de YouTube con contenido financiero especializado`,
      `${yearsOfExperience} años de experiencia documentada en finanzas`
    ],
    "workLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ES"
      }
    },
    "nationality": {
      "@type": "Country",
      "name": "España"
    },
    "knowsLanguage": [
      {
        "@type": "Language",
        "name": "Español",
        "alternateName": "es"
      }
    ],
    "teaches": [
      "Finanzas Personales",
      "Inversión en ETFs",
      "Planificación de Jubilación",
      "Gestión de Deudas",
      "Construcción de Carteras de Inversión",
      "Estrategias de Ahorro",
      "Inversión Pasiva",
      "Análisis de Fondos de Inversión",
      "Presupuestos Personales",
      "Independencia Financiera"
    ],
    "subjectOf": [
      {
        "@type": "WebSite",
        "name": "Blog de Finanzas e Inversiones",
        "url": baseUrl,
        "description": "Blog educativo sobre finanzas personales e inversiones"
      },
      {
        "@type": "VideoObject",
        "name": "Canal de YouTube de Alejandro Rosales",
        "url": "https://youtube.com/@alejandrorosales",
        "description": "Contenido educativo en video sobre finanzas e inversiones"
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/about`
    }
  };
}

function generateWebsiteJsonLd(config, posts) {
  const baseUrl = config.site?.base_url || 'https://alejandrorosales.me';
  
  return {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": config.site?.title || "Alejandro Rosales, Inversor y Divulgador Financiero",
    "description": config.site?.description || "Blog de finanzas personales e inversiones",
    "url": baseUrl,
    "inLanguage": "es-ES",
    "isPartOf": {
      "@id": `${baseUrl}/#organization`
    },
    "about": [
      "Finanzas Personales",
      "Inversiones", 
      "Educación Financiera",
      "ETFs",
      "Fondos de Inversión",
      "Planificación de Jubilación"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": [
        "Principiantes en Inversión",
        "Personas interesadas en Finanzas Personales",
        "Hispanohablantes",
        "Adultos jóvenes y profesionales"
      ],
      "geographicArea": {
        "@type": "Country",
        "name": "España"
      }
    },
    "mainEntity": {
      "@id": `${baseUrl}/#person`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "hasPart": [
      {
        "@type": "WebPage",
        "name": "Blog",
        "url": `${baseUrl}/blog`,
        "description": "Artículos sobre finanzas personales e inversiones"
      },
      {
        "@type": "WebPage", 
        "name": "Sobre Mí",
        "url": `${baseUrl}/about`,
        "description": "Información sobre Alejandro Rosales"
      }
    ]
  };
}

function generateOrganizationJsonLd(config) {
  const baseUrl = config.site?.base_url || 'https://alejandrorosales.me';
  
  return {
    "@type": ["Organization", "EducationalOrganization"],
    "@id": `${baseUrl}/#organization`,
    "name": "Alejandro Rosales - Educación Financiera",
    "description": "Organización dedicada a la educación financiera y democratización de las inversiones",
    "url": baseUrl,
    "logo": `${baseUrl}${config.site?.logoLight || '/logoLight.png'}`,
    "foundingDate": "2024",
    "founder": {
      "@id": `${baseUrl}/#person`
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Spanish"
    },
    "areaServed": {
      "@type": "Country",
      "name": "España"
    },
    "knowsAbout": [
      "Finanzas Personales",
      "Inversiones",
      "ETFs", 
      "Fondos de Inversión",
      "Educación Financiera",
      "Planificación de Jubilación"
    ],
    "serviceType": [
      "Educación Financiera",
      "Contenido Educativo sobre Inversiones",
      "Divulgación Financiera"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ES"
    }
  };
}

function generateBlogJsonLd(config, posts) {
  const baseUrl = config.site?.base_url || 'https://alejandrorosales.me';
  
  return {
    "@type": "Blog",
    "@id": `${baseUrl}/#blog`,
    "name": "Blog de Finanzas e Inversiones - Alejandro Rosales",
    "description": "Blog especializado en finanzas personales, inversiones y educación financiera",
    "url": baseUrl,
    "inLanguage": "es-ES",
    "author": {
      "@id": `${baseUrl}/#person`
    },
    "publisher": {
      "@id": `${baseUrl}/#organization`
    },
    "about": [
      "Finanzas Personales",
      "Inversiones",
      "ETFs",
      "Fondos de Inversión", 
      "Educación Financiera",
      "Interés Compuesto",
      "Planificación de Jubilación",
      "Independencia Financiera"
    ],
    "blogPost": posts.slice(0, 20).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.description, 
      "url": `${baseUrl}/blog/${post.slug}`,
      "datePublished": post.pubDate,
      "dateModified": post.pubDate,
      "author": {
        "@id": `${baseUrl}/#person`
      },
      "publisher": {
        "@id": `${baseUrl}/#organization`
      },
      "mainEntityOfPage": `${baseUrl}/blog/${post.slug}`,
      "image": post.heroImage ? `${baseUrl}${post.heroImage}` : `${baseUrl}/blog-placeholder.jpg`,
      "articleSection": post.categories,
      "keywords": post.tags,
      "isPartOf": {
        "@id": `${baseUrl}/#blog`
      }
    })),
    "audience": {
      "@type": "Audience",
      "audienceType": [
        "Principiantes en Inversión",
        "Personas interesadas en Finanzas Personales", 
        "Profesionales jóvenes",
        "Personas que buscan Independencia Financiera"
      ]
    }
  };
}