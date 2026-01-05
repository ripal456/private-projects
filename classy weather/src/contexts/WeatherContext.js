/**
 * WeatherContext.js
 *
 * Centralized state management for weather data using React Context.
 * Features:
 * - Location search with geocoding
 * - Daily and hourly forecast fetching
 * - Loading and error states
 * - localStorage persistence for last searched location
 * - Automatic refetch on location change
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// API endpoints
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// Action types for reducer
const ACTIONS = {
  SET_LOCATION: "SET_LOCATION",
  FETCH_START: "FETCH_START",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_ERROR: "FETCH_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Initial state
const initialState = {
  location: "",
  displayLocation: "",
  coordinates: null,
  daily: null,
  hourly: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Reducer for complex state management
function weatherReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOCATION:
      return { ...state, location: action.payload };

    case ACTIONS.FETCH_START:
      return { ...state, isLoading: true, error: null };

    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        displayLocation: action.payload.displayLocation,
        coordinates: action.payload.coordinates,
        daily: action.payload.daily,
        hourly: action.payload.hourly,
        lastUpdated: new Date().toISOString(),
        error: null,
      };

    case ACTIONS.FETCH_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        daily: null,
        hourly: null,
      };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}

// Create context
const WeatherContext = createContext(null);

/**
 * Custom hook to access weather context
 */
export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
}

/**
 * Converts country code to flag emoji
 */
function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Weather Provider Component
 */
export function WeatherProvider({ children }) {
  const [state, dispatch] = useReducer(weatherReducer, initialState);

  // Initialize location from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem("weather-location") || "";
    if (savedLocation) {
      dispatch({ type: ACTIONS.SET_LOCATION, payload: savedLocation });
    }
  }, []);

  /**
   * Fetches weather data for the current location
   */
  const fetchWeather = useCallback(
    async (searchLocation) => {
      const locationToSearch = searchLocation || state.location;

      if (locationToSearch.length < 2) {
        dispatch({
          type: ACTIONS.FETCH_SUCCESS,
          payload: {
            displayLocation: "",
            coordinates: null,
            daily: null,
            hourly: null,
          },
        });
        return;
      }

      dispatch({ type: ACTIONS.FETCH_START });

      try {
        // 1) Geocoding - get coordinates from location name
        const geoRes = await fetch(
          `${GEO_API}?name=${encodeURIComponent(locationToSearch)}&count=1`
        );

        if (!geoRes.ok) {
          throw new Error("Failed to fetch location data");
        }

        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(
            "Location not found. Please try a different search term."
          );
        }

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results[0];
        const displayLocation = `${name} ${convertToFlag(country_code)}`;

        // 2) Fetch weather data (daily + hourly)
        const weatherParams = new URLSearchParams({
          latitude,
          longitude,
          timezone,
          // Daily parameters
          daily: [
            "weathercode",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "windspeed_10m_max",
            "precipitation_sum",
            "precipitation_probability_max",
            "uv_index_max",
          ].join(","),
          // Hourly parameters (next 48 hours)
          hourly: [
            "temperature_2m",
            "weathercode",
            "precipitation_probability",
            "windspeed_10m",
            "relativehumidity_2m",
          ].join(","),
          forecast_days: 14, // Extended forecast
        });

        const weatherRes = await fetch(`${WEATHER_API}?${weatherParams}`);

        if (!weatherRes.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const weatherData = await weatherRes.json();

        dispatch({
          type: ACTIONS.FETCH_SUCCESS,
          payload: {
            displayLocation,
            coordinates: { latitude, longitude, timezone },
            daily: weatherData.daily,
            hourly: weatherData.hourly,
          },
        });
      } catch (err) {
        console.error("Weather fetch error:", err);
        dispatch({ type: ACTIONS.FETCH_ERROR, payload: err.message });
      }
    },
    [state.location]
  );

  /**
   * Sets the search location and persists to localStorage
   */
  const setLocation = useCallback((newLocation) => {
    dispatch({ type: ACTIONS.SET_LOCATION, payload: newLocation });
    localStorage.setItem("weather-location", newLocation);
  }, []);

  /**
   * Clears any error messages
   */
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  /**
   * Refreshes weather data for current location
   */
  const refresh = useCallback(() => {
    if (state.location) {
      fetchWeather(state.location);
    }
  }, [state.location, fetchWeather]);

  // Auto-fetch when location changes (debounced)
  useEffect(() => {
    if (!state.location) return;

    const timeoutId = setTimeout(() => {
      fetchWeather(state.location);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [state.location, fetchWeather]);

  // Memoized context value
  const value = useMemo(
    () => ({
      ...state,
      setLocation,
      fetchWeather,
      clearError,
      refresh,
      hasData: Boolean(state.daily),
    }),
    [state, setLocation, fetchWeather, clearError, refresh]
  );

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export default WeatherContext;
