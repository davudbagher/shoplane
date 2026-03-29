import { Link } from 'react-router-dom';

export const LandingFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 md:py-24 px-6 md:px-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 mb-16">
         {/* Column 1 */}
         <div className="flex flex-col gap-6">
            <h4 className="text-white font-bold tracking-tight">Platform</h4>
            <div className="flex flex-col gap-3">
               <Link to="/" className="hover:text-white transition-colors">Features</Link>
               <Link to="/" className="hover:text-white transition-colors">Pricing</Link>
               <Link to="/" className="hover:text-white transition-colors">Integrations</Link>
               <Link to="/" className="hover:text-white transition-colors">Changelog</Link>
            </div>
         </div>
         {/* Column 2 */}
         <div className="flex flex-col gap-6">
            <h4 className="text-white font-bold tracking-tight">Solutions</h4>
            <div className="flex flex-col gap-3">
               <Link to="/" className="hover:text-white transition-colors">Startups</Link>
               <Link to="/" className="hover:text-white transition-colors">Enterprise</Link>
               <Link to="/" className="hover:text-white transition-colors">Agencies</Link>
               <Link to="/" className="hover:text-white transition-colors">E-commerce</Link>
            </div>
         </div>
         {/* Column 3 */}
         <div className="flex flex-col gap-6">
            <h4 className="text-white font-bold tracking-tight">Resources</h4>
            <div className="flex flex-col gap-3">
               <Link to="/" className="hover:text-white transition-colors">Documentation</Link>
               <Link to="/" className="hover:text-white transition-colors">Blog</Link>
               <Link to="/" className="hover:text-white transition-colors">Community</Link>
               <Link to="/" className="hover:text-white transition-colors">Help Center</Link>
            </div>
         </div>
         {/* Column 4 */}
         <div className="flex flex-col gap-6">
            <h4 className="text-white font-bold tracking-tight">Company</h4>
            <div className="flex flex-col gap-3">
               <Link to="/" className="hover:text-white transition-colors">About</Link>
               <Link to="/" className="hover:text-white transition-colors">Careers</Link>
               <Link to="/" className="hover:text-white transition-colors">Legal</Link>
               <Link to="/" className="hover:text-white transition-colors">Contact</Link>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border-t border-slate-900 pt-8 mt-16 text-sm">
         <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                 <path d="M12 2L2 7l10 5 10-5-10-5zm0 15.5l-10-5v-1l10 5 10-5v1l-10 5z"/>
                 <path d="M12 22l-10-5v-3.5l10 5 10-5V17l-10 5z"/>
               </svg>
            </div>
            <span className="text-white font-black tracking-tighter uppercase">1line.az</span>
         </div>
         <div className="text-slate-500 font-medium">
            © {new Date().getFullYear()} 1line.az Inc. All rights reserved.
         </div>
      </div>
    </footer>
  );
};