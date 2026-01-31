
import React from 'react';
import { ACADEMIC_UPDATES } from '../constants';

const AcademicPortal: React.FC = () => {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Bridging From High School</h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Missing out on standard application windows? Spanispace tracks late applications, 
            learnerships, and vocational training dates so you never fall behind.
          </p>
          <div className="space-y-4">
            {ACADEMIC_UPDATES.map((update, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    {update.institution.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{update.institution}</h4>
                    <span className="text-xs font-medium text-slate-500">{update.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Deadline</span>
                  <span className="text-sm font-bold text-indigo-600">{update.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <img src="https://picsum.photos/seed/academic/800/600" className="rounded-3xl shadow-2xl" alt="Education" />
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 max-w-xs">
            <p className="text-indigo-600 font-bold text-2xl">98%</p>
            <p className="text-sm text-slate-600 font-medium italic">"Success rate for learners placed in vocational programs via Spanispace 2024."</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademicPortal;