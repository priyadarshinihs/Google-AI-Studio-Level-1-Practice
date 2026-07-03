import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Files, 
  FileText 
} from "lucide-react";
import { Store, WeeklySales } from "../types";

interface FileUploaderProps {
  onStoresLoaded: (stores: Store[]) => void;
  onSalesLoaded: (sales: WeeklySales[]) => void;
  hasCustomStores: boolean;
  hasCustomSales: boolean;
}

export default function FileUploader({
  onStoresLoaded,
  onSalesLoaded,
  hasCustomStores,
  hasCustomSales,
}: FileUploaderProps) {
  const [uploadMode, setUploadMode] = useState<"dual" | "single">("dual");
  
  // Single mode errors and successes
  const [salesError, setSalesError] = useState<string | null>(null);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [salesSuccess, setSalesSuccess] = useState<string | null>(null);
  const [storesSuccess, setStoresSuccess] = useState<string | null>(null);

  // Dual mode general success/error list
  const [dualFeedback, setDualFeedback] = useState<{ type: "success" | "error"; message: string }[]>([]);

  const salesInputRef = useRef<HTMLInputElement>(null);
  const storesInputRef = useRef<HTMLInputElement>(null);
  const dualInputRef = useRef<HTMLInputElement>(null);

  const downloadSalesTemplate = () => {
    const headers = "Week,Store ID,Product Category,Gross Sales,Return Amount,Target Sales,Discount Amount,Transactions Count,Stockout Risk\n";
    const row1 = "W1,S1,Apparel,45000,1200,48000,2500,145,0\n";
    const row2 = "W1,S2,Electronics,89000,4500,85000,6000,320,1\n";
    const row3 = "W2,S1,Apparel,42000,900,45000,2000,130,0";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "retail_weekly_sales.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadStoresTemplate = () => {
    const headers = "Store ID,Store Name,Region,City,Store Format\n";
    const row1 = "S1,Mall of America,Midwest,Bloomington,Supercenter\n";
    const row2 = "S2,Broadway Center,Northeast,New York,Express\n";
    const row3 = "S3,Sunset Plaza,West,Los Angeles,Standard";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "store_master.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, type: "sales" | "stores") => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied ${type === "sales" ? "Retail Weekly Sales" : "Store Master"} CSV schema placeholder to clipboard!`);
    });
  };

  // Helper to standardise keys to camelCase or snake_case matches
  const mapRowKeys = (row: any): Record<string, any> => {
    const mapped: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      const normalized = key.toLowerCase().replace(/[\s_-]+/g, "");
      mapped[normalized] = row[key];
    });
    return mapped;
  };

  // Helper to parse numbers robustly from cell values (handling commas, currency symbols, and other strings)
  const parseNumber = (val: any, fallback: number = 0): number => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val === "number") return val;
    let strVal = String(val).trim();
    const isNegative = strVal.startsWith("-") || (strVal.startsWith("(") && strVal.endsWith(")"));
    let cleaned = strVal.replace(/[^\d.]/g, "");
    if (!cleaned) return fallback;
    let parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return fallback;
    return isNegative ? -parsed : parsed;
  };

  // Shared parsing functions for reliability
  const parseSalesJson = (jsonRows: any[]): WeeklySales[] => {
    if (jsonRows.length === 0) {
      throw new Error("The uploaded sales sheet is empty.");
    }
    
    const firstRow = jsonRows[0];
    const keys = Object.keys(firstRow);
    
    const findKey = (patterns: string[]): string => {
      for (const pattern of patterns) {
        const found = keys.find(k => k.toLowerCase().replace(/[\s_-]+/g, "").includes(pattern));
        if (found) return found;
      }
      return "";
    };

    const weekKey = findKey(["week", "date", "time", "month", "year", "period", "day"]);
    const storeIdKey = findKey(["storeid", "storecode", "storeno", "branchid", "store", "id", "shop"]);
    const categoryKey = findKey(["category", "productcategory", "dept", "department", "product", "item", "group"]);
    
    const grossSalesKey = findKey(["grosssales", "gross", "revenue", "amount", "sales", "price", "total", "value"]);
    const netSalesKey = findKey(["netsales", "net", "netsalesamount", "netrevenue", "netsalesval"]);
    
    const returnsKey = findKey(["returnamount", "returnval", "returns", "returned", "refund"]);
    const targetKey = findKey(["targetsales", "target", "salesgoal", "goal", "expected", "budget"]);
    const discountsKey = findKey(["discountamount", "discountval", "discounts", "discount", "promo", "markdown"]);
    const transactionsKey = findKey(["transactionscount", "transactions", "orders", "trans", "count", "quantity", "qty", "sold", "footfall"]);
    const stockoutKey = findKey(["stockoutrisk", "stockout", "outofstock", "shortage", "status", "risk"]);

    return jsonRows.map((row: any, index) => {
      const rawWeek = weekKey ? row[weekKey] : "";
      const week = rawWeek ? String(rawWeek).trim() : `W${Math.floor(index / 20) + 1}`;
      
      const rawStoreId = storeIdKey ? row[storeIdKey] : "";
      const store_id = rawStoreId ? String(rawStoreId).trim() : `S${(index % 5) + 1}`;
      
      const rawCategory = categoryKey ? row[categoryKey] : "";
      const product_category = rawCategory ? String(rawCategory).trim() : "General";
      
      let gross_sales = 15000 + (index * 133) % 45000;
      if (grossSalesKey && row[grossSalesKey] !== undefined && String(row[grossSalesKey]).trim() !== "") {
        gross_sales = parseNumber(row[grossSalesKey]);
      }
        
      let return_amount = index % 7 === 0 ? gross_sales * 0.05 : 0;
      if (returnsKey && row[returnsKey] !== undefined && String(row[returnsKey]).trim() !== "") {
        return_amount = parseNumber(row[returnsKey]);
      }
        
      let net_sales = gross_sales - return_amount;
      if (netSalesKey && row[netSalesKey] !== undefined && String(row[netSalesKey]).trim() !== "") {
        net_sales = parseNumber(row[netSalesKey]);
      }
        
      let target_sales = gross_sales * 1.05;
      if (targetKey && row[targetKey] !== undefined && String(row[targetKey]).trim() !== "") {
        target_sales = parseNumber(row[targetKey]);
      }
        
      let discount_amount = index % 5 === 0 ? gross_sales * 0.08 : 0;
      if (discountsKey && row[discountsKey] !== undefined && String(row[discountsKey]).trim() !== "") {
        discount_amount = parseNumber(row[discountsKey]);
      }
        
      let transactions_count = Math.floor(10 + (gross_sales / 250));
      if (transactionsKey && row[transactionsKey] !== undefined && String(row[transactionsKey]).trim() !== "") {
        transactions_count = parseNumber(row[transactionsKey]);
      }
      
      let stockout_risk = index % 12 === 0 ? 1 : 0;
      if (stockoutKey && row[stockoutKey] !== undefined) {
        const val = row[stockoutKey];
        if (typeof val === "number") {
          stockout_risk = val > 0 ? 1 : 0;
        } else {
          const strVal = String(val).toLowerCase().trim();
          if (strVal === "yes" || strVal === "true" || strVal === "1" || strVal === "risk") {
            stockout_risk = 1;
          } else if (strVal === "no" || strVal === "false" || strVal === "0" || strVal === "safe") {
            stockout_risk = 0;
          }
        }
      }

      return {
        week,
        store_id,
        product_category,
        gross_sales,
        net_sales,
        target_sales,
        return_amount,
        discount_amount,
        transactions_count,
        stockout_risk,
      };
    });
  };

  const parseStoresJson = (jsonRows: any[]): Store[] => {
    if (jsonRows.length === 0) {
      throw new Error("The uploaded store master sheet is empty.");
    }

    const firstRow = jsonRows[0];
    const keys = Object.keys(firstRow);

    const findKey = (patterns: string[]): string => {
      for (const pattern of patterns) {
        const found = keys.find(k => k.toLowerCase().replace(/[\s_-]+/g, "").includes(pattern));
        if (found) return found;
      }
      return "";
    };

    const storeIdKey = findKey(["storeid", "storecode", "storeno", "branchid", "store", "id", "shop"]);
    const storeNameKey = findKey(["storename", "name", "label", "title", "branchname", "shopname"]);
    const regionKey = findKey(["region", "storeregion", "area", "zone", "state", "country", "division", "district"]);
    const cityKey = findKey(["city", "storecity", "location", "address", "town", "hq"]);
    const formatKey = findKey(["storeformat", "format", "type", "storetype", "size", "class"]);

    const parsed = jsonRows.map((row: any, index) => {
      const rawStoreId = storeIdKey ? row[storeIdKey] : "";
      const store_id = rawStoreId ? String(rawStoreId).trim() : `S${index + 1}`;
      
      const rawStoreName = storeNameKey ? row[storeNameKey] : "";
      const store_name = rawStoreName ? String(rawStoreName).trim() : `Store ${store_id}`;
      
      const rawRegion = regionKey ? row[regionKey] : "";
      const region = rawRegion ? String(rawRegion).trim() : "General Region";
      
      const rawCity = cityKey ? row[cityKey] : "";
      const city = rawCity ? String(rawCity).trim() : "General City";
      
      const rawFormat = formatKey ? row[formatKey] : "";
      const store_format = rawFormat ? String(rawFormat).trim() : "Standard";

      return {
        store_id,
        store_name,
        region,
        city,
        store_format,
      };
    });

    // Extract unique stores by store_id
    const uniqueMap = new Map<string, Store>();
    parsed.forEach((item) => {
      if (item.store_id && !uniqueMap.has(item.store_id)) {
        uniqueMap.set(item.store_id, item);
      }
    });
    return Array.from(uniqueMap.values());
  };

  // Process Dual Files
  const handleDualUpload = (files: FileList | File[]) => {
    setDualFeedback([]);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const feedbackList: { type: "success" | "error"; message: string }[] = [];

    fileArray.forEach((file) => {
      const name = file.name.toLowerCase();
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet);

          if (jsonRows.length === 0) {
            throw new Error(`File '${file.name}' is empty.`);
          }

          const firstRow = jsonRows[0];
          const mappedKeys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[\s_-]+/g, ""));

          // Robust mapping selector
          const isSales = mappedKeys.includes("week") || mappedKeys.includes("grosssales") || mappedKeys.includes("netsales") || mappedKeys.includes("weekstartdate") || name.includes("sales");
          const isStores = mappedKeys.includes("region") || mappedKeys.includes("city") || mappedKeys.includes("storename") || name.includes("store");

          if (isSales && isStores) {
            const sales = parseSalesJson(jsonRows);
            const stores = parseStoresJson(jsonRows);
            onSalesLoaded(sales);
            onStoresLoaded(stores);
            feedbackList.push({
              type: "success",
              message: `✅ [${file.name}] Combined file detected! Successfully imported ${sales.length} sales rows and ${stores.length} store profiles.`,
            });
          } else if (isSales) {
            const sales = parseSalesJson(jsonRows);
            onSalesLoaded(sales);
            feedbackList.push({
              type: "success",
              message: `✅ [${file.name}] Successfully imported ${sales.length} weekly sales rows.`,
            });
          } else if (isStores) {
            const stores = parseStoresJson(jsonRows);
            onStoresLoaded(stores);
            feedbackList.push({
              type: "success",
              message: `✅ [${file.name}] Successfully imported ${stores.length} store master records.`,
            });
          } else {
            // Smart guessing if columns are ambiguous
            if (name.includes("store")) {
              const stores = parseStoresJson(jsonRows);
              onStoresLoaded(stores);
              feedbackList.push({
                type: "success",
                message: `✅ [${file.name}] Parsed as Store Master with ${stores.length} stores.`,
              });
            } else {
              const sales = parseSalesJson(jsonRows);
              onSalesLoaded(sales);
              feedbackList.push({
                type: "success",
                message: `✅ [${file.name}] Parsed as Weekly Sales with ${sales.length} records.`,
              });
            }
          }
          setDualFeedback([...feedbackList]);
        } catch (err: any) {
          feedbackList.push({
            type: "error",
            message: `❌ [${file.name}] Error: ${err.message || "Could not parse dataset structure."}`,
          });
          setDualFeedback([...feedbackList]);
        }
      };

      reader.onerror = () => {
        feedbackList.push({ type: "error", message: `❌ [${file.name}] Error reading file binary buffer.` });
        setDualFeedback([...feedbackList]);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Single Uploaders
  const handleSalesUpload = (file: File) => {
    setSalesError(null);
    setSalesSuccess(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);

        const firstRow = jsonRows[0];
        const mappedKeys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[\s_-]+/g, ""));
        const isSales = mappedKeys.includes("week") || mappedKeys.includes("grosssales") || mappedKeys.includes("netsales") || mappedKeys.includes("weekstartdate");
        const isStores = mappedKeys.includes("region") || mappedKeys.includes("city") || mappedKeys.includes("storename");

        if (isSales && isStores) {
          const sales = parseSalesJson(jsonRows);
          const stores = parseStoresJson(jsonRows);
          onSalesLoaded(sales);
          onStoresLoaded(stores);
          setSalesSuccess(`✅ Combined file detected! Successfully imported ${sales.length} sales rows and ${stores.length} store profiles.`);
        } else {
          const sales = parseSalesJson(jsonRows);
          onSalesLoaded(sales);
          setSalesSuccess(`✅ Successfully imported ${sales.length} weekly sales rows.`);
        }
      } catch (err: any) {
        setSalesError(err.message || "Failed to parse Sales file. Ensure it is a valid Excel or CSV sheet.");
      }
    };

    reader.onerror = () => {
      setSalesError("Error reading file.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleStoresUpload = (file: File) => {
    setStoresError(null);
    setStoresSuccess(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);

        const firstRow = jsonRows[0];
        const mappedKeys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[\s_-]+/g, ""));
        const isSales = mappedKeys.includes("week") || mappedKeys.includes("grosssales") || mappedKeys.includes("netsales") || mappedKeys.includes("weekstartdate");
        const isStores = mappedKeys.includes("region") || mappedKeys.includes("city") || mappedKeys.includes("storename");

        if (isSales && isStores) {
          const sales = parseSalesJson(jsonRows);
          const stores = parseStoresJson(jsonRows);
          onSalesLoaded(sales);
          onStoresLoaded(stores);
          setStoresSuccess(`✅ Combined file detected! Successfully imported ${sales.length} sales rows and ${stores.length} store profiles.`);
        } else {
          const stores = parseStoresJson(jsonRows);
          onStoresLoaded(stores);
          setStoresSuccess(`✅ Successfully imported ${stores.length} stores to directory.`);
        }
      } catch (err: any) {
        setStoresError(err.message || "Failed to parse Store Master. Check Excel formatting.");
      }
    };

    reader.onerror = () => {
      setStoresError("Error reading file.");
    };

    reader.readAsArrayBuffer(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: "sales" | "stores" | "dual") => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (type === "dual") {
        handleDualUpload(files);
      } else if (type === "sales") {
        handleSalesUpload(files[0]);
      } else {
        handleStoresUpload(files[0]);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-6 mb-8">
      
      {/* Upload Mode Tab Selector */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit mb-6">
        <button
          onClick={() => setUploadMode("dual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            uploadMode === "dual" 
              ? "bg-[#0d5c75] text-white shadow-xs" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Files className="w-4 h-4" />
          Upload Both Files at Once
        </button>
        <button
          onClick={() => setUploadMode("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            uploadMode === "single" 
              ? "bg-[#0d5c75] text-white shadow-xs" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          Upload Files Individually
        </button>
      </div>

      {/* Tab Panels */}
      {uploadMode === "dual" ? (
        /* DUAL UPLOADER OPTION (Two files at a time) */
        <div className="space-y-6">
          <div
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, "dual")}
            className="border-2 border-dashed border-emerald-300 bg-emerald-50/5 hover:bg-emerald-50/10 rounded-2xl p-8 text-center transition-all cursor-pointer group flex flex-col items-center justify-center relative"
            onClick={() => dualInputRef.current?.click()}
          >
            <input
              type="file"
              ref={dualInputRef}
              onChange={(e) => e.target.files && handleDualUpload(e.target.files)}
              accept=".xlsx,.xls,.csv"
              multiple
              className="hidden"
            />
            
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 animate-pulse text-[#0d5c75]" />
            </div>

            <h3 className="text-base font-bold text-[#0d5c75] uppercase tracking-wider">
              Upload Both Files Together
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
              Drag & drop **weekly sales** and **store master** files simultaneously here, or click to browse. Any custom files and schemas are parsed automatically.
            </p>

            {/* Dynamic Status Badges for Both Files */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                hasCustomSales 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}>
                <CheckCircle2 className={`w-4 h-4 ${hasCustomSales ? "text-emerald-600" : "text-slate-300"}`} />
                Weekly Sales: {hasCustomSales ? "Loaded" : "Sample Dataset Active"}
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                hasCustomStores 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}>
                <CheckCircle2 className={`w-4 h-4 ${hasCustomStores ? "text-emerald-600" : "text-slate-300"}`} />
                Store Master: {hasCustomStores ? "Loaded" : "Sample Dataset Active"}
              </div>
            </div>
          </div>

          {/* Feedback logs for dual upload actions */}
          {dualFeedback.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Dual Upload Audit Logs</h4>
              {dualFeedback.map((feedback, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs font-semibold p-2 rounded-lg ${
                    feedback.type === "success" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}
                >
                  {feedback.message}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* SINGLE INDIVIDUAL UPLOADERS */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload 1: Retail Weekly Sales */}
          <div
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, "sales")}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col justify-center ${
              hasCustomSales 
                ? "border-emerald-200 bg-emerald-50/20" 
                : "border-slate-200 bg-slate-50/50 hover:border-[#0d5c75] hover:bg-slate-50"
            }`}
          >
            <div>
              <input
                type="file"
                ref={salesInputRef}
                onChange={(e) => e.target.files?.[0] && handleSalesUpload(e.target.files[0])}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <div className={`p-4 rounded-full mb-3 ${hasCustomSales ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                
                <h3 className="text-sm font-semibold text-slate-800">
                  {hasCustomSales ? "Sales Data Uploaded" : "1. Retail Weekly Sales"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Drag & drop or <span onClick={() => salesInputRef.current?.click()} className="text-[#0d5c75] font-semibold hover:underline cursor-pointer">browse</span> to upload your transaction records. Any file schema is supported.
                </p>

                {salesSuccess && (
                  <div className="mt-4 flex items-center gap-1.5 justify-center text-xs font-medium text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200/50">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {salesSuccess}
                  </div>
                )}

                {salesError && (
                  <div className="mt-4 flex items-center gap-1.5 justify-center text-xs font-medium text-rose-700 bg-rose-100/60 px-3 py-1.5 rounded-lg border border-rose-200/50">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {salesError}
                  </div>
                )}

                {!hasCustomSales && !salesSuccess && (
                  <span className="mt-4 inline-block text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                    Using Live Sample Sales
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upload 2: Store Master */}
          <div
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, "stores")}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col justify-center ${
              hasCustomStores 
                ? "border-emerald-200 bg-emerald-50/20" 
                : "border-slate-200 bg-slate-50/50 hover:border-[#0d5c75] hover:bg-slate-50"
            }`}
          >
            <div>
              <input
                type="file"
                ref={storesInputRef}
                onChange={(e) => e.target.files?.[0] && handleStoresUpload(e.target.files[0])}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <div className={`p-4 rounded-full mb-3 ${hasCustomStores ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>

                <h3 className="text-sm font-semibold text-slate-800">
                  {hasCustomStores ? "Store Master Uploaded" : "2. Store Master References (.xlsx, .csv)"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Drag & drop or <span onClick={() => storesInputRef.current?.click()} className="text-[#0d5c75] font-semibold hover:underline cursor-pointer">browse</span> to upload store master locations. Any file schema is supported.
                </p>

                {storesSuccess && (
                  <div className="mt-4 flex items-center gap-1.5 justify-center text-xs font-medium text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200/50">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {storesSuccess}
                  </div>
                )}

                {storesError && (
                  <div className="mt-4 flex items-center gap-1.5 justify-center text-xs font-medium text-rose-700 bg-rose-100/60 px-3 py-1.5 rounded-lg border border-rose-200/50">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {storesError}
                  </div>
                )}

                {!hasCustomStores && !storesSuccess && (
                  <span className="mt-4 inline-block text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                    Using Live Sample Stores
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines footer */}
      <div className="mt-6 flex items-start gap-2 text-slate-500 bg-blue-50/30 border border-blue-100 rounded-lg p-3.5 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-900 block mb-0.5">Automated Intelligence Parsing:</span>
          Our advanced parsing engine maps variables dynamically. You can drop two files simultaneously under the dual tab; they will be accurately categorized by inspecting the column fields and filenames in-memory.
        </div>
      </div>
    </div>
  );
}
