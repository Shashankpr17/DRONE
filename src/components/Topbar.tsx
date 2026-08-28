import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface TopbarProps {
  onToggleMobile?: () => void;
}

interface SearchLocation {
  name: string;
  category: string;
  lat: number;
  lng: number;
  keywords: string;
}

const KNOWN_LOCATIONS: SearchLocation[] = [
  { name: 'KIIT Campus 6 (Command Hub)', category: 'Disaster Sector', lat: 20.3529, lng: 85.8202, keywords: 'campus 6 kiit university bhubaneswar patia odisha hq command' },
  { name: 'Campus 6 Hostel Block', category: 'Affected Settlement', lat: 20.3540, lng: 85.8210, keywords: 'campus 6 hostel student housing residential flood 620' },
  { name: 'Patia Square Residential', category: 'Affected Settlement', lat: 20.3510, lng: 85.8190, keywords: 'patia square settlement residential flood 450' },
  { name: 'Sikharchandi Foothills', category: 'Affected Settlement', lat: 20.3570, lng: 85.8235, keywords: 'sikharchandi foothills basthi residential flood 280' },
  { name: 'KIMS Super Specialty Hospital', category: 'Emergency Facility', lat: 20.3545, lng: 85.8150, keywords: 'kims hospital medical emergency healthcare safe' },
  { name: 'Patia Railway Overbridge B-02', category: 'Critical Infrastructure', lat: 20.3515, lng: 85.8245, keywords: 'patia railway overbridge b-02 river crossing risk infrastructure' },
  { name: 'KIIT Substation Sub-04', category: 'Power Infrastructure', lat: 20.3485, lng: 85.8165, keywords: 'kiit substation sub-04 power grid electrical flood' },
  { name: 'Nandankanan Main Road (Blocked)', category: 'Transport Route', lat: 20.3580, lng: 85.8170, keywords: 'nandankanan road blocked clearance transport' },
  { name: 'Sikharchandi Evacuation Route', category: 'Safe Evacuation Route', lat: 20.3500, lng: 85.8250, keywords: 'sikharchandi safe evacuation route open road' },
  { name: 'Relief Camp KIIT Convention Hall', category: 'Relief Shelter', lat: 20.3565, lng: 85.8195, keywords: 'camp kiit convention shelter relief rations' },
  { name: 'DRONE-001 Patrol', category: 'Live Aerial Unit', lat: 20.3529, lng: 85.8202, keywords: 'drone-001 matrice drone telemetry aerial kiit' },
  { name: 'ODRAF / NDRF Rescue Team', category: 'Rescue Squad', lat: 20.3550, lng: 85.8215, keywords: 'odraf ndrf team rescue squad field unit' },
  { name: 'Boat Unit 01 (Patia)', category: 'Swiftwater Boat', lat: 20.3510, lng: 85.8190, keywords: 'boat unit 01 zodiac swiftwater rescue patia' },
];

