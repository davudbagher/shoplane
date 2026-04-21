import { useState, useRef, useEffect } from 'react';
import { superAdminApi } from '../../../shared/api';

// ─── Setup animation steps (longer, more realistic) ──────────────────────────
const SETUP_STEPS = [
  { label: 'Mağaza profili yaradılır...', done: 'Mağaza profili yaradıldı', ms: 4200 },
  { label: 'Subdomen konfiqurasiya edilir...', done: 'Subdomen aktiv', ms: 3800 },
  { label: 'Kateqoriyalar qurulur...', done: 'Kateqoriyalar hazır', ms: 3500 },
  { label: 'Marka rəngləri tətbiq edilir...', done: 'Dizayn tamamlandı', ms: 4000 },
  { label: 'Ödəniş metodları aktivləşdirilir...', done: 'Ödəniş aktiv', ms: 4500 },
  { label: 'Çatdırılma parametrləri qurulur...', done: 'Çatdırılma hazır', ms: 3600 },
  { label: 'SSL sertifikatı qurulur...', done: 'Sayt təhlükəsizdir', ms: 3900 },
  { label: 'Son tənzimləmələr edilir...', done: 'Mağaza hazırdır 🎉', ms: 3200 },
];

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];

// ─── Step illustrations ───────────────────────────────────────────────────────
const IllustrationStep1 = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48">
    <circle cx="100" cy="72" r="36" fill="#e0e7ff" />
    <circle cx="100" cy="65" r="22" fill="#a5b4fc" />
    <ellipse cx="100" cy="130" rx="44" ry="28" fill="#c7d2fe" />
    <rect x="56" y="128" width="88" height="48" rx="12" fill="#e0e7ff" />
    <rect x="66" y="148" width="30" height="6" rx="3" fill="#818cf8" />
    <rect x="66" y="160" width="50" height="5" rx="2.5" fill="#c7d2fe" />
    <rect x="110" y="148" width="26" height="6" rx="3" fill="#a5b4fc" />
    <circle cx="157" cy="52" r="14" fill="#fef3c7" />
    <path d="M151 52l4 4 8-8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="44" cy="100" r="10" fill="#fce7f3" />
    <path d="M40 100h8M44 96v8" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IllustrationStep2 = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48">
    <rect x="38" y="90" width="124" height="80" rx="10" fill="#e0e7ff" />
    <rect x="38" y="70" width="124" height="30" rx="8" fill="#a5b4fc" />
    <path d="M38 84h124" stroke="#818cf8" strokeWidth="1" />
    <rect x="55" y="110" width="36" height="44" rx="6" fill="#818cf8" />
    <rect x="102" y="118" width="46" height="18" rx="5" fill="#c7d2fe" />
    <rect x="102" y="142" width="30" height="5" rx="2" fill="#e0e7ff" />
    <rect x="50" y="60" width="100" height="18" rx="6" fill="#c7d2fe" />
    <rect x="78" y="57" width="44" height="10" rx="5" fill="#818cf8" />
    <circle cx="152" cy="155" r="16" fill="#fef3c7" />
    <path d="M146 155l4 4 8-8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IllustrationStep3 = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48">
    <circle cx="100" cy="100" r="54" fill="#f3f4f6" />
    <circle cx="100" cy="100" r="38" fill="white" />
    <circle cx="100" cy="62" r="10" fill="#818cf8" />
    <circle cx="133" cy="81" r="10" fill="#f472b6" />
    <circle cx="133" cy="119" r="10" fill="#34d399" />
    <circle cx="100" cy="138" r="10" fill="#fbbf24" />
    <circle cx="67" cy="119" r="10" fill="#60a5fa" />
    <circle cx="67" cy="81" r="10" fill="#fb923c" />
    <circle cx="100" cy="100" r="16" fill="#1e1b4b" />
    <circle cx="100" cy="100" r="7" fill="white" />
    <rect x="88" y="155" width="24" height="30" rx="4" fill="#e0e7ff" />
    <rect x="82" y="183" width="36" height="8" rx="4" fill="#c7d2fe" />
  </svg>
);

