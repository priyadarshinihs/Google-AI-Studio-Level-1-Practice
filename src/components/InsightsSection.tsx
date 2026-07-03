import React, { useState, useMemo } from "react";
import { MergedSalesRecord, SummaryMetrics } from "../types";
import { Sparkles, Download, FileText, CheckCircle, AlertTriangle, RefreshCw, Printer, FileSpreadsheet } from "lucide-react";

interface InsightsSectionProps {
  filteredData: MergedSalesRecord[];
  metrics: SummaryMetrics;
}

export default function InsightsSection({ filteredData, metrics }: InsightsSectionProps) {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Client-Side instant business heuristics
  const heuristics = useMemo(() => {
    if (filteredData.length === 0) return null;

    // Group sales and targets by Region
    const regionMap: Record<string, { name: string; sales: number; target: number; returns: number }> = {};
    const storeMap: Record<string, { name: string; sales: number; target: number; region: string; ach: number }> = {};
    const catMap: Record<string, { name: string; sales: number; returns: number; rate: number }> = {};

    filteredData.forEach((r) => {
      // Region
      if (!regionMap[r.region]) regionMap[r.region] = { name: r.region, sales: 0, target: 0, returns: 0 };
      regionMap[r.region].sales += r.net_sales;
      regionMap[r.region].target += r.target_sales;
      regionMap[r.region].returns += r.return_amount;

      // Store
      if (!storeMap[r.store_name]) storeMap[r.store_name] = { name: r.store_name, sales: 0, target: 0, region: r.region, ach: 0 };
      storeMap[r.store_name].sales += r.net_sales;
      storeMap[r.store_name].target += r.target_sales;

      // Category
      if (!catMap[r.product_category]) catMap[r.product_category] = { name: r.product_category, sales: 0, returns: 0, rate: 0 };
      catMap[r.product_category].sales += r.net_sales;
      catMap[r.product_category].returns += r.return_amount;
    });

    const regionsList = Object.values(regionMap).map((r) => ({
      ...r,
      ach: r.target > 0 ? (r.sales / r.target) * 100 : 0,
      returnRate: r.sales > 0 ? (r.returns / r.sales) * 100 : 0
    })).sort((a, b) => b.ach - a.ach);

    const bestRegion = regionsList[0];
    const worstRegion = regionsList[regionsList.length - 1];

    const storesMissingTarget = Object.values(storeMap)
      .map((s) => ({ ...s, ach: s.target > 0 ? (s.sales / s.target) * 100 : 0 }))
      .filter((s) => s.ach < 100)
      .sort((a, b) => a.ach - b.ach); // sorted worst-to-best achievement

    const highReturnCategories = Object.values(catMap)
      .map((c) => ({ ...c, rate: c.sales > 0 ? (c.returns / c.sales) * 100 : 0 }))
      .sort((a, b) => b.rate - a.rate);

    return {
      bestRegion,
      worstRegion,
      storesMissingTarget,
      highReturnCategories,
      regionsList
    };
  }, [filteredData]);

  // Handle triggering server-side Gemini generation
  const handleGenerateAiReport = async () => {
    if (!heuristics) return;
    setLoading(true);
    setError(null);

    // Build optimized payload summarizing active segment metrics
    const payload = {
      summaryData: {
        netSales: metrics.netSales,
        grossSales: metrics.grossSales,
        targetSales: metrics.targetSales,
        targetAchievement: metrics.targetAchievement,
        averageTransactionValue: metrics.averageTransactionValue,
        returnAmount: metrics.returnAmount,
        returnRate: metrics.returnRate,
        discountRate: metrics.discountRate,
        stockoutCount: metrics.stockoutCount,
        stockoutRate: metrics.stockoutRate,
        regions: heuristics.regionsList.map(r => ({
          name: r.name,
          sales: r.sales,
          targetAchieved: r.ach,
          returnRate: r.returnRate
        })),
        topStores: heuristics.storesMissingTarget
          .filter(s => s.ach > 85)
          .slice(0, 3)
          .map(s => ({ name: s.name, region: s.region, sales: s.sales, targetAchieved: s.ach })),
        storesMissingTarget: heuristics.storesMissingTarget.slice(0, 5).map(s => ({
          name: s.name,
          region: s.region,
          sales: s.sales,
          targetAchieved: s.ach
        })),
        categories: heuristics.highReturnCategories.slice(0, 3).map(c => ({
          name: c.name,
          sales: c.sales,
          returns: c.returns,
          returnRate: c.rate
        })),
        categoryStockouts: heuristics.highReturnCategories.map(c => {
          const catStockouts = filteredData.filter(r => r.product_category === c.name && r.stockout_risk === 1).length;
          return { name: c.name, stockouts: catStockouts };
        })
      }
    };

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to contact Gemini endpoint.");
      }

      const resData = await response.json();
      setAiReport(resData.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown network error occurred while generating reports.");
    } finally {
      setLoading(false);
    }
  };

  // CSV Data Downloader
  const downloadCsv = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "Week", "Store ID", "Store Name", "Region", "City", "Store Format",
      "Product Category", "Gross Sales", "Return Amount", "Net Sales",
      "Target Sales", "Discount Amount", "Transactions Count", "Stockout Risk"
    ];

    const rows = filteredData.map((r) => [
      r.week, r.store_id, r.store_name, r.region, r.city, r.store_format,
      r.product_category, r.gross_sales, r.return_amount, r.net_sales,
      r.target_sales, r.discount_amount, r.transactions_count, r.stockout_risk
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retail_sales_intelligence_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI advisory report text file downloader
  const downloadAiReport = () => {
    if (!aiReport) return;
    const blob = new Blob([aiReport.replace(/<[^>]*>/g, "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retail_executive_advisory_report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!heuristics) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      
      {/* Col 1: Direct Calculated Insights (Heuristics) */}
      <div id="insight-diagnostics" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-display font-bold text-slate-800">Operational Diagnostics</h3>
          </div>

          <div className="space-y-5">
            {/* Best / Worst Region */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Regional Performance</span>
              <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-lg p-3">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">🏆 Top Performer</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5 font-display">{heuristics.bestRegion?.name} Region</span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Achieving <span className="font-bold text-emerald-700 font-mono">{heuristics.bestRegion?.ach.toFixed(1)}%</span> of targeted sales with a return rate of <span className="font-mono">{heuristics.bestRegion?.returnRate.toFixed(1)}%</span>.
                </p>
              </div>

              <div className="bg-rose-50/40 border border-rose-200/60 rounded-lg p-3">
                <span className="text-[10px] font-bold text-rose-800 block uppercase tracking-wider">⚠️ Lowest Performer</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5 font-display">{heuristics.worstRegion?.name} Region</span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Achieving only <span className="font-bold text-rose-700 font-mono">{heuristics.worstRegion?.ach.toFixed(1)}%</span> of target. Operational review is highly recommended.
                </p>
              </div>
            </div>

            {/* Top Stores Missing Target */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Critical Store Gaps (Missing Target)</span>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-slate-50/20">
                {heuristics.storesMissingTarget.slice(0, 3).map((s) => (
                  <div key={s.name} className="p-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Region: {s.region}</span>
                    </div>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm font-mono">
                      {s.ach.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {heuristics.storesMissingTarget.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400 italic">All active stores are meeting goals!</div>
                )}
              </div>
            </div>

            {/* High Return Rate Categories */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Product Return Vectors</span>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-slate-50/20">
                {heuristics.highReturnCategories.slice(0, 2).map((c) => (
                  <div key={c.name} className="p-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Total Returns: ${c.returns.toLocaleString()}</span>
                    </div>
                    <span className={`font-bold px-1.5 py-0.5 rounded-sm font-mono ${c.rate > 10 ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"}`}>
                      {c.rate.toFixed(1)}% returns
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data exporting widget */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={downloadCsv}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Filtered CSV Records
          </button>
        </div>
      </div>

      {/* Col 2 & 3: AI-powered Advisory summaries */}
      <div id="ai-advisory-panel" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-display font-bold text-slate-800">Gemini Executive Business Briefing</h3>
                <p className="text-[10px] text-slate-400">Synthesize filtered datasets into executive directives</p>
              </div>
            </div>

            {aiReport && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={downloadAiReport}
                  title="Download Briefing"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handlePrint}
                  title="Print Briefing"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* AI generated markdown viewer */}
          <div className="min-h-72 bg-slate-50/50 border border-slate-200 rounded-lg p-4 relative overflow-y-auto max-h-[420px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg gap-3">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-500 font-semibold animate-pulse">
                  Querying Gemini 3.5 Flash Analyst...
                </span>
              </div>
            ) : aiReport ? (
              <div 
                className="text-xs text-slate-700 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: aiReport }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <Sparkles className="w-8 h-8 text-indigo-300 mb-2.5" />
                <h4 className="text-xs font-semibold text-slate-800">Generate Actionable Intelligence Briefing</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1 mb-4">
                  Runs our cloud AI consultant over your custom segmented parameters to identify root cause trends, product vectors, and action items.
                </p>
                <button
                  onClick={handleGenerateAiReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Request AI Performance Summary
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <span className="font-bold">Intelligence Error:</span> {error}
                  <button 
                    onClick={handleGenerateAiReport} 
                    className="block mt-2 font-semibold underline text-rose-800 hover:text-rose-900 cursor-pointer"
                  >
                    Retry Consulting Model
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {aiReport && (
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-3">
            <span>Powered by Gemini 3.5 Flash</span>
            <button
              onClick={handleGenerateAiReport}
              className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Re-analyze Active Segment
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
