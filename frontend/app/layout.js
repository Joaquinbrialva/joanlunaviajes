import { Inter, Fira_Code, Cormorant_Garamond, Syne } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import HeroUIToastProvider from '@/components/ui/heroui-toast-provider';
import RootShell from '@/components/ui/root-shell';

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin'],
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
	title: 'Joan Luna Viajes',
	description: 'Agencia de viajes especializada en paquetes y destinos turísticos.',
};

export default function RootLayout({ children }) {
	return (
		<html lang='es' suppressHydrationWarning>
			<body
				className={`${inter.variable} ${fira.variable} ${cormorant.variable} ${syne.variable} font-sans antialiased`}
			>
				<ThemeProvider attribute='class' defaultTheme='light' enableSystem>
					<RootShell>{children}</RootShell>
					<HeroUIToastProvider />
				</ThemeProvider>
			</body>
		</html>
	);
}
