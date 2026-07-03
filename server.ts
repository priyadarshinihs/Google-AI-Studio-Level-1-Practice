import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API endpoint for generating AI insights
  app.post("/api/insights", async (req, res) => {
    try {
      const { summaryData } = req.body;
      if (!summaryData) {
        return res.status(400).json({ error: "Missing summaryData in request body." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
You are an expert Retail Business Intelligence Consultant.
Analyze the following retail sales performance data for a retail chain operating stores across 5 regions.

SUMMARY PERFORMANCE METRICS:
- Total Net Sales: $${summaryData.netSales.toLocaleString()}
- Target Sales: $${summaryData.targetSales.toLocaleString()}
- Target Achievement Rate: ${summaryData.targetAchievement.toFixed(2)}%
- Average Transaction Value (ATV): $${summaryData.averageTransactionValue.toFixed(2)}
- Average Return Rate: ${summaryData.returnRate.toFixed(2)}%
- Average Discount Rate: ${summaryData.discountRate.toFixed(2)}%
- Out-of-stock (Stockout) incidents count: ${summaryData.stockoutCount} (${summaryData.stockoutRate.toFixed(2)}% of transaction lines affected)

REGIONAL SALES PERFORMANCE (Best to Worst):
${summaryData.regions.map((r: any) => `- ${r.name}: Sales = $${r.sales.toLocaleString()}, Return Rate = ${r.returnRate.toFixed(2)}%, Target Achieved = ${r.targetAchieved.toFixed(2)}%`).join('\n')}

TOP PERFORMING STORES (By Target Achievement):
${summaryData.topStores.map((s: any) => `- Store ${s.name} (${s.region}): Sales = $${s.sales.toLocaleString()}, Target Achieved = ${s.targetAchieved.toFixed(2)}%`).join('\n')}

STORES MISSING TARGET (Target Achieved < 100%):
${summaryData.storesMissingTarget.map((s: any) => `- Store ${s.name} (${s.region}): Sales = $${s.sales.toLocaleString()}, Target Achieved = ${s.targetAchieved.toFixed(2)}%`).join('\n')}

HIGH RETURN RATE PRODUCT CATEGORIES (Sorted by Return Amount):
${summaryData.categories.map((c: any) => `- ${c.name}: Sales = $${c.sales.toLocaleString()}, Returns = $${c.returns.toLocaleString()} (${c.returnRate.toFixed(2)}% Return Rate)`).join('\n')}

STOCKOUT RISK IN CATEGORIES:
${summaryData.categoryStockouts.map((c: any) => `- ${c.name}: ${c.stockouts} stockout occurrences`).join('\n')}

Based on this data, write an action-oriented retail executive summary. Keep it concise, professional, and directly actionable for regional managers.

Provide your analysis in clean HTML tags (like <h3>, <p>, <ul>, <li>, <strong>) with the following exact sections (do not include markdown headings like ###, just write raw HTML wrapped in a container):

1. Executive Performance Highlight (An overall assessment of current performance versus target)
2. Strategic Diagnostics (Identify the key root causes of missed targets or high returns)
3. Actionable Regional Directives (Provide 3 specific, tactical, data-driven recommendations for specific regions or stores)
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text;
      res.json({ text });
    } catch (error: any) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI insights." });
    }
  });

  // Serve static assets or mount Vite in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
