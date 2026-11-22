import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat all Elementum custom elements (<el-*>) as native custom elements
          isCustomElement: (tag) => tag.startsWith('el-'),
        },
      },
    }),
  ],
});