const IllustrationStep4 = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48">
    <rect x="30" y="68" width="140" height="88" rx="12" fill="#818cf8" />
    <rect x="30" y="68" width="140" height="30" rx="12" fill="#6366f1" />
    <rect x="30" y="86" width="140" height="12" fill="#6366f1" />
    <rect x="44" y="116" width="48" height="8" rx="4" fill="#e0e7ff" />
    <rect x="44" y="130" width="32" height="6" rx="3" fill="#c7d2fe" />
    <circle cx="145" cy="133" r="10" fill="#fbbf24" opacity=".9" />
    <circle cx="135" cy="133" r="10" fill="#f87171" opacity=".9" />
    <rect x="56" y="44" width="88" height="44" rx="10" fill="#c7d2fe" />
    <rect x="56" y="44" width="88" height="18" rx="10" fill="#a5b4fc" />
    <rect x="56" y="54" width="88" height="8" fill="#a5b4fc" />
    <rect x="68" y="72" width="36" height="6" rx="3" fill="#e0e7ff" />
    <rect x="68" y="82" width="24" height="5" rx="2.5" fill="#ddd6fe" />
  </svg>
);

const IllustrationLoading = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48">
    <circle cx="100" cy="100" r="60" fill="#e0e7ff" />
    <circle cx="100" cy="100" r="40" fill="#c7d2fe" />
    <circle cx="100" cy="100" r="22" fill="#818cf8" />
    <circle cx="100" cy="100" r="8" fill="white" />
    <rect x="96" y="36" width="8" height="16" rx="4" fill="#6366f1" />
    <rect x="96" y="148" width="8" height="16" rx="4" fill="#6366f1" />
    <rect x="36" y="96" width="16" height="8" rx="4" fill="#6366f1" />
    <rect x="148" y="96" width="16" height="8" rx="4" fill="#6366f1" />
    <rect x="54.1" y="51.7" width="8" height="16" rx="4" fill="#a5b4fc" transform="rotate(-45 54.1 51.7)" />
    <rect x="137.9" y="135.5" width="8" height="16" rx="4" fill="#a5b4fc" transform="rotate(-45 137.9 135.5)" />
    <rect x="51.7" y="137.9" width="8" height="16" rx="4" fill="#a5b4fc" transform="rotate(45 51.7 137.9)" />
    <rect x="135.5" y="54.1" width="8" height="16" rx="4" fill="#a5b4fc" transform="rotate(45 135.5 54.1)" />
  </svg>
);

const STEP_ILLUSTRATIONS = [IllustrationStep1, IllustrationStep2, IllustrationStep3, IllustrationStep4];
const STEP_BG_COLORS = ['#eef2ff', '#eef2ff', '#fdf4ff', '#fffbeb'];

