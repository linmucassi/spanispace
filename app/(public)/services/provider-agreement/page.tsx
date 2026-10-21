import type { Metadata } from 'next';
import Link from 'next/link';
import { SERVICE_TERMS_VERSION, POLICE_CLEARANCE_VALID_MONTHS } from '@/lib/services/config';

export const metadata: Metadata = {
  title: 'Service Provider Agreement | Spanispace',
};

// Source of truth for the wording: docs/project-details.md §7.3, §7.7, §7.7a,
// §7.14. Bump SERVICE_TERMS_VERSION (lib/services/config.ts) whenever this
// text changes so existing providers are asked to re-accept. Pending attorney
// review -- see docs/project-details.md §8 (R2, R3, R4, R5).

const h2 = 'text-xl font-semibold text-ink-800 mb-3';
const p = 'text-ink-600 leading-relaxed';
const ul = 'list-disc list-inside text-ink-600 space-y-2 ml-2';

export default function ServiceProviderAgreementPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink-900 mb-2">Service Provider Agreement</h1>
        <p className="text-sm text-ink-500 mb-2">Version {SERVICE_TERMS_VERSION}</p>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-10">
          Spanispace Services is not yet live. This agreement is a draft that is being reviewed before launch, and you will be asked to accept the final version.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className={h2}>1. What this agreement covers</h2>
            <p className={p}>
              This agreement applies when you offer services (for example cleaning, laundry, painting, plumbing or gardening) to
              customers through Spanispace Services. It adds to our{' '}
              <Link href="/terms" className="text-brand-600 underline">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-brand-600 underline">Privacy Policy</Link>, which also apply.
            </p>
          </section>

          <section>
            <h2 className={h2}>2. Spanispace is a marketplace</h2>
            <p className={p}>
              Spanispace is an online marketplace that connects people who need a service with independent service providers.
              You are not an employee, agent or contractor of Spanispace or of your customers. Any agreement for a service,
              including its scope, price, quality, timing and payment, is made directly between you and the customer. Spanispace is
              not a party to that agreement.
            </p>
          </section>

          <section>
            <h2 className={h2}>3. Who can offer services</h2>
            <ul className={ul}>
              <li>You must be 18 or older and legally allowed to work in South Africa.</li>
              <li>You must provide true, current information about yourself, your skills and your prices.</li>
              <li>Regulated trades (such as electrical, gas, plumbing compliance work, pest control and security) need a valid registration or trade certificate for that category.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2}>4. Verification</h2>
            <p className={`${p} mb-3`}>Before your listing goes live, Spanispace checks:</p>
            <ul className={ul}>
              <li>your identity (SA ID, or a passport and work permit), with a selfie holding your ID;</li>
              <li>a SAPS Police Clearance Certificate, which is valid on Spanispace for {POLICE_CLEARANCE_VALID_MONTHS} months from its issue date;</li>
              <li>your proof of address; and</li>
              <li>trade certificates for regulated categories.</li>
            </ul>
            <p className={`${p} mt-3`}>
              A police clearance certificate contains criminal record information, which is special personal information under the
              Protection of Personal Information Act. By submitting it, you consent to Spanispace processing it only to verify you
              as a service provider. Only authorised Spanispace staff can see your documents. Customers see only your verification
              badge and the date it was checked. When your clearance expires, your listing is hidden until you upload a new one.
            </p>
          </section>

          <section>
            <h2 className={h2}>5. Fees and payments</h2>
            <ul className={ul}>
              <li>Customers pay Spanispace a <strong>R10 booking fee</strong> for each confirmed booking. It is separate from your service price and is always paid online. You never collect it.</li>
              <li>You choose how customers pay you for the service: cash only, online only, or cash or online.</li>
              <li><strong>Cash</strong> means physical money that the customer pays you directly.</li>
              <li><strong>Online</strong> means the customer pays through Spanispace when you both agree. Spanispace holds the money and pays it out to your verified bank account once the job is marked complete and confirmed by the customer, or 72 hours after you mark it complete if the customer does not respond or raise a dispute. The payment processing fee on the service price is deducted from your payout and shown to you before you agree an offer.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2}>6. Contact details and staying on Spanispace</h2>
            <ul className={ul}>
              <li>Do not share or ask for phone numbers, email addresses, links or social media handles before a booking is confirmed and paid. Spanispace automatically blocks messages that contain them.</li>
              <li>Once a booking is confirmed, both of you can see each other&apos;s verified phone number and the job address.</li>
              <li>Do not ask customers to book or pay you outside Spanispace to avoid the booking fee.</li>
              <li>Breaking these rules leads to a warning, then suspension, then removal from Spanispace.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2}>7. Cancellations and reliability</h2>
            <ul className={ul}>
              <li>If you cancel a paid booking or do not show up, the customer is refunded in full and you receive a reliability strike.</li>
              <li>If a customer cancels an online booking within 24 hours of the start, you receive a late-cancellation fee of 10% of the service price (minimum R50, maximum R200) from the money Spanispace holds.</li>
              <li>Three strikes within 90 days pause your listing until Spanispace reviews it. You can ask for a strike to be reviewed if there was a genuine emergency.</li>
            </ul>
            <p className={`${p} mt-3`}>The full cancellation policy is published before Spanispace Services launches.</p>
          </section>

          <section>
            <h2 className={h2}>8. Conduct and safety</h2>
            <ul className={ul}>
              <li>Treat customers and their property with respect, and do the work you agreed to do.</li>
              <li>Report any safety concern through the report button. If a crime takes place, report it to the South African Police Service (SAPS) immediately.</li>
              <li>Spanispace may suspend your listing immediately while it looks into a safety report.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2}>9. Limits of Spanispace&apos;s responsibility</h2>
            <p className={p}>
              Spanispace verifies a provider&apos;s identity and checks the police clearance certificate they submit at the time of
              enrolment. That verification is limited to the documents provided. It does not guarantee a provider&apos;s conduct,
              skills, honesty or the quality of their work. To the fullest extent permitted by law, Spanispace is not liable for the quality, safety, legality or outcome of any service, for any loss, damage or injury arising
              from it, or for any criminal or unlawful act by a provider or a customer. Nothing in this agreement limits any right
              you have under the Consumer Protection Act that cannot lawfully be limited.
            </p>
          </section>

          <section>
            <h2 className={h2}>10. Suspension and ending this agreement</h2>
            <p className={p}>
              You can switch your listing off at any time. Spanispace may suspend or remove your listing if you break this agreement,
              if your verification lapses, or if there is a safety concern. Bookings already confirmed are handled under the
              cancellation policy.
            </p>
          </section>

          <section>
            <h2 className={h2}>11. Changes</h2>
            <p className={p}>
              If this agreement changes, we will ask you to accept the new version before you can receive new bookings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
