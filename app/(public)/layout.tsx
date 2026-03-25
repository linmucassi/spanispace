import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileCTA from '@/components/MobileCTA';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <MobileCTA />
    </>
  );
}
