import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Spanispace',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: 25 March 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              By accessing or using the Spanispace platform (&quot;Platform&quot;), you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use
              the Platform. These Terms constitute a legally binding agreement between you and
              Spanispace (Pty) Ltd (&quot;Spanispace&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), a company
              registered in the Republic of South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Description of Service</h2>
            <p className="text-slate-600 leading-relaxed">
              Spanispace is a talent and employment platform that connects job seekers with employers
              and provides professional development services. Our services include, but are not limited
              to: a vetted job board, skills training programmes and bootcamps, academic opportunity
              tracking, CV review and professional profile building, and event hosting. We act as an
              intermediary platform and do not guarantee employment outcomes or the suitability of any
              candidate or employer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">3. User Accounts</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              To access certain features of the Platform, you must create an account. When creating
              an account, you agree to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and update your information to keep it accurate and current.</li>
              <li>Maintain the security and confidentiality of your login credentials.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorised use of your account.</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or that
              have been inactive for an extended period. You may delete your account at any time by
              contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">4. User Conduct</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              You agree not to use the Platform to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Post false, misleading, or fraudulent job listings or applications.</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
              <li>Harass, threaten, or discriminate against other users.</li>
              <li>Collect or harvest personal information of other users without their consent.</li>
              <li>Upload or transmit viruses, malware, or other harmful code.</li>
              <li>Attempt to gain unauthorised access to our systems or other users' accounts.</li>
              <li>Use the Platform for any illegal purpose or in violation of any applicable law.</li>
              <li>Engage in any activity that disrupts or interferes with the proper functioning of the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Job Postings and Applications</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              <strong>For Employers:</strong> You are solely responsible for the accuracy and legality
              of job postings you submit. All job listings must comply with South African labour
              legislation, including the Employment Equity Act, the Basic Conditions of Employment Act,
              and the Labour Relations Act. Job postings must not discriminate on the basis of race,
              gender, disability, religion, or any other protected characteristic unless a genuine
              occupational requirement exists. We reserve the right to review, edit, or remove any
              job posting at our discretion.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For Candidates:</strong> You are responsible for the accuracy of information
              provided in your applications and profile. Submitting false qualifications, fabricated
              work experience, or misleading information may result in account termination.
              Spanispace does not guarantee that you will receive responses from employers or that
              any application will result in employment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Training and Events</h2>
            <p className="text-slate-600 leading-relaxed">
              Spanispace may offer training programmes, bootcamps, and events. Enrolment in these
              programmes may be subject to additional terms, fees, and availability. We reserve the
              right to modify, reschedule, or cancel any training programme or event. Where fees
              apply, our refund policy will be communicated at the time of enrolment. Completion of
              training programmes does not guarantee employment or certification unless explicitly
              stated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Intellectual Property</h2>
            <p className="text-slate-600 leading-relaxed">
              All content on the Platform, including but not limited to text, graphics, logos, icons,
              images, software, and design elements, is the property of Spanispace or its licensors
              and is protected by South African and international intellectual property laws. You may
              not reproduce, distribute, modify, or create derivative works from any content on the
              Platform without our prior written consent. By submitting content to the Platform (such
              as job postings or profile information), you grant us a non-exclusive, worldwide,
              royalty-free licence to use, display, and distribute that content in connection with
              the operation of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              To the maximum extent permitted by law, Spanispace shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Platform. This includes, without limitation, damages for loss of profits, data, or
              other intangible losses, even if we have been advised of the possibility of such damages.
              Our total liability for any claim arising from or related to these Terms shall not exceed
              the amount you have paid to us in the twelve (12) months preceding the claim. The
              Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any
              kind, whether express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Indemnification</h2>
            <p className="text-slate-600 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Spanispace, its directors, officers,
              employees, and agents from and against any claims, liabilities, damages, losses, and
              expenses (including reasonable legal fees) arising out of or in connection with your use
              of the Platform, your violation of these Terms, or your violation of any rights of a
              third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">10. Governing Law and Jurisdiction</h2>
            <p className="text-slate-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              Republic of South Africa. Any disputes arising from or related to these Terms or your
              use of the Platform shall be subject to the exclusive jurisdiction of the courts of the
              Republic of South Africa. The parties agree to first attempt to resolve any disputes
              through good-faith negotiation before pursuing formal legal proceedings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">11. Severability</h2>
            <p className="text-slate-600 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid by a court of
              competent jurisdiction, that provision shall be limited or eliminated to the minimum
              extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">12. Changes to Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of
              material changes by posting the updated Terms on the Platform and updating the
              &quot;Last updated&quot; date. Your continued use of the Platform after the effective date of
              any changes constitutes your acceptance of the revised Terms. If you do not agree to
              the updated Terms, you must stop using the Platform and close your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">13. Contact Information</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-3 bg-slate-50 rounded-lg p-4 text-slate-600 text-sm space-y-1">
              <p><strong>Spanispace (Pty) Ltd</strong></p>
              <p>Email: legal@spanispace.com</p>
              <p>South Africa</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
