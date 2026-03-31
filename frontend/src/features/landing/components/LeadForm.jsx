import { useState } from 'react';
import { OnboardingModal } from '../../platform/components/OnboardingModal';

export const LeadForm = () => {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setShowModal(true);
  };

  const handleSuccess = () => {
    setSubmitted(true);
    setShowModal(false);
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Təşəkkür edirik!</h3>
        <p className="text-gray-600 mb-4">
          Müraciətiniz qəbul edildi. Komandamız 48 saat ərzində sizinlə WhatsApp və ya zəng vasitəsilə əlaqə saxlayacaq.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            📞 Əlaqə: <strong>+994 50 123 45 67</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Mağaza üçün müraciət et</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <p className="text-sm text-gray-700 mb-3">
              🎯 3 addımda onlayn mağazanızı yaradaq!
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                Məlumatlar
              </span>
              <span>→</span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                Marka
              </span>
              <span>→</span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                Təsdiq
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            🚀 Başlayaq
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Müraciət edərək şərtlərimizlə razılaşırsınız.
          </p>
        </form>
      </div>

      <OnboardingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmitSuccess={handleSuccess}
      />
    </>
  );
};
