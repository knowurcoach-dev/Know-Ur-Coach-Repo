/**
 * Location Configuration Model & Types for KnowUrCoach
 * Enables administrators to fully customize entry modal behavior,
 * default landing hub, city arrangements, badges, and sorting presets.
 */

export interface ConfiguredCityItem {
  id: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  icon?: string;          // Emoji icon (e.g. 🕌, 🏛️, 🌊, 🏸)
  tag?: string;           // Badge text (e.g. "Headquarters", "Capital Hub", "Top Sports Hub", "New Launch")
  isActive: boolean;      // Toggle whether city appears in the modal
  order: number;          // Manual sort ordering position
}

export type LocationSortMode = 'manual' | 'alphabetical' | 'most_academies';
export type ModalFrequency = 'once_ever' | 'session' | 'always_until_selected';

export interface LocationConfig {
  // 1. Entry & Trigger Modal Behavior
  autoShowModal: boolean;        // Whether the modal opens automatically when a new visitor lands
  autoShowDelayMs: number;       // Delay in milliseconds before opening (e.g. 600, 1500, 3000)
  showFrequency: ModalFrequency; // Popup frequency rule
  isDismissible: boolean;        // Whether user can close modal without choosing a location

  // 2. Default Landing Location
  defaultCity: string;           // Fallback city for new users (e.g. "Agra")
  defaultLocality: string;       // Fallback locality/area (e.g. "Agra" or "Kamla Nagar")
  defaultLat: number;
  defaultLon: number;

  // 3. Modal Presentation & Copy
  modalTitle: string;            // e.g. "Choose Your Location"
  modalSubtitle: string;         // e.g. "Discover verified sports academies, coaches & creative labs"
  searchPlaceholder: string;     // e.g. "Search city, area, neighbourhood or 6-digit PIN code..."
  showGpsButton: boolean;        // Toggle "Use Current Location (GPS)"
  showAllIndiaButton: boolean;   // Toggle "Explore All India"
  gpsButtonLabel: string;        // Button label
  allIndiaButtonLabel: string;   // Button label

  // 4. Arrangement & Sorting
  sortMode: LocationSortMode;
  cities: ConfiguredCityItem[];
}

