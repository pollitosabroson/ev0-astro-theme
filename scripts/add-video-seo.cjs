const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const youtube = google.youtube('v3');

const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// Extraer video ID de URLs de YouTube
function extractVideoId(content) {
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Parsear timestamp a segundos (soporta M:SS, MM:SS, H:MM:SS, HH:MM:SS)
function timestampToSeconds(timestamp) {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
}

// Parsear duración ISO 8601 (PT12M30S) a segundos
function isoDurationToSeconds(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// Extraer capítulos de la descripción del video de YouTube
function parseChaptersFromDescription(description, videoDurationISO) {
  const lines = description.split('\n');
  const chapterRegex = /^\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[–—\-]?\s*(.+)$/;
  const rawChapters = [];

  for (const line of lines) {
    const match = line.match(chapterRegex);
    if (match) {
      rawChapters.push({
        timestamp: match[1],
        name: match[2].trim(),
        startOffset: timestampToSeconds(match[1]),
      });
    }
  }

  if (rawChapters.length === 0) return [];

  // Calcular endOffset de cada capítulo (inicio del siguiente, o duración total para el último)
  const totalSeconds = isoDurationToSeconds(videoDurationISO);
  return rawChapters.map((chapter, i) => ({
    name: chapter.name,
    startOffset: chapter.startOffset,
    endOffset: i < rawChapters.length - 1 ? rawChapters[i + 1].startOffset : totalSeconds,
  }));
}

// Obtener información del video desde YouTube API
async function getVideoInfo(videoId) {
  try {
    const response = await youtube.videos.list({
      key: API_KEY,
      part: 'snippet,contentDetails',
      id: videoId,
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`❌ No se encontró información para el video: ${videoId}`);
      return null;
    }

    const video = response.data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    const duration = contentDetails?.duration && /^PT/.test(contentDetails.duration)
      ? contentDetails.duration
      : null;

    if (!duration) {
      console.log(`⚠️  Video ${videoId}: duración no disponible (¿estreno en curso?). Se omitirá el campo duration.`);
    }

    const chapters = snippet?.description
      ? parseChaptersFromDescription(snippet.description, duration)
      : [];

    return {
      title: snippet.title,
      description: snippet.description,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: snippet.thumbnails.maxres?.url ||
                    snippet.thumbnails.high?.url ||
                    snippet.thumbnails.default?.url,
      duration: duration,
      uploadDate: snippet.publishedAt,
      chapters: chapters,
    };
  } catch (error) {
    console.error(`❌ Error al obtener info del video ${videoId}:`, error.message);
    return null;
  }
}

// Parsear frontmatter YAML
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: '', body: content, hasVideo: false };
  }

  // Añadir \n para que el último campo del frontmatter siempre sea capturable por el regex
  const frontmatter = match[1] + '\n';
  const body = content.slice(match[0].length);
  
  // Check si ya tiene video con datos reales (no solo el campo vacío)
  const hasVideoKey = /^video:/m.test(frontmatter);
  const hasEmbedUrl = hasVideoKey && /embedUrl:\s*".+"/m.test(frontmatter);
  const hasBadDuration = hasVideoKey && /duration:\s*"undefined"/m.test(frontmatter);
  // Si tiene embedUrl pero la duración es "undefined", necesita re-procesarse
  const hasVideoData = hasEmbedUrl && !hasBadDuration;

  return { frontmatter, body, hasVideo: hasVideoData, hasEmptyVideo: hasVideoKey && !hasVideoData };
}

