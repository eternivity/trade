import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'TradeSim · Solana',
  description: 'Solana meme coin trading terminal',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0d1117',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: { background: '#0d1117', border: '1px solid rgba(99,179,237,0.25)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }
          }}
        />
      </body>
    </html>
  )
}
