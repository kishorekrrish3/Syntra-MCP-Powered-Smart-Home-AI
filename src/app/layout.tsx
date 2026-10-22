import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SYNTRA: MCP-Powered Smart Home AI — Powered by ATLAS-MCP',
  description:
    'Context-aware smart-home orchestration connecting IoT events, wearable memory, multimodal AI, and Fire TV through the Model Context Protocol.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'SYNTRA — Powered by ATLAS-MCP | Your Home. One Intelligent Network.',
    description:
      'Context-aware smart-home orchestration connecting IoT events, wearable memory, multimodal AI, and Fire TV through the Model Context Protocol.',
    siteName: 'SYNTRA Smart Home AI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-amazon-background_light text-amazon-text_main font-ember antialiased selection:bg-amazon-accent_amber selection:text-amazon-primary_ink">
        {children}
      </body>
    </html>
  );
}
