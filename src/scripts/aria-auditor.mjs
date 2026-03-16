import fs from 'fs';
import path from 'path';

export default function ariaAuditor() {
  return {
    name: 'aria-auditor',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        try {
          // Dynamic imports to avoid ESM/CommonJS conflicts during config evaluation
          const { glob } = await import('glob');
          const { JSDOM } = await import('jsdom');
          
          console.log('♿ Auditando y mejorando accesibilidad ARIA...');
          
          // Buscar todos los archivos HTML generados
          const htmlFiles = await glob('**/*.html', {
            cwd: dir.pathname,
            absolute: true
          });
          
          let totalIssues = 0;
          let totalFixes = 0;
          const ariaReport = {
            files: [],
            summary: {
              totalFiles: htmlFiles.length,
              filesWithIssues: 0,
              totalIssues: 0,
              totalFixes: 0
            },
            issues: []
          };
          
          for (const file of htmlFiles) {
            try {
              const html = fs.readFileSync(file, 'utf-8');
              const dom = new JSDOM(html);
              const document = dom.window.document;
              
              const fileIssues = [];
              const fileFixes = [];
              
              // Auditar y mejorar elementos
              auditAndFixInputs(document, fileIssues, fileFixes);
              auditAndFixButtons(document, fileIssues, fileFixes);
              auditAndFixForms(document, fileIssues, fileFixes);
              auditAndFixLinks(document, fileIssues, fileFixes);
              auditAndFixImages(document, fileIssues, fileFixes);
              auditAndFixHeadings(document, fileIssues, fileFixes);
              auditAndFixLandmarks(document, fileIssues, fileFixes);
              auditAndFixInteractiveElements(document, fileIssues, fileFixes);
              
              // Si hubo cambios, guardar el archivo
              if (fileFixes.length > 0) {
                const updatedHTML = dom.serialize();
                fs.writeFileSync(file, updatedHTML, 'utf-8');
                
                ariaReport.files.push({
                  file: path.relative(dir.pathname, file),
                  issues: fileIssues,
                  fixes: fileFixes.length
                });
                
                ariaReport.summary.filesWithIssues++;
              }
              
              totalIssues += fileIssues.length;
              totalFixes += fileFixes.length;
              
            } catch (error) {
              console.warn(`Error procesando ${file}:`, error.message);
            }
          }
          
          ariaReport.summary.totalIssues = totalIssues;
          ariaReport.summary.totalFixes = totalFixes;
          
          // Guardar reporte de auditoría
          fs.writeFileSync(
            path.join(dir.pathname, 'aria-audit-report.json'),
            JSON.stringify(ariaReport, null, 2)
          );
          
          console.log(`✅ Auditoría ARIA completada`);
          console.log(`📊 Archivos procesados: ${htmlFiles.length}`);
          console.log(`⚠️  Issues encontrados: ${totalIssues}`);
          console.log(`🔧 Correcciones aplicadas: ${totalFixes}`);
          
        } catch (error) {
          console.error('❌ Error en auditoría ARIA:', error);
        }
      }
    }
  };
}

// Auditar y mejorar inputs
function auditAndFixInputs(document, issues, fixes) {
  const inputs = document.querySelectorAll('input');
  
  inputs.forEach((input, index) => {
    const type = input.getAttribute('type') || 'text';
    const id = input.getAttribute('id');
    const name = input.getAttribute('name');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    const placeholder = input.getAttribute('placeholder');
    
    // Verificar si tiene label asociado
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    
    if (!ariaLabel && !ariaLabelledBy && !hasLabel) {
      issues.push({
        element: 'input',
        type: type,
        issue: 'Sin aria-label, aria-labelledby o label asociado'
      });
      
      // Generar aria-label descriptivo
      let generatedLabel = '';
      
      if (placeholder) {
        generatedLabel = placeholder;
      } else if (name) {
        generatedLabel = formatLabel(name);
      } else if (type === 'search') {
        generatedLabel = 'Buscar en el sitio';
      } else if (type === 'email') {
        generatedLabel = 'Correo electrónico';
      } else if (type === 'password') {
        generatedLabel = 'Contraseña';
      } else if (type === 'tel') {
        generatedLabel = 'Número de teléfono';
      } else if (type === 'number') {
        generatedLabel = 'Valor numérico';
      } else if (type === 'date') {
        generatedLabel = 'Fecha';
      } else if (type === 'checkbox') {
        generatedLabel = 'Opción de selección';
      } else if (type === 'radio') {
        generatedLabel = 'Opción de radio';
      } else {
        generatedLabel = `Campo de entrada ${index + 1}`;
      }
      
      input.setAttribute('aria-label', generatedLabel);
      
      // Añadir role si es necesario
      if (type === 'search') {
        input.setAttribute('role', 'searchbox');
      }
      
      fixes.push({
        element: 'input',
        action: `Añadido aria-label: "${generatedLabel}"`
      });
    }
    
    // Añadir aria-required si el campo es requerido
    if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
      input.setAttribute('aria-required', 'true');
      fixes.push({
        element: 'input',
        action: 'Añadido aria-required="true"'
      });
    }
    
    // Añadir aria-invalid para validación
    if (!input.hasAttribute('aria-invalid')) {
      input.setAttribute('aria-invalid', 'false');
    }
  });
}

