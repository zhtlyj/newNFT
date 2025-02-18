import {defineConfig} from "vite";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig({
	base: "./",
	server: {
		host: "0.0.0.0",
		port: 5177,
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api/, '/api')
			}
		}
	},
	css: {
		postcss: {
			plugins: [
				autoprefixer({
					overrideBrowserslist: [
						"Android 4.1",
						"iOS 7.1",
						"Chrome > 31",
						"ff > 31",
						"ie >= 8",
						"> 1%",
					]
				})
			]
		}
	}
});
