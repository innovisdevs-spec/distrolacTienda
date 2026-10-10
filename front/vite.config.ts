import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// En dev: /api -> sistema Distrolac (Express en el puerto 4000)
//         /form-api -> backend propio de la tienda (nodemailer, puerto 4100)
// El directorio de salida de la build es 'dist' y el límite de tamaño de chunk es 2000 KB
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
      '/form-api': {
        target: 'http://127.0.0.1:4100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/form-api/, ''),
      },
    },
  },
});
