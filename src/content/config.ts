import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    categories: z.array(z.string()).default(['others']),
    tags: z.array(z.string()).default(['others']),
    authors: z.array(z.string()).default(['gndx']),
    // Campos opcionales para Video SEO (Schema.org VideoObject)
    video: z.object({
      embedUrl: z.string(), // URL del video embebido (ej: https://www.youtube.com/embed/ID)
      thumbnailUrl: z.string().optional(), // URL de la miniatura
      duration: z.string().optional(), // Duración en formato ISO 8601 (ej: PT12M30S)
      uploadDate: z.string().optional(), // Fecha de subida en formato ISO 8601
      chapters: z.array(z.object({
        name: z.string(), // Nombre del capítulo
        startOffset: z.number(), // Inicio en segundos
        endOffset: z.number(), // Fin en segundos
      })).optional(), // Key Moments del video
    }).optional(),
  }),
});

export const collections = { blog };