// Per-step transition configs — shown after clicking Next between form steps
const STEP_TRANSITIONS = [
  {
    title: 'Sahibkar məlumatları yadda saxlanılır...',
    tasks: ['Əlaqə məlumatları yoxlanılır...', 'Profil yaradılır...'],
    ms: 5000,
  },
  {
    title: 'Mağaza konfiqurasiya edilir...',
    tasks: ['Subdomen ayrılır...', 'Mağaza strukturu qurulur...', 'Kateqoriyalar hazırlanır...'],
    ms: 6500,
  },
  {
    title: 'Marka tənzimləmələri tətbiq edilir...',
    tasks: ['Rənglər tətbiq edilir...', 'Vizual identifikasiya hazırlanır...'],
    ms: 5500,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export const OnboardingModal = ({ isOpen, onClose, onSubmitSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [uploadedBanner, setUploadedBanner] = useState(null);
  const [setupPhase, setSetupPhase] = useState(null); // null | 'configuring' | 'done'
  const [completedSteps, setCompletedSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Between-step transition state
  const [transitioning, setTransitioning] = useState(false);
  const [transitionTaskIndex, setTransitionTaskIndex] = useState(0);
  const transitionStepRef = useRef(0); // which step's transition is playing

  const totalSteps = 4;

  // Drive each final setup step using its own duration
  useEffect(() => {
    if (setupPhase !== 'configuring') return;
    if (completedSteps >= SETUP_STEPS.length) {
      const t = setTimeout(() => setSetupPhase('done'), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCompletedSteps(s => s + 1), SETUP_STEPS[completedSteps]?.ms ?? 2000);
    return () => clearTimeout(t);
  }, [setupPhase, completedSteps]);

  // Cycle through sub-tasks during between-step transition
  useEffect(() => {
    if (!transitioning) return;
    const tasks = STEP_TRANSITIONS[transitionStepRef.current - 1]?.tasks ?? [];
    if (transitionTaskIndex >= tasks.length - 1) return;
    const t = setTimeout(
      () => setTransitionTaskIndex(i => i + 1),
      (STEP_TRANSITIONS[transitionStepRef.current - 1]?.ms ?? 2600) / tasks.length,
    );
    return () => clearTimeout(t);
  }, [transitioning, transitionTaskIndex]);

  const [formData, setFormData] = useState({
    full_name: '', email: '', whatsapp: '', phone: '',
    shop_name: '', shop_name_az: '', category: '', subdomain_preference: '',
    instagram_url: '', location_address: '', google_maps_link: '',
    business_description: '', current_revenue: '', employee_count: '',
    currently_selling_online: false, other_platforms: '',
    logo_url: '', banner_url: '', primary_color: '#6366f1', secondary_color: '#10b981',
    want_cod: true, want_millikart: true, want_birbank: false, want_pasha_pay: false,
    tax_id: '', legal_name: '', iban: '',
    delivery_courier: true, delivery_pickup: false, delivery_cities: '', delivery_notes: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const response = await superAdminApi.uploadImage(fd);
      if (type === 'logo') setUploadedLogo(response.url);
      else setUploadedBanner(response.url);
    } catch {
      alert('Şəkil yüklənərkən xəta baş verdi');
    }
  };

  // Clicking Next triggers a transition animation, then advances the step
  const handleNext = () => {
    if (loading) return; // prevent clicks during submit
    if (currentStep >= totalSteps) return;
    const cfg = STEP_TRANSITIONS[currentStep - 1];
    if (!cfg) { setCurrentStep(s => s + 1); return; }

    transitionStepRef.current = currentStep;
    setTransitionTaskIndex(0);
    setTransitioning(true);

    setTimeout(() => {
      setTransitioning(false);
      setCurrentStep(s => s + 1);
    }, cfg.ms);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Strip non-schema fields that exist in DB but not in LeadBase schema
      const payload = { ...formData, logo_url: uploadedLogo, banner_url: uploadedBanner };
      delete payload.current_revenue;
      delete payload.employee_count;
      delete payload.currently_selling_online;
      delete payload.other_platforms;

      await superAdminApi.submitLead(payload);
      setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
      setSetupPhase('configuring');
      setCompletedSteps(0);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        alert(`Xəta baş verdi:\n${detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n')}`);
      } else if (typeof detail === 'string') {
        alert(`Xəta: ${detail}`);
      } else {
        alert('Müraciət göndərilərkən xəta baş verdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    if (step === 1) return !!(formData.full_name && formData.whatsapp);
    if (step === 2) return !!formData.shop_name;
    return true;
  };

  if (!isOpen) return null;

  const isSetupScreen = setupPhase === 'configuring' || setupPhase === 'done';
  const IllustrationCurrent = STEP_ILLUSTRATIONS[currentStep - 1] ?? IllustrationStep1;
  const leftBg = isSetupScreen ? '#eef2ff' : STEP_BG_COLORS[currentStep - 1];

  const stepLabels = ['Sahibkar', 'Mağaza', 'Marka', 'Ödəniş'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg);  opacity: 1; }
          100% { transform: translateY(380px) rotate(720deg); opacity: 0; }
        }
        @keyframes checkmark-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .setup-spin { animation: spin-slow 3s linear infinite; }
        .field-input {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          background: white;
        }
        textarea.field-input { height: auto; padding: 10px 14px; }
        select.field-input { cursor: pointer; }
      `}</style>

      <div
        className="bg-white rounded-3xl shadow-2xl w-full overflow-hidden flex"
        style={{ maxWidth: 820, minHeight: 520 }}
      >

        {/* ── Left panel ── */}
        <div
          className="hidden md:flex w-2/5 flex-col items-center justify-center p-10 transition-colors duration-500"
          style={{ backgroundColor: leftBg }}
        >
          {isSetupScreen ? (
            <div className="flex flex-col items-center gap-4">
              <div className="setup-spin">
                <IllustrationLoading />
              </div>
              <p className="text-indigo-600 font-semibold text-sm text-center">
                {setupPhase === 'done' ? 'Hazırdır!' : 'Konfiqurasiya edilir...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <IllustrationCurrent />
              <div className="text-center">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  Addım {currentStep} / {totalSteps}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stepLabels[currentStep - 1]}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col">

          {/* Top bar: step indicators + close */}
          <div className="flex items-center justify-between px-8 pt-7 pb-2">
            {!isSetupScreen ? (
              <div className="flex items-center gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i + 1 === currentStep ? 28 : 8,
                      height: 8,
                      backgroundColor: i + 1 <= currentStep ? '#6366f1' : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {SETUP_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: 8,
                      backgroundColor: i < completedSteps ? '#10b981' : i === completedSteps ? '#6366f1' : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            )}

            {!isSetupScreen && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Setup / Done screen ── */}
          {isSetupScreen && (
            <div className="flex-1 flex flex-col justify-center px-8 py-6 relative overflow-hidden">

              {setupPhase === 'done' && Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute', top: 0,
                    left: `${(i * 4.7) % 100}%`,
                    width: i % 3 === 0 ? 9 : 7,
                    height: i % 3 === 0 ? 9 : 13,
                    borderRadius: i % 2 === 0 ? '50%' : '2px',
                    backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    animation: `confetti-fall ${1.3 + (i % 6) * 0.2}s ease-in ${(i % 8) * 0.09}s forwards`,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {setupPhase === 'done' && (
                <div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5 mx-auto"
                  style={{ animation: 'checkmark-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                >
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                {setupPhase === 'done' ? 'Təbriklər! 🎉' : 'Mağazanız qurulur...'}
              </h2>
              <p className="text-sm text-gray-400 mb-6 text-center">
                {setupPhase === 'done'
                  ? `Qeydiyyat ${elapsedTime} saniyəyə tamamlandı`
                  : 'Zəhmət olmasa gözləyin, bu bir neçə saniyə çəkəcək'}
              </p>

              <div className="space-y-3 mb-4">
                {SETUP_STEPS.map((step, i) => {
                  const isDone = i < completedSteps;
                  const isActive = i === completedSteps && setupPhase === 'configuring';
                  // The step just finished (one behind active) gets a brief "completing" spinner
                  const isJustDone = i === completedSteps - 1 && setupPhase === 'configuring';
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={
                          isDone ? 'text-green-600 font-medium' :
                          isActive ? 'text-indigo-600 font-medium' : 'text-gray-300'
                        }>
                          {isDone ? `✓ ${step.done}` : step.label.replace('...', isActive ? '...' : '')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {isJustDone && (
                            <span className="inline-block w-3 h-3 rounded-full border-2 border-green-300 border-t-green-500 animate-spin" />
                          )}
                          {isDone && !isJustDone && (
                            <span className="text-green-500 font-bold">100%</span>
                          )}
                          {isActive && (
                            <span className="inline-block w-3 h-3 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: isDone ? '#10b981' : isActive ? '#818cf8' : 'transparent',
                            width: isDone ? '100%' : '0%',
                            animation: isActive ? `progress-fill ${step.ms - 200}ms ease-out forwards` : undefined,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {setupPhase === 'done' && (
                <div
                  className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2"
                  style={{ animation: 'fade-up 0.5s ease-out forwards' }}
                >
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Növbəti addımlar</p>
                  <p className="text-xs text-indigo-600">📞 48 saat ərzində WhatsApp ilə əlaqə saxlayacağıq</p>
                  <p className="text-xs text-indigo-600">🔑 Giriş məlumatlarınız e-poçtunuza göndəriləcək</p>
                  <p className="text-xs text-indigo-600">🚀 Mağazanız hazır olduqda bildiriş alacaqsınız</p>
                  <button
                    onClick={() => { onSubmitSuccess?.(); onClose(); }}
                    className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Bağla
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Between-step transition screen ── */}
          {!isSetupScreen && transitioning && (() => {
            const cfg = STEP_TRANSITIONS[transitionStepRef.current - 1];
            const tasks = cfg?.tasks ?? [];
            return (
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-10"
                style={{ animation: 'fade-up 0.25s ease-out' }}>
                {/* Outer ring spinner */}
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-300"
                    style={{ animation: 'spin 1.4s linear infinite reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
                  </div>
                </div>

                <p className="text-base font-semibold text-gray-800 mb-2 text-center">{cfg?.title}</p>
                <p className="text-sm text-indigo-500 font-medium mb-8 text-center animate-pulse">
                  {tasks[transitionTaskIndex] ?? tasks[tasks.length - 1]}
                </p>

                {/* Sub-task checklist */}
                <div className="w-full max-w-xs space-y-2">
                  {tasks.map((task, i) => {
                    const done = i < transitionTaskIndex;
                    const active = i === transitionTaskIndex;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          done ? 'bg-green-100' : active ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          {done ? (
                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : active ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span className={`text-xs transition-colors duration-300 ${
                          done ? 'text-green-600 line-through' : active ? 'text-indigo-600 font-medium' : 'text-gray-300'
                        }`}>{task}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Form body + footer (hidden while transitioning) ── */}
          {!isSetupScreen && !transitioning && (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-4">

                {/* STEP 1 */}
                {currentStep === 1 && (
                  <div style={{ animation: 'fade-up 0.3s ease-out' }}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Sahibkar Məlumatları</h2>
                    <p className="text-sm text-gray-400 mb-6">Mağaza sahibinin əsas əlaqə məlumatlarını daxil edin.</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Ad və Soyad *">
                          <input name="full_name" value={formData.full_name} onChange={handleChange}
                            placeholder="Əli Məmmədov"
                            className="field-input" />
                        </Field>
                        <Field label="WhatsApp *">
                          <input name="whatsapp" value={formData.whatsapp} onChange={handleChange}
                            placeholder="+994 50 123 45 67"
                            className="field-input" />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Email">
                          <input name="email" type="email" value={formData.email} onChange={handleChange}
                            placeholder="email@example.com"
                            className="field-input" />
                        </Field>
                        <Field label="Əlavə Telefon">
                          <input name="phone" value={formData.phone} onChange={handleChange}
                            placeholder="+994 12 345 67 89"
                            className="field-input" />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                  <div style={{ animation: 'fade-up 0.3s ease-out' }}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Mağaza Məlumatları</h2>
                    <p className="text-sm text-gray-400 mb-6">Mağazanızı düzgün qurmaq üçün bir neçə sual.</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Mağaza Adı *">
                          <input name="shop_name" value={formData.shop_name} onChange={handleChange}
                            placeholder="Cheechak Boutique"
                            className="field-input" />
                        </Field>
                        <Field label="Subdomen Tərcih">
                          <div className="flex items-center gap-1">
                            <input name="subdomain_preference" value={formData.subdomain_preference} onChange={handleChange}
                              placeholder="cheechak"
                              className="field-input" />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">cheechak.1line.az olacaq</p>
                        </Field>
                      </div>

                      <Field label="Sahə / Kateqoriya">
                        <select name="category" value={formData.category} onChange={handleChange} className="field-input">
                          <option value="">Seçin...</option>
                          <option value="clothing">Geyim və Aksessuarlar</option>
                          <option value="electronics">Elektronika</option>
                          <option value="home">Ev və Bağ</option>
                          <option value="beauty">Gözəllik və Sağlamlıq</option>
                          <option value="food">Qida və Restoran</option>
                          <option value="sports">İdman və Aktivlik</option>
                          <option value="toys">Uşaq və Oyuncaqlar</option>
                          <option value="other">Digər</option>
                        </select>
                      </Field>

                      <Field label="Instagram URL">
                        <input name="instagram_url" value={formData.instagram_url} onChange={handleChange}
                          placeholder="https://instagram.com/shopname"
                          className="field-input" />
                      </Field>

                      <Field label="Biznes Haqqında">
                        <textarea name="business_description" value={formData.business_description}
                          onChange={handleChange} rows={3}
                          placeholder="Məhsullarınız, hədəf auditoriya, fərqli cəhətləriniz..."
                          className="field-input resize-none" />
                        <p className="text-xs text-gray-400 mt-1">SEO meta-description üçün istifadə ediləcək.</p>
                      </Field>

                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Aylıq Gəlir (Təxmini)">
                          <select name="current_revenue" value={formData.current_revenue} onChange={handleChange} className="field-input">
                            <option value="">Seçin...</option>
                            <option value="<1000">1,000 AZN-dən az</option>
                            <option value="1000-3000">1,000 – 3,000 AZN</option>
                            <option value="3000-10000">3,000 – 10,000 AZN</option>
                            <option value="10000+">10,000+ AZN</option>
                          </select>
                        </Field>
                        <Field label="İşçi Sayı">
                          <select name="employee_count" value={formData.employee_count} onChange={handleChange} className="field-input">
                            <option value="">Seçin...</option>
                            <option value="1">Tək nəfər</option>
                            <option value="2-5">2–5 nəfər</option>
                            <option value="6-20">6–20 nəfər</option>
                            <option value="20+">20+ nəfər</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                  <div style={{ animation: 'fade-up 0.3s ease-out' }}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Marka Kimliyi</h2>
                    <p className="text-sm text-gray-400 mb-6">Mağazanızın görünüşünü fərdiləşdirin.</p>
                    <div className="space-y-5">

                      {/* Logo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Loqo</label>
                        <label htmlFor="logo-upload"
                          className="flex items-center gap-4 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 transition-colors group">
                          {uploadedLogo ? (
                            <img src={uploadedLogo} alt="Logo" className="h-14 w-14 object-contain rounded-lg bg-gray-50 p-1" />
                          ) : (
                            <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                              {uploadedLogo ? 'Loqo yükləndi — dəyişmək üçün klikləyin' : 'Loqo yüklə'}
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG • Maks. 2MB</p>
                          </div>
                          <input type="file" id="logo-upload" accept="image/*" className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files?.[0], 'logo')} />
                        </label>
                      </div>

                      {/* Colors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Əsas Rəng</label>
                          <div className="flex items-center gap-3">
                            <input type="color" name="primary_color" value={formData.primary_color}
                              onChange={handleChange}
                              className="h-11 w-14 rounded-xl border border-gray-200 cursor-pointer p-1" />
                            <input type="text" name="primary_color" value={formData.primary_color}
                              onChange={handleChange}
                              className="field-input font-mono flex-1" placeholder="#6366f1" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Köməkçi Rəng</label>
                          <div className="flex items-center gap-3">
                            <input type="color" name="secondary_color" value={formData.secondary_color}
                              onChange={handleChange}
                              className="h-11 w-14 rounded-xl border border-gray-200 cursor-pointer p-1" />
                            <input type="text" name="secondary_color" value={formData.secondary_color}
                              onChange={handleChange}
                              className="field-input font-mono flex-1" placeholder="#10b981" />
                          </div>
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="h-10 flex items-center px-4 gap-3" style={{ backgroundColor: formData.primary_color }}>
                          {uploadedLogo
                            ? <img src={uploadedLogo} alt="" className="h-6 w-6 object-contain rounded" />
                            : <div className="h-6 w-6 bg-white/30 rounded" />}
                          <span className="text-white text-sm font-semibold truncate">{formData.shop_name || 'Mağaza Adı'}</span>
                        </div>
                        <div className="p-3 bg-gray-50 flex gap-2">
                          <div className="flex-1 h-8 bg-white rounded-lg border border-gray-100" />
                          <div className="h-8 w-20 rounded-lg text-xs font-semibold text-white flex items-center justify-center"
                            style={{ backgroundColor: formData.secondary_color }}>
                            Sifariş et
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {currentStep === 4 && (
                  <div style={{ animation: 'fade-up 0.3s ease-out' }}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Ödəniş & Çatdırılma</h2>
                    <p className="text-sm text-gray-400 mb-6">Müştəriləriniz necə ödəyəcək, məhsullar necə çatdırılacaq?</p>

                    <div className="space-y-5">
                      {/* Payment */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Ödəniş Metodları</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'want_cod', label: 'Nağd (COD)', sub: 'Ən populyar', icon: '💵' },
                            { name: 'want_millikart', label: 'MilliKart', sub: 'Kartla onlayn', icon: '💳' },
                            { name: 'want_birbank', label: 'BirBank', sub: 'Mobil bank', icon: '📱' },
                            { name: 'want_pasha_pay', label: 'Pasha Pay', sub: 'Rəqəmsal cüzdan', icon: '💰' },
                          ].map(({ name, label, sub, icon }) => (
                            <label key={name}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                formData[name] ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                              }`}>
                              <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} className="sr-only" />
                              <span className="text-xl">{icon}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{label}</p>
                                <p className="text-xs text-gray-400">{sub}</p>
                              </div>
                              {formData[name] && (
                                <div className="ml-auto w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Delivery */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Çatdırılma Növü</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {[
                            { name: 'delivery_courier', label: 'Kuryer', icon: '🛵' },
                            { name: 'delivery_pickup', label: 'Mağazadan Götür', icon: '🏪' },
                          ].map(({ name, label, icon }) => (
                            <label key={name}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                formData[name] ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                              }`}>
                              <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} className="sr-only" />
                              <span className="text-xl">{icon}</span>
                              <span className="text-sm font-medium text-gray-900">{label}</span>
                              {formData[name] && (
                                <div className="ml-auto w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                        <input type="text" name="delivery_cities" value={formData.delivery_cities} onChange={handleChange}
                          placeholder="Çatdırma şəhərləri: Bakı, Sumqayıt, Gəncə..."
                          className="field-input" />
                      </div>

                      {/* Optional business info */}
                      <details className="group">
                        <summary className="text-sm font-medium text-gray-500 cursor-pointer select-none list-none flex items-center gap-2">
                          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                          Biznes məlumatları (VÖEN, IBAN — istəyə görə)
                        </summary>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <Field label="VÖEN">
                            <input name="tax_id" value={formData.tax_id} onChange={handleChange} placeholder="1234567890" className="field-input" />
                          </Field>
                          <Field label="IBAN">
                            <input name="iban" value={formData.iban} onChange={handleChange} placeholder="AZ20010000..." className="field-input" />
                          </Field>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100">
                <button
                  onClick={currentStep === 1 ? onClose : () => setCurrentStep(s => s - 1)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-4 py-2 rounded-xl hover:bg-gray-100"
                >
                  {currentStep === 1 ? 'Ləğv et' : 'Geri'}
                </button>

                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    disabled={!validateStep(currentStep)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Növbəti
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Göndərilir...</>
                    ) : (
                      <><span>Müraciəti Göndər</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg></>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Small helper ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);
