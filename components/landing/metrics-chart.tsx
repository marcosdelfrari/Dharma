"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { easeOut, useChartInView } from "@/components/landing/motion";

const CHART_W = 400;
const CHART_H = 112;
const PAD_X = 2;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

const PT_DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export type MetricsSeries = {
  id: string;
  stroke: string;
  fill: string;
  points: number[];
};

function rollingWeekLabels() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return PT_DAY_LABELS[day.getDay()];
  });
}

function plotCoords(
  points: number[],
  min: number,
  max: number,
): { x: number; y: number }[] {
  const range = max - min || 1;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
  return points.map((point, index) => ({
    x: PAD_X + (index / (points.length - 1)) * (CHART_W - PAD_X * 2),
    y: PAD_TOP + (1 - (point - min) / range) * plotH,
  }));
}

function linePath(coords: { x: number; y: number }[]) {
  return coords
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

function areaPath(coords: { x: number; y: number }[]) {
  if (coords.length === 0) return "";
  const base = CHART_H - PAD_BOTTOM;
  const line = linePath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  return `${line} L${last.x.toFixed(2)},${base} L${first.x.toFixed(2)},${base} Z`;
}

const FALLBACK_DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const MotionPath = motion.path;

export function MetricsChart({ series }: { series: MetricsSeries[] }) {
  const [dayLabels, setDayLabels] = useState(FALLBACK_DAY_LABELS);
  const { ref, inView } = useChartInView();
  const reduced = useReducedMotion();

  useEffect(() => {
    setDayLabels([...rollingWeekLabels()]);
  }, []);

  const { yMin, yMax, gridY } = useMemo(() => {
    const allValues = series.flatMap((entry) => entry.points);
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const padding = Math.max(2, (rawMax - rawMin) * 0.12);
    const min = rawMin - padding;
    const max = rawMax + padding;
    const grid = [0, 0.33, 0.66, 1].map(
      (ratio) => PAD_TOP + ratio * (CHART_H - PAD_TOP - PAD_BOTTOM),
    );
    return { yMin: min, yMax: max, gridY: grid };
  }, [series]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Gráfico ilustrativo de volume semanal"
    >
      {gridY.map((y) => (
        <line
          key={y}
          x1={PAD_X}
          x2={CHART_W - PAD_X}
          y1={y}
          y2={y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {series.map((entry, seriesIndex) => {
        const coords = plotCoords(entry.points, yMin, yMax);
        const lineD = linePath(coords);
        const areaD = areaPath(coords);
        const lineDelay = seriesIndex * 0.14;

        return (
          <g key={entry.id}>
            <MotionPath
              d={areaD}
              fill={entry.fill}
              initial={{ opacity: 0 }}
              animate={inView || reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: lineDelay, ease: easeOut }}
            />
            <MotionPath
              d={lineD}
              fill="none"
              stroke={entry.stroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? false : { pathLength: 0, opacity: 0.5 }}
              animate={
                inView || reduced
                  ? { pathLength: 1, opacity: 1 }
                  : { pathLength: 0, opacity: 0.5 }
              }
              transition={{ duration: 0.95, delay: lineDelay, ease: easeOut }}
            />
          </g>
        );
      })}
      {dayLabels.map((label, index) => {
        const x = PAD_X + (index / (dayLabels.length - 1)) * (CHART_W - PAD_X * 2);
        return (
          <text
            key={label}
            x={x}
            y={CHART_H - 4}
            textAnchor="middle"
            className="fill-muted text-[9px]"
            style={{ fontFamily: "inherit" }}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
