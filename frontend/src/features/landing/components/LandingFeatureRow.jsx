export const LandingFeatureRow = ({ 
  title, 
  description, 
  image, 
  reversed = false,
  tag = "FEATURES",
  stats = [],
  features = []
}) => {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-white">
      <div className={`max-w-7xl mx-auto flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 md:gap-24`}>
        
        <div className="flex-1 w-full flex flex-col items-start gap-6">
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded mb-2">
            {tag}
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
             {title}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
             {description}
          </p>
          
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-4xl font-black text-indigo-600 mb-1">{s.value}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {features?.length > 0 && (
            <div className="flex flex-col gap-4 pt-4 w-full">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                     <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-gray-800 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}
          
          {!stats.length && !features.length && (
            <div className="pt-4">
              <button className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2">
                 Learn more <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Image Area */}
        <div className="flex-1 w-full">
           <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-50">
              <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
              <img 
                src={image} 
                alt="Feature Showcase" 
                className="w-full h-auto object-cover"
              />
           </div>
        </div>

      </div>
    </section>
  );
};