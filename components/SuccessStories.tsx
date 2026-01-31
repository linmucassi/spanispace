
import React from 'react';

const SuccessStories: React.FC = () => {
  return (
    <section className="py-20 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">The Spanispace Impact</h2>
          <p className="text-slate-600">Real stories from graduates who turned theory into career assets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Sarah J.", role: "Backend Dev @ Meta", text: "Spanispace helped me understand Docker and CI/CD when uni only taught me Java basics. I was hired within 2 weeks of the bootcamp." },
            { name: "David K.", role: "Cyber Security @ ABSA", text: "The CV curation service is a game changer. I went from zero replies to 5 interviews in a month." },
            { name: "Lindiwe M.", role: "Cloud Architect @ AWS", text: "Learning directly from industry experts who are currently working in the field made all the difference." }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-slate-600 italic mb-6">"{item.text}"</p>
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-sm text-indigo-600 font-medium">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
