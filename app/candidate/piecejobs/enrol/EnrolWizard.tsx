'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { scanText, explainContactScan } from '@/lib/services/contactGuard';
import { parseSaId, ageOn } from '@/lib/services/saId';
import { twMerge } from 'tailwind-merge';
import {
  MIN_PROVIDER_AGE,
  PAYMENT_METHOD_LABELS,
  PROVIDER_DOC_LABELS,
  PROVINCES,
  UNIT_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
  requiredDocTypes,
  type PaymentMethods,
  type PricingUnit,
  type ProviderDocType,
  type ProviderStatus,
} from '@/lib/services/config';
import { Check, Loader2, Plus, Trash2, Upload, AlertTriangle, ShieldCheck } from 'lucide-react';
import Select from '@/components/ui/Select';

export type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  requires_qualification: boolean;
  qualification_hint: string | null;
  units: PricingUnit[];
};

type RateDraft = { label: string; unit: PricingUnit; price_rands: string; minimum_rands: string; notes: string };
type ServiceDraft = {
  category_id: string;
  years_experience: string;
  description: string;
  qualification_status?: 'pending' | 'approved' | 'rejected' | null;
  rates: RateDraft[];
};
type ProviderDocument = {
  id: string;
  doc_type: ProviderDocType;
  category_id: string | null;
  file_name: string;
  status: 'pending' | 'verified' | 'rejected';
  review_note: string | null;
  storage_path: string;
  created_at: string;
};

export type EnrolState = {
  providerId: string | null;
  status: ProviderStatus;
  verificationNote: string | null;
  profile: {
    headline: string;
    bio: string;
    province: string;
    city: string;
    suburb: string;
    travel_radius_km: number;
    payment_methods: PaymentMethods;
    availability: Record<string, boolean | string>;
  };
  idKind: 'sa_id' | 'passport' | null;
  hasDateOfBirth: boolean;
  services: ServiceDraft[];
  documents: ProviderDocument[];
};

const STEPS = ['Services & prices', 'Profile & area', 'Identity', 'Documents', 'Agreement'] as const;

const ACCEPTED_FILES = 'application/pdf,image/jpeg,image/png,image/webp,image/heic';

const inputClass =
  'block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white';

// Under a field: the validation error (red) once the person has tried to
// continue, otherwise a live contact-detail warning (amber) while typing.
function FieldNote({ error, value }: { error?: string; value?: string }) {
  if (error) return <p className="text-xs text-red-600 mt-1">{error}</p>;
  const scan = scanText(value ?? '');
  if (!scan.blocked) return null;
  return <p className="text-xs text-amber-700 mt-1">{explainContactScan(scan.reasons)}</p>;
}

const INVALID = 'border-red-400 focus:border-red-500 focus:ring-red-500';

