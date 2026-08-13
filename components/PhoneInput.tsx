'use client';

// A South African phone/WhatsApp input: a fixed "+27" prefix chip, and an
// editable field that only ever holds the 9 digits after it -- typing a
// letter, a space, or a 10th digit is simply ignored rather than accepted
// and cleaned up later. Stored/emitted value is always "+27XXXXXXXXX" or ''.
//
// Visual defaults match the candidate portal (slate scale). Public-facing
// forms pass their own containerClassName/prefixClassName (ink scale) to
// match their own inputs -- see app/(public)/jobs/[id]/apply/ApplyForm.tsx
// and app/(public)/post-job/page.tsx for that variant.

import { toSaLocalDigits, toSaPhone } from '@/lib/phone';

export default function PhoneInput({
  id,
  name,
  value,
  onChange,
  required,
  containerClassName = 'rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500',
  inputClassName = 'px-3 py-2',
  prefixClassName = 'px-3',
}: {
  id?: string;
  /** Only needed if a parent form still reads changes by input `name`. */
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  prefixClassName?: string;
}) {
  const local = toSaLocalDigits(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(toSaPhone(e.target.value));
  }

  return (
    <div className={`flex items-stretch overflow-hidden bg-white ${containerClassName}`}>
      <span
        className={`flex items-center text-slate-500 text-sm font-medium bg-slate-50 border-r border-slate-300 select-none ${prefixClassName}`}
      >
        +27
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={local}
        onChange={handleChange}
        required={required}
        maxLength={9}
        placeholder="821234567"
        className={`flex-1 min-w-0 text-sm text-slate-900 placeholder-slate-400 outline-none ${inputClassName}`}
      />
    </div>
  );
}
