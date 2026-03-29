import { LandingNavbar } from '../components/LandingNavbar';
import { LandingHero } from '../components/LandingHero';
import { LandingLogos } from '../components/LandingLogos';
import { LandingFeatureRow } from '../components/LandingFeatureRow';
import { LandingFeatureGrid } from '../components/LandingFeatureGrid';
import { LandingTestimonial } from '../components/LandingTestimonial';
import { LandingCTA } from '../components/LandingCTA';
import { LandingFooter } from '../components/LandingFooter';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#e5ff24] selection:text-black">
      <LandingNavbar />

      <main>
        <LandingHero />

        <LandingLogos />

        <LandingFeatureRow
          tag="OUR STATISTIC"
          title="Get Lead the way in Your Business Marketing"
          description="Unlock the full potential of your business with our cutting-edge marketing strategies designed to propel you ahead of the competition. At 'Lead the Way in Your Business Marketing,' we specialize in crafting innovative, results-driven marketing solutions tailored to your unique goals."
          image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000"
          stats={[
            { value: '120', label: 'Country around the world' },
            { value: '95%', label: 'Less time spent on data entry' },
            { value: '$2.6M', label: 'Annual savings from automations' }
          ]}
        />

        <LandingFeatureRow
          tag="OUR FEATURED"
          title="A Next-Gen App Platform Designed to Scale with You"
          description="End silos with unique platform that connects every part of your work. Enable those closest to the real-world details of your business to customize the apps that accelerate how work gets done."
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000"
          features={[
            'Transform your operations with Airtab',
            'Drive org-wide alignment through shared data',
            'Scale with confidence'
          ]}
        />

        <LandingFeatureGrid />

        <LandingFeatureRow
          tag="WHY CHOOSE US"
          title="Deploy, Govern, and Scale with Ease Confidently"
          description="Platformamız sizin onlayn mağazanızı tam nəzarətdə saxlamağınız üçün hər bir detalı nəzərə alıb. MilliKART və Pasha Bank ilə tam inteqrasiya."
          image="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=2000"
          reversed={true}
        />

        <LandingTestimonial />

        <LandingCTA />
      </main>

      <LandingFooter />
    </div>
  );
};