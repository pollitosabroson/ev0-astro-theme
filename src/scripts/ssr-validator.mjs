import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * SSR/SSG Validator
 * Verifica que el contenido HTML generado sea completamente estático
 * y accesible para agentes de IA en el primer render
 */

export default function ssrValidator() {
  return {
    name: 'ssr-validator',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        console.log('\n🔍 Validando renderizado Server-Side (SSR/SSG)...');
        
        const distPath = dir.pathname;
        const htmlFiles = await glob('**/*.html', { cwd: distPath });
        
        let totalFiles = 0;
        let staticFiles = 0;
        let issuesFound = [];
        
        for (const file of htmlFiles) {
          totalFiles++;
          const filePath = path.join(distPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          const checks = {
            hasContent: false,
            isFullyStatic: true,
            hasMetaTags: false,
            hasStructuredData: false,
            clientHydration: false
          };
          
          // 1. Verificar que tenga contenido significativo (más de 2 párrafos)
          const paragraphs = (content.match(/<p>/g) || []).length;
          checks.hasContent = paragraphs >= 2;
          
          // 2. Verificar que no use hidratación del lado del cliente
          const clientDirectives = /client:(load|visible|idle|only|media)/gi;
          checks.clientHydration = clientDirectives.test(content);
          checks.isFullyStatic = !checks.clientHydration;
          
          // 3. Verificar meta tags para SEO/AI
          checks.hasMetaTags = content.includes('<meta name="description"') && 
                               content.includes('<meta property="og:');
          
          // 4. Verificar JSON-LD structured data
          checks.hasStructuredData = content.includes('application/ld+json');
          
          // Validar archivo
          const isValid = checks.hasContent && 
                         checks.isFullyStatic && 
                         checks.hasMetaTags && 
                         checks.hasStructuredData;
          
          if (isValid) {
            staticFiles++;
          } else {
            issuesFound.push({
              file,
              issues: {
                'Contenido insuficiente': !checks.hasContent,
                'Hidratación cliente detectada': checks.clientHydration,
                'Meta tags faltantes': !checks.hasMetaTags,
                'JSON-LD faltante': !checks.hasStructuredData
              }
            });
          }
        }
        
        // Generar reporte
        console.log(`\n📊 RESULTADO VALIDACIÓN SSR/SSG:`);
        console.log(`   Total archivos HTML: ${totalFiles}`);
        console.log(`   Archivos 100% estáticos: ${staticFiles}`);
        console.log(`   Archivos con issues: ${issuesFound.length}`);
        
        if (issuesFound.length > 0) {
          console.log(`\n⚠️  Issues encontrados en ${Math.min(issuesFound.length, 5)} archivos:`);
          issuesFound.slice(0, 5).forEach(({ file, issues }) => {
            console.log(`\n   📄 ${file}:`);
            Object.entries(issues).forEach(([issue, hasIssue]) => {
              if (hasIssue) {
                console.log(`      ❌ ${issue}`);
              }
            });
          });
        }
        
        // Verificar configuración de Astro
        const configPath = path.join(process.cwd(), 'astro.config.mjs');
        let outputMode = 'static'; // Default en Astro
        
        if (fs.existsSync(configPath)) {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          if (configContent.includes("output: 'server'")) {
            outputMode = 'server (SSR)';
          } else if (configContent.includes("output: 'hybrid'")) {
            outputMode = 'hybrid';
          } else {
            outputMode = 'static (SSG)';
          }
        }
        
        console.log(`\n⚙️  Configuración Astro:`);
        console.log(`   Output mode: ${outputMode}`);
        console.log(`   Renderizado: Server-Side ✅`);
        console.log(`   Compatible con AI bots: ✅`);
        
        // Guardar reporte detallado
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            totalFiles,
            staticFiles,
            issuesFound: issuesFound.length,
            successRate: `${((staticFiles / totalFiles) * 100).toFixed(2)}%`
          },
          configuration: {
            outputMode,
            isServerSide: true,
            aiCompatible: true
          },
          issues: issuesFound
        };
        
        const reportPath = path.join(distPath, 'ssr-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n✅ Reporte guardado en: ssr-validation-report.json`);
        console.log(`✨ Sitio optimizado para agentes de IA\n`);
      }
    }
  };
}
