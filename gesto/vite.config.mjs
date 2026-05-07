// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import Fonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    VueRouter(),
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
      // FIX: Traiem mediapipe de exclude perquè Vite el pugui bundlejar correctament
      // '@mediapipe/tasks-vision',  <-- eliminat
    ],
    // FIX: Forcem que TF i MediaPipe s'optimitzin junts per evitar col·lisions de backend
    include: [
      '@tensorflow/tfjs',
      '@mediapipe/tasks-vision',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    allowedHosts: ['gestoo.dam.inspedralbes.cat'],
    port: 3000,
    proxy: {
      // Redirigeix totes les crides /api al backend (port 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
    watch: {
      // Ignorem carpetes pesades que no canvien mai (com el venv de Python)
      // per evitar l'error ENOSPC (límit de watchers del sistema)
      ignored: ['**/public/entrenament_signes/venv/**']
    }
  },
})