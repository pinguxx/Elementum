import type { Metadata } from 'next';
import { ClientElementRegistration } from './client-elements';

export const metadata: Metadata = {
  title: 'Next.js + Elementum DSD SSR',
  description: 'Zero-CLS Declarative Shadow DOM SSR with Elementum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <ClientElementRegistration />
        {children}
      </body>
    </html>
  );
}
