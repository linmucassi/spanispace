// app/coming-soon/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  type: z.enum(['Bootcamp', 'Course', 'Event/Hackathon', 'Other']).refine(
    (val) => val !== undefined,
    'Please select what you are interested in'
  ),
  consent: z.boolean().refine((val) => val === true, 'You must agree to be contacted'),
});

type FormData = z.infer<typeof formSchema>;

export default function ComingSoon() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'Bootcamp', // optional – can remove if you prefer no default
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL_HERE', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: data.type || 'Coming Soon Interest',
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setError('');
      } else {
        setError('Something went wrong. Please try again or email us directly.');
      }
    } catch (err) {
      setError('Network error – please check your internet connection.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Coming Soon
          </h1>
          <p className="text-lg text-gray-600">
            Bootcamps, short courses, events & hackathons launching soon.
          </p>
          <p className="text-gray-600 mt-1">
            Join the reminder list and be the first to know!
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              You're on the list!
            </h2>
            <p className="text-gray-600">
              We'll send you a notification as soon as registration opens.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                placeholder="Thabo Mokoena"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (optional)
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                placeholder="+27 82 123 4567"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                I'm interested in
              </label>
              <select
                id="type"
                {...register('type')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 bg-white"
              >
                <option value="Bootcamp">Bootcamp</option>
                <option value="Course">Short Course</option>
                <option value="Event/Hackathon">Event / Hackathon</option>
                <option value="Other">Other (please specify in notes later)</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="consent"
                  type="checkbox"
                  {...register('consent')}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </div>
              <label htmlFor="consent" className="ml-3 text-sm text-gray-600">
                I agree to be contacted by Spanispace via email or phone about updates, bootcamps, courses, events, and to receive an auto-created profile when features launch.
                <br />
                <a href="/privacy" className="text-indigo-600 hover:underline">
                  View our Privacy Policy
                </a>
              </label>
            </div>
            {errors.consent && (
              <p className="text-sm text-red-600">{errors.consent.message}</p>
            )}

            {error && <p className="text-center text-red-600 mt-4">{error}</p>}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Join the Reminder List
            </button>
          </form>
        )}
      </div>
    </div>
  );
}