export const DEFAULT_CONFIGURED_CITIES: ConfiguredCityItem[] = [
  { id: 'agra', city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, icon: '🕌', tag: 'Headquarters', isActive: true, order: 1 },
  { id: 'delhi-ncr', city: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.2090, icon: '🏛️', tag: 'Capital Hub', isActive: true, order: 2 },
  { id: 'mumbai', city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, icon: '🌊', tag: 'Financial Hub', isActive: true, order: 3 },
  { id: 'bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, icon: '🚀', tag: 'Tech & Sports', isActive: true, order: 4 },
  { id: 'hyderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, icon: '💎', tag: 'Badminton Hub', isActive: true, order: 5 },
  { id: 'pune', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, icon: '🎓', tag: 'Education Hub', isActive: true, order: 6 },
  { id: 'jaipur', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, icon: '🏰', tag: 'Pink City', isActive: true, order: 7 },
  { id: 'lucknow', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, icon: '👑', tag: 'City of Nawabs', isActive: true, order: 8 },
  { id: 'chandigarh', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, icon: '🌿', tag: 'Sports Hub', isActive: true, order: 9 },
  { id: 'ahmedabad', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, icon: '🪁', tag: 'Commercial Hub', isActive: true, order: 10 },
  { id: 'kolkata', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, icon: '🌉', tag: 'Football Hub', isActive: true, order: 11 },
  { id: 'chennai', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, icon: '🏖️', tag: 'Chess & Tennis', isActive: true, order: 12 },
];

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  autoShowModal: true,
  autoShowDelayMs: 600,
  showFrequency: 'once_ever',
  isDismissible: true,
  defaultCity: 'Agra',
  defaultLocality: 'Agra',
  defaultLat: 27.1767,
  defaultLon: 78.0081,
  modalTitle: 'Choose Your Location',
  modalSubtitle: 'Discover verified sports academies, coaches & creative labs across India',
  searchPlaceholder: 'Search city, area, neighbourhood or 6-digit PIN code (e.g. 110001, Indiranagar)...',
  showGpsButton: true,
  showAllIndiaButton: true,
  gpsButtonLabel: 'Use Current Location',
  allIndiaButtonLabel: 'Explore All India',
  sortMode: 'manual',
  cities: DEFAULT_CONFIGURED_CITIES,
};

/**
 * Merges partial config with defaults to ensure all required fields exist
 */
export function mergeLocationConfig(partial?: Partial<LocationConfig> | null): LocationConfig {
  if (!partial) return { ...DEFAULT_LOCATION_CONFIG };

  const cities = Array.isArray(partial.cities) && partial.cities.length > 0
    ? partial.cities.map((c, idx) => ({
        id: c.id || `city-${idx}-${c.city?.toLowerCase().replace(/\s+/g, '-')}`,
        city: c.city || 'Unknown City',
        state: c.state || '',
        lat: typeof c.lat === 'number' ? c.lat : 27.1767,
        lon: typeof c.lon === 'number' ? c.lon : 78.0081,
        icon: c.icon || '📍',
        tag: c.tag || '',
        isActive: c.isActive !== false,
        order: typeof c.order === 'number' ? c.order : idx + 1,
      }))
    : DEFAULT_CONFIGURED_CITIES;

  return {
    autoShowModal: typeof partial.autoShowModal === 'boolean' ? partial.autoShowModal : DEFAULT_LOCATION_CONFIG.autoShowModal,
    autoShowDelayMs: typeof partial.autoShowDelayMs === 'number' ? partial.autoShowDelayMs : DEFAULT_LOCATION_CONFIG.autoShowDelayMs,
    showFrequency: partial.showFrequency || DEFAULT_LOCATION_CONFIG.showFrequency,
    isDismissible: typeof partial.isDismissible === 'boolean' ? partial.isDismissible : DEFAULT_LOCATION_CONFIG.isDismissible,
    defaultCity: partial.defaultCity || DEFAULT_LOCATION_CONFIG.defaultCity,
    defaultLocality: partial.defaultLocality || DEFAULT_LOCATION_CONFIG.defaultLocality,
    defaultLat: typeof partial.defaultLat === 'number' ? partial.defaultLat : DEFAULT_LOCATION_CONFIG.defaultLat,
    defaultLon: typeof partial.defaultLon === 'number' ? partial.defaultLon : DEFAULT_LOCATION_CONFIG.defaultLon,
    modalTitle: partial.modalTitle || DEFAULT_LOCATION_CONFIG.modalTitle,
    modalSubtitle: partial.modalSubtitle || DEFAULT_LOCATION_CONFIG.modalSubtitle,
    searchPlaceholder: partial.searchPlaceholder || DEFAULT_LOCATION_CONFIG.searchPlaceholder,
    showGpsButton: typeof partial.showGpsButton === 'boolean' ? partial.showGpsButton : DEFAULT_LOCATION_CONFIG.showGpsButton,
    showAllIndiaButton: typeof partial.showAllIndiaButton === 'boolean' ? partial.showAllIndiaButton : DEFAULT_LOCATION_CONFIG.showAllIndiaButton,
    gpsButtonLabel: partial.gpsButtonLabel || DEFAULT_LOCATION_CONFIG.gpsButtonLabel,
    allIndiaButtonLabel: partial.allIndiaButtonLabel || DEFAULT_LOCATION_CONFIG.allIndiaButtonLabel,
    sortMode: partial.sortMode || DEFAULT_LOCATION_CONFIG.sortMode,
    cities,
  };
}

/**
 * Sorts cities according to configured sort mode and academy counts (if available)
 */
export function sortConfiguredCities(
  cities: ConfiguredCityItem[],
  mode: LocationSortMode,
  academyCounts?: Record<string, number>
): ConfiguredCityItem[] {
  const list = [...cities];

  if (mode === 'alphabetical') {
    return list.sort((a, b) => a.city.localeCompare(b.city));
  }

  if (mode === 'most_academies' && academyCounts) {
    return list.sort((a, b) => {
      const countA = academyCounts[a.city] || 0;
      const countB = academyCounts[b.city] || 0;
      if (countB !== countA) return countB - countA;
      return a.order - b.order;
    });
  }

  // Default: manual ordering
  return list.sort((a, b) => a.order - b.order);
}
