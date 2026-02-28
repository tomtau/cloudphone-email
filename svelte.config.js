import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Needed for routing on GitHub Pages
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
            base: process.env.BASE_PATH || '',
        },
		serviceWorker: {
			register: false,
		}
	}
};

export default config;
