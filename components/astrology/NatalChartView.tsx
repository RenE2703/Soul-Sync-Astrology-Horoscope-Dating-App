"use dom";

import React, { useEffect, useRef, useState } from "react";
// Dynamic import of astrochart2 inside useEffect to prevent SSR errors

interface PlanetData {
  name: string;
  angle: number;
}

interface ChartDataProps {
  planets: any[];
  cusps: any[];
  aspects: any[];
  houseSystem: "placidus" | "wholeSign";
}

/**
 * Expo DOM Component that renders the interactive SVG Natal Chart
 * using the AstrologyChart2 library in a webview environment.
 */
export default function NatalChartView({
  planets,
  cusps,
  aspects,
  houseSystem,
}: {
  planets: any[];
  cusps: any[];
  aspects: any[];
  houseSystem: "placidus" | "wholeSign";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    async function drawChart() {
      console.log("[NatalChartView] drawChart called");
      console.log("[NatalChartView] containerRef:", containerRef.current);
      console.log("[NatalChartView] planets:", planets);
      console.log("[NatalChartView] cusps:", cusps);

      if (!containerRef.current) {
        console.warn("[NatalChartView] No container ref, aborting.");
        return;
      }
      if (!planets || !cusps || planets.length === 0 || cusps.length === 0) {
        console.warn("[NatalChartView] Missing or empty planets/cusps, aborting.");
        return;
      }

      try {
        // @ts-ignore
        const astro = require("astrochart2/dist/astrochart2.js");
        console.log("[NatalChartView] astrochart2 loaded, keys:", Object.keys(astro));
        const Universe = astro.Universe ?? astro.default?.Universe ?? astro.default;
        if (!Universe) {
          throw new Error("Could not find Universe export in astrochart2");
        }

        // Inject the Astronomicon font from our public folder
        if ('FontFace' in window) {
          try {
            const font = new (window as any).FontFace('Astronomicon', 'url(/fonts/Astronomicon.ttf)');
            await font.load();
            (document as any).fonts.add(font);
            console.log('[NatalChartView] Astronomicon font loaded!');
          } catch (fontErr) {
            console.warn('[NatalChartView] Font load failed, using serif fallback:', fontErr);
          }
        }

        // Clear previous chart
        containerRef.current.innerHTML = "";

        // Add a wrapper div with id for astrochart2
        const chartDivId = "astro-chart-wrapper";
        const chartDiv = document.createElement("div");
        chartDiv.id = chartDivId;
        chartDiv.style.width = "400px";
        chartDiv.style.height = "400px";
        containerRef.current.appendChild(chartDiv);

        // Map planets to astrochart2 format: [{name: "Sun", angle: 30}, ...]
        const chartPlanets = planets.map((p) => ({
          name: p.name,
          angle: p.degree ?? p.longitude ?? 0,
        }));
        console.log("[NatalChartView] chartPlanets:", chartPlanets.slice(0, 3));

        // Map cusps to astrochart2 format: [{angle: 300}, ...]
        const chartCusps = cusps
          .sort((a: any, b: any) => a.house - b.house)
          .map((c: any) => ({ angle: c.degree ?? c.angle ?? 0 }));
        console.log("[NatalChartView] chartCusps:", chartCusps.slice(0, 3));

        // Create the chart instance
        const universe = new Universe(chartDivId, {
          CHART_FONT_FAMILY: "Astronomicon", // served from /public/fonts/
          CHART_MAIN_STROKE: 1.5,
        });

        const data = {
          points: chartPlanets,
          cusps: chartCusps,
        };

        console.log("[NatalChartView] Calling setData with:", data);
        const radix = universe.radix();
        radix.setData(data);
        console.log("[NatalChartView] Chart drawn successfully!");

      } catch (error: any) {
        console.error("[NatalChartView] Error drawing natal chart:", error);
        setChartError(error.message);
      }
    }
    
    drawChart();
  }, [planets, cusps, houseSystem]);

  if (chartError) {
    return (
      <div style={{ color: "red", padding: 20 }}>
        Chart Error: {chartError}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: 400,
        minHeight: 400,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
      ref={containerRef}
    />
  );
}
