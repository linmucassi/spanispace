
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spanispace | Skill-to-Job Bridge',
  description: 'The ultimate platform for fresh graduates and job hunters to bridge the gap between skills and careers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        {/* Mobile Persistent CTA */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
          <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-2xl shadow-indigo-200 border-2 border-indigo-400">
            Enroll For Training Now
          </button>
        </div>
      </body>
    </html>
  );
}
