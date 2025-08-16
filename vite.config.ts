// // vite.config.ts
// import { defineConfig } from 'vite';
// import { angular } from '@angular-devkit/build-angular/plugins/vite';

// export default defineConfig({
//   plugins: [angular()],
//   optimizeDeps: {
//     // ArcGIS ESM must NOT be prebundled by esbuild
//     exclude: ['@arcgis/core'],
//   },
//   ssr: {
//     // be safe if you ever run SSR
//     noExternal: ['@arcgis/core'],
//   },
// });
