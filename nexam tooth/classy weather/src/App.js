/**
 * App.js - Classy Weather Application
 *
 * A modern React weather application featuring:
 * - Dark/light mode with system preference sync
 * - Hourly and 7-day forecasts
 * - Interactive temperature chart
 * - 3D weather visualization with Three.js
 * - Accessible, responsive design
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import WeatherScene from "./WeatherScene";
import { useTheme } from "./contexts";
import {
  TemperatureChart,
  HourlyForecast,
  ThemeToggle,
  SearchInput,
  DayCard,
} from "./components";
import WeatherDetails from "./components/WeatherDetails";

// Utility: Convert country code to flag emoji
function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

// Custom hook for debounced value
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for weather data fetching
function useWeather(location) {
  const [state, setState] = useState({
    isLoading: false,
    error: null,
    displayLocation: "",
    weather: null,
    hourly: null,
    currentConditions: null,
  });

  const fetchWeather = useCallback(async (searchLocation) => {
    if (!searchLocation || searchLocation.length < 2) {
      setState((prev) => ({
        ...prev,
        weather: null,
        hourly: null,
        currentConditions: null,
        displayLocation: "",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1) Geocoding
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchLocation
        )}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        throw new Error("Location not found");
      }

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results[0];

      // 2) Weather data with hourly forecasts and additional parameters
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&` +
          `daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,` +
          `precipitation_probability_max,windspeed_10m_max,winddirection_10m_dominant,uv_index_max&` +
          `hourly=temperature_2m,weathercode,precipitation_probability,relativehumidity_2m,` +
          `visibility,windspeed_10m,winddirection_10m,apparent_temperature,pressure_msl&` +
          `current_weather=true&` +
          `forecast_days=14`
      );
      const weatherData = await weatherRes.json();

      // 3) Try to fetch Air Quality data (optional - may fail)
      let airQuality = null;
      try {
        const aqiRes = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?` +
            `latitude=${latitude}&longitude=${longitude}&` +
            `current=us_aqi,pm10,pm2_5`
        );
        const aqiData = await aqiRes.json();
        airQuality = aqiData.current;
      } catch (aqiErr) {
        console.warn("Air quality data not available:", aqiErr);
      }

      // Extract current conditions from hourly data (current hour)
      const now = new Date();
      const currentHourIndex =
        weatherData.hourly?.time?.findIndex(
          (t) =>
            new Date(t).getHours() === now.getHours() &&
            new Date(t).getDate() === now.getDate()
        ) ?? 0;

      const currentConditions = {
        humidity: weatherData.hourly?.relativehumidity_2m?.[currentHourIndex],
        visibility: weatherData.hourly?.visibility?.[currentHourIndex]
          ? Math.round(weatherData.hourly.visibility[currentHourIndex] / 1000) // Convert m to km
          : null,
        windSpeed: weatherData.hourly?.windspeed_10m?.[currentHourIndex],
        windDirection:
          weatherData.hourly?.winddirection_10m?.[currentHourIndex],
        feelsLike: weatherData.hourly?.apparent_temperature?.[currentHourIndex],
        pressure: weatherData.hourly?.pressure_msl?.[currentHourIndex],
        aqi: airQuality?.us_aqi ?? null,
      };

      setState({
        isLoading: false,
        error: null,
        displayLocation: `${name} ${convertToFlag(country_code)}`,
        weather: weatherData.daily,
        hourly: weatherData.hourly,
        currentConditions,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to fetch weather data",
        weather: null,
        hourly: null,
        currentConditions: null,
      }));
    }
  }, []);

  // Fetch weather when location changes
  useEffect(() => {
    fetchWeather(location);
  }, [location, fetchWeather]);

  return state;
}

// Main App component
function App() {
  useTheme(); // Initialize theme on mount
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("location") || "";
  });

  // Debounce location input for API calls
  const debouncedLocation = useDebounce(location, 500);

  // Fetch weather data
  const {
    isLoading,
    error,
    displayLocation,
    weather,
    hourly,
    currentConditions,
  } = useWeather(debouncedLocation);

  // Save location to localStorage
  useEffect(() => {
    if (location) {
      localStorage.setItem("location", location);
    }
  }, [location]);

  // Handle search input - receives value directly from SearchInput
  const handleLocationChange = useCallback((value) => {
    setLocation(value);
  }, []);

  const handleClear = useCallback(() => {
    setLocation("");
    localStorage.removeItem("location");
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Classy Weather</h1>
        <ThemeToggle />
      </header>

      <SearchInput
        value={location}
        onChange={handleLocationChange}
        onClear={handleClear}
        isLoading={isLoading}
        placeholder="Search for a location..."
      />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {isLoading && !weather && (
        <p className="loader" aria-live="polite">
          Loading weather data...
        </p>
      )}

      {weather && (
        <WeatherDisplay
          weather={weather}
          hourly={hourly}
          location={displayLocation}
          currentConditions={currentConditions}
        />
      )}
    </div>
  );
}

// Weather display component
function WeatherDisplay({ weather, hourly, location, currentConditions }) {
  const {
    temperature_2m_max: maxTemps,
    temperature_2m_min: minTemps,
    time: dates,
    weathercode: codes,
    sunrise,
    sunset,
    windspeed_10m_max: windMax,
    precipitation_probability_max: precipProb,
    uv_index_max: uvIndex,
  } = weather;

  // Calculate if it's currently day or night
  const isDayNow = useMemo(() => {
    try {
      const srTime = new Date(sunrise?.[0]).getTime();
      const ssTime = new Date(sunset?.[0]).getTime();
      const nowTime = Date.now();
      if (!Number.isNaN(srTime) && !Number.isNaN(ssTime)) {
        return nowTime >= srTime && nowTime <= ssTime;
      }
    } catch (e) {}
    return true;
  }, [sunrise, sunset]);

  // Prepare chart data (first 7 days)
  const chartData = useMemo(() => {
    return (
      dates?.slice(0, 7).map((date, i) => ({
        date,
        max: maxTemps[i],
        min: minTemps[i],
      })) || []
    );
  }, [dates, maxTemps, minTemps]);

  return (
    <>
      <h2>Weather in {location}</h2>

      {/* 3D Weather Scene */}
      <div className="weather-scene-container">
        <WeatherScene
          weatherCode={codes[0]}
          isDay={isDayNow}
          windSpeed={windMax?.[0] || 0}
        />
      </div>

      {/* Weather Details - Additional Parameters */}
      <WeatherDetails
        sunrise={sunrise?.[0]}
        sunset={sunset?.[0]}
        humidity={currentConditions?.humidity}
        windSpeed={currentConditions?.windSpeed ?? windMax?.[0]}
        windDirection={currentConditions?.windDirection}
        visibility={currentConditions?.visibility}
        uvIndex={uvIndex?.[0]}
        feelsLike={currentConditions?.feelsLike}
        pressure={currentConditions?.pressure}
        aqi={currentConditions?.aqi}
      />

      {/* Hourly Forecast */}
      {hourly && (
        <section className="forecast-section" aria-labelledby="hourly-heading">
          <h3 id="hourly-heading" className="sr-only">
            Hourly Forecast
          </h3>
          <HourlyForecast hourlyData={hourly} hoursToShow={24} />
        </section>
      )}

      {/* Temperature Chart */}
      {chartData.length > 0 && (
        <section className="forecast-section" aria-labelledby="chart-heading">
          <h3 id="chart-heading" className="forecast-section__title">
            7-Day Temperature Trend
          </h3>
          <TemperatureChart data={chartData} />
        </section>
      )}

      {/* Daily Forecast Grid */}
      <section className="forecast-section" aria-labelledby="daily-heading">
        <h3 id="daily-heading" className="sr-only">
          Daily Forecast
        </h3>
        <ul className="weather">
          {dates?.slice(0, 7).map((date, i) => (
            <DayCard
              key={date}
              date={date}
              max={maxTemps[i]}
              min={minTemps[i]}
              code={codes[i]}
              isToday={i === 0}
              precipProbability={precipProb?.[i]}
              uvIndex={uvIndex?.[i]}
            />
          ))}
        </ul>
      </section>
    </>
  );
}

export default App;