// Auditar y mejorar botones
function auditAndFixButtons(document, issues, fixes) {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach((button, index) => {
    const ariaLabel = button.getAttribute('aria-label');
    const textContent = button.textContent.trim();
    const hasIcon = button.querySelector('svg, img, i');
    const classes = button.className || '';
    
    if (!ariaLabel && (!textContent || textContent.length === 0) && hasIcon) {
      issues.push({
        element: 'button',
        issue: 'Botón con icono sin aria-label'
      });
      
      // Generar aria-label basado en el contexto
      let generatedLabel = '';
      
      if (classes.includes('dark') || classes.includes('theme')) {
        generatedLabel = 'Cambiar tema de color';
      } else if (classes.includes('menu') || classes.includes('hamburger')) {
        generatedLabel = 'Abrir menú de navegación';
      } else if (classes.includes('close')) {
        generatedLabel = 'Cerrar';
      } else if (classes.includes('search')) {
        generatedLabel = 'Buscar';
      } else if (classes.includes('share')) {
        generatedLabel = 'Compartir';
      } else if (classes.includes('submit')) {
        generatedLabel = 'Enviar formulario';
      } else {
        generatedLabel = `Botón de acción ${index + 1}`;
      }
      
      button.setAttribute('aria-label', generatedLabel);
      fixes.push({
        element: 'button',
        action: `Añadido aria-label: "${generatedLabel}"`
      });
    }
    
    // Verificar aria-pressed para botones de toggle
    if (classes.includes('toggle') && !button.hasAttribute('aria-pressed')) {
      button.setAttribute('aria-pressed', 'false');
      fixes.push({
        element: 'button',
        action: 'Añadido aria-pressed="false" para toggle'
      });
    }
  });
}

// Auditar y mejorar formularios
function auditAndFixForms(document, issues, fixes) {
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form, index) => {
    const ariaLabel = form.getAttribute('aria-label');
    const ariaLabelledBy = form.getAttribute('aria-labelledby');
    
    if (!ariaLabel && !ariaLabelledBy) {
      issues.push({
        element: 'form',
        issue: 'Formulario sin aria-label'
      });
      
      // Buscar heading dentro del form
      const heading = form.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && heading.textContent) {
        const headingId = heading.getAttribute('id') || `form-heading-${index}`;
        heading.setAttribute('id', headingId);
        form.setAttribute('aria-labelledby', headingId);
        
        fixes.push({
          element: 'form',
          action: `Añadido aria-labelledby="${headingId}"`
        });
      } else {
        const action = form.getAttribute('action');
        const generatedLabel = action ? 
          `Formulario para ${action}` : 
          `Formulario ${index + 1}`;
        
        form.setAttribute('aria-label', generatedLabel);
        fixes.push({
          element: 'form',
          action: `Añadido aria-label: "${generatedLabel}"`
        });
      }
    }
  });
}

