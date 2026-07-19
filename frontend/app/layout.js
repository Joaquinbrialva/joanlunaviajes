import { Fira_Code, Cormorant_Garamond, Syne, Nunito } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import HeroUIToastProvider from '@/components/ui/heroui-toast-provider';
import RootShell from '@/components/ui/root-shell';
import ErrorBoundary from '@/components/ui/error-boundary';

const jakarta = Nunito({
	variable: '--font-jakarta',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
	display: 'swap',
});

const fira = Fira_Code({
	variable: '--font-mono',
	subsets: ['latin'],
});

const cormorant = Cormorant_Garamond({
	variable: '--font-cormorant',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
	style: ['normal', 'italic'],
	display: 'swap',
});

const syne = Syne({
	variable: '--font-syne',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
	display: 'swap',
});

export const metadata = {
	title: { default: 'Joanluna Viajes', template: '%s | Joanluna Viajes' },
	description: 'Agencia de viajes especializada en paquetes turísticos. Encontrá tu próximo destino.',
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
	openGraph: {
		siteName: 'Joanluna Viajes',
		locale: 'es',
		type: 'website',
	},
	robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
	return (
		<html lang='es' suppressHydrationWarning>
			<body
				className={`${jakarta.variable} ${fira.variable} ${cormorant.variable} ${syne.variable} font-sans antialiased`}
			>
				<ThemeProvider attribute='class' defaultTheme='light' enableSystem>
					<ErrorBoundary>
						<RootShell>{children}</RootShell>
					</ErrorBoundary>
					<HeroUIToastProvider />
				</ThemeProvider>
			</body>
		</html>
	);
}
