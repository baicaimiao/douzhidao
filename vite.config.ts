import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GOOGLE_API_KEY || env.GEMINI_API_KEY;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // 👇👇👇 核心修改：允许所有域名访问（解决 Host blocked 报错）
        allowedHosts: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.GOOGLE_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
