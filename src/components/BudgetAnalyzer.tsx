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
  Coins
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
      // Remove dots, commas, currency symbols to get raw number
      const rawNumber = itinerary.tourPrice.amount.replace(/[^0-9]/g, '');
      totalFromAI = parseInt(rawNumber, 10) || 0;
      
      // If AI gave per person, we might want to scale if we knew guest count
      // For now assume the AI gives a representative price
    }

    // Base prices in VND (Approximate per person per day)
    let dailyBase = 1500000; 
    
    // Destination Intelligence
    const expensiveDestinations = ['paris', 'tokyo', 'new york', 'london', 'zurich', 'singapore', 'hanoi', 'saigon', 'hcmc', 'da nang', 'phu quoc', 'maldive', 'dubai'];
    if (expensiveDestinations.some(d => destination.includes(d))) dailyBase *= 1.8;
    
    // Style multiplier
    let mult = 1.0;
    if (style.includes('budget') || style.includes('tiết kiệm') || style.includes('modest')) mult = 0.6;
    else if (style.includes('premium') || style.includes('cao cấp')) mult = 1.8;
    else if (style.includes('luxury') || style.includes('sang trọng')) mult = 3.8;

    // Seasonal & Activity Analysis (AI logic)
    const activityCount = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);
    const activityComplexity = activityCount / days; // more activities = more cost
    if (activityComplexity > 4) mult *= 1.2;

    // Scaling Logic
    let total = totalFromAI;
    if (total === 0) {
      const hotelCost = dailyBase * 0.45 * mult * days;
      const flightCost = mult > 3 ? 12000000 : mult > 1.5 ? 5000000 : 2500000;
      const foodCost = dailyBase * 0.25 * mult * days;
      const activityCost = dailyBase * 0.2 * mult * days;
      const transportCost = dailyBase * 0.1 * mult * days;
      const contingency = (hotelCost + foodCost + activityCost + transportCost) * 0.08;
      total = hotelCost + flightCost + foodCost + activityCost + transportCost + contingency;
    }

    // Proportional breakdown based on total
    const hotelCost = total * 0.42;
    const flightCost = total * 0.18;
    const foodCost = total * 0.22;
    const activityCost = total * 0.12;
    const transportCost = total * 0.04;
    const contingency = total * 0.02;

    const categories: BudgetCategory[] = [
      { name: t('itinerary.bookingHotels'), amount: hotelCost, icon: <Hotel size={18} />, color: '#3B2A25', percentage: (hotelCost / total) * 100 },
      { name: t('itinerary.bookingFlights'), amount: flightCost, icon: <Plane size={18} />, color: '#5A3E36', percentage: (flightCost / total) * 100 },
      { name: t('itinerary.bookingDining'), amount: foodCost, icon: <Utensils size={18} />, color: '#A57C00', percentage: (foodCost / total) * 100 },
      { name: t('itinerary.bookingActivities'), amount: activityCost, icon: <Ticket size={18} />, color: '#D8CBBE', percentage: (activityCost / total) * 100 },
      { name: t('itinerary.bookingTransport'), amount: transportCost, icon: <Bus size={18} />, color: '#C4B5A6', percentage: (transportCost / total) * 100 },
      { name: t('itinerary.contingency'), amount: contingency, icon: <ShieldAlert size={18} />, color: '#7E766D', percentage: (contingency / total) * 100 },
    ];

    const savings = total * 0.12; 
    
    return {
      categories,
      total,
      savings,
      perPerson: total,
      dailyAvg: total / days,
      level: mult <= 0.7 ? 'Budget' : mult <= 1.5 ? 'Standard' : mult <= 2.5 ? 'Premium' : 'Luxury'
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
          <p className="text-sm text-luxury-cacao/60 font-medium italic">{t('itinerary.budgetAnalyzerSub')}</p>
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
        {/* Total Summary Card */}
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

        {/* Chart Section */}
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

        {/* Detailed Breakdown Items */}
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-luxury-espresso/70">{cat.name}</span>
                    <ChevronRight size={14} className="text-luxury-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-4 h-1 w-full bg-luxury-beige/20 rounded-full overflow-hidden">
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