const pageTitles: Record<string, { title: string; category?: string }> = {
  '/dashboard': { title: 'Operational Dashboard', category: 'HQ Command' },
  '/water-coverage': { title: 'Flood Spread Analysis', category: 'Hydrology & Inundation' },
  '/affected-settlements': { title: 'Affected Settlements', category: 'Civil Protection' },
  '/road-accessibility': { title: 'Road Accessibility', category: 'Transport & Logistics' },
  '/infrastructure-impact': { title: 'Infrastructure Impact', category: 'Critical Facilities' },
  '/flood-map': { title: 'Flood Map Intelligence', category: 'GIS & Satellite' },
  '/drone-missions': { title: 'Drone Mission Control', category: 'Autonomous Aerial Ops' },
  '/detection-analysis': { title: 'Detection & Analysis Workspace', category: 'Computer Vision AI' },
  '/rescue-coordination': { title: 'Response Planning', category: 'Field Operations' },
  '/relief-camps': { title: 'Relief Camps Oversight', category: 'Logistics & Camp Welfare' },
  '/alerts': { title: 'Emergency Alert Management', category: 'Public Warning System' },
  '/incident-records': { title: 'Incident Records & Logs', category: 'Historical Archive' },
  '/flood-report': { title: 'Assessment Report', category: 'Executive Summary' },
};

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const current = pageTitles[location.pathname] || { title: 'Flood Management', category: 'Authority' };

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeLocation, setActiveLocation] = useState('KIIT Campus 6');
  const [activeCoords, setActiveCoords] = useState('20.353, 85.820');
  const [globalSuggestions, setGlobalSuggestions] = useState<{ lat: number; lng: number; name: string; category: string; zoom?: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced global suggestions when typing in Topbar search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGlobalSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=4&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          const items = data.map((d: any) => {
            const isStateOrCountry = d.type === 'administrative' || d.type === 'state' || d.type === 'country';
            const isCity = d.type === 'city' || d.type === 'town';
            const zoom = isStateOrCountry ? 8 : isCity ? 12 : 15;
            return {
              lat: parseFloat(d.lat),
              lng: parseFloat(d.lon),
              name: d.name || d.display_name.split(',')[0],
              category: d.display_name,
              zoom,
            };
          });
          setGlobalSuggestions(items);
        }
      } catch (err) {
        console.error('Topbar search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Match local suggestions based on query
  const qLower = query.toLowerCase().trim();
  const localSuggestions = qLower
    ? KNOWN_LOCATIONS.filter(
        (loc) =>
          loc.name.toLowerCase().includes(qLower) ||
          loc.category.toLowerCase().includes(qLower) ||
          loc.keywords.toLowerCase().includes(qLower)
      ).slice(0, 4)
    : [];

  const suggestions = [...localSuggestions, ...globalSuggestions];

  const handleSelectLocation = (loc: { lat: number; lng: number; name: string; category: string; zoom?: number }) => {
    setActiveLocation(loc.name);
    setActiveCoords(`${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`);

    // If not on a page with map (dashboard or flood-map), navigate to dashboard
    if (location.pathname !== '/dashboard' && location.pathname !== '/flood-map') {
      navigate('/dashboard');
    }

    // Dispatch flyto event to map
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('map:flyto', {
          detail: {
            lat: loc.lat,
            lng: loc.lng,
            zoom: loc.zoom || 15,
            label: loc.name,
            category: loc.category,
          },
        })
      );
    }, 150);

    setQuery('');
    setShowDropdown(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    // Check if query is direct lat, lng coordinates e.g. "28.6139, 77.2090" or "28.6139 77.2090"
    const coordMatch = q.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        handleSelectLocation({
          lat,
          lng,
          name: `GPS ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          category: 'Coordinate Target',
          zoom: 16,
        });
        return;
      }
    }

    // If matches suggestion, take first suggestion
    if (suggestions.length > 0) {
      handleSelectLocation(suggestions[0]);
      return;
    }

    // Fetch real geocoded coordinates dynamically for ANY state, city or place
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const d = data[0];
          const isStateOrCountry = d.type === 'administrative' || d.type === 'state' || d.type === 'country';
          const isCity = d.type === 'city' || d.type === 'town';
          const zoom = isStateOrCountry ? 8 : isCity ? 12 : 15;

          handleSelectLocation({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            name: d.name || d.display_name.split(',')[0],
            category: d.display_name,
            zoom,
          });
          return;
        }
      }
    } catch (err) {
      console.error('Geocode search submit error:', err);
    }
  };

  return (
    <header className="h-16 px-4 md:px-xl bg-surface border-b border-outline-variant flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          aria-label="Open navigation"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div>
          <h2 className="font-headline-md text-base md:text-lg font-bold text-on-surface truncate">
            {current.title}
          </h2>
        </div>
      </div>

      {/* Center: Live Coordinate & Location Search (Desktop) */}
      <div className="relative hidden lg:block">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center bg-surface-container-high/80 rounded-full px-md py-1.5 w-80 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">
            {isSearching ? 'travel_explore' : 'search'}
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search any state, city, address, or GPS..."
            className="bg-transparent border-none outline-none w-full text-xs text-on-surface placeholder:text-on-surface-variant"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
              }}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </form>

        {/* Dropdown Suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-outline-variant bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
              <span>Matching Locations ({suggestions.length})</span>
              <span className="text-[10px] lowercase font-normal">Press Enter to pan</span>
            </div>
            <div className="divide-y divide-outline-variant/60 max-h-60 overflow-y-auto">
              {suggestions.map((loc, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectLocation(loc)}
                  className="p-2.5 hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm group-hover:scale-110 transition-transform">
                      location_on
                    </span>
                    <div>
                      <div className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {loc.name}
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {loc.category} · {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Locate →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Dynamic Clickable Location Badge */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={() => {
            const [latStr, lngStr] = activeCoords.split(',').map((s) => s.trim());
            const lat = parseFloat(latStr) || 28.614;
            const lng = parseFloat(lngStr) || 77.209;

            if (location.pathname !== '/dashboard') {
              navigate('/dashboard');
            }

            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('map:flyto', {
                  detail: {
                    lat,
                    lng,
                    zoom: 16,
                    label: activeLocation,
                    category: 'Command Hub & Monitored Zone',
                  },
                })
              );
            }, 250);
          }}
          title="Click to locate on Map in Dashboard"
          className="hidden sm:flex items-center gap-2 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant hover:border-primary text-xs shadow-xs transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:scale-125 transition-transform"></span>
          <span className="font-bold text-primary truncate max-w-[170px]">{activeLocation}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
          <span className="text-on-surface-variant font-mono text-[11px] group-hover:text-on-surface">{activeCoords}</span>
          <span className="material-symbols-outlined text-on-surface-variant/60 group-hover:text-primary text-[15px] ml-0.5 transition-colors">
            explore
          </span>
        </button>
      </div>
    </header>
  );
};
