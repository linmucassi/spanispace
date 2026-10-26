import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PROVINCES } from '@/lib/services/config';
import { fetchProviderCards, fetchServiceCategories, type ServiceCategory } from '@/lib/services/publicData';
import ProviderCardView from './ProviderCardView';
import Select from '@/components/ui/Select';

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
  // Always /services: it redirects ?category=x to /services/x (keeping the
  // other filters), so switching service from a category page works too.
  const formAction = '/piecejobs';

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="text-sm text-ink-500 mb-3" aria-label="Breadcrumb">
          <Link href="/piecejobs" className="hover:text-brand-600">PieceJobs</Link>
          {category && <> <span aria-hidden>/</span> <span className="text-ink-800">{category.name}</span></>}
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink-900">
          {category ? `${category.name} near you` : 'Hire trusted local help'}
        </h1>
        <p className="text-ink-500 mt-2 max-w-2xl">
          Every provider is ID-checked and police-cleared by Spanispace before they can take bookings.
          {category?.requires_qualification && ' This is a regulated trade, so providers listed here have also had their trade certificate checked.'}
        </p>

        {/* Each filter submits as soon as it's picked (submitOnChange), so
            there's no Search button to forget. */}
        <form action={formAction} method="get" className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {category ? (
            <Select
              label="Service"
              defaultValue={category.slug}
              submitOnChange
              name="category"
              options={categories.map((c) => ({ value: c.slug, label: c.name }))}
            />
          ) : (
            <Select
              label="Service"
              name="category"
              defaultValue=""
              submitOnChange
              options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
            />
          )}
          <Select
            label="Province"
            name="province"
            defaultValue={province ?? ''}
            submitOnChange
            options={[{ value: '', label: 'Anywhere in South Africa' }, ...PROVINCES.map((p) => ({ value: p, label: p }))]}
          />
          <Select
            label="Payment"
            name="pay"
            defaultValue={pay ?? ''}
            submitOnChange
            options={[
              { value: '', label: 'Cash or online' },
              { value: 'cash', label: 'Accepts cash' },
              { value: 'online', label: 'Accepts online payment' },
            ]}
          />
        </form>

        {!category && (
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map((c) => (
              <Link key={c.slug} href={`/piecejobs/${c.slug}`} className="rounded-full border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:border-brand-500 hover:text-brand-700">
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
          Providers are independent, not Spanispace employees. We check every provider&apos;s ID and police clearance
          before they go live. See the <Link href="/piecejobs/provider-agreement" className="underline">Service Provider Agreement</Link>.
        </p>
      </div>
    </div>
  );
}
