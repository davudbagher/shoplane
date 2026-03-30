import { LeadForm } from './LeadForm';

export const LandingCTA = () => {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-gray-50/50" id="apply">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
                Biznesinizi rəqəmsal dünyaya daşıyın
              </h2>
              <p className="text-xl text-gray-600 font-medium mb-8">
                Shoplane ilə öz onlayn mağazanızı qurun. Biz sizə quraşdırma, dizayn və ödəniş sistemlərinin inteqrasiyasında şəxsən kömək edəcəyik.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  MilliKART və Pasha Bank inteqrasiyası
                </li>
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Sürətli və etibarlı infrastruktur
                </li>
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Fərdi dizayn və dəstək
                </li>
              </ul>
           </div>

           <div className="relative">
             <div className="absolute -inset-4 bg-primary-500/5 rounded-[40px] blur-2xl -z-10" />
             <LeadForm />
           </div>
        </div>
      </div>
    </section>
  );
};