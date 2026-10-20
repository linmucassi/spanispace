import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PROVINCES } from '@/lib/services/config';
import { fetchProviderCards, fetchServiceCategories, type ServiceCategory } from '@/lib/services/publicData';
import ProviderCardView from './ProviderCardView';

// Shared by /services and /services/[category]. Plain GET form for the
// filters, so it works without JavaScript and every filtered view is a
// shareable URL.
export default async function ServicesBrowser({
  category,
  province,
  pay,
}: {
  category?: ServiceCategory;
  province?: string;
  pay?: 'cash' | 'online';
}) {
  const [categories, { cards, available }] = await Promise.all([
    fetchServiceCategories(),
    fetchProviderCards({ category: category?.slug, province, payment: pay }),
  ]);

  const filtered = !!(province || pay);
  const formAction = category ? `/services/${category.slug}` : '/services';

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="text-sm text-ink-500 mb-3" aria-label="Breadcrumb">
          <Link href="/services" className="hover:text-brand-600">Services</Link>
          {category && <> <span aria-hidden>/</span> <span className="text-ink-800">{category.name}</span></>}
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink-900">
          {category ? `${category.name} near you` : 'Hire trusted local help'}
        </h1>
        <p className="text-ink-500 mt-2 max-w-2xl">
          Every provider is ID-checked and police-cleared by Spanispace before they can take bookings.
          {category?.requires_qualification && ' This is a regulated trade, so providers listed here have also had their trade certificate checked.'}
        </p>

        <form action={formAction} method="get" className="mt-6 flex flex-col sm:flex-row gap-2 sm:items-end">
          {!category && (
            <label className="flex-1">
              <span className="block text-xs font-medium text-ink-500 mb-1">Service</span>
              <select name="category" defaultValue="" className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900">
                <option value="">All services</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
          )}
          <label className="flex-1">
            <span className="block text-xs font-medium text-ink-500 mb-1">Province</span>
            <select name="province" defaultValue={province ?? ''} className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900">
              <option value="">Anywhere in South Africa</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="flex-1">
            <span className="block text-xs font-medium text-ink-500 mb-1">Payment</span>
            <select name="pay" defaultValue={pay ?? ''} className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900">
              <option value="">Cash or online</option>
              <option value="cash">Accepts cash</option>
              <option value="online">Accepts online payment</option>
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Search
          </button>
        </form>

        {!category && (
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map((c) => (
              <Link key={c.slug} href={`/services/${c.slug}`} className="rounded-full border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:border-brand-500 hover:text-brand-700">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10">
          {cards.length > 0 ? (
            <>
              <p className="text-sm text-ink-500 mb-4">{cards.length} verified provider{cards.length === 1 ? '' : 's'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => <ProviderCardView key={card.id} card={card} />)}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-ink-200 px-6 py-12 text-center">
              <ShieldCheck className="h-8 w-8 text-brand-600 mx-auto" aria-hidden />
              <p className="font-semibold text-ink-900 mt-3">
                {available && filtered ? 'No providers match those filters yet' : 'Verified providers are on their way'}
              </p>
              <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
                {available && filtered
                  ? 'Try another province or payment option.'
                  : 'We are checking providers now and bookings open soon. Do you offer this service? Get verified and be one of the first.'}
              </p>
              <Link href="/register?as=services" className="inline-block mt-5 rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-bold text-ink-800 hover:border-brand-500">
                Offer your services
              </Link>
            </div>
          )}
        </div>

        <p className="text-xs text-ink-400 mt-12 max-w-3xl">
          Spanispace is a marketplace that connects you with independent service providers. Providers are not Spanispace
          employees. We check identity and police clearance at enrolment, but we don&apos;t guarantee the quality of a service.
          See the <Link href="/services/provider-agreement" className="underline">Service Provider Agreement</Link>.
        </p>
      </div>
    </div>
  );
}
