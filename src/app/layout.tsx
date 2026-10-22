import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amazon OmniGuard — Context-Aware Home Guardian (Argon-MCP)',
  description:
    'Amazon Global developer ecosystem bridge for Alexa+, Ring, Fire TV, and AWS Bedrock.',
  icons: {
    icon: '/favicon.ico',
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
