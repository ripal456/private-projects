/**
 * HourlyForecast.js
 *
 * Enhanced hourly weather forecast with animated chart visualization.
 * Shows temperature trends, weather icons, and precipitation.
 *
 * Features:
 * - Animated SVG temperature chart
 * - Horizontal scroll with snap points
 * - Current hour highlighting
 * - Smooth entrance animations
 * - Interactive hover states
 */

import React, {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useTheme } from "../contexts";

// Weather code to icon mapping
const WEATHER_ICONS = {
  0: "☀️",
  1: "🌤",
  2: "⛅️",
  3: "☁️",
  45: "🌫",
  48: "🌫",
  51: "🌦",
  53: "🌧",
  55: "🌧",
  56: "🌧",
  57: "🌧",
  61: "🌦",
  63: "🌧",
  65: "🌧",
  66: "🌧",
  67: "🌧",
  71: "🌨",
  73: "🌨",
  75: "🌨",
  77: "🌨",
  80: "🌦",
  81: "🌧",
  82: "🌧",
  85: "🌨",
  86: "🌨",
  95: "🌩",
  96: "⛈",
  99: "⛈",
};

function getWeatherIcon(code) {
  return WEATHER_ICONS[code] || "🌡";
}

function formatHour(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en", { hour: "numeric", hour12: true });
}

function isCurrentHour(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date.getHours() === now.getHours() && date.getDate() === now.getDate();
}

/**
 * Animated Temperature Chart for Hourly Data
 */
