"use dom";

import React, { useState, useMemo } from "react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface PlanetData {
  name: string;
  degree: number; // 0-360 ecliptic longitude
  sign?: string;
  signDegree?: number;
  isRetrograde?: boolean;
  house?: number;
}

export interface HouseCuspData {
  house: number;
  degree: number;
  sign?: string;
  signDegree?: number;
}

export interface AspectData {
  body1: string;
  body2: string;
  type: string; // conjunction, sextile, square, trine, opposition
  orb: number;
}

interface NatalChartViewProps {
  planets: PlanetData[];
  cusps: HouseCuspData[];
  aspects?: AspectData[];
  houseSystem: "placidus" | "wholeSign";
  dom?: import("expo/dom").DOMProps;
}

// 12 Zodiac signs in order from 0° Aries
const ZODIAC_SIGNS = [
  { name: "Aries", vi: "Bạch Dương", symbol: "♈", element: "fire", startDeg: 0 },
  { name: "Taurus", vi: "Kim Ngưu", symbol: "♉", element: "earth", startDeg: 30 },
  { name: "Gemini", vi: "Song Tử", symbol: "♊", element: "air", startDeg: 60 },
  { name: "Cancer", vi: "Cự Giải", symbol: "♋", element: "water", startDeg: 90 },
  { name: "Leo", vi: "Sư Tử", symbol: "♌", element: "fire", startDeg: 120 },
  { name: "Virgo", vi: "Xử Nữ", symbol: "♍", element: "earth", startDeg: 150 },
  { name: "Libra", vi: "Thiên Bình", symbol: "♎", element: "air", startDeg: 180 },
  { name: "Scorpio", vi: "Bọ Cạp", symbol: "♏", element: "water", startDeg: 210 },
  { name: "Sagittarius", vi: "Nhân Mã", symbol: "♐", element: "fire", startDeg: 240 },
  { name: "Capricorn", vi: "Ma Kết", symbol: "♑", element: "earth", startDeg: 270 },
  { name: "Aquarius", vi: "Bảo Bình", symbol: "♒", element: "air", startDeg: 300 },
  { name: "Pisces", vi: "Song Ngư", symbol: "♓", element: "water", startDeg: 330 },
];

// Element Color Palettes
const ELEMENT_COLORS: Record<string, { bg: string; text: string; stroke: string }> = {
  fire:  { bg: "rgba(239, 68, 68, 0.18)",  text: "#EF4444", stroke: "rgba(239, 68, 68, 0.4)" },
  earth: { bg: "rgba(34, 197, 94, 0.18)",  text: "#22C55E", stroke: "rgba(34, 197, 94, 0.4)" },
  air:   { bg: "rgba(245, 158, 11, 0.18)", text: "#F59E0B", stroke: "rgba(245, 158, 11, 0.4)" },
  water: { bg: "rgba(59, 130, 246, 0.18)", text: "#3B82F6", stroke: "rgba(59, 130, 246, 0.4)" },
};

// Planet Info (Glyph, Color, Name Translation)
const PLANET_META: Record<string, { symbol: string; vi: string; color: string }> = {
  Sun:       { symbol: "☉", vi: "Mặt Trời",     color: "#F59E0B" },
  Moon:      { symbol: "☽", vi: "Mặt Trăng",     color: "#93C5FD" },
  Mercury:   { symbol: "☿", vi: "Sao Thủy",      color: "#14B8A6" },
  Venus:     { symbol: "♀", vi: "Sao Kim",       color: "#EC4899" },
  Mars:      { symbol: "♂", vi: "Sao Hỏa",       color: "#EF4444" },
  Jupiter:   { symbol: "♃", vi: "Sao Mộc",       color: "#A855F7" },
  Saturn:    { symbol: "♄", vi: "Sao Thổ",       color: "#D97706" },
  Uranus:    { symbol: "♅", vi: "Thiên Vương",   color: "#06B6D4" },
  Neptune:   { symbol: "♆", vi: "Hải Vương",     color: "#6366F1" },
  Pluto:     { symbol: "♇", vi: "Diêm Vương",    color: "#8B5CF6" },
  NorthNode: { symbol: "☊", vi: "La Hầu (Bắc)",  color: "#F97316" },
  TrueNode:  { symbol: "☊", vi: "La Hầu (Bắc)",  color: "#F97316" },
  SouthNode: { symbol: "☋", vi: "Kế Đô (Nam)",   color: "#9CA3AF" },
  Chiron:    { symbol: "⚷", vi: "Chiron",        color: "#10B981" },
  Lilith:    { symbol: "⚸", vi: "Mặt Trăng Đen", color: "#64748B" },
  Ascendant: { symbol: "AC", vi: "Cung Mọc",     color: "#F43F5E" },
  Midheaven: { symbol: "MC", vi: "Thiên Đỉnh",   color: "#06B6D4" },
};

