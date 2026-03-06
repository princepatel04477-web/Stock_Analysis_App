"use client";
import { useEffect, useRef } from "react";
import { ChartCandle } from "@/lib/api";
import { createChart, ColorType } from "lightweight-charts";

interface Props {
  symbol: string;
  chartData: ChartCandle[];
}

export default function PriceChart({ symbol, chartData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (sma20Data.length > 0) {
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
    if (sma50Data.length > 0) {
      const sma50Series = chart.addLineSeries({
        color: "#00BFFF",
        lineWidth: 1,
        title: "SMA 50",
      });
      sma50Series.setData(
        sma50Data.map((c) => ({ time: c.date as any, value: c.sma_50! }))
      );
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
  }, [chartData]);

  return (
    <div className="bg-[#1E2130] border border-[#2E3245] rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">📈 Price Chart — {symbol} (6 Months)</h3>
      <div className="flex gap-4 mb-3 text-xs text-[#8B949E]">
        <span><span className="inline-block w-3 h-0.5 bg-[#FFA500] mr-1 align-middle"></span>SMA 20</span>
        <span><span className="inline-block w-3 h-0.5 bg-[#00BFFF] mr-1 align-middle"></span>SMA 50</span>
        <span><span className="inline-block w-3 h-0.5 bg-[#3FB950] mr-1 align-middle"></span>Up</span>
        <span><span className="inline-block w-3 h-0.5 bg-[#F85149] mr-1 align-middle"></span>Down</span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
