"use client";
import { useState, useMemo, useRef, useEffect, useCallback, KeyboardEvent } from "react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
}

interface NavbarSearchProps {
  stocks: Stock[];
  loading: boolean;
  onAnalyze: (symbol: string) => void;
}

const RECENT_KEY = "niftypulse_recent";
const MAX_RESULTS = 8;
const MAX_RECENT = 5;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(symbol: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getRecent().filter((s) => s !== symbol);
    list.unshift(symbol);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

function clearRecent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
}

// ──────────────────────────────────────────────
// Spinner shown inside the Analyze button
// ──────────────────────────────────────────────
function ButtonSpinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid rgba(0,0,0,0.4)",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "navSpinAnim 0.6s linear infinite",
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function NavbarSearch({ stocks, loading, onAnalyze }: NavbarSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Load recent on client
  useEffect(() => {
    setRecent(getRecent());
  }, []);

  // Filter stocks matching query (top MAX_RESULTS)
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toUpperCase();
    return stocks
      .filter((s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [query, stocks]);

  // Show recent when empty + focused, show results otherwise
  const showRecent = focused && query.trim() === "" && recent.length > 0;
  const showResults = focused && query.trim().length > 0;
  const dropdownOpen = isOpen && (showRecent || showResults);

  // Items displayed in the dropdown (mix of recent strings and Stock objects)
  const displayItems: (string | Stock)[] = showResults ? filtered : (showRecent ? recent : []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocused(false);
        setHighlighted(-1);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  const triggerAnalyze = useCallback(
    (item: string | Stock) => {
      const symbol = typeof item === 'string' 
        ? item.split(" - ")[0].trim().toUpperCase()
        : item.symbol.toUpperCase();
      if (!symbol) return;
      setQuery(symbol);
      setIsOpen(false);
      setFocused(false);
      setHighlighted(-1);
      saveRecent(symbol);
      setRecent(getRecent());
      onAnalyze(symbol);
      // Scroll to the analysis section
      setTimeout(() => {
        document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [onAnalyze],
  );

  const handleSelect = (item: string | Stock) => {
    triggerAnalyze(item);
  };

  const handleAnalyzeClick = () => {
    triggerAnalyze(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) {
      if (e.key === "Enter") {
        triggerAnalyze(query);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, displayItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && displayItems[highlighted]) {
          handleSelect(displayItems[highlighted]);
        } else {
          triggerAnalyze(query);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlighted(-1);
        break;
    }
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecent();
    setRecent([]);
    setIsOpen(false);
  };

  return (
    <>
      {/* Keyframe injected once via style tag */}
      <style>{`
        @keyframes navSpinAnim {
          to { transform: rotate(360deg); }
        }
        .nb-input:focus {
          border-color: rgba(57,255,20,0.4) !important;
          box-shadow: 0 0 0 3px rgba(57,255,20,0.08) !important;
        }
        .nb-input::placeholder {
          color: #6b7280;
        }
        .nb-item:hover {
          background: rgba(57,255,20,0.06) !important;
        }
        .nb-item:hover .nb-sym {
          color: #39FF14 !important;
        }
        .nb-dropdown::-webkit-scrollbar {
          width: 4px;
        }
        .nb-dropdown::-webkit-scrollbar-track {
          background: #111;
        }
        .nb-dropdown::-webkit-scrollbar-thumb {
          background: rgba(57,255,20,0.3);
          border-radius: 4px;
        }
        .nb-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(57,255,20,0.5);
        }
        .nb-analyze-btn:hover:not(:disabled) {
          background: #2dd10e !important;
          box-shadow: 0 0 16px rgba(57,255,20,0.4) !important;
        }
      `}</style>

      {/* ─── Search container (hidden on < 768px via CSS) ─── */}
      <div
        ref={containerRef}
        className="nb-search-wrapper"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: 320,
          flexShrink: 0,
        }}
      >
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className="nb-input"
          value={query}
          placeholder="Search NSE stock... eg. RELIANCE"
          disabled={loading}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setIsOpen(true);
            setHighlighted(-1);
          }}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRight: "none",
            borderRadius: "999px 0 0 999px",
            padding: "8px 16px",
            fontSize: 13,
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            outline: "none",
            width: "100%",
            transition: "all 0.2s ease",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "text",
          }}
        />

        {/* Analyze button */}
        <button
          className="nb-analyze-btn"
          onClick={handleAnalyzeClick}
          disabled={loading || !query.trim()}
          style={{
            background: "#39FF14",
            color: "#000000",
            fontWeight: 700,
            fontSize: 13,
            padding: "8px 18px",
            borderRadius: "0 999px 999px 0",
            border: "none",
            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            flexShrink: 0,
            opacity: loading ? 0.8 : 1,
            transition: "background 0.15s, box-shadow 0.15s",
            height: 36,
          }}
        >
          {loading ? <ButtonSpinner /> : "Analyze →"}
        </button>

        {/* ─── Dropdown ─── */}
        {dropdownOpen && (
          <div
            className="nb-dropdown"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              overflow: "hidden",
              zIndex: 1000,
              maxHeight: 320,
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Recent searches header */}
            {showRecent && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 16px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  Recent Searches
                </span>
                <button
                  onMouseDown={handleClearRecent}
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* No results */}
            {showResults && filtered.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                No stocks found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Result / Recent list */}
            {displayItems.length > 0 && (
              <ul ref={listRef} style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {displayItems.map((item, idx) => {
                  const isRecent = typeof item === 'string';
                  const sym = isRecent ? item.split(" - ")[0] : item.symbol;
                  const name = isRecent ? item.split(" - ")[1] : item.name;
                  const isHighlighted = idx === highlighted;
                  return (
                    <li
                      key={isRecent ? item : item.symbol}
                      className="nb-item"
                      onMouseDown={() => handleSelect(item)}
                      onMouseEnter={() => setHighlighted(idx)}
                      style={{
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: isHighlighted
                          ? "rgba(57,255,20,0.08)"
                          : "transparent",
                        borderLeft: isHighlighted
                          ? "2px solid #39FF14"
                          : "2px solid transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
                        {isRecent && (
                          <span style={{ marginRight: 8, fontSize: 13 }}>🕐</span>
                        )}
                        <span
                          className="nb-sym"
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isHighlighted ? "#39FF14" : "#ffffff",
                            whiteSpace: "nowrap",
                            transition: "color 0.15s",
                          }}
                        >
                          {sym}
                        </span>
                        {name && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              marginLeft: 8,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {name}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          background: "rgba(57,255,20,0.1)",
                          color: "#39FF14",
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 600,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        NSE
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Mobile / below-hero variant (full width)
// ──────────────────────────────────────────────
export function MobileNavbarSearch({ stocks, loading, onAnalyze }: NavbarSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toUpperCase();
    return stocks.filter((s) =>
      s.symbol.toUpperCase().includes(q) ||
      s.name.toUpperCase().includes(q)
    ).slice(0, MAX_RESULTS);
  }, [query, stocks]);

  const showRecent = focused && query.trim() === "" && recent.length > 0;
  const showResults = focused && query.trim().length > 0;
  const dropdownOpen = isOpen && (showRecent || showResults);
  const displayItems: (string | Stock)[] = showResults ? filtered : (showRecent ? recent : []);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocused(false);
        setHighlighted(-1);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  const triggerAnalyze = useCallback(
    (item: string | Stock) => {
      const symbol = typeof item === 'string'
        ? item.split(" - ")[0].trim().toUpperCase()
        : item.symbol.toUpperCase();
      if (!symbol) return;
      setQuery(symbol);
      setIsOpen(false);
      setFocused(false);
      setHighlighted(-1);
      saveRecent(symbol);
      setRecent(getRecent());
      onAnalyze(symbol);
      setTimeout(() => {
        document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [onAnalyze],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) {
      if (e.key === "Enter") triggerAnalyze(query);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, displayItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && displayItems[highlighted]) {
          triggerAnalyze(displayItems[highlighted]);
        } else {
          triggerAnalyze(query);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlighted(-1);
        break;
    }
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecent();
    setRecent([]);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}
    >
      <input
        type="text"
        className="nb-input"
        value={query}
        placeholder="Search NSE stock... eg. RELIANCE"
        disabled={loading}
        autoComplete="off"
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setHighlighted(-1); }}
        onFocus={() => { setFocused(true); setIsOpen(true); setHighlighted(-1); }}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRight: "none",
          borderRadius: "999px 0 0 999px",
          padding: "10px 18px",
          fontSize: 14,
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          outline: "none",
          width: "100%",
          transition: "all 0.2s ease",
          opacity: loading ? 0.6 : 1,
        }}
      />
      <button
        className="nb-analyze-btn"
        onClick={() => triggerAnalyze(query)}
        disabled={loading || !query.trim()}
        style={{
          background: "#39FF14",
          color: "#000",
          fontWeight: 700,
          fontSize: 14,
          padding: "10px 20px",
          borderRadius: "0 999px 999px 0",
          border: "none",
          cursor: loading || !query.trim() ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          flexShrink: 0,
          opacity: loading ? 0.8 : 1,
          height: 42,
        }}
      >
        {loading ? <ButtonSpinner /> : "Analyze →"}
      </button>

      {dropdownOpen && (
        <div
          className="nb-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 1000,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {showRecent && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 4px" }}>
              <span style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Recent Searches
              </span>
              <button onMouseDown={handleClearRecent} style={{ fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Clear
              </button>
            </div>
          )}
          {showResults && filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
              No stocks found for &ldquo;{query}&rdquo;
            </div>
          )}
          {displayItems.length > 0 && (
            <ul ref={listRef} style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {displayItems.map((item, idx) => {
                const isRecent = typeof item === 'string';
                const sym = isRecent ? item.split(" - ")[0] : item.symbol;
                const name = isRecent ? item.split(" - ")[1] : item.name;
                const isHL = idx === highlighted;
                return (
                  <li
                    key={isRecent ? item : item.symbol}
                    className="nb-item"
                    onMouseDown={() => triggerAnalyze(item)}
                    onMouseEnter={() => setHighlighted(idx)}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: isHL ? "rgba(57,255,20,0.08)" : "transparent",
                      borderLeft: isHL ? "2px solid #39FF14" : "2px solid transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
                      {isRecent && <span style={{ marginRight: 8, fontSize: 13 }}>🕐</span>}
                      <span
                        className="nb-sym"
                        style={{ fontSize: 14, fontWeight: 700, color: isHL ? "#39FF14" : "#ffffff", whiteSpace: "nowrap", transition: "color 0.15s" }}
                      >
                        {sym}
                      </span>
                      {name && (
                        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </span>
                      )}
                    </div>
                    <span style={{ background: "rgba(57,255,20,0.1)", color: "#39FF14", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                      NSE
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
