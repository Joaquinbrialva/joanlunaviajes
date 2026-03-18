/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.pixabay.com',
			},
			{
				protocol: 'https',
				hostname: 'picsum.photos',
			},
			{
				protocol: 'https',
				hostname: 'content.airhex.com',
			},
			{
				protocol: 'https',
				hostname: '*.supabase.co',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
			},
		],
	},
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: `${BACKEND_URL}/api/:path*`,
			},
		];
	},
};

export default nextConfig;
