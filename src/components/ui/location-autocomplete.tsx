"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react"; 

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function LocationAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();
      const places = data.features.map((f: any) => {
        const name = f.properties.name || "";
        const city = f.properties.city || "";
        const country = f.properties.country || "";
        return [name, city, country].filter(Boolean).join(", ");
      });
      setSuggestions(places);
      setShowDropdown(true);
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="Where are you based? City, Country or Region"
        className="h-14 w-full bg-slate-100 rounded-full border border-gray-200 px-6 text-base shadow-none focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-0 rounded-2xl border border-t-0 border-gray-200 bg-gray-50 shadow z-10 overflow-hidden">
          {suggestions.map((place, idx) => (
            <li
              key={idx}
              onClick={() => {
                setQuery(place);
                onChange(place);
                setSuggestions([]);
                setShowDropdown(false);
              }}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-200 cursor-pointer text-sm transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{place}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