export default function EnrolWizard({
  userId,
  categories,
  initial,
}: {
  userId: string;
  categories: CategoryOption[];
  initial: EnrolState;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState(initial.providerId);
  const [services, setServices] = useState<ServiceDraft[]>(initial.services);
  const [profile, setProfile] = useState(initial.profile);
  const [idKind, setIdKind] = useState<'sa_id' | 'passport' | null>(initial.idKind);
  const [saIdNumber, setSaIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [identitySaved, setIdentitySaved] = useState(initial.hasDateOfBirth);
  const [documents, setDocuments] = useState<ProviderDocument[]>(initial.documents);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  // Errors only show after the first "Save and continue" on a step, then
  // update live as fields are fixed.
  const [showErrors, setShowErrors] = useState(false);

  const locked = initial.status === 'pending';
  const identityLocked = initial.status === 'verified';
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  async function callApi(payload: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setError(null);
    setProblems([]);
    try {
      const res = await fetch('/api/services/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        if (Array.isArray(data.problems)) setProblems(data.problems);
        return false;
      }
      if (data.providerId) setProviderId(data.providerId);
      return true;
    } catch {
      setError('Could not reach Spanispace. Check your connection and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndNext() {
    // Nothing moves forward until this step is complete and valid. The API
    // re-checks everything; this is so problems are shown on the fields.
    const found = validateStep(step);
    if (Object.keys(found).length > 0) {
      setShowErrors(true);
      setError('Please fix the highlighted fields before continuing.');
      setProblems([]);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus());
      return;
    }
    setShowErrors(false);
    let ok = true;
    if (step === 0) ok = await callApi({ action: 'services', services });
    if (step === 1) ok = await callApi({ action: 'profile', ...profile });
    if (step === 2) {
      if (identityLocked || (identitySaved && !saIdNumber && !dateOfBirth && idKind === initial.idKind)) {
        ok = true;
      } else {
        ok = await callApi({ action: 'identity', id_kind: idKind, sa_id_number: saIdNumber, date_of_birth: dateOfBirth });
        if (ok) { setIdentitySaved(true); setSaIdNumber(''); }
      }
    }
    if (step === 3 && !providerId) ok = await callApi({ action: 'start' });
    if (ok) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goBack() {
    setShowErrors(false);
    setError(null);
    setProblems([]);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    const ok = await callApi({ action: 'submit', accept_terms: acceptTerms, popia_consent: popiaConsent });
    if (ok) {
      router.push('/candidate/piecejobs?submitted=1');
      router.refresh();
    }
  }

  // ------------------------------------------------------------ services
  function addService() {
    const category = categoryById.get(newCategory);
    if (!category || services.some((s) => s.category_id === category.id)) return;
    setServices([
      ...services,
      {
        category_id: category.id,
        years_experience: '',
        description: '',
        rates: [{ label: '', unit: category.units[0], price_rands: '', minimum_rands: '', notes: '' }],
      },
    ]);
    setNewCategory('');
  }

  function updateService(index: number, patch: Partial<ServiceDraft>) {
    setServices(services.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function updateRate(serviceIndex: number, rateIndex: number, patch: Partial<RateDraft>) {
    const service = services[serviceIndex];
    updateService(serviceIndex, { rates: service.rates.map((r, i) => (i === rateIndex ? { ...r, ...patch } : r)) });
  }

  // ----------------------------------------------------------- documents
  async function uploadDocument(docType: ProviderDocType, file: File, categoryId: string | null = null) {
    if (!providerId) return;
    if (file.size > 10 * 1024 * 1024) { setError('Files must be under 10 MB.'); return; }
    const supabase = createClient();
    if (!supabase) return;
    const key = `${docType}:${categoryId ?? ''}`;
    setUploading(key);
    setError(null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${Date.now()}-${docType}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('provider-documents').upload(storagePath, file, { upsert: false });
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(null);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('provider_documents')
      .insert({
        provider_id: providerId,
        user_id: userId,
        doc_type: docType,
        category_id: categoryId,
        storage_path: storagePath,
        file_name: file.name,
        file_size_kb: Math.round(file.size / 1024),
      })
      .select('id, doc_type, category_id, file_name, status, review_note, storage_path, created_at')
      .single();

    if (insertError || !data) {
      await supabase.storage.from('provider-documents').remove([storagePath]);
      setError(`Could not save the document: ${insertError?.message ?? 'unknown error'}`);
    } else {
      setDocuments([data as ProviderDocument, ...documents]);
    }
    setUploading(null);
  }

  async function removeDocument(doc: ProviderDocument) {
    const supabase = createClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase.from('provider_documents').delete().eq('id', doc.id);
    if (deleteError) { setError(deleteError.message); return; }
    await supabase.storage.from('provider-documents').remove([doc.storage_path]);
    setDocuments(documents.filter((d) => d.id !== doc.id));
  }

  const docSlots: { docType: ProviderDocType; categoryId: string | null; label: string; hint?: string | null }[] = [
    ...requiredDocTypes(idKind).map((docType) => ({ docType, categoryId: null, label: PROVIDER_DOC_LABELS[docType] })),
    ...services
      .map((s) => categoryById.get(s.category_id))
      .filter((c): c is CategoryOption => !!c && c.requires_qualification)
      .map((c) => ({
        docType: 'trade_certificate' as const,
        categoryId: c.id,
        label: `Trade certificate: ${c.name}`,
        hint: c.qualification_hint,
      })),
  ];

  // ------------------------------------------------------------ validation
  function validateStep(current: number): Record<string, string> {
    const e: Record<string, string> = {};
    const contact = (key: string, value: string) => {
      const scan = scanText(value);
      if (scan.blocked) e[key] = explainContactScan(scan.reasons);
    };

    if (current === 0) {
      if (services.length === 0) e.services = 'Add at least one service you offer.';
      services.forEach((svc, si) => {
        const years = svc.years_experience.trim();
        if (!years) e[`svc.${si}.years`] = 'Required.';
        else if (!/^\d+$/.test(years) || Number(years) > 60) e[`svc.${si}.years`] = 'Enter a whole number from 0 to 60.';
        if (svc.description.trim().length < 10) e[`svc.${si}.description`] = 'Describe this service in a sentence (at least 10 characters).';
        else contact(`svc.${si}.description`, svc.description);
        svc.rates.forEach((rate, ri) => {
          const k = `svc.${si}.rate.${ri}`;
          if (!rate.label.trim()) e[`${k}.label`] = 'Name this price, e.g. "Interior walls".';
          else contact(`${k}.label`, rate.label);
          const price = Number(rate.price_rands);
          if (!rate.price_rands.trim()) e[`${k}.price`] = 'Enter a price.';
          else if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) e[`${k}.price`] = 'Enter a valid price.';
          if (rate.minimum_rands.trim() && !(Number(rate.minimum_rands) > 0)) e[`${k}.minimum`] = 'Enter a valid minimum, or leave it empty.';
          if (rate.notes.trim()) contact(`${k}.notes`, rate.notes);
        });
      });
    }

    if (current === 1) {
      if (profile.headline.trim().length < 5) e.headline = 'Add a short headline (at least 5 characters).';
      else contact('headline', profile.headline);
      if (profile.bio.trim()) contact('bio', profile.bio);
      if (!profile.province) e.province = 'Choose your province.';
      if (!profile.city.trim()) e.city = 'Add your town or city.';
      else contact('city', profile.city);
      if (profile.suburb.trim()) contact('suburb', profile.suburb);
      if (!WEEKDAYS.some((d) => profile.availability[d] === true)) e.days = 'Choose at least one day you usually work.';
      const notes = typeof profile.availability.notes === 'string' ? profile.availability.notes : '';
      if (notes.trim()) contact('availabilityNotes', notes);
    }

    if (current === 2 && !identityLocked) {
      // Already saved and not being changed: nothing to re-enter.
      const keepSaved = identitySaved && idKind === initial.idKind;
      if (!idKind) e.idKind = 'Choose SA ID or passport.';
      else if (idKind === 'sa_id' && !(keepSaved && !saIdNumber)) {
        const parsed = parseSaId(saIdNumber);
        if (!parsed.ok) e.saId = parsed.error;
        else if (ageOn(parsed.dateOfBirth) < MIN_PROVIDER_AGE) e.saId = `You must be ${MIN_PROVIDER_AGE} or older to offer services.`;
      } else if (idKind === 'passport' && !(keepSaved && !dateOfBirth)) {
        if (!dateOfBirth) e.dob = 'Enter your date of birth.';
        else if (ageOn(dateOfBirth) < MIN_PROVIDER_AGE) e.dob = `You must be ${MIN_PROVIDER_AGE} or older to offer services.`;
      }
    }

    if (current === 3) {
      if (!providerId) e.documents = 'Save your services first.';
      for (const slot of docSlots) {
        const has = documents.some(
          (d) => d.doc_type === slot.docType && (d.category_id ?? null) === slot.categoryId && d.status !== 'rejected',
        );
        if (!has) e[`doc.${slot.docType}:${slot.categoryId ?? ''}`] = 'Upload this document to continue.';
      }
    }

    return e;
  }

  const errors = showErrors ? validateStep(step) : {};
  const cls = (base: string, key: string) => (errors[key] ? twMerge(base, INVALID) : base);
  const invalid = (key: string) => (errors[key] ? true : undefined);

  // --------------------------------------------------------------- render
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/candidate/piecejobs" className="text-sm text-brand-600 hover:underline">← Back to My PieceJobs</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Offer your services</h1>
        <p className="text-slate-500 text-sm mt-1">
          Set up your service listing. Every provider is checked by Spanispace before going live, so customers can book you with confidence.
        </p>
      </div>

      {locked && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your enrolment is under review. You can make changes once the review is finished.
        </div>
      )}
      {initial.status === 'rejected' && initial.verificationNote && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Changes needed:</strong> {initial.verificationNote}
        </div>
      )}

      {/* Progress only. Steps can't be jumped: "Save and continue" is the
          only way forward, and it only moves on when the step is valid. */}
      <ol className="flex flex-wrap gap-2 mb-6" aria-label="Enrolment progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium select-none ${
              i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {i < step ? <Check className="w-3 h-3" aria-hidden /> : <span>{i + 1}</span>}
            {label}
            {i < step && <span className="sr-only"> (done)</span>}
          </li>
        ))}
      </ol>

      <fieldset disabled={locked || saving} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        {/* ------------------------------------------------ Step 1 */}
        {step === 0 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">What services do you offer?</h2>
              <p className="text-sm text-slate-500">Add each service with a rate card. Prices are a guide for customers. The final price is agreed in the chat.</p>
            </div>

            {services.map((service, si) => {
              const category = categoryById.get(service.category_id);
              if (!category) return null;
              return (
                <div key={service.category_id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      {category.requires_qualification && (
                        <p className="text-xs text-amber-700 mt-0.5">
                          Regulated trade: needs a trade certificate ({category.qualification_hint}).
                          {service.qualification_status === 'approved' && ' Approved.'}
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => setServices(services.filter((_, i) => i !== si))} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${category.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600">Years of experience <span className="text-red-500" aria-hidden>*</span></span>
                      <input type="number" min={0} max={60} required aria-invalid={invalid(`svc.${si}.years`)} value={service.years_experience} onChange={(e) => updateService(si, { years_experience: e.target.value })} className={cls(inputClass, `svc.${si}.years`)} />
                      <FieldNote error={errors[`svc.${si}.years`]} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium text-slate-600">Short description <span className="text-red-500" aria-hidden>*</span></span>
                      <input type="text" maxLength={1000} required aria-invalid={invalid(`svc.${si}.description`)} value={service.description} onChange={(e) => updateService(si, { description: e.target.value })} className={cls(inputClass, `svc.${si}.description`)} placeholder="e.g. Interior and exterior walls, I bring my own rollers" />
                      <FieldNote error={errors[`svc.${si}.description`]} value={service.description} />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600">Rate card <span className="text-slate-400 font-normal">(price name and price are required; minimum and notes are optional)</span></p>
                    {service.rates.map((rate, ri) => {
                      const k = `svc.${si}.rate.${ri}`;
                      const rowErrors = [errors[`${k}.label`], errors[`${k}.price`], errors[`${k}.minimum`], errors[`${k}.notes`]].filter(Boolean);
                      return (
                      <div key={ri} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-start">
                        <input aria-label="Price name" required aria-invalid={invalid(`${k}.label`)} className={cls(`${inputClass} col-span-2 sm:col-span-4`, `${k}.label`)} placeholder="e.g. Interior walls" value={rate.label} onChange={(e) => updateRate(si, ri, { label: e.target.value })} maxLength={80} />
                        <div className="relative sm:col-span-3">
                          <span className="absolute left-3 top-2.5 text-sm text-slate-400">R</span>
                          <input aria-label="Price in rand" required aria-invalid={invalid(`${k}.price`)} type="number" min={1} step="0.01" className={cls(`${inputClass} pl-7`, `${k}.price`)} placeholder="45" value={rate.price_rands} onChange={(e) => updateRate(si, ri, { price_rands: e.target.value })} />
                        </div>
                        <Select
                          label="Unit"
                          hideLabel
                          className="sm:col-span-3"
                          triggerClassName="px-3 border-slate-300"
                          value={rate.unit}
                          onChange={(v) => updateRate(si, ri, { unit: v as PricingUnit })}
                          options={category.units.map((u) => ({ value: u, label: UNIT_LABELS[u] }))}
                        />
                        <div className="relative sm:col-span-2">
                          <span className="absolute left-3 top-2.5 text-sm text-slate-400">R</span>
                          <input aria-label="Minimum charge in rand (optional)" aria-invalid={invalid(`${k}.minimum`)} type="number" min={1} step="0.01" className={cls(`${inputClass} pl-7`, `${k}.minimum`)} placeholder="Min" title="Minimum charge (optional)" value={rate.minimum_rands} onChange={(e) => updateRate(si, ri, { minimum_rands: e.target.value })} />
                        </div>
                        <div className="col-span-2 sm:col-span-12 flex gap-2">
                          <input aria-label="Notes (optional)" aria-invalid={invalid(`${k}.notes`)} className={cls(inputClass, `${k}.notes`)} placeholder="Notes (optional), e.g. paint not included" value={rate.notes} onChange={(e) => updateRate(si, ri, { notes: e.target.value })} maxLength={200} />
                          {service.rates.length > 1 && (
                            <button type="button" onClick={() => updateService(si, { rates: service.rates.filter((_, i) => i !== ri) })} className="text-slate-400 hover:text-red-600 px-2" aria-label="Remove price">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="col-span-2 sm:col-span-12">
                          {rowErrors.length > 0
                            ? rowErrors.map((msg) => <p key={msg} className="text-xs text-red-600">{msg}</p>)
                            : <FieldNote value={`${rate.label} ${rate.notes}`} />}
                        </div>
                      </div>
                      );
                    })}
                    {service.rates.length < 10 && (
                      <button
                        type="button"
                        onClick={() => updateService(si, { rates: [...service.rates, { label: '', unit: category.units[0], price_rands: '', minimum_rands: '', notes: '' }] })}
                        className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add another price
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                label="Choose a service to add"
                hideLabel
                className="flex-1"
                triggerClassName="px-3 border-slate-300"
                value={newCategory}
                onChange={setNewCategory}
                options={[
                  { value: '', label: 'Choose a service to add…' },
                  ...categories
                    .filter((c) => !services.some((s) => s.category_id === c.id))
                    .map((c) => ({ value: c.id, label: `${c.name}${c.requires_qualification ? ' (certificate needed)' : ''}` })),
                ]}
              />
              <button type="button" onClick={addService} disabled={!newCategory} className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add service
              </button>
            </div>
            {errors.services && <p className="text-sm text-red-600" role="alert">{errors.services}</p>}
          </>
        )}

        {/* ------------------------------------------------ Step 2 */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your profile and service area</h2>
              <p className="text-sm text-slate-500">Don&apos;t include phone numbers, emails or social media. Customers contact you through Spanispace messages.</p>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Headline <span className="text-red-500" aria-hidden>*</span></span>
              <input required aria-invalid={invalid('headline')} className={cls(inputClass, 'headline')} maxLength={120} value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="e.g. Neat interior painter, 8 years experience" />
              <FieldNote error={errors.headline} value={profile.headline} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">About you (optional)</span>
              <textarea aria-invalid={invalid('bio')} className={cls(inputClass, 'bio')} rows={4} maxLength={2000} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Your experience, the kind of jobs you enjoy, what customers can expect." />
              <FieldNote error={errors.bio} value={profile.bio} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Select
                  label="Province *"
                  labelClassName="block text-sm font-medium text-slate-700"
                  triggerClassName={errors.province ? 'px-3 border-red-400' : 'px-3 border-slate-300'}
                  value={profile.province}
                  onChange={(v) => setProfile({ ...profile, province: v })}
                  options={[{ value: '', label: 'Choose…' }, ...PROVINCES.map((p) => ({ value: p, label: p }))]}
                />
                <FieldNote error={errors.province} />
              </div>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Town / city <span className="text-red-500" aria-hidden>*</span></span>
                <input required aria-invalid={invalid('city')} className={cls(inputClass, 'city')} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="e.g. Soweto" />
                <FieldNote error={errors.city} value={profile.city} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Suburb (optional)</span>
                <input aria-invalid={invalid('suburb')} className={cls(inputClass, 'suburb')} value={profile.suburb} onChange={(e) => setProfile({ ...profile, suburb: e.target.value })} placeholder="e.g. Orlando East" />
                <FieldNote error={errors.suburb} value={profile.suburb} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">How far will you travel? ({profile.travel_radius_km} km)</span>
              <input type="range" min={0} max={100} step={5} value={profile.travel_radius_km} onChange={(e) => setProfile({ ...profile, travel_radius_km: Number(e.target.value) })} className="w-full accent-brand-600" />
            </label>
            <div>
              <span className="text-sm font-medium text-slate-700">Days you usually work <span className="text-red-500" aria-hidden>*</span></span>
              <div className="flex flex-wrap gap-2 mt-1">
                {WEEKDAYS.map((day) => {
                  const on = profile.availability[day] === true;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setProfile({ ...profile, availability: { ...profile.availability, [day]: !on } })}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300 text-slate-600'}`}
                      aria-pressed={on}
                    >
                      {WEEKDAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
              <FieldNote error={errors.days} />
              <input
                aria-invalid={invalid('availabilityNotes')}
                className={cls(`${inputClass} mt-2`, 'availabilityNotes')}
                maxLength={200}
                placeholder="Notes (optional), e.g. weekdays from 8am, Saturdays until 1pm"
                value={typeof profile.availability.notes === 'string' ? profile.availability.notes : ''}
                onChange={(e) => setProfile({ ...profile, availability: { ...profile.availability, notes: e.target.value } })}
              />
              <FieldNote error={errors.availabilityNotes} />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">How do you want customers to pay you for the service?</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethods[]).map((method) => (
                  <label key={method} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer ${profile.payment_methods === method ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 text-slate-700'}`}>
                    <input type="radio" name="payment_methods" value={method} checked={profile.payment_methods === method} onChange={() => setProfile({ ...profile, payment_methods: method })} className="accent-brand-600" />
                    {PAYMENT_METHOD_LABELS[method]}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <strong>Cash</strong> is physical money paid to you on the day. <strong>Online</strong> payments are held by Spanispace and paid out to your bank account once the job is complete and both of you confirm. Online payments switch on when payouts launch. Until then, customers can still book you for cash. The R10 Spanispace booking fee is always paid online by the customer.
              </p>
            </div>
          </>
        )}

        {/* ------------------------------------------------ Step 3 */}
        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Confirm who you are</h2>
              <p className="text-sm text-slate-500">
                You must be 18 or older. We only use your ID number to check your age and don&apos;t store it. Your ID document is checked in the next step.
              </p>
            </div>
            {identityLocked ? (
              <p className="text-sm text-green-700 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Your identity is verified.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['sa_id', 'passport'] as const).map((kind) => (
                    <label key={kind} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer ${idKind === kind ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 text-slate-700'}`}>
                      <input type="radio" name="id_kind" checked={idKind === kind} onChange={() => setIdKind(kind)} className="accent-brand-600" />
                      {kind === 'sa_id' ? 'South African ID' : 'Passport (non-SA citizen)'}
                    </label>
                  ))}
                </div>
                <FieldNote error={errors.idKind} />
                {idKind === 'sa_id' && (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">SA ID number{identitySaved ? ' (saved; enter again only to change it)' : ''}</span>
                    <input aria-invalid={invalid('saId')} className={cls(inputClass, 'saId')} inputMode="numeric" maxLength={13} value={saIdNumber} onChange={(e) => setSaIdNumber(e.target.value.replace(/\D/g, ''))} placeholder="13 digits" autoComplete="off" />
                    <FieldNote error={errors.saId} />
                  </label>
                )}
                {idKind === 'passport' && (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Date of birth{identitySaved ? ' (saved; enter again only to change it)' : ''}</span>
                    <input type="date" aria-invalid={invalid('dob')} className={cls(inputClass, 'dob')} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                    <FieldNote error={errors.dob} />
                    <span className="text-xs text-slate-500">You&apos;ll also need to upload a valid work permit or visa.</span>
                  </label>
                )}
              </>
            )}
          </>
        )}

        {/* ------------------------------------------------ Step 4 */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Verification documents</h2>
              <p className="text-sm text-slate-500">
                These are stored privately and only Spanispace admins can see them. Customers never see your documents, only your &quot;Verified&quot; badge. PDF or photo, up to 10 MB each.
              </p>
            </div>
            {!idKind && <p className="text-sm text-amber-700">Complete the identity step first so we know which documents you need.</p>}
            {!providerId && <p className="text-sm text-amber-700">Save the first step (your services) before uploading documents.</p>}
            <ul className={`space-y-3 ${providerId ? '' : 'opacity-50 pointer-events-none'}`}>
              {docSlots.map((slot) => {
                const key = `${slot.docType}:${slot.categoryId ?? ''}`;
                const uploaded = documents.filter((d) => d.doc_type === slot.docType && (d.category_id ?? null) === slot.categoryId);
                return (
                  <DocumentSlot
                    key={key}
                    label={slot.label}
                    hint={slot.docType === 'police_clearance'
                      ? 'Apply at any SAPS station. Spanispace accepts certificates issued in the last 12 months.'
                      : slot.docType === 'selfie'
                        ? 'A clear photo of your face holding your ID next to it.'
                        : slot.hint ?? undefined}
                    uploaded={uploaded}
                    error={errors[`doc.${key}`]}
                    busy={uploading === key}
                    onUpload={(file) => uploadDocument(slot.docType, file, slot.categoryId)}
                    onRemove={removeDocument}
                  />
                );
              })}
            </ul>
          </>
        )}

        {/* ------------------------------------------------ Step 5 */}
        {step === 4 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Agreement and submit</h2>
              <p className="text-sm text-slate-500">Once you submit, Spanispace checks your documents. This usually takes a few working days.</p>
            </div>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc ml-5">
              <li>Customers pay Spanispace a R10 booking fee. You keep your full service price, less the payment processing fee on online payments.</li>
              <li>Don&apos;t share or ask for phone numbers, emails or social media before a booking is paid. Contact details unlock automatically once it is.</li>
              <li>Don&apos;t ask customers to book or pay you outside Spanispace.</li>
              <li>You are an independent service provider, not an employee of Spanispace or your customers.</li>
            </ul>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 accent-brand-600" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
              <span>
                I have read and accept the{' '}
                <Link href="/piecejobs/provider-agreement" target="_blank" className="text-brand-600 underline">Service Provider Agreement</Link>.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 accent-brand-600" checked={popiaConsent} onChange={(e) => setPopiaConsent(e.target.checked)} />
              <span>
                I consent to Spanispace processing my identity documents and police clearance certificate (which includes criminal record information) to verify me as a service provider, as explained in the{' '}
                <Link href="/privacy" target="_blank" className="text-brand-600 underline">Privacy Policy</Link>.
              </span>
            </label>
          </>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}</p>
            {problems.length > 0 && <ul className="mt-2 ml-6 list-disc space-y-0.5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={goBack} disabled={step === 0} className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-0">
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={saveAndNext} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save and continue
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={!acceptTerms || !popiaConsent} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Submit for verification
            </button>
          )}
        </div>
      </fieldset>
    </div>
  );
}

function DocumentSlot({
  label,
  hint,
  uploaded,
  error,
  busy,
  onUpload,
  onRemove,
}: {
  label: string;
  hint?: string;
  uploaded: ProviderDocument[];
  error?: string;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: (doc: ProviderDocument) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasActive = uploaded.some((d) => d.status !== 'rejected');
  return (
    <li className={`rounded-xl border p-4 ${error ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            {hasActive && <Check className="w-4 h-4 text-green-600" />} {label}
          </p>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button
          type="button"
          data-invalid={error ? 'true' : undefined}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} {hasActive ? 'Replace' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_FILES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
      </div>
      {uploaded.length > 0 && (
        <ul className="mt-2 space-y-1">
          {uploaded.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-600">{doc.file_name}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2 py-0.5 font-bold ${
                  doc.status === 'verified' ? 'bg-green-100 text-green-700' : doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {doc.status === 'pending' ? 'awaiting review' : doc.status}
                </span>
                {doc.status !== 'verified' && (
                  <button type="button" onClick={() => onRemove(doc)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${doc.file_name}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
              {doc.status === 'rejected' && doc.review_note && <span className="basis-full text-red-600">{doc.review_note}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
