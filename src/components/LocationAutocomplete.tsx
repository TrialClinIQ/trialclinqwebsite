import React, { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;

function getPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  if (!placesPromise) {
    setOptions({ key: MAPS_API_KEY || "", version: "weekly" });
    placesPromise = importLibrary("places") as Promise<google.maps.PlacesLibrary>;
  }
  return placesPromise;
}

export interface LocationResult {
  formatted: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (raw: string, result?: LocationResult) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  label?: string;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = "ZIP or City, State",
  className = "",
  required,
  label,
  error,
}: LocationAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [apiMissing, setApiMissing] = useState(false);

  useEffect(() => {
    if (!MAPS_API_KEY) {
      setApiMissing(true);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // 8s timeout so spinner doesn't hang forever if API isn't enabled
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Maps API load timeout")), 8000)
    );

    Promise.race([getPlacesLibrary(), timeout])
      .then((places: any) => {
        if (cancelled || !containerRef.current) return;

        // PlaceAutocompleteElement — required for API keys created after March 1, 2025
        const el = new places.PlaceAutocompleteElement({
          componentRestrictions: { country: "us" },
          types: ["(regions)"],
        }) as HTMLElement;

        el.setAttribute("placeholder", placeholder);

        el.addEventListener("gmp-placeselect", async (event: any) => {
          const place = event.place;
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location", "addressComponents"],
          });

          const components: any[] = place.addressComponents || [];
          const get = (type: string) =>
            components.find((c: any) => c.types.includes(type))?.shortText || "";

          const result: LocationResult = {
            formatted: place.formattedAddress || place.displayName || "",
            city: get("locality") || get("sublocality") || get("neighborhood"),
            state: get("administrative_area_level_1"),
            zip: get("postal_code"),
            country: get("country"),
            lat: place.location.lat(),
            lng: place.location.lng(),
          };

          const display = result.zip
            ? `${result.zip}${result.city ? ` (${result.city}, ${result.state})` : ""}`
            : result.city && result.state
            ? `${result.city}, ${result.state}`
            : result.formatted;

          onChange(display, result);
        });

        containerRef.current.appendChild(el);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          console.warn("Google Maps failed to load:", err.message);
          setApiMissing(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {!apiMissing ? (
        <div className="relative">
          {/* containerRef always in DOM so ref is stable when async callback fires */}
          <div ref={containerRef} className="w-full" style={{ display: loading ? "none" : undefined }} />
          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-400">Loading…</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              error
                ? "border-red-400 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {apiMissing && (
        <p className="mt-1 text-xs text-gray-400">
          Location suggestions unavailable — enter ZIP or City, State manually.
        </p>
      )}
    </div>
  );
}