function HourlyChart({ hours, isVisible }) {
  const { isDark } = useTheme();
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let start = null;
    const duration = 1200; // Animation duration in ms

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setAnimationProgress(easeOutQuart);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible]);

  const chartData = useMemo(() => {
    if (!hours.length) return null;

    const temps = hours.map((h) => h.temperature);
    const minTemp = Math.min(...temps) - 3;
    const maxTemp = Math.max(...temps) + 3;

    const width = hours.length * 75; // 75px per hour
    const height = 120;
    const padding = { top: 25, bottom: 25, left: 10, right: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = hours.map((hour, i) => {
      const x = padding.left + (i / (hours.length - 1)) * chartWidth;
      const y =
        padding.top +
        (1 - (hour.temperature - minTemp) / (maxTemp - minTemp)) * chartHeight;
      return {
        x,
        y,
        temp: hour.temperature,
        time: hour.time,
        precipProb: hour.precipProbability,
      };
    });

    // Create smooth curve path using bezier curves
    const createSmoothPath = (pts) => {
      if (pts.length < 2) return "";

      let path = `M ${pts[0].x},${pts[0].y}`;

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 >= pts.length ? i + 1 : i + 2];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }

      return path;
    };

    // Create area path for gradient fill
    const createAreaPath = (pts) => {
      const linePath = createSmoothPath(pts);
      return `${linePath} L ${pts[pts.length - 1].x},${
        height - padding.bottom
      } L ${pts[0].x},${height - padding.bottom} Z`;
    };

    return {
      points,
      linePath: createSmoothPath(points),
      areaPath: createAreaPath(points),
      width,
      height,
      minTemp,
      maxTemp,
    };
  }, [hours]);

  if (!chartData) return null;

  const { points, linePath, areaPath, width, height } = chartData;

  // Calculate animated path length
  const pathLength = 2000; // Approximate path length
  const animatedDashOffset = pathLength * (1 - animationProgress);

  const gradientColors = isDark
    ? { start: "#ff6b6b", end: "#feca57" }
    : { start: "#e65100", end: "#ff9800" };

  return (
    <svg
      width={width}
      height={height}
      className="hourly-chart__svg"
      style={{ minWidth: width }}
    >
      <defs>
        {/* Gradient for the line */}
        <linearGradient
          id="hourly-line-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={gradientColors.start} />
          <stop offset="100%" stopColor={gradientColors.end} />
        </linearGradient>

        {/* Gradient for the area fill */}
        <linearGradient
          id="hourly-area-gradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={gradientColors.start}
            stopOpacity="0.4"
          />
          <stop
            offset="100%"
            stopColor={gradientColors.end}
            stopOpacity="0.05"
          />
        </linearGradient>

        {/* Glow filter for line */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Drop shadow for points */}
        <filter id="point-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor={gradientColors.start}
            floodOpacity="0.5"
          />
        </filter>
      </defs>

      {/* Area fill with animation */}
      <path
        d={areaPath}
        fill="url(#hourly-area-gradient)"
        opacity={animationProgress}
        className="hourly-chart__area"
      />

      {/* Animated line */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#hourly-line-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        strokeDasharray={pathLength}
        strokeDashoffset={animatedDashOffset}
        className="hourly-chart__line"
      />

      {/* Data points with animation */}
      {points.map((point, i) => {
        const delay = i * 0.03;
        const pointProgress = Math.max(
          0,
          Math.min(1, (animationProgress - delay) / (1 - delay))
        );
        const scale = pointProgress;

        return (
          <g key={point.time} className="hourly-chart__point-group">
            {/* Point circle */}
            <circle
              cx={point.x}
              cy={point.y}
              r={5 * scale}
              fill={isDark ? "#1a1a2e" : "#fff"}
              stroke="url(#hourly-line-gradient)"
              strokeWidth="2"
              filter="url(#point-shadow)"
              style={{
                opacity: pointProgress,
                transition: "r 0.2s ease",
              }}
              className="hourly-chart__point"
            />

            {/* Temperature label */}
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              fill={isDark ? "#fff" : "#333"}
              fontSize="11"
              fontWeight="600"
              opacity={pointProgress}
              className="hourly-chart__temp-label"
            >
              {Math.round(point.temp)}°
            </text>

            {/* Precipitation indicator */}
            {point.precipProb > 20 && (
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fill="#64b5f6"
                fontSize="9"
                fontWeight="500"
                opacity={pointProgress * 0.8}
              >
                💧{point.precipProb}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Hourly Forecast Component with Chart
 */
export default function HourlyForecast({ hourlyData, hoursToShow = 24 }) {
  useTheme();
  const scrollRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // Intersection observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Process hourly data
  const hours = useMemo(() => {
    if (!hourlyData?.time) return [];

    const now = new Date();
    const currentHourIndex = hourlyData.time.findIndex((time) => {
      const date = new Date(time);
      return date >= now;
    });

    const startIndex = Math.max(0, currentHourIndex);
    const endIndex = Math.min(startIndex + hoursToShow, hourlyData.time.length);

    return hourlyData.time.slice(startIndex, endIndex).map((time, i) => ({
      time,
      temperature: hourlyData.temperature_2m?.[startIndex + i],
      weatherCode: hourlyData.weathercode?.[startIndex + i],
      precipProbability: hourlyData.precipitation_probability?.[startIndex + i],
      isCurrent: isCurrentHour(time),
    }));
  }, [hourlyData, hoursToShow]);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  }, []);

  if (hours.length === 0) return null;

  return (
    <section
      ref={containerRef}
      className="hourly-forecast"
      aria-label="Hourly weather forecast"
    >
      <div className="hourly-forecast__header">
        <h3 className="hourly-forecast__title">
          <span className="hourly-forecast__title-icon">📊</span>
          Hourly Forecast
        </h3>
        <div className="hourly-forecast__controls">
          <button
            onClick={scrollLeft}
            className="hourly-forecast__scroll-btn"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="hourly-forecast__scroll-btn"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      {/* Animated Chart */}
      <div className="hourly-chart" ref={scrollRef}>
        <HourlyChart hours={hours} isVisible={isVisible} />
      </div>

      {/* Hour labels with icons */}
      <div
        className="hourly-forecast__labels"
        style={{ width: hours.length * 75 }}
      >
        {hours.map((hour, index) => (
          <div
            key={hour.time}
            className={`hourly-forecast__label ${
              hour.isCurrent ? "hourly-forecast__label--current" : ""
            }`}
            style={{
              animationDelay: `${index * 50}ms`,
              opacity: isVisible ? 1 : 0,
            }}
          >
            <span className="hourly-forecast__label-icon">
              {getWeatherIcon(hour.weatherCode)}
            </span>
            <span className="hourly-forecast__label-time">
              {hour.isCurrent ? "Now" : formatHour(hour.time)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
