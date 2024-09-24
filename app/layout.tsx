import './globals.css'
import { Inter } from 'next/font/google'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration'
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Patient Visit Tracker',
  description: 'Track patient visits with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  if (!clientId) {
    console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in the environment variables.');
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={clientId}>
          <ServiceWorkerRegistration />
          {children}
        <SpeedInsights />
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}