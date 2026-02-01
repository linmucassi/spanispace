'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, 'You must agree to be contacted'),
});

type FormData = z.infer<typeof formSchema>;

export default function JoinWaitlist() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('YOUR_APPS_SCRIPT_URL_HERE', { // ← Paste your web app URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'Waitlist / Mailing List' }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError('Submission failed—try again or email us directly.');
      }
    } catch (err) {
      setError('Network error—please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Join the Spanispace Waitlist</h1>
        <p className="text-center text-gray-600 mb-8">
          Get weekly job drops, bootcamp invites, and early access. We'll notify you when login/signup goes live!
        </p>

        {submitted ? (
          <div className="text-center text-green-600 font-medium">
            Thanks! You're on the list—check your email soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500" />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
              <input {...register('phone')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500" />
            </div>

            <div className="flex items-start">
              <input type="checkbox" {...register('consent')} className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <label className="ml-2 text-sm text-gray-600">
                I agree to be contacted via email/phone for Spanispace updates, profile creation, and opportunities. 
                See our <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>.
              </label>
            </div>
            {errors.consent && <p className="text-red-500 text-sm">{errors.consent.message}</p>}

            {error && <p className="text-red-500 text-center">{error}</p>}

            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-full font-bold hover:bg-indigo-700 transition">
              Join Waitlist
            </button>
          </form>
        )}
      </div>
    </div>
  );
}