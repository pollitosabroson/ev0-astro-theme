import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import compressor from "astro-compressor";
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import { VitePWA } from 'vite-plugin-pwa';
import llmsGenerator from './src/scripts/llms-generator.mjs';
import jsonLdGenerator from './src/scripts/jsonld-generator.mjs';
import ariaAuditor from './src/scripts/aria-auditor.mjs';
import ssrValidator from './src/scripts/ssr-validator.mjs';

import { manifest } from './src/utils/manifest';

// https://astro.build/config
export default defineConfig({
  site: 'https://alejandrorosales.me/',
  trailingSlash: 'always',
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: 'material-theme-palenight',
      wrap: true,
    },
  },
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'material-theme-palenight',
        wrap: true,
      },
      drafts: true,
    }),
    compressor({ gzip: true, brotli: true }),
    sitemap({
      filter: (page) => !page.includes('/tags/'),
    }),
    tailwind(),
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/tags/', '/tags/*', '/admin/', '/private/', '/.well-known/', '/api/', '/temp/'],
        },
        {
          userAgent: 'GPTBot',
          allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/rss.xml'],
        },
        {
          userAgent: 'ClaudeBot',
          allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/rss.xml'],
        },
        {
          userAgent: 'CCBot',
          allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt'],
        },
        {
          userAgent: 'PerplexityBot',
          allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/rss.xml'],
        },
        {
          userAgent: 'Google-Extended',
          allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt'],
        },
        {
          userAgent: 'FacebookBot',
          allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt'],
        },
        {
          userAgent: 'Googlebot',
          allow: '/',
          crawlDelay: 1,
        },
        {
          userAgent: 'Bingbot',
          allow: '/',
          crawlDelay: 1,
        },
        {
          userAgent: 'AhrefsBot',
          disallow: '/',
        },
        {
          userAgent: 'MJ12bot',
          disallow: '/',
        },
        {
          userAgent: 'SemrushBot',
          disallow: '/',
        },
        {
          userAgent: 'BLEXBot',
          disallow: '/',
        },
      ],
      sitemap: true,
      host: 'alejandrorosales.me',
    }),
    llmsGenerator(),
    jsonLdGenerator(),
    ariaAuditor(),
    ssrValidator(),
  ],
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest,
        workbox: {
          globDirectory: 'dist',
          globPatterns: ['**/*.{js,css,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}'],
          navigateFallback: null,
        },
      }),
    ],
  },
});
