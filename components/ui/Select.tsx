'use client';

/**
 * A styled replacement for <select>. The native control's open menu is drawn
 * by the operating system and can't be themed, which is what made the filter
 * dropdowns on /jobs and /services look out of place.
 *
 * Keeps what a native select gets for free: a real button, the listbox ARIA
 * pattern, arrow keys / Home / End, Enter or Space to choose, Escape to close,
 * type a letter to jump. Pass `name` to take part in a plain GET <form> (a
 * hidden input carries the value). Pass `submitOnChange` to submit that form
 * as soon as an option is picked.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };

export default function Select({
  options,
  value,
  defaultValue,
  onChange,
  name,
  label,
  hideLabel = false,
  submitOnChange = false,
  className = '',
}: {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  label: string;
  hideLabel?: boolean;
  submitOnChange?: boolean;
  className?: string;
}) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value ?? '');
  const current = value ?? internal;
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === current));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: '', at: 0 });

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      if (value === undefined) setInternal(option.value);
      onChange?.(option.value);
      setOpen(false);
      buttonRef.current?.focus();
      if (submitOnChange && hiddenRef.current) {
        // Let the hidden input pick up the new value before submitting.
        hiddenRef.current.value = option.value;
        hiddenRef.current.disabled = option.value === '';
        hiddenRef.current.form?.requestSubmit();
      }
    },
    [options, value, onChange, submitOnChange],
  );

  function openMenu() {
    setActive(selectedIndex);
    setOpen(true);
  }

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const now = Date.now();
          typeahead.current.text = (now - typeahead.current.at > 700 ? '' : typeahead.current.text) + e.key.toLowerCase();
          typeahead.current.at = now;
          const match = options.findIndex((o) => o.label.toLowerCase().startsWith(typeahead.current.text));
          if (match >= 0) setActive(match);
        }
    }
  }

  const selected = options[selectedIndex];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={`${id}-label`} className={hideLabel ? 'sr-only' : 'block text-xs font-medium text-ink-500 mb-1'}>
        {label}
      </span>
      {/* Disabled when empty so "All"-style options don't add ?name= to the URL. */}
      {name && <input ref={hiddenRef} type="hidden" name={name} value={current} disabled={current === ''} />}
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-labelledby={`${id}-label ${id}-button`}
        id={`${id}-button`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm text-ink-900 transition-colors hover:border-ink-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
          open ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-ink-200'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          // Exactly the trigger's width: a min-width wider than a narrow
          // trigger pushed the menu past the viewport edge and scrolled the
          // page sideways.
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-auto rounded-xl border border-ink-100 bg-white p-1 shadow-lg shadow-ink-900/10"
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            const isActive = index === active;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-700'
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
