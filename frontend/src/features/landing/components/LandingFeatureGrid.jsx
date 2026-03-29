export const LandingFeatureGrid = () => {
  const features = [
    {
      icon: '🔐',
      title: 'Enterprise Security',
      text: 'Bank-grade encryption and automated compliance built right into the platform.'
    },
    {
       icon: '⚡',
       title: 'Instant Deployments',
       text: 'Push updates instantly without bringing your store offline. Zero downtime.'
    },
    {
       icon: '📊',
       title: 'Deep Analytics',
       text: 'Actionable insights derived from real-time customer behavior and sales data.'
    }
  ];

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto flex flex-col items-center gap-4">
           <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
             Built to scale globally
           </h2>
           <p className="text-lg text-gray-500 font-medium leading-relaxed">
             Our infrastructure handles everything from day-one launches to massive peak-season traffic spikes.
           </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="flex flex-col p-8 md:p-10 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-8 bg-indigo-50 border border-indigo-100">
                {f.icon}
              </div>
              
              <h3 className="text-2xl font-bold tracking-tight mb-4 text-gray-900">
                {f.title}
              </h3>
              
              <p className="text-base font-medium text-gray-500 leading-relaxed mb-6">
                {f.text}
              </p>
              
              <div className="mt-auto">
                 <span className="text-xl font-bold text-indigo-600">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};