'use client';

import { useEffect, useRef, useState } from 'react';

// TODO: set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY (in .env.local + your deployment platform's
// env vars) to enable Google Places autofill on this field. Until it's set, this renders
// as a plain controlled text input — manual entry always works either way, unaffected.

interface ParsedAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: ParsedAddress) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

// Minimal shims for the one Google Maps JS API surface this component touches — avoids
// pulling in the @types/google.maps package for a feature that's off by default.
interface GoogleAddressComponent {
  long_name: string;
  types: string[];
}
interface GooglePlaceResult {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>
          ) => {
            addListener: (event: string, handler: () => void) => { remove: () => void };
            getPlace: () => GooglePlaceResult;
          };
        };
      };
    };
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

function parseAddressComponents(place: GooglePlaceResult): ParsedAddress {
  const components = place.address_components ?? [];
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name ?? '';

  const line1 = [get('street_number'), get('route')].filter(Boolean).join(' ') || place.formatted_address || '';
  const city = get('locality') || get('administrative_area_level_2');
  const state = get('administrative_area_level_1');
  const pincode = get('postal_code');

  return { line1, city, state, pincode };
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  className,
  placeholder,
  required,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placesReady, setPlacesReady] = useState(false);

  // No key configured — plain manual-entry input, zero extra network/JS cost.
  useEffect(() => {
    if (!API_KEY) return;
    let cancelled = false;
    loadGoogleMapsScript()
      .then(() => { if (!cancelled) setPlacesReady(true); })
      .catch(() => {}); // Falls back to manual entry silently
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!placesReady || !inputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const parsed = parseAddressComponents(autocomplete.getPlace());
      onChange(parsed.line1);
      onPlaceSelect?.(parsed);
    });

    return () => listener.remove();
  }, [placesReady, onChange, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      required={required}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
