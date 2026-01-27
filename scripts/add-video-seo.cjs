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

    return {
      title: snippet.title,
      description: snippet.description,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: snippet.thumbnails.maxres?.url || 
                    snippet.thumbnails.high?.url || 
                    snippet.thumbnails.default?.url,
      duration: contentDetails.duration,
      uploadDate: snippet.publishedAt,
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

  const frontmatter = match[1];
  const body = content.slice(match[0].length);
  
  // Check si ya tiene video
  const hasVideo = /^video:/m.test(frontmatter);
  
  return { frontmatter, body, hasVideo };
}

// Generar YAML para el objeto video
function generateVideoYaml(videoInfo, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = `${spaces}video:\n`;
  yaml += `${spaces}  embedUrl: "${videoInfo.embedUrl}"\n`;
  yaml += `${spaces}  thumbnailUrl: "${videoInfo.thumbnailUrl}"\n`;
  yaml += `${spaces}  duration: "${videoInfo.duration}"\n`;
  yaml += `${spaces}  uploadDate: "${videoInfo.uploadDate}"\n`;
  
  return yaml;
}

// Procesar un archivo de blog
async function processPostFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parsear frontmatter
  const { frontmatter, body, hasVideo } = parseFrontmatter(content);
  
  if (!frontmatter) {
    console.log(`⚠️  ${fileName}: No se encontró frontmatter válido`);
    return;
  }

  // Si ya tiene video, saltar
  if (hasVideo) {
    console.log(`✅ ${fileName}: Ya tiene campo video`);
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
  const newFrontmatter = `${frontmatter}\n${videoYaml}`;
  const newContent = `---\n${newFrontmatter}---${body}`;

  // Guardar archivo
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ ${fileName}: Video SEO agregado exitosamente`);
  console.log(`   Título: ${videoInfo.title}`);
  console.log(`   Duración: ${videoInfo.duration}`);
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