// Generar YAML para el objeto video
function generateVideoYaml(videoInfo, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = `${spaces}video:\n`;
  yaml += `${spaces}  embedUrl: "${videoInfo.embedUrl}"\n`;
  yaml += `${spaces}  thumbnailUrl: "${videoInfo.thumbnailUrl}"\n`;
  if (videoInfo.duration) {
    yaml += `${spaces}  duration: "${videoInfo.duration}"\n`;
  }
  yaml += `${spaces}  uploadDate: "${videoInfo.uploadDate}"\n`;
  
  if (videoInfo.chapters && videoInfo.chapters.length > 0) {
    yaml += `${spaces}  chapters:\n`;
    for (const chapter of videoInfo.chapters) {
      // Escapar comillas dobles en el nombre del capítulo
      const safeName = chapter.name.replace(/"/g, '\\"');
      yaml += `${spaces}    - name: "${safeName}"\n`;
      yaml += `${spaces}      startOffset: ${chapter.startOffset}\n`;
      yaml += `${spaces}      endOffset: ${chapter.endOffset}\n`;
    }
  }
  
  return yaml;
}

// Procesar un archivo de blog
async function processPostFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parsear frontmatter
  const { frontmatter, body, hasVideo, hasEmptyVideo } = parseFrontmatter(content);
  
  if (!frontmatter) {
    console.log(`⚠️  ${fileName}: No se encontró frontmatter válido`);
    return;
  }

  // Si ya tiene video completo, saltar
  if (hasVideo) {
    console.log(`✅ ${fileName}: Ya tiene campo video configurado`);
    return;
  }

  // Buscar video ID en el contenido
  const videoId = extractVideoId(body);
  
  if (!videoId) {
    console.log(`⏭️  ${fileName}: No se encontró enlace de YouTube`);
    return;
  }

  console.log(`🔍 ${fileName}: Encontrado video ID: ${videoId}`);

  // Obtener información del video
  const videoInfo = await getVideoInfo(videoId);
  
  if (!videoInfo) {
    console.log(`❌ ${fileName}: No se pudo obtener información del video`);
    return;
  }

  // Generar nuevo frontmatter con campo video
  const videoYaml = generateVideoYaml(videoInfo);
  let newFrontmatter;

  if (hasEmptyVideo) {
    // Reemplazar el bloque video completo (incluyendo líneas indentadas anidadas)
    newFrontmatter = frontmatter.replace(
      /^video:\n(?:[ \t]+.*\n)*/m,
      videoYaml
    );
    console.log(`🔄 ${fileName}: Reemplazando campo video incompleto`);
  } else {
    // Añadir campo video nuevo (frontmatter ya termina en \n)
    newFrontmatter = `${frontmatter}${videoYaml}`;
  }

  const newContent = `---\n${newFrontmatter}---${body}`;

  // Guardar archivo
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ ${fileName}: Video SEO agregado exitosamente`);
  console.log(`   Título: ${videoInfo.title}`);
  console.log(`   Duración: ${videoInfo.duration}`);
  console.log(`   Capítulos: ${videoInfo.chapters.length > 0 ? videoInfo.chapters.length : 'No encontrados en la descripción'}`);
  console.log('');
}

// Procesar todos los posts
async function processAllPosts() {
  console.log('🚀 Iniciando procesamiento de posts...\n');

  if (!API_KEY) {
    console.error('❌ Error: No se encontró API_KEY en el archivo .env');
    process.exit(1);
  }

  const files = fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
    .map(file => path.join(BLOG_DIR, file));

  console.log(`📝 Se encontraron ${files.length} posts\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let added = 0;

  for (const file of files) {
    try {
      const beforeSize = fs.statSync(file).size;
      await processPostFile(file);
      const afterSize = fs.statSync(file).size;
      
      processed++;
      
      if (afterSize > beforeSize) {
        added++;
      } else {
        skipped++;
      }
      
      // Pequeña pausa para evitar rate limiting de la API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error procesando ${path.basename(file)}:`, error.message);
      errors++;
    }
  }

  console.log('\n======================');
  console.log('📊 RESUMEN');
  console.log('======================');
  console.log(`✅ Posts procesados: ${processed}`);
  console.log(`➕ Videos agregados: ${added}`);
  console.log(`⏭️  Posts omitidos: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log('======================\n');
}

// Ejecutar
processAllPosts().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
