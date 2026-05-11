import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Globe, Sparkles } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
  onViewSaved?: () => void;
}

export default function Landing({ onStart, onViewSaved }: LandingProps) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden bg-luxury-bg flex flex-col min-h-screen">
      {/* Soft warm LED-like glow background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-luxury-beige/20 dark:bg-luxury-beige/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-luxury-cacao/5 dark:bg-luxury-cacao/10 rounded-full blur-[100px]" />
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-40 pb-20 md:pb-32 flex-1 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-luxury-ivory/60 dark:bg-luxury-ivory/10 border border-luxury-beige/50 text-luxury-cacao text-[10px] font-bold uppercase tracking-[0.3em] mb-10 shadow-sm transition-colors duration-500">
            <Sparkles size={14} />
            <span>{t('landing.badge')}</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[clamp(4rem,10vw,9rem)] font-serif font-bold leading-[1.2] tracking-tight text-luxury-espresso mb-10 whitespace-pre-line transition-all duration-700">
            {t('landing.titleMain')}
          </h1>
          
          <p className="text-lg md:text-xl text-luxury-espresso/70 mb-12 max-w-2xl leading-relaxed font-medium uppercase italic">
            {t('landing.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
            <button 
              onClick={onStart}
              className="group px-16 py-6 bg-luxury-espresso text-luxury-ivory rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-luxury-espresso/90 transition-all duration-500 shadow-xl shadow-luxury-espresso/10"
            >
              {t('landing.plan')}
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-500" size={18} />
            </button>
            <button 
              onClick={() => {
                // We need to trigger navigation in App.tsx. 
                // But Landing only has onStart.
                // I should probably add onNavigate to Landing props too.
                onViewSaved?.();
              }}
              className="px-12 py-6 bg-luxury-ivory/50 dark:bg-luxury-ivory/10 border border-luxury-beige rounded-full text-sm font-bold uppercase tracking-widest hover:bg-luxury-ivory dark:hover:bg-luxury-ivory/20 transition-all text-luxury-espresso duration-500"
            >
              {t('nav.saved')}
            </button>
          </div>
        </motion.div>

        <div className="mt-40 grid md:grid-cols-3 gap-16 border-t border-luxury-beige/30 pt-20">
          {[
            { icon: <Sparkles size={28} />, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
            { icon: <Globe size={28} />, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
            { icon: <ArrowRight size={28} />, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') }
          ].map((feature, i) => (
            <div key={i} className="group flex flex-col items-start cursor-default">
              <div className="w-16 h-16 bg-luxury-ivory/60 dark:bg-luxury-ivory/10 backdrop-blur-sm text-luxury-cacao rounded-[24px] flex items-center justify-center mb-10 border border-luxury-beige/20 group-hover:bg-luxury-ivory dark:group-hover:bg-luxury-ivory/20 group-hover:shadow-led transition-all duration-700">
                {feature.icon}
              </div>
              <h4 className="text-2xl font-serif font-bold mb-5 text-luxury-espresso">{feature.title}</h4>
              <p className="text-luxury-espresso/60 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

