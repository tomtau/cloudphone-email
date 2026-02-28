import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Needed for routing on GitHub Pages
		adapter: adapter({
			fallback: 'index.html'
		}),
		paths: {
            base: (process.env.NODE_ENV === 'production') ? '/cloudphone-email' : '',
        },
		serviceWorker: {
			register: false,
		}
	}
};

export default config;
