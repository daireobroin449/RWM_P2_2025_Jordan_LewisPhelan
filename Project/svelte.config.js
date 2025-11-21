// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // keep if your deployment requires SPA fallback
      fallback: 'index.html'
    }),
    paths: {
      // EXACT subpath folder name provided 
      base: '/Team_2'
    }
  }
};

export default config;
