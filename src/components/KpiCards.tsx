import React from "react";
import { SummaryMetrics } from "../types";
import { 
  ShoppingBag,
  Target,
  Activity,
  RotateCcw,
  Tag,
  AlertTriangle
} from "lucide-react";

interface KpiCardsProps {
  metrics: SummaryMetrics;
}

export default function KpiCards({ metrics }: KpiCardsProps) {
  // Format currency helpers
  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}k`;
    }
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      
      {/* Card 1: Total Net Sales (Emerald / Mint) */}
      <div id="kpi-net-sales" className="bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-2xl p-4.5 flex flex-col items-center justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden min-h-[120px] text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1.5 shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight block">
            {formatCurrency(metrics.netSales)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
            Net Sales
          </span>
          <span className="text-[9px] font-semibold text-emerald-600 block mt-1 bg-emerald-100/50 px-1.5 py-0.5 rounded">
            {metrics.transactionsCount.toLocaleString()} Orders
          </span>
        </div>
        {/* SVG Sparkline Background */}
        <svg className="absolute bottom-0 left-0 right-0 h-6 w-full text-emerald-200/30 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 30 C 20 20, 40 5, 60 25 C 80 10, 90 12, 100 4 L 100 30 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Card 2: Target Achievement (Sky / Blue) */}
      <div id="kpi-target-achievement" className="bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-2xl p-4.5 flex flex-col items-center justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden min-h-[120px] text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center mb-1.5 shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight block">
            {metrics.targetAchievement.toFixed(1)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
            Target Achievement
          </span>
          <span className="text-[9px] font-semibold text-sky-600 block mt-1 bg-sky-100/50 px-1.5 py-0.5 rounded truncate max-w-full">
            Goal: {formatCurrency(metrics.targetSales)}
          </span>
        </div>
        {/* SVG Sparkline Background */}
        <svg className="absolute bottom-0 left-0 right-0 h-6 w-full text-sky-200/30 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 30 C 10 20, 30 15, 50 25 C 70 12, 85 8, 100 16 L 100 30 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Card 3: Conversion Rate (Purple) */}
      <div id="kpi-conversion-rate" className="bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-2xl p-4.5 flex flex-col items-center justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden min-h-[120px] text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mb-1.5 shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight block">
            {metrics.conversionRate.toFixed(1)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
            Conversion Rate
          </span>
          <span className="text-[9px] font-semibold text-purple-600 block mt-1 bg-purple-100/50 px-1.5 py-0.5 rounded">
            Optimized Traffic
          </span>
        </div>
        {/* SVG Sparkline Background */}
        <svg className="absolute bottom-0 left-0 right-0 h-6 w-full text-purple-200/30 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 30 C 15 28, 30 18, 45 22 C 60 8, 80 15, 100 6 L 100 30 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Card 4: Return Rate (Rose / Red) */}
      <div id="kpi-return-rate" className="bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-2xl p-4.5 flex flex-col items-center justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden min-h-[120px] text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-1.5 shadow-xs">
            <RotateCcw className="w-4 h-4" />
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight block">
            {metrics.returnRate.toFixed(2)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
            Return Rate
          </span>
          <span className="text-[9px] font-semibold text-rose-600 block mt-1 bg-rose-100/50 px-1.5 py-0.5 rounded truncate max-w-full">
            Loss: {formatCurrency(metrics.returnAmount)}
          </span>
        </div>
        {/* SVG Sparkline Background */}
        <svg className="absolute bottom-0 left-0 right-0 h-6 w-full text-rose-200/30 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 30 C 15 25, 30 10, 45 28 C 60 15, 75 5, 100 12 L 100 30 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Card 5: Discount Rate (Amber / Orange) */}
      <div id="kpi-discount-rate" className="bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-2xl p-4.5 flex flex-col items-center justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden min-h-[120px] text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1.5 shadow-xs">
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight block">
            {metrics.discountRate.toFixed(2)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
            Discount Rate
          </span>
          <span className="text-[9px] font-semibold text-amber-600 block mt-1 bg-amber-100/50 px-1.5 py-0.5 rounded truncate max-w-full">
            Promo: {formatCurrency(metrics.discountAmount)}
          </span>
        </div>
        {/* SVG Sparkline Background */}
        <svg className="absolute bottom-0 left-0 right-0 h-6 w-full text-amber-200/30 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 30 C 25 25, 50 20, 75 28, 90 18, 100 15 L 100 30 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Card 6: Stockout Indicators (Indigo) */}
      <div id="kpi-stockout-indicators" className="bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl p-4.5 flex flex-col items-center justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden min-h-[120px] text-center">
        <div className="z-10 flex flex-col items-center w-full">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-1.5 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight block">
            {metrics.stockoutRate.toFixed(1)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
            Stockout Indicator
          </span>
          <span className="text-[9px] font-semibold text-indigo-600 block mt-1 bg-indigo-100/50 px-1.5 py-0.5 rounded">
            {metrics.stockoutCount} Alert{metrics.stockoutCount !== 1 ? "s" : ""}
          </span>
        </div>
        {/* SVG Sparkline Background */}
        <svg className="absolute bottom-0 left-0 right-0 h-6 w-full text-indigo-200/30 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 30 C 20 25, 40 18, 60 22 C 80 12, 90 5, 100 2 L 100 30 Z" fill="currentColor" />
        </svg>
      </div>

    </div>
  );
}
