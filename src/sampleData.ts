import { Store, WeeklySales } from "./types";

// Generates 20 stores matching store master specs
export const sampleStores: Store[] = [
  { store_id: "ST001", store_name: "Apex Hypermarket", region: "North", city: "Chicago", store_format: "Hypermarket" },
  { store_id: "ST002", store_name: "Metropolis Express", region: "North", city: "New York", store_format: "Express" },
  { store_id: "ST003", store_name: "Windy City Super", region: "North", city: "Chicago", store_format: "Supermarket" },
  { store_id: "ST004", store_name: "Lakeside Boutique", region: "North", city: "Boston", store_format: "Boutique" },
  
  { store_id: "ST005", store_name: "Pacific Galleria", region: "West", city: "Los Angeles", store_format: "Hypermarket" },
  { store_id: "ST006", store_name: "Emerald City Mart", region: "West", city: "Seattle", store_format: "Supermarket" },
  { store_id: "ST007", store_name: "Silicon Valley Express", region: "West", city: "San Jose", store_format: "Express" },
  { store_id: "ST008", store_name: "Bay Area Boutique", region: "West", city: "San Francisco", store_format: "Boutique" },

  { store_id: "ST009", store_name: "Lone Star Mega", region: "Central", city: "Houston", store_format: "Hypermarket" },
  { store_id: "ST010", store_name: "Denver Peak Super", region: "Central", city: "Denver", store_format: "Supermarket" },
  { store_id: "ST011", store_name: "Dallas Hub Express", region: "Central", city: "Dallas", store_format: "Express" },
  { store_id: "ST012", store_name: "Austin Eco Center", region: "Central", city: "Austin", store_format: "Boutique" },

  { store_id: "ST013", store_name: "Atlantic Supercenter", region: "East", city: "Philadelphia", store_format: "Hypermarket" },
  { store_id: "ST014", store_name: "Capital Plaza", region: "East", city: "Washington DC", store_format: "Supermarket" },
  { store_id: "ST015", store_name: "Liberty Express", region: "East", city: "New York", store_format: "Express" },
  { store_id: "ST016", store_name: "New England Corner", region: "East", city: "Boston", store_format: "Boutique" },

  { store_id: "ST017", store_name: "Sunshine Mega", region: "South", city: "Miami", store_format: "Hypermarket" },
  { store_id: "ST018", store_name: "Peach State Super", region: "South", city: "Atlanta", store_format: "Supermarket" },
  { store_id: "ST019", store_name: "Crescent City Express", region: "South", city: "New Orleans", store_format: "Express" },
  { store_id: "ST020", store_name: "Everglades Mart", region: "South", city: "Orlando", store_format: "Boutique" }
];

const categories = ["Apparel", "Electronics", "Grocery", "Home & Living", "Beauty & Care"];

// Helper to generate realistic weekly retail sales matching standard proportions
export function generateSampleSales(): WeeklySales[] {
  const sales: WeeklySales[] = [];
  const totalWeeks = 12;

  // Base performance modifiers per store (some outperform, some struggle)
  const storeModifiers: Record<string, { scale: number; targetScale: number }> = {
    ST001: { scale: 1.15, targetScale: 1.10 }, // Outperforming
    ST002: { scale: 0.90, targetScale: 0.95 },
    ST003: { scale: 1.05, targetScale: 1.00 },
    ST004: { scale: 0.85, targetScale: 0.95 }, // Missing targets
    ST005: { scale: 1.25, targetScale: 1.20 }, // High performing Mega
    ST006: { scale: 1.00, targetScale: 1.00 },
    ST007: { scale: 0.95, targetScale: 0.90 },
    ST008: { scale: 0.80, targetScale: 0.90 }, // Low boutique
    ST009: { scale: 1.30, targetScale: 1.15 }, // Mega Central
    ST010: { scale: 1.00, targetScale: 0.95 },
    ST011: { scale: 0.85, targetScale: 0.95 }, // Struggling Express
    ST012: { scale: 1.10, targetScale: 1.05 },
    ST013: { scale: 1.20, targetScale: 1.25 }, // Missing slightly high target
    ST014: { scale: 1.00, targetScale: 0.95 },
    ST015: { scale: 0.90, targetScale: 0.90 },
    ST016: { scale: 0.75, targetScale: 0.85 }, // Underperforming
    ST017: { scale: 1.25, targetScale: 1.15 },
    ST018: { scale: 1.05, targetScale: 1.00 },
    ST019: { scale: 0.88, targetScale: 0.90 },
    ST020: { scale: 0.92, targetScale: 0.95 }
  };

  // Category parameters: base sales range, typical return rate (%), typical discount rate (%)
  const categoryConfigs: Record<string, { baseSales: number; returnRate: number; discountRate: number; atv: number }> = {
    "Apparel": { baseSales: 15000, returnRate: 14.5, discountRate: 18.0, atv: 75 },
    "Electronics": { baseSales: 28000, returnRate: 11.2, discountRate: 12.0, atv: 320 },
    "Grocery": { baseSales: 35000, returnRate: 1.2, discountRate: 4.5, atv: 42 },
    "Home & Living": { baseSales: 18000, returnRate: 7.8, discountRate: 14.0, atv: 110 },
    "Beauty & Care": { baseSales: 12000, returnRate: 4.5, discountRate: 8.5, atv: 55 }
  };

  for (let w = 1; w <= totalWeeks; w++) {
    const weekStr = `Week ${String(w).padStart(2, '0')}`;
    
    // Seasonal factor to make weekly trend look organic and natural (e.g. dips and peaks)
    const seasonalFactor = 1 + Math.sin((w / totalWeeks) * Math.PI * 2) * 0.12;

    sampleStores.forEach(store => {
      const storeMod = storeModifiers[store.store_id] || { scale: 1.0, targetScale: 1.0 };
      
      categories.forEach(category => {
        const config = categoryConfigs[category];
        
        // Base values for calculation
        const baseSalesVal = config.baseSales * storeMod.scale * seasonalFactor;
        
        // Introduce weekly variance
        const randomFactor = 0.85 + Math.random() * 0.30; // +/- 15% random variance
        const gross_sales = Math.round(baseSalesVal * randomFactor);
        
        // Calculate return rate & amount based on category config
        const returnChance = config.returnRate + (Math.random() * 4 - 2); // variance of +/- 2%
        const return_amount = Math.round(gross_sales * (returnChance / 100));
        
        // Net Sales
        const net_sales = gross_sales - return_amount;
        
        // Target achievement: let's build a realistic target
        const target_sales = Math.round(baseSalesVal * storeMod.targetScale * 0.95);
        
        // Calculate discount amount
        const discountChance = config.discountRate + (Math.random() * 6 - 3); // +/- 3%
        const discount_amount = Math.round(gross_sales * (discountChance / 100));
        
        // Transactions count
        const transactions_count = Math.max(1, Math.round(gross_sales / config.atv));
        
        // Stockout risk (higher in Electronics and Home & Living, lower in Grocery due to stable supply chain)
        let stockoutProb = 0.08;
        if (category === "Electronics") stockoutProb = 0.15;
        if (category === "Home & Living") stockoutProb = 0.12;
        if (category === "Grocery") stockoutProb = 0.04;
        
        // If random factor is very low or very high, or raw random chance
        const stockout_risk = Math.random() < stockoutProb ? 1 : 0;

        sales.push({
          week: weekStr,
          store_id: store.store_id,
          product_category: category,
          gross_sales,
          net_sales,
          target_sales,
          return_amount,
          discount_amount,
          transactions_count,
          stockout_risk
        });
      });
    });
  }

  return sales;
}
