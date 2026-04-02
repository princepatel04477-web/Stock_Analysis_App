"use client";
import { useState, useMemo } from "react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
}

interface Props {
  stocks: Stock[];
  onAnalyze: (symbol: string) => void;
  loading: boolean;
}

export default function SearchBar({ stocks, onAnalyze, loading }: Props) {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState<Stock | null>(null);
  const [open, setOpen]         = useState(false);

  const filtered = useMemo(() => {
    if (!query || query.length < 1) return stocks.slice(0, 50);
    const q = query.toUpperCase();
    return stocks.filter((s) => 
      s.symbol.toUpperCase().includes(q) || 
      s.name.toUpperCase().includes(q)
    ).slice(0, 50);
  }, [query, stocks]);

  const handleSelect = (stock: Stock) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setOpen(false);
  };

  const handleAnalyze = () => {
    const symbol = selected?.symbol || query.split(" - ")[0].trim();
    if (symbol) onAnalyze(symbol);
  };

  return (
    <div className="flex gap-3 items-start w-full max-w-2xl">
      {/* Search Input + Dropdown */}
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by symbol or company name..."
          className="w-full bg-[#161B22] border border-[#30363D] rounded-lg px-4 py-3 text-white placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] transition-colors"
        />

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-[#161B22] border border-[#30363D] rounded-lg max-h-64 overflow-y-auto shadow-xl">
            {filtered.map((stock) => (
              <li
                key={stock.symbol}
                onMouseDown={() => handleSelect(stock)}
                className="px-4 py-2.5 hover:bg-[#1E2130] cursor-pointer flex justify-between items-center border-b border-[#30363D] last:border-0"
              >
                <span className="font-mono font-bold text-[#58A6FF] text-sm">{stock.symbol}</span>
                <span className="text-[#8B949E] text-xs truncate ml-3 max-w-[200px]">{stock.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || (!selected && !query)}
        className="px-6 py-3 bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analyzing...
          </span>
        ) : "Analyze Stock"}
      </button>
    </div>
  );
}
