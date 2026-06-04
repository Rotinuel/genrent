import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'GenRent — Generator Marketplace',
  description: 'Rent generators near you. List yours. Earn money.',
  keywords: 'generator rental, power rental, backup power Nigeria',
  openGraph: {
    title: 'GenRent — Generator Marketplace',
    description: 'Rent generators near you.',
    type: 'website',
  },
}

export default async function RootLayout({ children }) {
  const user = await getCurrentUser().catch(() => null)

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider initialUser={user}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#f5f5f5',
                border: '1px solid #2e2e2e',
                borderRadius: '10px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#ff7d11', secondary: '#0a0a0a' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
