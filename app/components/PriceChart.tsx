"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChartCandle } from "@/lib/api";
import { createChart, ColorType } from "lightweight-charts";

interface Props {
  symbol: string;
  chartData: ChartCandle[];
}

export default function PriceChart({ symbol, chartData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showEma9, setShowEma9] = useState(false);
  const [showEma21, setShowEma21] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showMacd, setShowMacd] = useState(false);

  const macdLatest = useMemo(() => {
    const latest = [...chartData].reverse().find((c) => c.macd != null && c.macd_signal != null);
    return {
      macd: latest?.macd ?? null,
      signal: latest?.macd_signal ?? null,
    };
  }, [chartData]);

  useEffect(() => {
    if (!containerRef.current || !chartData?.length) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0E1117" },
        textColor: "#8B949E",
      },
      grid: {
        vertLines: { color: "#30363D" },
        horzLines: { color: "#30363D" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#30363D" },
      timeScale: { borderColor: "#30363D", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#3FB950",
      downColor: "#F85149",
      borderUpColor: "#3FB950",
      borderDownColor: "#F85149",
      wickUpColor: "#3FB950",
      wickDownColor: "#F85149",
    });

    candleSeries.setData(
      chartData.map((c) => ({
        time: c.date as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const sma20Data = chartData.filter((c) => c.sma_20 != null);
    if (showSma20 && sma20Data.length > 0) {
      const sma20Series = chart.addLineSeries({
        color: "#FFA500",
        lineWidth: 1,
        title: "SMA 20",
      });
      sma20Series.setData(
        sma20Data.map((c) => ({ time: c.date as any, value: c.sma_20! }))
      );
    }

    const sma50Data = chartData.filter((c) => c.sma_50 != null);
    if (showSma50 && sma50Data.length > 0) {
      const sma50Series = chart.addLineSeries({
        color: "#00BFFF",
        lineWidth: 1,
        title: "SMA 50",
      });
      sma50Series.setData(
        sma50Data.map((c) => ({ time: c.date as any, value: c.sma_50! }))
      );
    }

    const ema9Data = chartData.filter((c) => c.ema_9 != null);
    if (showEma9 && ema9Data.length > 0) {
      const ema9Series = chart.addLineSeries({
        color: "#a855f7",
        lineWidth: 1,
        title: "EMA 9",
      });
      ema9Series.setData(
        ema9Data.map((c) => ({ time: c.date as any, value: c.ema_9! }))
      );
    }

    const ema21Data = chartData.filter((c) => c.ema_21 != null);
    if (showEma21 && ema21Data.length > 0) {
      const ema21Series = chart.addLineSeries({
        color: "#ec4899",
        lineWidth: 1,
        title: "EMA 21",
      });
      ema21Series.setData(
        ema21Data.map((c) => ({ time: c.date as any, value: c.ema_21! }))
      );
    }

    if (showBollinger) {
      const bbUpperData = chartData.filter((c) => c.bb_upper != null);
      const bbMiddleData = chartData.filter((c) => c.bb_middle != null);
      const bbLowerData = chartData.filter((c) => c.bb_lower != null);

      if (bbUpperData.length > 0) {
        const upperSeries = chart.addLineSeries({
          color: "rgba(107,114,128,0.6)",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Upper",
        });
        upperSeries.setData(bbUpperData.map((c) => ({ time: c.date as any, value: c.bb_upper! })));
      }
      if (bbMiddleData.length > 0) {
        const middleSeries = chart.addLineSeries({
          color: "rgba(107,114,128,0.4)",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Middle",
        });
        middleSeries.setData(bbMiddleData.map((c) => ({ time: c.date as any, value: c.bb_middle! })));
      }
      if (bbLowerData.length > 0) {
        const lowerSeries = chart.addLineSeries({
          color: "rgba(107,114,128,0.6)",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Lower",
        });
        lowerSeries.setData(bbLowerData.map((c) => ({ time: c.date as any, value: c.bb_lower! })));
      }

      const bbAreaData = chartData.filter((c) => c.bb_upper != null && c.bb_lower != null);
      if (bbAreaData.length > 0) {
        const areaSeries = chart.addAreaSeries({
          lineColor: "rgba(0,0,0,0)",
          topColor: "rgba(107,114,128,0.08)",
          bottomColor: "rgba(107,114,128,0)",
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        areaSeries.setData(bbAreaData.map((c) => ({ time: c.date as any, value: c.bb_upper! })));
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData, showSma20, showSma50, showEma9, showEma21, showBollinger]);

  useEffect(() => {
    if (!showMacd || !macdRef.current || !chartData?.length) return;

    const macdChart = createChart(macdRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111111" },
        textColor: "#8B949E",
      },
      grid: {
        vertLines: { color: "#30363D" },
        horzLines: { color: "#30363D" },
      },
      rightPriceScale: { borderColor: "#30363D" },
      timeScale: { borderColor: "#30363D", timeVisible: true },
      width: macdRef.current.clientWidth,
      height: 120,
    });

    const histSeries = macdChart.addHistogramSeries({
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    histSeries.setData(
      chartData
        .filter((c) => c.macd_diff != null)
        .map((c) => ({
          time: c.date as any,
          value: c.macd_diff!,
          color: c.macd_diff! >= 0 ? "rgba(57,255,20,0.5)" : "rgba(248,81,73,0.5)",
        }))
    );

    const macdSeries = macdChart.addLineSeries({ color: "#39FF14", lineWidth: 2, title: "MACD" });
    macdSeries.setData(
      chartData.filter((c) => c.macd != null).map((c) => ({ time: c.date as any, value: c.macd! }))
    );

    const signalSeries = macdChart.addLineSeries({ color: "#F85149", lineWidth: 2, title: "Signal" });
    signalSeries.setData(
      chartData.filter((c) => c.macd_signal != null).map((c) => ({ time: c.date as any, value: c.macd_signal! }))
    );

    const zeroSeries = macdChart.addLineSeries({
      color: "rgba(255,255,255,0.1)",
      lineWidth: 1,
      lineStyle: 2,
      title: "Zero",
    });
    zeroSeries.setData(chartData.map((c) => ({ time: c.date as any, value: 0 })));

    macdChart.timeScale().fitContent();
    const resize = () => {
      if (macdRef.current) macdChart.applyOptions({ width: macdRef.current.clientWidth });
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      macdChart.remove();
    };
  }, [chartData, showMacd]);

  return (
    <div className="bg-[#1E2130] border border-[#2E3245] rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">📈 Price Chart — {symbol} (6 Months)</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[
          { label: "SMA 20", active: showSma20, set: setShowSma20, color: "#FFA500" },
          { label: "SMA 50", active: showSma50, set: setShowSma50, color: "#00BFFF" },
          { label: "EMA 9", active: showEma9, set: setShowEma9, color: "#a855f7" },
          { label: "EMA 21", active: showEma21, set: setShowEma21, color: "#ec4899" },
          { label: "Bollinger Bands", active: showBollinger, set: setShowBollinger, color: "#6b7280" },
          { label: "MACD", active: showMacd, set: setShowMacd, color: "#39FF14" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => item.set(!item.active)}
            style={{
              background: item.active ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.04)",
              border: item.active ? "1px solid rgba(57,255,20,0.35)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              padding: "5px 14px",
              fontSize: 12,
              color: item.active ? "#39FF14" : "#6b7280",
              cursor: "pointer",
              transition: "all 0.2s",
              userSelect: "none",
            }}
          >
            <span style={{ color: item.color }}>{item.label}</span>
          </button>
        ))}
      </div>
      <div ref={containerRef} className="w-full" />
      {showMacd && (
        <div
          style={{
            marginTop: 0,
            background: "#111111",
            borderRadius: "0 0 12px 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>MACD (12,26,9)</span>
            <span style={{ fontSize: 11 }}>
              <span style={{ color: "#39FF14" }}>MACD: {macdLatest.macd != null ? macdLatest.macd.toFixed(2) : "—"}</span>
              <span style={{ marginLeft: 10, color: "#F85149" }}>Signal: {macdLatest.signal != null ? macdLatest.signal.toFixed(2) : "—"}</span>
            </span>
          </div>
          <div ref={macdRef} className="w-full" />
        </div>
      )}
    </div>
  );
}
