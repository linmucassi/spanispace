import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ServicesBrowser from '@/components/services/ServicesBrowser';
import { PROVINCES } from '@/lib/services/config';
import { fetchServiceCategories } from '@/lib/services/publicData';

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = (await fetchServiceCategories()).find((c) => c.slug === slug);
  if (!category) return { title: 'Services | Spanispace' };
  return {
    title: `${category.name} | Spanispace Services`,
    description: `Find verified, police-cleared ${category.name.toLowerCase()} providers near you on Spanispace.`,
  };
}

export default async function ServiceCategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ province?: string; pay?: string }>;
}) {
  const [{ category: slug }, { province, pay }] = await Promise.all([params, searchParams]);
  const category = (await fetchServiceCategories()).find((c) => c.slug === slug);
  if (!category) notFound();
  return (
    <ServicesBrowser
      category={category}
      province={province && PROVINCES.includes(province) ? province : undefined}
      pay={pay === 'cash' || pay === 'online' ? pay : undefined}
    />
  );
}
