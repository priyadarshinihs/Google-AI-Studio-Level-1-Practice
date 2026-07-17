import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  Search, 
  X, 
  Check, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  LayoutGrid, 
  Tag 
} from "lucide-react";

interface SlicerDropdownProps {
  title: string;
  icon: React.ReactNode;
  available: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  showSearch?: boolean;
}

export function SlicerDropdown({
  title,
  icon,
  available,
  selected,
  onChange,
  showSearch = false,
}: SlicerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([...available]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Label text to display in the dropdown selection box (Matches Power BI slicer behavior)
  const getSelectionLabel = () => {
    if (selected.length === 0) return "All"; // default selection is all when empty / nothing filtered
    const activeSelected = selected.filter((item) => available.includes(item));
    if (activeSelected.length === 0) return "None";
    if (activeSelected.length === available.length) return "All";
    if (activeSelected.length === 1) return activeSelected[0];
    return `${activeSelected.length} selected`;
  };

  const filteredList = available.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col relative w-full" ref={containerRef}>
      {/* Slicer Header (Field Name) */}
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        {icon}
        {title}
      </span>

      {/* Dropdown Input/Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold flex items-center justify-between shadow-2xs transition-all duration-150 text-left focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
      >
        <span className="truncate max-w-[85%] text-slate-800">
          {getSelectionLabel()}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-[105%] left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col max-h-56 mt-1 overflow-hidden">
          {/* Slicer Action Controls (All / Clear) */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex-shrink-0 text-[10px] font-black">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Slicer Search (Optional) */}
          {showSearch && (
            <div className="px-2.5 py-1.5 border-b border-slate-100 bg-white flex items-center gap-1.5 flex-shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none placeholder-slate-400 text-slate-700 font-medium"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery("")} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Slicer Checklist */}
          <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
            {filteredList.map((item) => {
              const isChecked = selected.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleToggleOption(item)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between group cursor-pointer ${
                    isChecked 
                      ? "bg-emerald-50 text-emerald-800 font-bold" 
                      : "hover:bg-slate-50 text-slate-600 font-semibold"
                  }`}
                >
                  <span className="truncate max-w-[85%]">{item}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isChecked 
                      ? "bg-[#10b981] border-[#10b981] text-white" 
                      : "border-slate-300 group-hover:border-slate-400 bg-white"
                  }`}>
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
            {filteredList.length === 0 && (
              <span className="text-[10px] text-slate-400 italic block py-4 text-center">
                No matching options
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FiltersPanelProps {
  availableWeeks: string[];
  availableRegions: string[];
  availableStores: string[];
  availableCities: string[];
  availableStoreFormats: string[];
  availableCategories: string[];

  selectedWeeks: string[];
  selectedRegions: string[];
  selectedStores: string[];
  selectedCities: string[];
  selectedStoreFormats: string[];
  selectedCategories: string[];

  setSelectedWeeks: (weeks: string[]) => void;
  setSelectedRegions: (regions: string[]) => void;
  setSelectedStores: (stores: string[]) => void;
  setSelectedCities: (cities: string[]) => void;
  setSelectedStoreFormats: (formats: string[]) => void;
  setSelectedCategories: (categories: string[]) => void;

  onClearAll: () => void;
}

export default function FiltersPanel({
  availableWeeks,
  availableRegions,
  availableStores,
  availableCities,
  availableStoreFormats,
  availableCategories,

  selectedWeeks,
  selectedRegions,
  selectedStores,
  selectedCities,
  selectedStoreFormats,
  selectedCategories,

  setSelectedWeeks,
  setSelectedRegions,
  setSelectedStores,
  setSelectedCities,
  setSelectedStoreFormats,
  setSelectedCategories,

  onClearAll,
}: FiltersPanelProps) {
  return (
    <div className="space-y-5 pb-24">
      {/* Slicer action reset button at top */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2 flex-shrink-0 shadow-2xs">
        <span className="text-[10px] font-black text-[#0d5c75] uppercase tracking-widest">Slicer Panel</span>
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] text-[#0d5c75] hover:text-[#0b5466] font-bold bg-white border border-slate-300 rounded-md transition-all shadow-3xs cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          Clear All Slicers
        </button>
      </div>

      {/* Dropdown Slicers Grid */}
      <div className="space-y-5">
        {/* 1. Week Dropdown */}
        <SlicerDropdown
          title="Week"
          icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
          available={availableWeeks}
          selected={selectedWeeks}
          onChange={setSelectedWeeks}
        />

        {/* 2. Region Dropdown */}
        <SlicerDropdown
          title="Region"
          icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
          available={availableRegions}
          selected={selectedRegions}
          onChange={setSelectedRegions}
        />

        {/* 3. Store Dropdown */}
        <SlicerDropdown
          title="Store"
          icon={<ShoppingBag className="w-3.5 h-3.5 text-slate-400" />}
          available={availableStores}
          selected={selectedStores}
          onChange={setSelectedStores}
          showSearch={true}
        />

        {/* 4. City Dropdown */}
        <SlicerDropdown
          title="City"
          icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
          available={availableCities}
          selected={selectedCities}
          onChange={setSelectedCities}
          showSearch={true}
        />

        {/* 5. Store Format Dropdown */}
        <SlicerDropdown
          title="Store Format"
          icon={<LayoutGrid className="w-3.5 h-3.5 text-slate-400" />}
          available={availableStoreFormats}
          selected={selectedStoreFormats}
          onChange={setSelectedStoreFormats}
        />

        {/* 6. Product Category Dropdown */}
        <SlicerDropdown
          title="Product Category"
          icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
          available={availableCategories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
      </div>
    </div>
  );
}
