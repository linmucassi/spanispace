
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center space-x-2 mb-6">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="text-xl font-extrabold text-white tracking-tight italic">spanispace</span>
          </div>
          <p className="text-sm leading-relaxed">
            Bridging skills and hiring since 2024. Expert-led bootcamps for the next generation of talent.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#jobs" className="hover:text-white">Job Board</a></li>
            <li><a href="#training" className="hover:text-white">Training Portal</a></li>
            <li><a href="#academic" className="hover:text-white">Academic Updates</a></li>
            <li><a href="#success-stories" className="hover:text-white">Success Stories</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#success-stories" className="hover:text-white">Partnerships</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Get Notified</h4>
          <p className="text-sm mb-4">Join our mailing list for weekly job drops.</p>
          <div className="flex">
            <input type="email" placeholder="Email" className="bg-slate-800 border-none rounded-l-xl px-4 py-2 w-full focus:ring-1 focus:ring-indigo-500 outline-none text-white" />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-xl hover:bg-indigo-700 transition-colors font-bold">Join</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between text-xs font-medium uppercase tracking-widest">
        <p>&copy; 2024 SPANISPACE. ALL RIGHTS RESERVED.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
