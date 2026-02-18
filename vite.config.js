import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [],
  root: './',
  publicDir: false, // publicディレクトリを使わない
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          // CSSファイルを css/styles.css に出力
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name].css';
          }
          // 画像ファイルはimagesフォルダに
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|webp)$/.test(assetInfo.name)) {
            return 'images/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Sassのグローバル設定があればここに追加
      }
    }
  },
  server: {
    open: true,
    port: 3000
  }
});
