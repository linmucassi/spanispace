import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Spanispace',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-ink-500 mb-10">Last updated: 26 June 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">1. Introduction</h2>
            <p className="text-ink-600 leading-relaxed">
              Spanispace (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal information
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our talent and employment platform. We are a South
              African-based platform and comply with the Protection of Personal Information Act, 2013
              (POPIA) and other applicable data protection legislation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">2. Information We Collect</h2>
            <p className="text-ink-600 leading-relaxed mb-3">
              We collect information that you provide directly to us, as well as information that is
              generated automatically when you use our platform. This includes:
            </p>
            <ul className="list-disc list-inside text-ink-600 space-y-2 ml-2">
              <li>
                <strong>Account Information:</strong> Name, email address, phone number, password, and
                account type (candidate or employer).
              </li>
              <li>
                <strong>Profile Information:</strong> Location, professional summary, skills, work
                experience, education history, and profile photographs.
              </li>
              <li>
                <strong>Application Data:</strong> CVs, cover letters, and any documents you upload or
                submit when applying for positions through our platform.
              </li>
              <li>
                <strong>Job Posting Data:</strong> Company details, job descriptions, compensation
                information, and contact details submitted by employers.
              </li>
              <li>
                <strong>Training and Event Data:</strong> Enrolment records, course progress, event
                registrations, and completion certificates.
              </li>
              <li>
                <strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent on
                pages, and other diagnostic data collected automatically.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">3. How We Use Your Information</h2>
            <p className="text-ink-600 leading-relaxed mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-ink-600 space-y-2 ml-2">
              <li>To create and manage your account on our platform.</li>
              <li>To facilitate job applications and match candidates with employers.</li>
              <li>To provide training programmes, bootcamps, and academic opportunity tracking.</li>
              <li>To communicate with you about your account, applications, or services.</li>
              <li>To send you newsletters, job alerts, and platform updates (with your consent).</li>
              <li>To improve our platform, analyse usage trends, and develop new features.</li>
              <li>To comply with legal obligations and enforce our Terms of Service.</li>
              <li>To prevent fraud, abuse, and unauthorised access to our systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">4. Data Sharing and Disclosure</h2>
            <p className="text-ink-600 leading-relaxed mb-3">
              We do not sell your personal information. We may share your information in the following
              circumstances:
            </p>
            <ul className="list-disc list-inside text-ink-600 space-y-2 ml-2">
              <li>
                <strong>With Employers:</strong> When you apply for a job, your application details
                and profile information are shared with the relevant employer.
              </li>
              <li>
                <strong>Service Providers:</strong> We work with third-party service providers who
                assist us in operating our platform, including hosting, analytics, and email delivery
                services. These providers are contractually obligated to protect your data.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose your information if required by
                law, regulation, or legal process, or if we believe disclosure is necessary to protect
                the rights, property, or safety of Spanispace, our users, or others.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
                assets, your information may be transferred as part of that transaction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">5. Data Security</h2>
            <p className="text-ink-600 leading-relaxed">
              We implement appropriate technical and organisational measures to protect your personal
              information against unauthorised access, alteration, disclosure, or destruction. These
              measures include encryption of data in transit and at rest, access controls, regular
              security assessments, and secure data storage infrastructure. However, no method of
              transmission over the internet or electronic storage is completely secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">6. Data Retention</h2>
            <p className="text-ink-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to
              provide you with our services. If you close your account, we will delete or anonymise your
              personal information within 90 days, unless we are required to retain it for legal,
              regulatory, or legitimate business purposes. Job application records may be retained for
              up to 12 months after the position is filled or closed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">7. Your Rights Under POPIA</h2>
            <p className="text-ink-600 leading-relaxed mb-3">
              Under the Protection of Personal Information Act (POPIA), you have the following rights
              regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-ink-600 space-y-2 ml-2">
              <li>
                <strong>Right of Access:</strong> You may request confirmation of whether we hold your
                personal information and request access to it.
              </li>
              <li>
                <strong>Right to Correction:</strong> You may request that we correct or update
                inaccurate or incomplete personal information.
              </li>
              <li>
                <strong>Right to Deletion:</strong> You may request that we delete your personal
                information, subject to legal retention requirements.
              </li>
              <li>
                <strong>Right to Object:</strong> You may object to the processing of your personal
                information for direct marketing purposes.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you
                may withdraw your consent at any time.
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> You may lodge a complaint with the
                Information Regulator of South Africa if you believe your rights have been infringed.
              </li>
            </ul>
            <p className="text-ink-600 leading-relaxed mt-3">
              To exercise any of these rights, please contact us using the details provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">8. Cookies and Tracking</h2>
            <p className="text-ink-600 leading-relaxed">
              We use only the essential cookies the platform needs to work, such as keeping you
              signed in and remembering whether you chose English or isiZulu. These are stored on
              your device and cannot be switched off without breaking the site. We do not run
              advertising or third party analytics cookies, and we do not track you across other
              websites. If that ever changes we will ask for your consent first and update this
              notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">9. Third-Party Links</h2>
            <p className="text-ink-600 leading-relaxed">
              Our platform may contain links to third-party websites, services, or applications that
              are not operated by us. We are not responsible for the privacy practices of these third
              parties. We encourage you to review the privacy policies of any third-party services
              before providing them with your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">10. AI CV Audit and Autofill Features</h2>
            <p className="text-ink-600 leading-relaxed mb-3">
              Spanispace offers optional AI-driven features that read an uploaded CV: the CV Audit
              (feedback and a score), CV autofill (pre-filling your profile from your CV), and the
              professional-profile builder (turning your work history into a summary). When you use
              any of these features:
            </p>
            <ul className="list-disc list-inside text-ink-600 space-y-2 ml-2">
              <li>
                Your uploaded CV, or the work history on your profile, is transmitted to Google&apos;s
                Gemini API for processing. Google&apos;s own Privacy Policy governs how they handle
                this data.
              </li>
              <li>
                A CV you upload for these features is stored the same way as any other document in
                your My Documents section — see Section 11, Document Storage — not deleted after the
                AI request completes.
              </li>
              <li>
                The audit and any autofilled details are provided for guidance purposes only, do not
                constitute professional career advice, and do not guarantee any employment outcome.
                Autofilled and generated details are always shown to you for review before anything
                is saved to your profile.
              </li>
              <li>
                You should not include sensitive personal information such as your national ID number,
                bank details, or medical history on a CV submitted for analysis.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">11. Document Storage</h2>
            <p className="text-ink-600 leading-relaxed">
              Candidates may upload documents (such as CVs and certificates) to their Spanispace
              profile through the My Documents section. These files are stored securely using
              Supabase Storage with access controls that limit visibility to you and authorised
              Spanispace administrators. Uploaded documents are retained for as long as your account
              is active and are deleted within 90 days of account closure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">12. Scraped Job Listings</h2>
            <p className="text-ink-600 leading-relaxed">
              Some job listings displayed on Spanispace are sourced automatically from third-party
              job boards (including RemoteOK, Remotive, and Adzuna) via automated scraping. These
              listings are curated and filtered before display but originate from external sources.
              Spanispace does not collect any personal information through this process, we only
              retrieve publicly available job posting data such as job title, description, location,
              and application link. We are not responsible for the accuracy or completeness of
              third-party job listings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">13. Changes to This Policy</h2>
            <p className="text-ink-600 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or applicable law. We will notify you of any material changes by posting the updated
              policy on our platform and updating the &quot;Last updated&quot; date. Your continued use of the
              platform after any changes constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-800 mb-3">14. Contact Information</h2>
            <p className="text-ink-600 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your data
              protection rights, please contact us at:
            </p>
            <div className="mt-3 bg-ink-50 rounded-lg p-4 text-ink-600 text-sm space-y-1">
              <p><strong>Spanispace (Pty) Ltd</strong></p>
              <p>Information Officer: reachable at the address below</p>
              <p>Email: privacy@spanispace.com</p>
              <p>South Africa</p>
            </div>
            <p className="text-ink-500 leading-relaxed mt-3 text-sm">
              Under POPIA our Information Officer is responsible for how your personal information is
              handled and for responding to any request or complaint. You may also lodge a complaint
              with the Information Regulator of South Africa at{' '}
              <a
                href="https://inforegulator.org.za"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                inforegulator.org.za
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-ink-200">
          <Link
            href="/"
            className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
