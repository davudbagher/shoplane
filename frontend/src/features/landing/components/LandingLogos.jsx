export const LandingLogos = () => {
  const logos = [
    { name: 'Spotify' },
    { name: 'Airbnb' },
    { name: 'Loom' },
    { name: 'Figma' },
    { name: 'Vercel' },
    { name: 'Linear' }
  ];

  return (
    <div className="py-16 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-10 text-center">
          Trusted by over 10,000 businesses
        </p>
        <div className="w-full flex flex-wrap justify-center items-center gap-12 md:gap-20">
           {logos.map((logo, index) => (
             <div key={index} className="flex">
                <span className="text-2xl font-black text-gray-400 opacity-60">
                   {logo.name}
                </span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};