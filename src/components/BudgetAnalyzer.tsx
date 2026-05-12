import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Hotel, 
  Plane, 
  Utensils, 
  Ticket, 
  Bus, 
  ShieldAlert, 
  PieChart as PieChartIcon, 
  Sparkles,
  TrendingDown,
  ChevronRight,
  TrendingUp,
  Coins,
  Car,
  Clock,
  TrainFront
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Itinerary } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface BudgetAnalyzerProps {
  itinerary: Itinerary;
  className?: string;
}

interface BudgetCategory {
  name: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
  percentage: number;
  extraInfo?: string;
}

export default function BudgetAnalyzer({ itinerary, className }: BudgetAnalyzerProps) {
  const { t } = useTranslation();

  const budgetAnalysis = useMemo(() => {
    const days = itinerary.duration || 1;
    const style = (itinerary.budgetStyle || itinerary.travelStyle || 'Standard').toLowerCase();
    const destination = itinerary.destination.toLowerCase();
    
    // AI Data Extraction
    let totalFromAI = 0;
    if (itinerary.tourPrice && itinerary.tourPrice.amount) {
      const rawNumber = itinerary.tourPrice.amount.replace(/[^0-9]/g, '');
      totalFromAI = parseInt(rawNumber, 10) || 0;
    }

    // Pricing Intelligence Engine
    const pricingEngine = {
      getTransportInfo: (dest: string, tripStyle: string) => {
        let amount = 2500000; 
        let confidence = 'High';
        let mode = 'plane';
        let time = '2h';
        let label = t('itinerary.transportModes.plane');
        let icon = <Plane size={18} />;

        // Distance & Feasibility Check
        const isThaiBinh = dest.includes('thái bình') || dest.includes('thai binh');
        const isHanoi = dest.includes('hà nội') || dest.includes('hanoi');
        const isSaigon = dest.includes('sài gòn') || dest.includes('hcmc') || dest.includes('saigon');
        const isDaNang = dest.includes('đà nẵng') || dest.includes('da nang');

        // Logic for specific routes (Simulated Distance Engine)
        if (isThaiBinh) {
          mode = 'limousine';
          amount = 250000;
          time = '1.5h - 2h';
          label = t('itinerary.transportModes.limousine');
          icon = <Bus size={18} />;
        } else if (isHanoi && (dest.includes('hòa bình') || dest.includes('ninh bình') || dest.includes('vĩnh phúc'))) {
          mode = 'car';
          amount = 500000;
          time = '1.5h';
          label = t('itinerary.transportModes.car');
          icon = <Car size={18} />;
        } else {
          // Region Identification
          const isSEA = ['thailand', 'singapore', 'malaysia', 'bali', 'indonesia', 'philippines', 'cambodia', 'laos'].some(r => dest.includes(r));
          const isAsia = ['japan', 'korea', 'china', 'taiwan', 'hong kong', 'india', 'dubai', 'maldives'].some(r => dest.includes(r));
          const isWestern = ['usa', 'america', 'europe', 'france', 'paris', 'london', 'uk', 'germany', 'switzerland', 'australia', 'canada'].some(r => dest.includes(r));
          
          if (isWestern) {
            amount = 35000000; 
            confidence = 'Medium';
            time = '12h-18h';
          } else if (isAsia) {
            amount = 12000000;
            time = '4h-6h';
          } else if (isSEA) {
            amount = 5000000;
            time = '2h-3h';
          } else {
            // Far Domestic
            const isFarDomestic = (isSaigon || isDaNang || dest.includes('phú quốc') || dest.includes('con dao'));
            amount = isFarDomestic ? 3500000 : 1800000;
            time = '1h-2h';
          }
        }

        // Style multiplier
        if (tripStyle.includes('luxury')) amount *= 3.5;
        else if (tripStyle.includes('premium')) amount *= 1.8;
        
        return { amount, confidence, mode, time, label, icon };
      },
      
      getDailyBase: (dest: string, tripStyle: string) => {
        let daily = 1200000; 
        const expensiveDestinations = ['paris', 'tokyo', 'new york', 'london', 'zurich', 'singapore', 'hanoi', 'saigon', 'hcmc', 'da nang', 'phu quoc', 'maldive', 'dubai', 'venice', 'rome'];
        if (expensiveDestinations.some(d => dest.includes(d))) daily *= 2.2;
        
        if (tripStyle.includes('budget')) daily *= 0.65;
        else if (tripStyle.includes('premium')) daily *= 1.8;
        else if (tripStyle.includes('luxury')) daily *= 4.2;

        return daily;
      }
    };

    const transInfo = pricingEngine.getTransportInfo(destination, style);
    const dailyBase = pricingEngine.getDailyBase(destination, style);
    
    let mult = 1.0;
    if (style.includes('budget')) mult = 0.7;
    else if (style.includes('premium')) mult = 1.8;
    else if (style.includes('luxury')) mult = 4.0;

    const activityCount = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);
    const activityComplexity = Math.max(1, activityCount / days);
    
    let total = totalFromAI;
    if (total === 0) {
      const hotelCost = dailyBase * 0.45 * days;
      const flightCost = transInfo.amount;
      const foodCost = dailyBase * 0.3 * days;
      const activityCost = dailyBase * 0.15 * activityComplexity * days;
      const transportCost = dailyBase * 0.1 * days;
      const contingency = (hotelCost + foodCost + activityCost + transportCost) * 0.1;
      total = hotelCost + flightCost + foodCost + activityCost + transportCost + contingency;
    }

    const hotelCost = total * 0.40;
    const flightCost = total * 0.22;
    const foodCost = total * 0.20;
    const activityCost = total * 0.10;
    const transportCost = total * 0.05;
    const contingency = total * 0.03;

    const categories: BudgetCategory[] = [
      { name: t('itinerary.bookingHotels'), amount: hotelCost, icon: <Hotel size={18} />, color: '#3B2A25', percentage: (hotelCost / total) * 100 },
      { 
        name: t('itinerary.bookingFlights'), 
        amount: flightCost, 
        icon: transInfo.icon, 
        color: '#5A3E36', 
        percentage: (flightCost / total) * 100,
        extraInfo: `${transInfo.label} • ~${transInfo.time}` 
      },
      { name: t('itinerary.bookingDining'), amount: foodCost, icon: <Utensils size={18} />, color: '#A57C00', percentage: (foodCost / total) * 100 },
      { name: t('itinerary.bookingActivities'), amount: activityCost, icon: <Ticket size={18} />, color: '#D8CBBE', percentage: (activityCost / total) * 100 },
      { name: t('itinerary.bookingTransport'), amount: transportCost, icon: <Bus size={18} />, color: '#C4B5A6', percentage: (transportCost / total) * 100 },
      { name: t('itinerary.contingency'), amount: contingency, icon: <ShieldAlert size={18} />, color: '#7E766D', percentage: (contingency / total) * 100 },
    ];

    const savings = total * 0.08; 
    
    return {
      categories,
      total,
      savings,
      perPerson: total,
      dailyAvg: total / days,
      level: mult <= 0.7 ? 'Budget' : mult <= 1.5 ? 'Standard' : mult <= 2.5 ? 'Premium' : 'Luxury',
      confidence: transInfo.confidence,
      transMode: transInfo.label,
      transTime: transInfo.time
    };
  }, [itinerary, t]);

  const formatVND = (amount: number) => {
    return Math.round(amount).toLocaleString('vi-VN') + '₫';
  };

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-luxury-beige/30 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Coins className="text-luxury-gold" size={24} />
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-luxury-espresso">{t('itinerary.budgetAnalyzerTitle')}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-luxury-cacao/60 font-medium italic">{t('itinerary.budgetAnalyzerSub')}</p>
            <div className="flex items-center gap-2 bg-luxury-gold/10 px-3 py-1 rounded-full border border-luxury-gold/20">
              <Sparkles size={12} className="text-luxury-gold" />
              <span className="text-[10px] font-bold text-luxury-gold uppercase tracking-wider">{t('itinerary.marketPriceLabel')}</span>
            </div>
            <div className="flex items-center gap-2 bg-luxury-espresso/5 px-3 py-1 rounded-full border border-luxury-espresso/10">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                budgetAnalysis.confidence === 'High' ? "bg-green-500" : "bg-amber-500"
              )} />
              <span className="text-[10px] font-bold text-luxury-espresso/60 uppercase tracking-wider">
                {t('itinerary.confidenceLabel')}: {budgetAnalysis.confidence === 'High' ? t('itinerary.confidenceHigh') : t('itinerary.confidenceMed')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg border",
            budgetAnalysis.level === 'Budget' ? "bg-green-100 text-green-700 border-green-200" :
            budgetAnalysis.level === 'Luxury' ? "bg-luxury-espresso text-luxury-gold border-luxury-gold/30" :
            "bg-luxury-beige/20 text-luxury-espresso border-luxury-beige/30"
          )}>
            {t('itinerary.mode')} {budgetAnalysis.level === 'Budget' ? t('setup.step4.budget.modest.label') : 
             budgetAnalysis.level === 'Standard' ? t('setup.step4.budget.balanced.label') : 
             budgetAnalysis.level === 'Premium' ? t('setup.step4.budget.luxury.label') : 
             t('setup.step4.budget.luxury.label')}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-8 grid sm:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-luxury-espresso text-luxury-ivory p-8 rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={80} />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">{t('itinerary.totalBudget')}</div>
            <div className="text-3xl font-serif font-bold">{formatVND(budgetAnalysis.total)}</div>
            <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-luxury-gold">
              <Sparkles size={14} />
              <span>{t('itinerary.groupEstimate')}</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/60 backdrop-blur-xl border border-luxury-beige/30 p-8 rounded-[40px] space-y-6 shadow-xl"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-cacao/60">{t('itinerary.perPersonDay')}</div>
            <div className="text-3xl font-serif font-bold text-luxury-espresso">{formatVND(budgetAnalysis.dailyAvg)}</div>
            <div className="pt-4 border-t border-luxury-beige/20 flex items-center gap-2 text-xs text-luxury-cacao/60">
              <div className="w-1.5 h-1.5 bg-luxury-gold rounded-full" />
              <span>{t('itinerary.avgSpend')}</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-green-50/50 backdrop-blur-xl border border-green-200/50 p-8 rounded-[40px] space-y-6 shadow-xl"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-800/60">{t('itinerary.estimatedSavings')}</div>
            <div className="text-3xl font-serif font-bold text-green-700">-{formatVND(budgetAnalysis.savings)}</div>
            <div className="pt-4 border-t border-green-200/30 flex items-center gap-2 text-xs text-green-600">
              <TrendingDown size={14} />
              <span>{t('itinerary.smartOptimization')}</span>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 bg-luxury-ivory p-8 rounded-[40px] border border-luxury-beige/30 shadow-xl min-h-[400px] flex flex-col items-center justify-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-cacao/40 mb-8 self-start">{t('itinerary.costBreakdown')}</div>
          <div className="w-full h-full flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={budgetAnalysis.categories}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="amount"
                  stroke="none"
                >
                  {budgetAnalysis.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatVND(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full pt-8">
            {budgetAnalysis.categories.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-espresso/60">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-12 bg-white/40 backdrop-blur-md border border-luxury-beige/30 rounded-[48px] overflow-hidden">
          <div className="p-8 md:p-12 space-y-10">
            <div className="flex items-center gap-4">
              <PieChartIcon size={20} className="text-luxury-gold" />
              <h3 className="text-xl font-serif font-bold text-luxury-espresso">{t('itinerary.itemizedExpenses')}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {budgetAnalysis.categories.map((cat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-luxury-ivory p-6 rounded-3xl border border-luxury-beige/20 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-luxury-ivory shadow-lg transition-transform group-hover:scale-110 duration-500",
                    )} style={{ backgroundColor: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-luxury-cacao/40 uppercase tracking-widest">{cat.percentage.toFixed(0)}% {t('itinerary.ofTotal')}</div>
                      <div className="text-lg font-serif font-bold text-luxury-espresso">{formatVND(cat.amount)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-xs font-bold text-luxury-espresso/70">{cat.name}</span>
                    {cat.extraInfo && (
                      <div className="flex items-center gap-2 text-[9px] text-luxury-gold font-bold uppercase tracking-wider">
                        <Clock size={10} />
                        <span>{cat.extraInfo}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto h-1 w-full bg-luxury-beige/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-10 border-t border-luxury-beige/30 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-luxury-espresso text-luxury-gold rounded-full flex items-center justify-center shadow-xl">
                  <Coins size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-luxury-espresso">{t('itinerary.budgetInsightTitle')}</h4>
                  <p className="text-xs text-luxury-cacao/60 italic">{t('itinerary.budgetInsightDesc', { days: itinerary.days.length, destination: itinerary.destination })}</p>
                </div>
              </div>
              <button className="px-10 py-5 bg-luxury-espresso text-luxury-ivory rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-espresso/90 transition-all shadow-xl shadow-luxury-espresso/20 flex items-center gap-3">
                <TrendingDown size={14} />
                {t('itinerary.optimizeFurther')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
