import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
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
  TrendingUp,
  Coins,
  Edit2,
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
}

export default function BudgetAnalyzer({ itinerary, className }: BudgetAnalyzerProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  // Logic to calculate initial total if not provided
  const initialTotal = useMemo(() => {
    const days = itinerary.duration || 1;
    const style = (itinerary.budgetStyle || itinerary.travelStyle || 'Standard').toLowerCase();
    const destination = itinerary.destination.toLowerCase();
    
    let totalFromAI = 0;
    if (itinerary.tourPrice && itinerary.tourPrice.amount) {
      const rawNumber = itinerary.tourPrice.amount.replace(/[^0-9]/g, '');
      totalFromAI = parseInt(rawNumber, 10) || 0;
    }

    if (totalFromAI > 0) return totalFromAI;

    // Pricing fallback engine
    const pricingEngine = {
      getTransport: (dest: string, tripStyle: string) => {
        let amount = 2500000;
        const isInternational = ['paris', 'tokyo', 'new york', 'london', 'zurich', 'singapore', 'bali', 'dubai'].some(r => dest.includes(r));
        if (isInternational) amount = 15000000;
        if (tripStyle.includes('luxury')) amount *= 3;
        return amount;
      },
      getDaily: (dest: string, tripStyle: string) => {
        let daily = 1500000;
        if (dest.includes('hanoi') || dest.includes('saigon')) daily *= 1.5;
        if (tripStyle.includes('budget')) daily *= 0.7;
        if (tripStyle.includes('luxury')) daily *= 3.5;
        return daily;
      }
    };

    const trans = pricingEngine.getTransport(destination, style);
    const daily = pricingEngine.getDaily(destination, style);
    return trans + (daily * days);
  }, [itinerary]);

  const currentTotal = manualTotal ?? initialTotal;

  // STRICT PERCENTAGES AND CALCULATION CONSISTENCY
  const budgetAnalysis = useMemo(() => {
    const total = currentTotal;
    const days = itinerary.duration || 1;
    const style = (itinerary.budgetStyle || itinerary.travelStyle || 'Standard').toLowerCase();

    const distribution = [
      { key: 'hotel', percent: 30, color: '#3B2A25', name: t('itinerary.bookingHotels'), icon: <Hotel size={18} /> },
      { key: 'flights', percent: 35, color: '#5A3E36', name: t('itinerary.bookingFlights'), icon: <Plane size={18} /> },
      { key: 'dining', percent: 15, color: '#A57C00', name: t('itinerary.bookingDining'), icon: <Utensils size={18} /> },
      { key: 'activities', percent: 10, color: '#D8CBBE', name: t('itinerary.bookingActivities'), icon: <Ticket size={18} /> },
      { key: 'transport', percent: 5, color: '#C4B5A6', name: t('itinerary.bookingTransport'), icon: <TrainFront size={18} /> },
      { key: 'contingency', percent: 5, color: '#7E766D', name: t('itinerary.contingency'), icon: <ShieldAlert size={18} /> },
    ];

    let allocatedAmount = 0;
    const categories: BudgetCategory[] = distribution.map((item, index) => {
      let amount = 0;
      // Last item absorbs rounding difference to ensure perfect 100% sum
      if (index === distribution.length - 1) {
        amount = total - allocatedAmount;
      } else {
        amount = Math.round((total * item.percent) / 100);
        allocatedAmount += amount;
      }

      return {
        name: item.name,
        amount: Math.max(0, amount),
        icon: item.icon,
        color: item.color,
        percentage: item.percent
      };
    });

    return {
      categories,
      total,
      perPerson: total,
      dailyAvg: total / days,
      level: style.includes('budget') ? 'Budget' : style.includes('luxury') ? 'Luxury' : style.includes('premium') ? 'Premium' : 'Standard'
    };
  }, [currentTotal, itinerary, t]);

  const formatVND = (amount: number) => {
    return Math.round(amount).toLocaleString('vi-VN') + '₫';
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
    setManualTotal(val);
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
        <div className="lg:col-span-12 xl:col-span-8 grid sm:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-luxury-espresso text-luxury-ivory p-8 rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={80} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">{t('itinerary.totalBudget')}</div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-luxury-gold"
              >
                <Edit2 size={14} />
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <input 
                    autoFocus
                    type="text"
                    value={currentTotal.toLocaleString('vi-VN')}
                    onChange={handleTotalChange}
                    onBlur={() => setIsEditing(false)}
                    className="w-full bg-transparent border-b border-luxury-gold/30 text-3xl font-serif font-bold text-luxury-ivory focus:outline-none focus:border-luxury-gold transition-colors"
                  />
                  <p className="text-[10px] text-luxury-gold/60 font-bold uppercase tracking-widest italic">{t('itinerary.editBudgetHint', { defaultValue: 'Cập nhật ngân sách để AI tối ưu hóa...' })}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={currentTotal}
                  className="text-3xl font-serif font-bold"
                >
                  {formatVND(budgetAnalysis.total)}
                </motion.div>
              )}
            </AnimatePresence>

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
            <motion.div 
              key={budgetAnalysis.dailyAvg}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-serif font-bold text-luxury-espresso"
            >
              {formatVND(budgetAnalysis.dailyAvg)}
            </motion.div>
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
            <div className="text-3xl font-serif font-bold text-green-700">-{formatVND(budgetAnalysis.total * 0.08)}</div>
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
                  key={cat.name}
                  layout
                  className="group bg-luxury-ivory p-6 rounded-3xl border border-luxury-beige/20 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-luxury-ivory shadow-lg",
                    )} style={{ backgroundColor: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-luxury-gold px-2 py-0.5 bg-luxury-gold/10 rounded-full border border-luxury-gold/20">{cat.percentage}%</span>
                      </div>
                      <div className="text-lg font-serif font-bold text-luxury-espresso mt-1">{formatVND(cat.amount)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-xs font-bold text-luxury-espresso/70">{cat.name}</span>
                  </div>
                  <div className="mt-auto h-1 w-full bg-luxury-beige/20 rounded-full overflow-hidden">
                    <motion.div 
                      key={`${cat.name}-${cat.percentage}-${currentTotal}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
