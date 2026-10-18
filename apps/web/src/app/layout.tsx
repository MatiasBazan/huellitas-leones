import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito_Sans } from 'next/font/google';
import './globals.css';

const nunito = Nunito_Sans({ variable: '--font-nunito', subsets: ['latin'] });
const baloo = Baloo_2({ variable: '--font-baloo', subsets: ['latin'], weight: ['700', '800'] });

export const metadata: Metadata = {
  title: { default: 'Huellita Leones', template: '%s · Huellita Leones' },
  description: 'Mascotas perdidas, encontradas y en adopción en Leones, Córdoba.',
};

export const viewport: Viewport = {
  themeColor: '#E8590C',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={`${nunito.variable} ${baloo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
