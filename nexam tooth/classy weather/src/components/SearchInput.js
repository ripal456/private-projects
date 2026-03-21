/**
 * SearchInput.js
 *
 * Accessible search input with loading state and clear button.
 */

import React, { useCallback, useRef } from "react";

export default function SearchInput({
  value,
  onChange,
  isLoading = false,
  placeholder = "Search for a location...",
  onClear,
}) {
  const inputRef = useRef(null);

  const handleChange = useCallback(
    (e) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
    if (onClear) onClear();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && value) {
        handleClear();
      }
    },
    [value, handleClear]
  );

  return (
    <div className="search-input" role="search">
      <label htmlFor="location-search" className="visually-hidden">
        Search for a location
      </label>
      <div className="search-input__wrapper">
        <span className="search-input__icon" aria-hidden="true">
          {isLoading ? "⏳" : "🔍"}
        </span>
        <input
          ref={inputRef}
          id="location-search"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input__field"
          autoComplete="off"
          aria-describedby={isLoading ? "search-loading" : undefined}
        />
        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="search-input__clear"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {isLoading && (
        <span id="search-loading" className="visually-hidden">
          Loading weather data...
        </span>
      )}
    </div>
  );
}
