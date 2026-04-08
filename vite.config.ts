import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const base = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/';
  
  return {
    base,
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'serve-root-logo',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/logo.png') {
              const fs = require('fs');
              const path = require('path');
              const logoPath = path.resolve(__dirname, 'logo.png');
              if (fs.existsSync(logoPath)) {
                res.setHeader('Content-Type', 'image/png');
                res.end(fs.readFileSync(logoPath));
                return;
              }
            }
            next();
          });
        }
      },
      viteStaticCopy({
        targets: [
          {
            src: 'logo.png',
            dest: '.'
          }
        ]
      }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        manifestFilename: 'manifest.json',
        filename: 'sw.js',
        includeAssets: ['logo.png'],
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        manifest: {
          name: 'Gestionale Busta Paga Colf',
          short_name: 'BustaPagaColf',
          description: 'Gestione buste paga e TFR per colf e badanti',
          theme_color: '#000000',
          background_color: '#f5f5f5',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
