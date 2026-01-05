/**
 * TemperatureChart.js
 *
 * A lightweight, accessible SVG-based temperature chart component.
 * No external charting library needed - pure React + SVG.
 *
 * Features:
 * - Min/max temperature visualization
 * - Responsive design
 * - Accessible with ARIA labels
 * - Theme-aware colors
 * - Smooth gradient fills
 */

import React, { useMemo, useId } from "react";
import { useTheme } from "../contexts";

/**
 * Formats temperature for display
 */
function formatTemp(temp) {
  return Math.round(temp);
}

/**
 * Maps a value from one range to another
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Temperature Chart Component
 */
export default function TemperatureChart({
  dates = [],
  maxTemps = [],
  minTemps = [],
  className = "",
  height = 200,
}) {
  const { isDark } = useTheme();
  const gradientId = useId();
  const gradientIdMin = useId();

  // Calculate chart dimensions and data points
  const chartData = useMemo(() => {
    if (!dates.length || !maxTemps.length || !minTemps.length) {
      return null;
    }

    const padding = { top: 30, right: 20, bottom: 40, left: 20 };
    const width = 100; // Percentage-based for responsiveness
    const chartHeight = height - padding.top - padding.bottom;

    // Find temperature range for scaling
    const allTemps = [...maxTemps, ...minTemps];
    const tempMin = Math.min(...allTemps) - 2;
    const tempMax = Math.max(...allTemps) + 2;

    // Calculate point positions
    const pointSpacing =
      (width - padding.left - padding.right) / (dates.length - 1 || 1);

    const maxPoints = maxTemps.map((temp, i) => ({
      x: padding.left + i * pointSpacing,
      y: mapRange(
        temp,
        tempMin,
        tempMax,
        chartHeight + padding.top,
        padding.top
      ),
      temp,
      date: dates[i],
    }));

    const minPoints = minTemps.map((temp, i) => ({
      x: padding.left + i * pointSpacing,
      y: mapRange(
        temp,
        tempMin,
        tempMax,
        chartHeight + padding.top,
        padding.top
      ),
      temp,
      date: dates[i],
    }));

    // Create SVG path strings
    const createPath = (points) => {
      if (points.length === 0) return "";
      return points.reduce((path, point, i) => {
        return (
          path +
          (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`)
        );
      }, "");
    };

    // Create filled area path (for gradient fill)
    const createAreaPath = (topPoints, bottomPoints) => {
      if (topPoints.length === 0) return "";
      const topPath = createPath(topPoints);
      const bottomPath = [...bottomPoints]
        .reverse()
        .map((p, i) => (i === 0 ? `L ${p.x},${p.y}` : ` L ${p.x},${p.y}`))
        .join("");
      return `${topPath} ${bottomPath} Z`;
    };

    return {
      maxPoints,
      minPoints,
      maxPath: createPath(maxPoints),
      minPath: createPath(minPoints),
      areaPath: createAreaPath(maxPoints, minPoints),
      tempMin,
      tempMax,
      padding,
      chartHeight,
    };
  }, [dates, maxTemps, minTemps, height]);

  if (!chartData) {
    return (
      <div
        className={`temperature-chart temperature-chart--empty ${className}`}
      >
        <p>No temperature data available</p>
      </div>
    );
  }

  const { maxPoints, minPoints, maxPath, minPath, areaPath } = chartData;

  // Theme-aware colors
  const colors = {
    maxLine: isDark ? "#ff8a65" : "#e65100",
    minLine: isDark ? "#64b5f6" : "#1565c0",
    area: isDark ? "rgba(255, 138, 101, 0.15)" : "rgba(230, 81, 0, 0.1)",
    text: isDark ? "#e0e0e0" : "#333",
    grid: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };

  return (
    <div
      className={`temperature-chart ${className}`}
      role="img"
      aria-label={`Temperature chart showing max temperatures from ${formatTemp(
        maxTemps[0]
      )}° to ${formatTemp(
        maxTemps[maxTemps.length - 1]
      )}° and min temperatures from ${formatTemp(minTemps[0])}° to ${formatTemp(
        minTemps[minTemps.length - 1]
      )}°`}
    >
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="temperature-chart__svg"
        aria-hidden="true"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.maxLine} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.minLine} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={gradientIdMin} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.minLine} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.minLine} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Filled area between max and min */}
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="temperature-chart__area"
        />

        {/* Max temperature line */}
        <path
          d={maxPath}
          fill="none"
          stroke={colors.maxLine}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="temperature-chart__line temperature-chart__line--max"
        />

        {/* Min temperature line */}
        <path
          d={minPath}
          fill="none"
          stroke={colors.minLine}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="temperature-chart__line temperature-chart__line--min"
        />

        {/* Data points - Max */}
        {maxPoints.map((point, i) => (
          <g key={`max-${i}`} className="temperature-chart__point-group">
            <circle
              cx={point.x}
              cy={point.y}
              r="1.2"
              fill={colors.maxLine}
              className="temperature-chart__point"
            />
            {i % 2 === 0 && (
              <text
                x={point.x}
                y={point.y - 3}
                textAnchor="middle"
                fill={colors.text}
                fontSize="3"
                className="temperature-chart__label"
              >
                {formatTemp(point.temp)}°
              </text>
            )}
          </g>
        ))}

        {/* Data points - Min */}
        {minPoints.map((point, i) => (
          <g key={`min-${i}`} className="temperature-chart__point-group">
            <circle
              cx={point.x}
              cy={point.y}
              r="1.2"
              fill={colors.minLine}
              className="temperature-chart__point"
            />
            {i % 2 === 0 && (
              <text
                x={point.x}
                y={point.y + 5}
                textAnchor="middle"
                fill={colors.text}
                fontSize="3"
                className="temperature-chart__label"
              >
                {formatTemp(point.temp)}°
              </text>
            )}
          </g>
        ))}

        {/* X-axis labels (dates) */}
        {maxPoints.map(
          (point, i) =>
            i % 2 === 0 && (
              <text
                key={`date-${i}`}
                x={point.x}
                y={height - 5}
                textAnchor="middle"
                fill={colors.text}
                fontSize="2.8"
                className="temperature-chart__date-label"
              >
                {new Date(point.date).toLocaleDateString("en", {
                  weekday: "short",
                })}
              </text>
            )
        )}
      </svg>

      {/* Legend */}
      <div className="temperature-chart__legend">
        <span className="temperature-chart__legend-item">
          <span
            className="temperature-chart__legend-dot"
            style={{ backgroundColor: colors.maxLine }}
          />
          Max
        </span>
        <span className="temperature-chart__legend-item">
          <span
            className="temperature-chart__legend-dot"
            style={{ backgroundColor: colors.minLine }}
          />
          Min
        </span>
      </div>
    </div>
  );
}
