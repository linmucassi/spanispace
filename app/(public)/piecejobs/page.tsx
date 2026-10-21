import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ServicesBrowser from '@/components/services/ServicesBrowser';
import { PROVINCES } from '@/lib/services/config';

export const metadata: Metadata = {
  title: 'Hire trusted local help | Spanispace PieceJobs',
  description: 'Find verified, police-cleared cleaners, painters, plumbers, gardeners and more across South Africa.',
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; province?: string; pay?: string }>;
}) {
  const { category, province, pay } = await searchParams;
  // The category select on this page submits ?category=; send it to the
  // category's own URL so there's one canonical page per category.
  if (category && /^[a-z0-9-]+$/.test(category)) {
    const qs = new URLSearchParams();
    if (province) qs.set('province', province);
    if (pay) qs.set('pay', pay);
    redirect(`/piecejobs/${category}${qs.size ? `?${qs}` : ''}`);
  }
  return (
    <ServicesBrowser
      province={province && PROVINCES.includes(province) ? province : undefined}
      pay={pay === 'cash' || pay === 'online' ? pay : undefined}
    />
  );
}