// Auditar y mejorar enlaces
function auditAndFixLinks(document, issues, fixes) {
  const links = document.querySelectorAll('a');
  
  links.forEach((link, index) => {
    const href = link.getAttribute('href');
    const ariaLabel = link.getAttribute('aria-label');
    const textContent = link.textContent.trim();
    const hasIcon = link.querySelector('svg, img, i');
    
    // Enlaces sin texto pero con icono
    if (!ariaLabel && (!textContent || textContent.length === 0) && hasIcon) {
      issues.push({
        element: 'a',
        issue: 'Enlace con icono sin aria-label',
        href
      });
      
      let generatedLabel = '';
      
      if (href) {
        if (href.includes('youtube')) generatedLabel = 'Ver en YouTube';
        else if (href.includes('twitter') || href.includes('x.com')) generatedLabel = 'Seguir en Twitter/X';
        else if (href.includes('linkedin')) generatedLabel = 'Perfil de LinkedIn';
        else if (href.includes('github')) generatedLabel = 'Repositorio en GitHub';
        else if (href.includes('instagram')) generatedLabel = 'Perfil de Instagram';
        else if (href.includes('facebook')) generatedLabel = 'Página de Facebook';
        else if (href.includes('mailto:')) generatedLabel = 'Enviar correo electrónico';
        else if (href === '#') generatedLabel = 'Enlace de navegación';
        else generatedLabel = `Ir a ${href}`;
      } else {
        generatedLabel = `Enlace ${index + 1}`;
      }
      
      link.setAttribute('aria-label', generatedLabel);
      fixes.push({
        element: 'a',
        action: `Añadido aria-label: "${generatedLabel}"`
      });
    }
    
    // Enlaces externos
    if (href && (href.startsWith('http') && !href.includes(document.location?.hostname || 'alejandrorosales.me'))) {
      if (!link.hasAttribute('rel')) {
        link.setAttribute('rel', 'noopener noreferrer');
      }
      
      if (!ariaLabel || !ariaLabel.includes('externa')) {
        const currentLabel = ariaLabel || textContent || 'enlace';
        link.setAttribute('aria-label', `${currentLabel} (abre en ventana nueva)`);
        fixes.push({
          element: 'a',
          action: 'Añadido indicación de enlace externo'
        });
      }
    }
  });
}

// Auditar y mejorar imágenes
function auditAndFixImages(document, issues, fixes) {
  const images = document.querySelectorAll('img');
  
  images.forEach((img, index) => {
    const alt = img.getAttribute('alt');
    const src = img.getAttribute('src');
    const role = img.getAttribute('role');
    
    if (alt === null || alt === undefined) {
      issues.push({
        element: 'img',
        issue: 'Imagen sin atributo alt',
        src
      });
      
      // Generar alt descriptivo basado en src
      let generatedAlt = '';
      
      if (src) {
        const filename = path.basename(src, path.extname(src));
        generatedAlt = formatLabel(filename);
      } else {
        generatedAlt = 'Imagen decorativa';
      }
      
      img.setAttribute('alt', generatedAlt);
      fixes.push({
        element: 'img',
        action: `Añadido alt: "${generatedAlt}"`
      });
    } else if (alt === '' && !role) {
      // Imagen decorativa
      img.setAttribute('role', 'presentation');
      img.setAttribute('aria-hidden', 'true');
      fixes.push({
        element: 'img',
        action: 'Marcada como decorativa'
      });
    }
  });
}

// Auditar headings
function auditAndFixHeadings(document, issues, fixes) {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1));
    
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        element: heading.tagName.toLowerCase(),
        issue: `Salto en jerarquía de headings: ${previousLevel} a ${level}`
      });
    }
    
    previousLevel = level;
  });
}

// Auditar landmarks
function auditAndFixLandmarks(document, issues, fixes) {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  
  if (main && !main.hasAttribute('role') && !main.hasAttribute('aria-label')) {
    main.setAttribute('role', 'main');
    main.setAttribute('aria-label', 'Contenido principal');
    fixes.push({
      element: 'main',
      action: 'Añadido role y aria-label'
    });
  }
  
  if (nav && !nav.hasAttribute('aria-label')) {
    nav.setAttribute('aria-label', 'Navegación principal');
    fixes.push({
      element: 'nav',
      action: 'Añadido aria-label'
    });
  }
  
  if (header && !header.hasAttribute('role')) {
    header.setAttribute('role', 'banner');
    fixes.push({
      element: 'header',
      action: 'Añadido role="banner"'
    });
  }
  
  if (footer && !footer.hasAttribute('role')) {
    footer.setAttribute('role', 'contentinfo');
    fixes.push({
      element: 'footer',
      action: 'Añadido role="contentinfo"'
    });
  }
}

// Auditar elementos interactivos
function auditAndFixInteractiveElements(document, issues, fixes) {
  // Divs y spans clickeables
  const clickables = document.querySelectorAll('[onclick], [onkeydown], [onkeyup]');
  
  clickables.forEach((element) => {
    if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
      if (!element.hasAttribute('role')) {
        element.setAttribute('role', 'button');
        fixes.push({
          element: element.tagName.toLowerCase(),
          action: 'Añadido role="button" a elemento clickeable'
        });
      }
      
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
        fixes.push({
          element: element.tagName.toLowerCase(),
          action: 'Añadido tabindex="0"'
        });
      }
    }
  });
}

// Utilidad para formatear labels
function formatLabel(text) {
  return text
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}