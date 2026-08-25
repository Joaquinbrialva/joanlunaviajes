/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig = {
	images: {
		qualities: [75, 85],
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
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'content.airhex.com',
			},
			{
				protocol: 'https',
				hostname: 'pics.avs.io',
			},
			{
				protocol: 'https',
				hostname: '*.supabase.co',
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
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
				],
			},
		];
	},
};

export default nextConfig;
