import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  LineChart,
  Legend,
} from "recharts";
import { MergedSalesRecord } from "../types";
import { TrendingUp, MapPin, Tag, Trophy, Award, ShoppingBag, AlertTriangle } from "lucide-react";

interface ChartsGridProps {
  filteredData: MergedSalesRecord[];
}

export default function ChartsGrid({ filteredData }: ChartsGridProps) {
  // 1. Weekly performance datasets
  const weeklyData = useMemo(() => {
    const map: Record<string, { week: string; sales: number; target: number; lastYearSales: number }> = {};
    filteredData.forEach((r) => {
      if (!map[r.week]) {
        // Synthesizing a realistic last year baseline for comparison (approx 92% of current + some noise)
        const lYear = r.net_sales * 0.92 + (Math.sin(r.transactions_count) * 1000);
        map[r.week] = { week: r.week, sales: 0, target: 0, lastYearSales: 0 };
      }
      map[r.week].sales += r.net_sales;
      map[r.week].target += r.target_sales;
      // Synthesize last-year cumulative baseline
      map[r.week].lastYearSales += r.net_sales * 0.9 + (r.transactions_count * 20);
    });

    return Object.values(map).sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredData]);

  // Calculate average target achievement for header stat
  const avgTargetAchieved = useMemo(() => {
    let totalSales = 0;
    let totalTarget = 0;
    filteredData.forEach((r) => {
      totalSales += r.net_sales;
      totalTarget += r.target_sales;
    });
    return totalTarget > 0 ? (totalSales / totalTarget) * 100 : 0;
  }, [filteredData]);

  // 2. Sales by Store Format (matches the 3-section Donut chart exactly!)
  const formatDonutData = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    filteredData.forEach((r) => {
      const fmt = r.store_format || "Supermarket";
      if (!map[fmt]) {
        map[fmt] = { name: fmt, value: 0 };
      }
      map[fmt].value += r.net_sales;
    });

    const list = Object.values(map).sort((a, b) => b.value - a.value);
    const total = list.reduce((acc, curr) => acc + curr.value, 0);

    return list.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
  }, [filteredData]);

  // 3. Store Leaderboard (Top 5 stores by actual net sales)
  const storeSalesLeaderboard = useMemo(() => {
    const map: Record<string, { store_name: string; sales: number; target: number; region: string }> = {};
    filteredData.forEach((r) => {
      if (!map[r.store_name]) {
        map[r.store_name] = { store_name: r.store_name, sales: 0, target: 0, region: r.region };
      }
      map[r.store_name].sales += r.net_sales;
      map[r.store_name].target += r.target_sales;
    });

    return Object.values(map).map((s) => ({
      name: s.store_name,
      sales: s.sales,
      target: s.target,
      region: s.region,
      achievement: s.target > 0 ? (s.sales / s.target) * 100 : 0,
    })).sort((a, b) => b.sales - a.sales).slice(0, 5);
  }, [filteredData]);

  // 4. Top 5 Item Categories / Segments by Sales
  const topSegmentsLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; sales: number }> = {};
    filteredData.forEach((r) => {
      // Map to category + format for highly unique segments
      const key = `${r.product_category} (${r.store_format})`;
      if (!map[key]) {
        map[key] = { name: key, sales: 0 };
      }
      map[key].sales += r.net_sales;
    });

    return Object.values(map)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredData]);

  // 5. Sales by Region
  const regionSalesData = useMemo(() => {
    const map: Record<string, { region: string; sales: number }> = {};
    filteredData.forEach((r) => {
      const reg = r.region || "Unknown";
      if (!map[reg]) {
        map[reg] = { region: reg, sales: 0 };
      }
      map[reg].sales += r.net_sales;
    });
    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredData]);

  // 6. Sales by Category
  const categorySalesData = useMemo(() => {
    const map: Record<string, { category: string; sales: number }> = {};
    filteredData.forEach((r) => {
      const cat = r.product_category || "Unknown";
      if (!map[cat]) {
        map[cat] = { category: cat, sales: 0 };
      }
      map[cat].sales += r.net_sales;
    });
    return Object.values(map).sort((a, b) => b.sales - a.sales);
  }, [filteredData]);

  // 7. Stockout Risk by Store
  const storeStockoutData = useMemo(() => {
    const map: Record<string, { storeName: string; stockoutCount: number; totalCount: number }> = {};
    filteredData.forEach((r) => {
      if (!map[r.store_name]) {
        map[r.store_name] = { storeName: r.store_name, stockoutCount: 0, totalCount: 0 };
      }
      map[r.store_name].totalCount += 1;
      if (r.stockout_risk > 0) {
        map[r.store_name].stockoutCount += 1;
      }
    });

    return Object.values(map)
      .map((item) => ({
        name: item.storeName,
        rate: item.totalCount > 0 ? Number(((item.stockoutCount / item.totalCount) * 100).toFixed(1)) : 0,
        count: item.stockoutCount,
      }))
      .sort((a, b) => b.rate - a.rate || b.count - a.count)
      .slice(0, 5);
  }, [filteredData]);

  // Matching Colors from template: Purple, Cyan/Teal, Orange/Yellow
  const DONUT_COLORS = ["#c084fc", "#22d3ee", "#facc15", "#818cf8"];

  const formatCurrencyYAxis = (tick: any) => {
    if (tick >= 1_000_000) return `$${(tick / 1_000_000).toFixed(1)}M`;
    if (tick >= 1_000) return `$${(tick / 1_000).toFixed(0)}K`;
    return `$${tick}`;
  };

  const formatValueK = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val}`;
  };

  return (
    <div className="space-y-6 mb-8">
      
      {/* Middle Row: Weekly Sales Trend (Line), Region Sales (Bar), and Category Sales (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Sales by Weekly Trend (Line Chart) */}
        <div id="chart-weekly-sales-trend" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Sales by Weekly Trend
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Tracking net sales performance and target benchmarks week over week
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Avg Target Achievement</span>
              <span className="text-sm font-black text-[#0d5c75] font-mono tracking-tight leading-none">
                {avgTargetAchieved.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={formatCurrencyYAxis} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", marginTop: "5px" }} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  name="Net Sales" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 0, fill: "#10b981" }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  name="Target Sales" 
                  stroke="#0ea5e9" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={{ r: 3, strokeWidth: 0, fill: "#0ea5e9" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Sales by Region (Bar Chart) */}
        <div id="chart-regional-sales" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Sales by Region
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Distribution across geographic operating areas
              </p>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="region" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={formatCurrencyYAxis} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Sales"]}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }}
                />
                <Bar dataKey="sales" name="Net Sales" fill="#0d5c75" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Sales by Product Category (Bar Chart) */}
        <div id="chart-category-sales" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-500" />
                Sales by Category
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Breakdown of net sales across merchandise departments
              </p>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={formatCurrencyYAxis} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Sales"]}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }}
                />
                <Bar dataKey="sales" name="Net Sales" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Two columns as requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Col 1: Store Leaderboard (Horizontal Bar Chart) */}
        <div id="bottom-stores-leaderboard" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Trophy className="w-4.5 h-4.5 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-display font-black text-slate-800 tracking-tight uppercase">
                  Store Leaderboard
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Top 5 Stores by Sales
                </p>
              </div>
            </div>
            
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={storeSalesLeaderboard}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatCurrencyYAxis} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    width={85}
                    tickFormatter={(tick) => tick.replace("Store ", "").replace("Supermarket", "SM").replace("Convenience", "Conv")}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Net Sales"]}
                    contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }}
                  />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Col 2: Stockout Risk by Store (Horizontal Bar Chart) */}
        <div id="bottom-stockout-risk" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-display font-black text-slate-800 tracking-tight uppercase">
                  Stockout Risk
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Top 5 Stores by Stockout Rate %
                </p>
              </div>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={storeStockoutData}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(tick) => `${tick}%`} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    width={85}
                    tickFormatter={(tick) => tick.replace("Store ", "").replace("Supermarket", "SM").replace("Convenience", "Conv")}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Stockout Rate"]}
                    contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }}
                  />
                  <Bar dataKey="rate" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
