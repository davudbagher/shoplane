export const LandingHero = ({ onOpenModal }) => {

  return (
    <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-gradient-to-b from-indigo-50/50 to-white overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
        <div className="text-center max-w-4xl mx-auto mb-16 flex flex-col items-center gap-6">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-indigo-100 text-sm font-bold text-indigo-700">
              <span className="flex h-2.5 w-2.5 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
              1line.az 2.0 is now live
           </div>
           
           <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold tracking-tight leading-tight text-slate-900">
             The effortless way to build apps.
           </h1>
           <p className="text-lg md:text-2xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed mt-6">
             Empower your team to transform business processes without writing a single line of code. Designed explicitly for speed, governance, and scale.
           </p>
           
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
             <button
               onClick={onOpenModal}
               className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
             >
               Start building free
             </button>
             <button className="w-full sm:w-auto bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-colors shadow-sm">
               Book a Demo
             </button>
           </div>
           <p className="text-sm text-slate-500 mt-6 font-medium">No credit card required. 14-day free trial.</p>
        </div>

        {/* Dashboard Composite Mockups */}
        <div className="relative w-full max-w-5xl mx-auto">
           {/* Center Big Dashboard */}
           <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-200">
             {/* Fake Browser header */}
             <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
             </div>
             <img
               src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2400"
               alt="1line.az Dashboard Preview"
               className="w-full h-auto object-cover"
             />
           </div>
        </div>
      </div>
    </section>
  );
};