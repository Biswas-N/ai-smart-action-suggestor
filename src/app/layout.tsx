import type { Metadata } from 'next'
import './globals.css'


export const metadata: Metadata = {
  title: 'Smart Actions POC',
  description: 'Proof of concept for smart actions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
