import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 加载所有环境变量
    const env = loadEnv(mode, '.', '');
    
    // 优先读取 GOOGLE_API_KEY，如果没有再读 GEMINI_API_KEY
    const apiKey = env.GOOGLE_API_KEY || env.GEMINI_API_KEY;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 把拿到的密钥注入到代码里
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
