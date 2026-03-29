export const LandingTestimonial = () => {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        
        <div className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-10">
           Customer Stories
        </div>
        
        <div className="bg-gray-50 p-12 md:p-16 rounded-3xl border border-gray-100 shadow-sm relative">
           
           <h2 className="text-3xl md:text-4xl font-extrabold leading-relaxed tracking-tight text-gray-900 mb-10">
             "We transitioned our entire online retail operation in under a week. The platform completely eliminated our dependency on external development agencies."
           </h2>
           
           <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-200">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
                  alt="Sarah Jenkins"
                  className="w-full h-full object-cover"
                />
             </div>
             <div>
                <div className="text-lg font-bold text-gray-900">Sarah Jenkins</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">VP Operations, Nexus</div>
             </div>
           </div>
           
        </div>
      </div>
    </section>
  );
};