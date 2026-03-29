import { useNavigate } from 'react-router-dom';

export const LandingCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-indigo-600 rounded-3xl p-12 md:p-24 text-center shadow-xl border border-indigo-500">
           
           <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Start building today
              </h2>
              <p className="text-xl text-indigo-100 font-medium max-w-xl mx-auto">
                 Join thousands of forward-thinking companies deploying 1line.az to accelerate their growth.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full sm:w-auto pt-6">
                <button 
                   onClick={() => navigate('/register')}
                   className="w-full sm:w-auto bg-white text-indigo-600 px-10 py-4 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-md"
                >
                   Get Started
                </button>
                <button className="w-full sm:w-auto px-10 py-4 rounded-full font-bold border-2 border-indigo-400 text-white hover:bg-indigo-700 transition-colors">
                   Talk to Sales
                </button>
              </div>
           </div>

        </div>
      </div>
    </section>
  );
};