// Aspect Line Styles
const ASPECT_STYLES: Record<string, { color: string; dash?: string; width: number; vi: string }> = {
  conjunction: { color: "#F59E0B", width: 2,   vi: "Trùng tụ (0°)" },
  opposition:  { color: "#EF4444", width: 2,   vi: "Đối đỉnh (180°)" },
  trine:       { color: "#3B82F6", width: 2,   vi: "Tam hợp (120°)" },
  square:      { color: "#F97316", width: 1.8, vi: "Vuông góc (90°)" },
  sextile:     { color: "#10B981", width: 1.4, dash: "4,3", vi: "Lục hợp (60°)" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function NatalChartView({
  planets = [],
  cusps = [],
  aspects = [],
  houseSystem = "wholeSign",
}: NatalChartViewProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);

  // SVG Geometry Constants
  const SIZE = 500;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 236;
  const R_ZODIAC_INNER = 192;
  const R_HOUSES_INNER = 130;
  const R_ASPECTS = 110;
  const R_PLANETS = 162;

  // Ascendant angle defines chart rotation so Ascendant is always at 9 o'clock (180°)
  const ascDegree = useMemo(() => {
    const ascCusp = cusps?.find((c) => c.house === 1);
    if (ascCusp && typeof ascCusp.degree === "number") return ascCusp.degree;
    const ascPlanet = planets?.find((p) => p.name === "Ascendant");
    if (ascPlanet && typeof ascPlanet.degree === "number") return ascPlanet.degree;
    return 0;
  }, [cusps, planets]);

  // Transform Ecliptic degree (0-360) to SVG coordinates with Ascendant at 9 o'clock
  // Counter-clockwise direction standard in western astrology
  const degToSvg = (deg: number, r: number) => {
    const normalizedDeg = ((deg - ascDegree + 180) % 360 + 360) % 360;
    const rad = (normalizedDeg * Math.PI) / 180;
    return {
      x: CX + r * Math.cos(rad),
      y: CY - r * Math.sin(rad), // SVG Y axis is inverted
    };
  };

  // Generate SVG path for a circular ring sector (Zodiac sign slice)
  const describeArc = (startDeg: number, endDeg: number, rIn: number, rOut: number) => {
    const p1 = degToSvg(startDeg, rOut);
    const p2 = degToSvg(endDeg, rOut);
    const p3 = degToSvg(endDeg, rIn);
    const p4 = degToSvg(startDeg, rIn);

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOut} ${rOut} 0 0 0 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rIn} ${rIn} 0 0 1 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  };

  // Group planets with collision detection so clustered glyphs don't overlap
  const renderedPlanets = useMemo(() => {
    if (!planets || planets.length === 0) return [];
    
    // Filter valid planets
    const valid = planets.filter((p) => typeof p.degree === "number");
    const sorted = [...valid].sort((a, b) => a.degree - b.degree);
    
    // Assign radius offsets for overlapping glyphs
    return sorted.map((p, idx) => {
      let rOffset = 0;
      // Compare with previous planet
      if (idx > 0) {
        const prev = sorted[idx - 1];
        const diff = Math.abs(p.degree - prev.degree);
        if (diff < 7) {
          rOffset = idx % 2 === 0 ? 12 : -12;
        }
      }
      return {
        ...p,
        r: R_PLANETS + rOffset,
      };
    });
  }, [planets]);

  // Planet lookup map for aspect line calculation
  const planetDegreeMap = useMemo(() => {
    const map = new Map<string, number>();
    planets?.forEach((p) => {
      map.set(p.name, p.degree);
    });
    return map;
  }, [planets]);

  if (!planets || planets.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: 420,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#9CA3AF",
          fontSize: 14,
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "rgba(17, 24, 39, 0.4)",
          borderRadius: 24,
        }}
      >
        <span style={{ fontSize: 32, marginBottom: 8 }}>🌌</span>
        <span>Đang tính toán toạ độ thiên bàn...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        userSelect: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* SVG Birth Chart Wheel */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          width: "100%",
          maxWidth: 440,
          aspectRatio: "1/1",
          filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.4))",
        }}
      >
        <defs>
          {/* Subtle gradient in central hub */}
          <radialGradient id="centerHubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#0F172A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>

          {/* Glow filter for selected planet */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Deep Space Background Circle */}
        <circle cx={CX} cy={CY} r={R_OUTER + 2} fill="#090D16" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

        {/* 2. Zodiac Sign Segments (12 Arcs) */}
        {ZODIAC_SIGNS.map((sign) => {
          const pathD = describeArc(sign.startDeg, sign.startDeg + 30, R_ZODIAC_INNER, R_OUTER);
          const colorInfo = ELEMENT_COLORS[sign.element];
          const midDeg = sign.startDeg + 15;
          const glyphPos = degToSvg(midDeg, (R_OUTER + R_ZODIAC_INNER) / 2);

          return (
            <g key={sign.name}>
              {/* Colored slice background */}
              <path
                d={pathD}
                fill={colorInfo.bg}
                stroke={colorInfo.stroke}
                strokeWidth="0.75"
              />
              {/* Zodiac glyph */}
              <text
                x={glyphPos.x}
                y={glyphPos.y + 5}
                textAnchor="middle"
                fontSize="18"
                fontWeight="700"
                fill={colorInfo.text}
                style={{ pointerEvents: "none" }}
              >
                {sign.symbol}
              </text>
            </g>
          );
        })}

        {/* Outer and Inner Zodiac Border Rings */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r={R_ZODIAC_INNER} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

        {/* Degree Tick Marks (Every 5 degrees) */}
        {Array.from({ length: 72 }).map((_, i) => {
          const deg = i * 5;
          const isMajor = deg % 30 === 0;
          const isMid = deg % 10 === 0;
          const r1 = R_OUTER;
          const r2 = isMajor ? R_OUTER - 10 : isMid ? R_OUTER - 6 : R_OUTER - 3;
          const p1 = degToSvg(deg, r1);
          const p2 = degToSvg(deg, r2);
          return (
            <line
              key={`tick-${deg}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isMajor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)"}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}

        {/* 3. House Sector Lines (12 Cusps) */}
        {cusps?.map((cusp) => {
          const pInner = degToSvg(cusp.degree, R_HOUSES_INNER);
          const pOuter = degToSvg(cusp.degree, R_ZODIAC_INNER);
          const isAngle = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
          
          return (
            <line
              key={`cusp-line-${cusp.house}`}
              x1={pInner.x}
              y1={pInner.y}
              x2={pOuter.x}
              y2={pOuter.y}
              stroke={isAngle ? "#F43F5E" : "rgba(255, 255, 255, 0.18)"}
              strokeWidth={isAngle ? 2 : 1}
              strokeDasharray={isAngle ? undefined : "3,3"}
            />
          );
        })}

        {/* House Numbers (1 through 12) */}
        {cusps?.map((cusp, idx) => {
          const nextCusp = cusps[(idx + 1) % 12];
          let midHouseDeg = (cusp.degree + (nextCusp.degree < cusp.degree ? nextCusp.degree + 360 : nextCusp.degree)) / 2;
          midHouseDeg = midHouseDeg % 360;
          const numPos = degToSvg(midHouseDeg, (R_HOUSES_INNER + R_ZODIAC_INNER) / 2 - 20);

          return (
            <text
              key={`house-num-${cusp.house}`}
              x={numPos.x}
              y={numPos.y + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="rgba(255, 255, 255, 0.45)"
              style={{ pointerEvents: "none" }}
            >
              {cusp.house}
            </text>
          );
        })}

        {/* House Inner Circle */}
        <circle cx={CX} cy={CY} r={R_HOUSES_INNER} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* 4. Central Hub with Aspect Web */}
        <circle cx={CX} cy={CY} r={R_ASPECTS} fill="url(#centerHubGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* Aspect Lines */}
        {aspects?.map((aspect, idx) => {
          const deg1 = planetDegreeMap.get(aspect.body1);
          const deg2 = planetDegreeMap.get(aspect.body2);
          if (deg1 === undefined || deg2 === undefined) return null;

          const p1 = degToSvg(deg1, R_ASPECTS);
          const p2 = degToSvg(deg2, R_ASPECTS);
          const style = ASPECT_STYLES[aspect.type.toLowerCase()] || { color: "rgba(255,255,255,0.2)", width: 1, vi: aspect.type };

          return (
            <line
              key={`aspect-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={style.color}
              strokeWidth={style.width}
              strokeDasharray={style.dash}
              strokeOpacity="0.75"
            />
          );
        })}

        {/* Center Astrological Symbol Badge */}
        <circle cx={CX} cy={CY} r={18} fill="#1E1B4B" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <text
          x={CX}
          y={CY + 5}
          textAnchor="middle"
          fontSize="14"
          fill="#EC4899"
          fontWeight="bold"
        >
          ✨
        </text>

        {/* 5. Ascendant / Descendant / Midheaven Axis Labels */}
        {/* AC (Ascendant) Indicator at 9 o'clock */}
        <g transform={`translate(${CX - R_OUTER - 4}, ${CY})`}>
          <circle cx="0" cy="0" r="10" fill="#F43F5E" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">
            AC
          </text>
        </g>
        {/* DC (Descendant) Indicator at 3 o'clock */}
        <g transform={`translate(${CX + R_OUTER + 4}, ${CY})`}>
          <circle cx="0" cy="0" r="10" fill="#64748B" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">
            DC
          </text>
        </g>

        {/* 6. Planet Glyphs & Degree Labels */}
        {renderedPlanets.map((planet) => {
          const meta = PLANET_META[planet.name] || { symbol: "●", vi: planet.name, color: "#FFFFFF" };
          const pos = degToSvg(planet.degree, planet.r);
          const tickOuter = degToSvg(planet.degree, R_ZODIAC_INNER);
          const tickInner = degToSvg(planet.degree, R_HOUSES_INNER);
          const isSelected = selectedPlanet?.name === planet.name;

          return (
            <g
              key={planet.name}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedPlanet(isSelected ? null : planet)}
            >
              {/* Radial pointer tick to exact degree */}
              <line
                x1={tickInner.x}
                y1={tickInner.y}
                x2={tickOuter.x}
                y2={tickOuter.y}
                stroke={meta.color}
                strokeWidth={isSelected ? "2" : "0.75"}
                strokeOpacity={isSelected ? 1 : 0.6}
              />

              {/* Planet Glyph Bubble */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 15 : 12}
                fill={isSelected ? meta.color : "#0F172A"}
                stroke={meta.color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                filter={isSelected ? "url(#glow)" : undefined}
              />

              {/* Planet Glyph Symbol */}
              <text
                x={pos.x}
                y={pos.y + 4.5}
                textAnchor="middle"
                fontSize={isSelected ? "14" : "12"}
                fontWeight="bold"
                fill={isSelected ? "#FFFFFF" : meta.color}
              >
                {meta.symbol}
              </text>

              {/* Retrograde symbol (℞) if applicable */}
              {planet.isRetrograde && (
                <text
                  x={pos.x + 8}
                  y={pos.y - 7}
                  fontSize="9"
                  fontWeight="bold"
                  fill="#EF4444"
                >
                  ℞
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected Planet Interactive Card / Callout */}
      {selectedPlanet && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 16px",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            borderRadius: 14,
            border: `1px solid ${PLANET_META[selectedPlanet.name]?.color || "#EC4899"}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 380,
            width: "90%",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `${PLANET_META[selectedPlanet.name]?.color || "#EC4899"}20`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 20,
              color: PLANET_META[selectedPlanet.name]?.color || "#FFFFFF",
              flexShrink: 0,
            }}
          >
            {PLANET_META[selectedPlanet.name]?.symbol || "●"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                {PLANET_META[selectedPlanet.name]?.vi || selectedPlanet.name}
              </span>
              {selectedPlanet.isRetrograde && (
                <span style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>
                  ℞ Nghịch hành
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
              {selectedPlanet.sign} {Math.floor(selectedPlanet.signDegree ?? (selectedPlanet.degree % 30))}°{" "}
              {selectedPlanet.house ? `· Nhà ${selectedPlanet.house}` : ""}
            </div>
          </div>
          <button
            onClick={() => setSelectedPlanet(null)}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              fontSize: 16,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend & Aspect Summary Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 10,
          flexWrap: "wrap",
          padding: "0 10px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94A3B8" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#3B82F6" }} /> Tam hợp 120°
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94A3B8" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F97316" }} /> Vuông góc 90°
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94A3B8" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} /> Lục hợp 60°
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94A3B8" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} /> Đối đỉnh 180°
        </span>
      </div>
    </div>
  );
}
