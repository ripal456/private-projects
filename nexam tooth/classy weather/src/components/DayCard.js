/**
 * DayCard.js
 *
 * Individual day forecast card component.
 * Memoized for performance optimization.
 */

import React, { memo } from "react";

// Weather code to icon mapping
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "🌡";
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function DayCard({
  date,
  max,
  min,
  code,
  isToday = false,
  precipProbability,
  uvIndex,
  onClick,
}) {
  const icon = getWeatherIcon(code);
  const dayLabel = isToday ? "Today" : formatDay(date);

  return (
    <li
      className={`day ${isToday ? "day--today" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${dayLabel}: ${icon}, high ${Math.ceil(
        max
      )}°, low ${Math.floor(min)}°${
        precipProbability
          ? `, ${precipProbability}% chance of precipitation`
          : ""
      }`}
    >
      <span className="day__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="day__name">{dayLabel}</p>
      <p className="day__temp">
        <span className="day__temp-min">{Math.floor(min)}°</span>
        <span className="day__temp-separator" aria-hidden="true">
          —
        </span>
        <span className="day__temp-max">
          <strong>{Math.ceil(max)}°</strong>
        </span>
      </p>
      {precipProbability !== undefined && precipProbability > 0 && (
        <p className="day__precip">
          <span aria-hidden="true">💧</span>
          <span>{precipProbability}%</span>
        </p>
      )}
      {uvIndex !== undefined && uvIndex >= 6 && (
        <p className="day__uv" title={`UV Index: ${uvIndex}`}>
          <span aria-hidden="true">☀️</span>
          <span>UV {Math.round(uvIndex)}</span>
        </p>
      )}
    </li>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(DayCard, (prevProps, nextProps) => {
  return (
    prevProps.date === nextProps.date &&
    prevProps.max === nextProps.max &&
    prevProps.min === nextProps.min &&
    prevProps.code === nextProps.code &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.precipProbability === nextProps.precipProbability
  );
});
