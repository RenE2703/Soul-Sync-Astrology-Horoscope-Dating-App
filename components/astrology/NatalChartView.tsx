"use dom";

import React, { useEffect, useRef, useState } from "react";
// @ts-ignore - astrochart2 might not have types
import { Chart } from "astrochart2";

interface PlanetData {
  [key: string]: [number]; // astrochart expects an array with [degree] for each planet
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
  dom: { window },
}: {
  planets: any[];
  cusps: any[];
  aspects: any[];
  houseSystem: "placidus" | "wholeSign";
  dom: any; // Expo DOM passes the window object natively via `dom` prop? 
            // Actually `dom` props are passed automatically in Expo SDK 52. 
            // We just need to render a div and use refs.
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!planets || !cusps) return;

    try {
      // Clear previous chart
      containerRef.current.innerHTML = "";

      // Add a wrapper div with id for astrochart2
      const chartDivId = "astro-chart-wrapper";
      const chartDiv = document.createElement("div");
      chartDiv.id = chartDivId;
      containerRef.current.appendChild(chartDiv);

      // Map planets to astrochart2 format: { "Sun": [degree], "Moon": [degree] }
      const chartPlanets: PlanetData = {};
      planets.forEach((p) => {
        chartPlanets[p.name] = [p.degree];
      });

      // Map cusps to astrochart2 format: [cusp1, cusp2, ..., cusp12]
      const chartCusps = cusps.sort((a, b) => a.house - b.house).map((c) => c.degree);

      // Create the chart instance. It will look for the element by ID.
      // Width/Height: 600
      const chart = new Chart(chartDivId, 600, 600, {
        margin: 50,
        colorWindow: "#111827", // match app dark theme background
        colorLine: "#4B5563",
        colorSign: "#E5E7EB",
        SYMBOL_SCALE: 1,
        // Add custom styling overrides if needed
      });

      const data = {
        planets: chartPlanets,
        cusps: chartCusps,
      };

      const radix = chart.radix(data);
      
      // Draw aspects if available
      if (aspects && aspects.length > 0) {
        // Map aspects
        aspects.forEach((asp) => {
          // Astrochart2 radix aspect method
          radix.addPointsOfInterest({
            [asp.body1]: [planets.find(p => p.name === asp.body1)?.degree || 0],
          });
          // Or we can let it auto-calculate aspects by providing settings
        });
        
        // Actually Astrochart2 has a specific way to draw aspects, usually it calculates them automatically.
        // Let's just use default radix.aspects()
        radix.aspects();
      }

    } catch (error: any) {
      console.error("Error drawing natal chart:", error);
      setChartError(error.message);
    }
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
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
      ref={containerRef}
    />
  );
}
