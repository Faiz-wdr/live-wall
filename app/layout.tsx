import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiveWall — Audience Engagement Platform',
  description: 'A premium realtime audience engagement wall for events and arts festivals.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-background text-text selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
