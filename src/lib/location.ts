// ─── OpenStreetMap Location Utilities & Pre-Indexed Hubs ──────────────────────
import { getCategoryDisplayName } from './categories';

export interface LocationResult {
  id: string;
  displayName: string;
  name: string;             // Specific colony, place or landmark
  locality: string;         // Suburb / neighborhood
  city: string;             // City / District
  state: string;            // State (e.g. Uttar Pradesh, Karnataka)
  postcode?: string;
  lat: number;
  lon: number;
  type?: string;
}

export interface GeoCoordinates {
  lat: number;
  lon: number;
}

// Top Indian Coaching Hubs with coordinates for instant selection
export interface TopCityItem {
  city: string;
  state: string;
  lat: number;
  lon: number;
  icon?: string;
  tag?: string;
  isPrimary?: boolean;
}

export const TOP_INDIAN_CITIES: TopCityItem[] = [
  { city: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.2090, icon: '🏛️', tag: 'Capital Hub' },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, icon: '🌊', tag: 'Financial Hub' },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, icon: '🚀', tag: 'Tech & Sports' },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, icon: '💎', tag: 'Badminton Hub' },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, icon: '🎓', tag: 'Education Hub' },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, icon: '🏰', tag: 'Pink City' },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, icon: '👑', tag: 'City of Nawabs' },
  { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, icon: '🌿', tag: 'Sports Hub' },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, icon: '🪁', tag: 'Commercial Hub' },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, icon: '🌉', tag: 'Football Hub' },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, icon: '🏖️', tag: 'Chess & Tennis' },
  { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, icon: '🕌', tag: 'Heritage Hub' },
];

// Agra Popular Localities for quick access
export const AGRA_LOCALITIES = [
  { name: 'Kamla Nagar', distance: '2.5 km', lat: 27.2104, lon: 78.0166, description: 'Tennis, Badminton, Soccer Hub' },
  { name: 'Sanjay Place', distance: '1.2 km', lat: 27.2001, lon: 78.0062, description: 'STEM, Abacus & Chess Centers' },
  { name: 'Dayalbagh', distance: '4.8 km', lat: 27.2285, lon: 78.0101, description: 'Martial Arts & Football Ground' },
  { name: 'Sadar Bazar', distance: '3.5 km', lat: 27.1584, lon: 78.0112, description: 'Aquatics & Swimming Academy' },
  { name: 'Fatehabad Road', distance: '5.2 km', lat: 27.1610, lon: 78.0489, description: 'Sports Complex & Skating' },
  { name: 'Bodla & Shastri Puram', distance: '6.1 km', lat: 27.1995, lon: 77.9520, description: 'Cricket Nets & Academies' },
  { name: 'Civil Lines', distance: '2.8 km', lat: 27.1932, lon: 78.0021, description: 'Badminton & Fitness Centers' },
  { name: 'Khandari', distance: '3.1 km', lat: 27.2110, lon: 77.9945, description: 'Multi-Sport Training Grounds' },
  { name: 'Etmadpur', distance: '19.0 km', lat: 27.2344, lon: 78.1887, description: 'Athletics, Turf & Sports Hub' },
];

export interface CityNeighbourhood {
  name: string;
  slug: string;
  tag?: string;
  highlight?: string;
  cityName?: string;
}

export const POPULAR_CITY_NEIGHBOURHOODS: Record<string, CityNeighbourhood[]> = {
  'Agra': [
    { name: 'Kamla Nagar', slug: 'kamla-nagar', tag: 'Badminton & Tennis' },
    { name: 'Sanjay Place', slug: 'sanjay-place', tag: 'STEM & Robotics' },
    { name: 'Dayalbagh', slug: 'dayalbagh', tag: 'Martial Arts & Football' },
    { name: 'Sadar Bazar', slug: 'sadar', tag: 'Aquatics & Swimming' },
    { name: 'Fatehabad Road', slug: 'fatehabad-road', tag: 'Skating & Tennis' },
    { name: 'Shastri Puram', slug: 'shastri-puram', tag: 'Cricket Nets' },
    { name: 'Civil Lines', slug: 'civil-lines', tag: 'Badminton & Dance' },
    { name: 'Khandari', slug: 'khandari', tag: 'Multi-Sport Hub' },
    { name: 'Etmadpur', slug: 'etmadpur', tag: 'Sports & Athletics Hub' },
  ],
  'Delhi NCR': [
    { name: 'Vasant Kunj', slug: 'vasant-kunj', tag: 'Tennis & Swimming' },
    { name: 'Connaught Place', slug: 'connaught-place', tag: 'Music & Arts' },
    { name: 'Dwarka', slug: 'dwarka', tag: 'Badminton & Football' },
    { name: 'Rohini', slug: 'rohini', tag: 'Cricket & Skating' },
    { name: 'Noida Sector 50', slug: 'noida-sector-50', tag: 'STEM & Robotics' },
    { name: 'Saket', slug: 'saket', tag: 'Dance & Gymnastics' },
    { name: 'Gurugram Cyber City', slug: 'gurugram', tag: 'Premier Sports Hub' },
    { name: 'Hauz Khas', slug: 'hauz-khas', tag: 'Arts & Music' },
  ],
  'Mumbai': [
    { name: 'Bandra West', slug: 'bandra', tag: 'Dance & Tennis' },
    { name: 'Andheri East', slug: 'andheri', tag: 'Badminton & Martial Arts' },
    { name: 'Juhu', slug: 'juhu', tag: 'Swimming & Fitness' },
    { name: 'Powai', slug: 'powai', tag: 'STEM & Robotics Labs' },
    { name: 'South Mumbai', slug: 'south-mumbai', tag: 'Cricket & Squash' },
    { name: 'Borivali', slug: 'borivali', tag: 'Skating & Gymnastics' },
    { name: 'Thane West', slug: 'thane', tag: 'Multi-Sports Complex' },
    { name: 'Navi Mumbai', slug: 'navi-mumbai', tag: 'FIFA Turf & Football' },
  ],
  'Bengaluru': [
    { name: 'Indiranagar', slug: 'indiranagar', tag: 'Badminton & Tennis' },
    { name: 'Koramangala', slug: 'koramangala', tag: 'STEM & Coding' },
    { name: 'Whitefield', slug: 'whitefield', tag: 'Cricket & Swimming' },
    { name: 'HSR Layout', slug: 'hsr-layout', tag: 'Martial Arts & Dance' },
    { name: 'JP Nagar', slug: 'jp-nagar', tag: 'Robotics & Chess' },
    { name: 'Malleshwaram', slug: 'malleshwaram', tag: 'Classical Music & Arts' },
    { name: 'Bellandur', slug: 'bellandur', tag: 'Badminton Arenas' },
    { name: 'Electronic City', slug: 'electronic-city', tag: 'Sports Complex' },
  ],
  'Hyderabad': [
    { name: 'Gachibowli', slug: 'gachibowli', tag: 'Badminton & Swimming' },
    { name: 'Hitec City', slug: 'hitec-city', tag: 'STEM Labs & Chess' },
    { name: 'Jubilee Hills', slug: 'jubilee-hills', tag: 'Tennis & Golf' },
    { name: 'Banjara Hills', slug: 'banjara-hills', tag: 'Dance & Music' },
    { name: 'Madhapur', slug: 'madhapur', tag: 'Robotics & Skating' },
    { name: 'Kukatpally', slug: 'kukatpally', tag: 'Cricket & Martial Arts' },
    { name: 'Kondapur', slug: 'kondapur', tag: 'Badminton Hub' },
    { name: 'Secunderabad', slug: 'secunderabad', tag: 'Swimming & Athletics' },
  ],
  'Pune': [
    { name: 'Kothrud', slug: 'kothrud', tag: 'Cricket & Badminton' },
    { name: 'Baner', slug: 'baner', tag: 'Tennis & Swimming' },
    { name: 'Viman Nagar', slug: 'viman-nagar', tag: 'STEM & Robotics' },
    { name: 'Koregaon Park', slug: 'koregaon-park', tag: 'Dance & Fine Arts' },
    { name: 'Wakad', slug: 'wakad', tag: 'Martial Arts & Skating' },
    { name: 'Aundh', slug: 'aundh', tag: 'Gymnastics & Chess' },
    { name: 'Hinjewadi', slug: 'hinjewadi', tag: 'Badminton Arenas' },
    { name: 'Hadapsar', slug: 'hadapsar', tag: 'Football & Turf Sports' },
  ],
  'Jaipur': [
    { name: 'Malviya Nagar', slug: 'malviya-nagar', tag: 'Badminton & Tennis' },
    { name: 'Vaishali Nagar', slug: 'vaishali-nagar', tag: 'Cricket Nets & STEM' },
    { name: 'Mansarovar', slug: 'mansarovar', tag: 'Swimming & Skating' },
    { name: 'C-Scheme', slug: 'c-scheme', tag: 'Classical Dance & Arts' },
    { name: 'Raja Park', slug: 'raja-park', tag: 'Martial Arts' },
    { name: 'Tonk Road', slug: 'tonk-road', tag: 'Sports Complex' },
    { name: 'Jagatpura', slug: 'jagatpura', tag: 'Football & Athletics' },
  ],
  'Lucknow': [
    { name: 'Gomti Nagar', slug: 'gomti-nagar', tag: 'Tennis & Badminton' },
    { name: 'Hazratganj', slug: 'hazratganj', tag: 'Music & Fine Arts' },
    { name: 'Aliganj', slug: 'aliganj', tag: 'STEM Labs & Chess' },
    { name: 'Indira Nagar', slug: 'indira-nagar', tag: 'Swimming & Skating' },
    { name: 'Mahanagar', slug: 'mahanagar', tag: 'Martial Arts Dojo' },
    { name: 'Ashiyana', slug: 'ashiyana', tag: 'Cricket & Football' },
    { name: 'Vikas Nagar', slug: 'vikas-nagar', tag: 'Badminton Arenas' },
  ],
  'Chandigarh': [
    { name: 'Sector 17', slug: 'sector-17', tag: 'City Center Hub' },
    { name: 'Sector 35', slug: 'sector-35', tag: 'Badminton & Fitness' },
    { name: 'Mohali Phase 7', slug: 'mohali', tag: 'Cricket Stadium Hub' },
    { name: 'Panchkula Sector 5', slug: 'panchkula', tag: 'Swimming & Tennis' },
    { name: 'Sector 22', slug: 'sector-22', tag: 'Skating & Athletics' },
    { name: 'Zirakpur', slug: 'zirakpur', tag: 'Martial Arts & Dance' },
  ],
  'Ahmedabad': [
    { name: 'Bodakdev', slug: 'bodakdev', tag: 'Tennis & Swimming' },
    { name: 'Satellite', slug: 'satellite', tag: 'Badminton & Skating' },
    { name: 'Vastrapur', slug: 'vastrapur', tag: 'STEM & Robotics' },
    { name: 'Navrangpura', slug: 'navrangpura', tag: 'Cricket Nets & Arts' },
    { name: 'Prahlad Nagar', slug: 'prahlad-nagar', tag: 'Dance & Music' },
    { name: 'SG Highway', slug: 'sg-highway', tag: 'Premier Sports Complex' },
  ],
  'Kolkata': [
    { name: 'Salt Lake', slug: 'salt-lake', tag: 'Football & Swimming' },
    { name: 'Park Street', slug: 'park-street', tag: 'Music & Performing Arts' },
    { name: 'New Town', slug: 'new-town', tag: 'STEM & Tennis Arena' },
    { name: 'Ballygunge', slug: 'ballygunge', tag: 'Chess & Fine Arts' },
    { name: 'Alipore', slug: 'alipore', tag: 'Cricket & Tennis' },
    { name: 'Gariahat', slug: 'gariahat', tag: 'Martial Arts & Dance' },
  ],
  'Chennai': [
    { name: 'Anna Nagar', slug: 'anna-nagar', tag: 'Tennis & Badminton' },
    { name: 'T. Nagar', slug: 't-nagar', tag: 'Music & Bharatnatyam' },
    { name: 'Adyar', slug: 'adyar', tag: 'Swimming & Chess' },
    { name: 'Velachery', slug: 'velachery', tag: 'Cricket & Skating' },
    { name: 'Besant Nagar', slug: 'besant-nagar', tag: 'Aquatics & Surf' },
    { name: 'Mylapore', slug: 'mylapore', tag: 'Classical Arts' },
    { name: 'OMR', slug: 'omr', tag: 'Robotics & STEM Labs' },
  ],
};

export const ALL_INDIA_POPULAR_NEIGHBOURHOODS: CityNeighbourhood[] = [
  { name: 'Connaught Place', slug: 'connaught-place', cityName: 'Delhi NCR' },
  { name: 'Bandra West', slug: 'bandra', cityName: 'Mumbai' },
  { name: 'Indiranagar', slug: 'indiranagar', cityName: 'Bengaluru' },
  { name: 'Gachibowli', slug: 'gachibowli', cityName: 'Hyderabad' },
  { name: 'Kothrud', slug: 'kothrud', cityName: 'Pune' },
  { name: 'Bodakdev', slug: 'bodakdev', cityName: 'Ahmedabad' },
  { name: 'Malviya Nagar', slug: 'malviya-nagar', cityName: 'Jaipur' },
  { name: 'Gomti Nagar', slug: 'gomti-nagar', cityName: 'Lucknow' },
  { name: 'Kamla Nagar', slug: 'kamla-nagar', cityName: 'Agra' },
  { name: 'Sector 17', slug: 'sector-17', cityName: 'Chandigarh' },
  { name: 'Salt Lake', slug: 'salt-lake', cityName: 'Kolkata' },
  { name: 'Anna Nagar', slug: 'anna-nagar', cityName: 'Chennai' },
  { name: 'Vasant Kunj', slug: 'vasant-kunj', cityName: 'Delhi NCR' },
  { name: 'Juhu', slug: 'juhu', cityName: 'Mumbai' },
  { name: 'Whitefield', slug: 'whitefield', cityName: 'Bengaluru' },
  { name: 'Hitec City', slug: 'hitec-city', cityName: 'Hyderabad' },
];

export const STATE_TO_CITIES: Record<string, string[]> = {
  'Uttar Pradesh': ['Agra', 'Lucknow'],
  'Maharashtra': ['Mumbai', 'Pune'],
  'Karnataka': ['Bengaluru'],
  'Telangana': ['Hyderabad'],
  'Delhi': ['Delhi NCR'],
  'Rajasthan': ['Jaipur'],
  'Gujarat': ['Ahmedabad'],
  'West Bengal': ['Kolkata'],
  'Tamil Nadu': ['Chennai'],
  'Chandigarh': ['Chandigarh'],
  'Punjab': ['Chandigarh'],
  'Haryana': ['Chandigarh', 'Delhi NCR'],
};

export function isStateLocation(locationQuery?: string): boolean {
  if (!locationQuery) return false;
  const lower = locationQuery.trim().toLowerCase();
  for (const state of Object.keys(STATE_TO_CITIES)) {
    if (state.toLowerCase() === lower || lower.includes(state.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function getPopularNeighbourhoodsForCity(cityName?: string): CityNeighbourhood[] {
  if (!cityName || cityName.trim() === '' || cityName.toLowerCase().includes('india')) {
    return ALL_INDIA_POPULAR_NEIGHBOURHOODS;
  }

  const clean = cityName.trim();
  const lower = clean.toLowerCase();

  // 1. Direct match with city in POPULAR_CITY_NEIGHBOURHOODS
  if (POPULAR_CITY_NEIGHBOURHOODS[clean]) {
    return POPULAR_CITY_NEIGHBOURHOODS[clean].map((n) => ({ ...n, cityName: clean }));
  }

  // 2. Fuzzy match with city in POPULAR_CITY_NEIGHBOURHOODS
  for (const [cityKey, list] of Object.entries(POPULAR_CITY_NEIGHBOURHOODS)) {
    if (
      cityKey.toLowerCase() === lower ||
      lower.includes(cityKey.toLowerCase()) ||
      cityKey.toLowerCase().includes(lower)
    ) {
      return list.map((n) => ({ ...n, cityName: cityKey }));
    }
  }

  // 3. Match with state in STATE_TO_CITIES
  for (const [stateKey, cities] of Object.entries(STATE_TO_CITIES)) {
    if (
      stateKey.toLowerCase() === lower ||
      lower.includes(stateKey.toLowerCase()) ||
      stateKey.toLowerCase().includes(lower)
    ) {
      const stateNeighbourhoods: CityNeighbourhood[] = [];
      for (const city of cities) {
        const cityList = POPULAR_CITY_NEIGHBOURHOODS[city] || [];
        stateNeighbourhoods.push(...cityList.map((n) => ({ ...n, cityName: city, stateName: stateKey })));
      }
      if (stateNeighbourhoods.length > 0) return stateNeighbourhoods;
    }
  }

  // 4. Check TOP_INDIAN_CITIES for state matching
  const matchedTopCity = TOP_INDIAN_CITIES.find(
    (tc) =>
      tc.city.toLowerCase() === lower ||
      tc.state.toLowerCase() === lower ||
      lower.includes(tc.city.toLowerCase()) ||
      lower.includes(tc.state.toLowerCase())
  );
  if (matchedTopCity) {
    const list = POPULAR_CITY_NEIGHBOURHOODS[matchedTopCity.city];
    if (list) return list.map((n) => ({ ...n, cityName: matchedTopCity.city, stateName: matchedTopCity.state }));
  }

  // Fallback: If unknown or generic, show diverse national hubs
  return ALL_INDIA_POPULAR_NEIGHBOURHOODS;
}

export interface DynamicNeighbourhoodOptions {
  activeCity?: string;
  activeLocality?: string;
  coords?: GeoCoordinates | null;
  academies?: Array<{
    id?: string;
    name?: string;
    locality?: string;
    localityName?: string;
    address?: string;
    city?: string;
    distance?: number;
    distanceText?: string;
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lon?: number | null;
    category?: string;
    activities?: string[];
    activitiesText?: string;
    rating?: number;
  }>;
  geocodedPlaces?: CityNeighbourhood[];
}

/**
 * Resolves popular localities/neighbourhoods dynamically using a Hybrid architecture:
 * 1. Database-driven: Extracts localities from real registered coaching centres matching the area.
 * 2. Geocoding-driven: Supplements with live nearby places/suburbs from the geocoding service.
 * 3. Pre-indexed Baseline: Uses city presets for top metros as fallback.
 */
export function resolveDynamicNeighbourhoods(options: DynamicNeighbourhoodOptions = {}): CityNeighbourhood[] {
  const { activeCity = '', activeLocality = '', coords = null, academies = [], geocodedPlaces = [] } = options;

  const isAllIndia =
    !activeCity ||
    activeCity.trim() === '' ||
    activeCity.toLowerCase().includes('india') ||
    activeCity.toLowerCase() === 'all';

  const cleanCity = activeCity.trim();
  const cleanLocality = activeLocality.trim();
  const targetLocation =
    cleanLocality &&
    cleanLocality.toLowerCase() !== cleanCity.toLowerCase() &&
    !cleanLocality.toLowerCase().includes('india')
      ? cleanLocality
      : cleanCity;

  const results: CityNeighbourhood[] = [];
  const seenSlugs = new Set<string>();

  const addNeighbourhood = (item: CityNeighbourhood) => {
    if (!item.name || !item.name.trim()) return;
    const slug = (item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    if (!slug || seenSlugs.has(slug)) return;
    seenSlugs.add(slug);
    results.push({
      ...item,
      slug,
      cityName: item.cityName || cleanCity || 'All India',
    });
  };

  // ── LAYER 1: Extract Real Localities from Registered Coaching Centres (Database-Driven) ──
  if (Array.isArray(academies) && academies.length > 0) {
    const relevantAcademies = academies.filter((acad) => {
      if (isAllIndia) return true;

      const acadLat = acad.lat ?? acad.latitude ?? null;
      const acadLon = acad.lon ?? acad.longitude ?? null;
      if (coords && typeof acadLat === 'number' && typeof acadLon === 'number' && acadLat !== 0) {
        const dist = calculateDistance(coords.lat, coords.lon, acadLat, acadLon);
        if (dist <= 30) return true;
      }

      const acadCity = (acad.city || resolveCentreCity(acad as any) || '').toLowerCase();
      const acadLocality = (acad.localityName || acad.locality || '').toLowerCase();
      const acadAddress = (acad.address || '').toLowerCase();
      const targetLower = targetLocation.toLowerCase();
      const cityLower = cleanCity.toLowerCase();

      return (
        acadCity.includes(targetLower) ||
        acadCity.includes(cityLower) ||
        acadLocality.includes(targetLower) ||
        acadAddress.includes(targetLower) ||
        targetLower.includes(acadLocality)
      );
    });

    const localityMap = new Map<
      string,
      {
        count: number;
        activities: Set<string>;
        cityName: string;
        minDistance: number;
      }
    >();

    for (const acad of relevantAcademies) {
      const rawLoc = (acad.localityName || acad.locality || '').trim();
      if (!rawLoc || rawLoc.toLowerCase() === 'all india') continue;

      const normLoc = rawLoc.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const acadLat = acad.lat ?? acad.latitude ?? null;
      const acadLon = acad.lon ?? acad.longitude ?? null;
      let dist = 999;
      if (coords && typeof acadLat === 'number' && typeof acadLon === 'number' && acadLat !== 0) {
        dist = calculateDistance(coords.lat, coords.lon, acadLat, acadLon);
      }

      const existing = localityMap.get(normLoc);
      const acts = acad.activities || (acad.category ? [acad.category] : []);
      if (existing) {
        existing.count += 1;
        acts.forEach((a) => existing.activities.add(a));
        if (dist < existing.minDistance) existing.minDistance = dist;
      } else {
        localityMap.set(normLoc, {
          count: 1,
          activities: new Set(acts),
          cityName: acad.city || cleanCity,
          minDistance: dist,
        });
      }
    }

    const sortedLocalities = Array.from(localityMap.entries()).sort((a, b) => {
      if (coords && a[1].minDistance !== b[1].minDistance) {
        return a[1].minDistance - b[1].minDistance;
      }
      return b[1].count - a[1].count;
    });

    for (const [locName, data] of sortedLocalities) {
      const topSports = Array.from(data.activities).slice(0, 2).map((s) => getCategoryDisplayName(s)).join(' & ');
      const tag = data.count > 1 ? `${data.count} Academies` : `${topSports || 'Verified Center'}`;
      addNeighbourhood({
        name: locName,
        slug: locName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tag,
        cityName: data.cityName,
      });
    }
  }

  // ── LAYER 2: Supplement with Live Geocoded Places (Location/Map Service) ──
  if (Array.isArray(geocodedPlaces) && geocodedPlaces.length > 0) {
    for (const place of geocodedPlaces) {
      addNeighbourhood(place);
    }
  }

  // ── LAYER 3: Baseline Fallback for Pre-indexed Top Cities ──
  if (results.length < 4) {
    const baselineHubs = getPopularNeighbourhoodsForCity(targetLocation);
    if (baselineHubs && baselineHubs !== ALL_INDIA_POPULAR_NEIGHBOURHOODS) {
      for (const hub of baselineHubs) {
        addNeighbourhood(hub);
      }
    } else if (cleanCity && cleanCity !== targetLocation) {
      const parentHubs = getPopularNeighbourhoodsForCity(cleanCity);
      if (parentHubs && parentHubs !== ALL_INDIA_POPULAR_NEIGHBOURHOODS) {
        for (const hub of parentHubs) {
          addNeighbourhood({
            ...hub,
            cityName: cleanCity,
          });
        }
      }
    }
  }

  // Final all-India fallback if nothing found
  if (results.length === 0 || isAllIndia) {
    return ALL_INDIA_POPULAR_NEIGHBOURHOODS;
  }

  return results;
}


/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 * @returns distance in kilometers rounded to 1 decimal place
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
}

/**
 * Formats a distance into human-friendly label
 */
export function formatDistanceText(distanceKm: number): string {
  if (distanceKm <= 0.8) {
    return `${Math.round(distanceKm * 1000)}m away (Walking distance)`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Resolves the genuine metropolitan city of an academy/coaching centre from its
 * address, locality, coordinates, or city field to ensure strict boundary filtering
 * and completely prevent cross-city contamination.
 */
export function resolveCentreCity(centre: {
  address?: string | null;
  locality?: string | null;
  city?: string | null;
  lat?: number | null;
  lon?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}): string {
  if (centre.city && centre.city.trim() && centre.city.toLowerCase() !== 'india') {
    return centre.city.trim();
  }

  const raw = `${centre.address || ''} ${centre.locality || ''}`.toLowerCase();
  const text = raw.replace(/[-_]/g, ' ');

  // 1. Explicit text parsing for major Indian coaching hubs
  if (
    text.includes('delhi') ||
    text.includes('new delhi') ||
    text.includes('dwarka') ||
    text.includes('connaught') ||
    text.includes('rohini') ||
    text.includes('vasant kunj') ||
    text.includes('saket') ||
    text.includes('ncr')
  ) {
    return 'Delhi NCR';
  }
  if (text.includes('noida') || text.includes('greater noida')) {
    return 'Noida';
  }
  if (text.includes('gurugram') || text.includes('gurgaon')) {
    return 'Gurugram';
  }
  if (text.includes('jaipur')) {
    return 'Jaipur';
  }
  if (text.includes('lucknow')) {
    return 'Lucknow';
  }
  if (text.includes('bengaluru') || text.includes('bangalore') || text.includes('indiranagar') || text.includes('koramangala')) {
    return 'Bengaluru';
  }
  if (text.includes('mumbai') || text.includes('navi mumbai') || text.includes('thane') || text.includes('andheri')) {
    return 'Mumbai';
  }
  if (text.includes('pune')) {
    return 'Pune';
  }
  if (text.includes('hyderabad')) {
    return 'Hyderabad';
  }
  if (text.includes('chandigarh') || text.includes('mohali') || text.includes('panchkula')) {
    return 'Chandigarh';
  }
  if (text.includes('ahmedabad')) {
    return 'Ahmedabad';
  }
  if (text.includes('kolkata') || text.includes('calcutta') || text.includes('howrah')) {
    return 'Kolkata';
  }
  if (text.includes('chennai') || text.includes('madras')) {
    return 'Chennai';
  }
  if (text.includes('mathura')) {
    return 'Mathura';
  }
  if (
    text.includes('agra') ||
    text.includes('taj') ||
    text.includes('etmadpur') ||
    text.includes('itmadpur') ||
    text.includes('kamla nagar') ||
    text.includes('sanjay place') ||
    text.includes('dayalbagh') ||
    text.includes('sadar') ||
    text.includes('fatehabad') ||
    text.includes('bodla') ||
    text.includes('shastri puram') ||
    text.includes('sikandra') ||
    text.includes('khandari') ||
    text.includes('civil lines') ||
    text.includes('2820') ||
    text.includes('282')
  ) {
    return 'Agra';
  }

  // 2. Coordinate boundary detection via GPS
  const lat = centre.lat ?? centre.latitude ?? null;
  const lon = centre.lon ?? centre.longitude ?? null;
  if (typeof lat === 'number' && typeof lon === 'number' && lat !== 0 && lon !== 0) {
    for (const cityItem of TOP_INDIAN_CITIES) {
      const dist = calculateDistance(lat, lon, cityItem.lat, cityItem.lon);
      if (dist <= 45) {
        return cityItem.city;
      }
    }
  }

  return 'Agra';
}

// In-Memory Cache for Nominatim queries (TTL: 24 hours)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const locationCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function getCachedLocation<T>(key: string): T | null {
  const entry = locationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    locationCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedLocation<T>(key: string, data: T): void {
  if (locationCache.size > 500) {
    const firstKey = locationCache.keys().next().value;
    if (firstKey) locationCache.delete(firstKey);
  }
  locationCache.set(key, { data, timestamp: Date.now() });
}

// ─── Commercial Geocoding Provider Adapter (LocationIQ / Geoapify / OSM) ─────

export interface ProviderConfig {
  provider: 'locationiq' | 'geoapify' | 'osm';
  apiKey: string;
}

export function getConfiguredProvider(): ProviderConfig {
  const customProvider = (process.env.LOCATION_API_PROVIDER || 'locationiq').toLowerCase();
  const locationIqKey =
    process.env.LOCATIONIQ_API_KEY ||
    process.env.LOCATION_API_KEY ||
    process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY ||
    '';
  const geoapifyKey = process.env.GEOAPIFY_API_KEY || '';

  // 1. Strictly prioritize LocationIQ if token is present or provider requested
  if ((customProvider === 'locationiq' || !customProvider) && locationIqKey) {
    return { provider: 'locationiq', apiKey: locationIqKey };
  }

  if (locationIqKey) {
    return { provider: 'locationiq', apiKey: locationIqKey };
  }

  if (customProvider === 'geoapify' && geoapifyKey) {
    return { provider: 'geoapify', apiKey: geoapifyKey };
  }

  if (geoapifyKey) {
    return { provider: 'geoapify', apiKey: geoapifyKey };
  }

  // Fallback to community OpenStreetMap (subject to 1 req/sec policy)
  return { provider: 'osm', apiKey: '' };
}

export function getLocationAttribution(): string {
  const config = getConfiguredProvider();
  if (config.provider === 'locationiq') {
    return 'LocationIQ / © OpenStreetMap contributors';
  }
  if (config.provider === 'geoapify') {
    return 'Powered by Geoapify / © OpenStreetMap contributors';
  }
  return '© OpenStreetMap contributors';
}

function parseNominatimItems(items: any[], prefix: string): LocationResult[] {
  const results: LocationResult[] = [];
  if (!Array.isArray(items)) return results;

  for (const item of items) {
    const addr = item.address || {};
    const locality =
      item.display_place ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.quarter ||
      addr.village ||
      addr.town ||
      item.name;

    const state = addr.state || '';
    const postcode = addr.postcode || '';

    const rawDistrict = addr.district || addr.state_district || addr.county || '';
    let city = addr.city || '';
    if (!city && rawDistrict && Object.keys(POPULAR_CITY_NEIGHBOURHOODS).some((k) => k.toLowerCase() === rawDistrict.toLowerCase())) {
      city = rawDistrict;
    }
    if (!city) {
      city = addr.town || rawDistrict || state || 'Agra';
    }

    // If city resolved to "India" or generic country, prefer state or town or Agra
    if (city.toLowerCase() === 'india' || city.toLowerCase() === 'republic of india') {
      city = state || addr.district || 'Agra';
    }

    results.push({
      id: `${prefix}-${item.place_id || Math.random()}`,
      displayName: item.display_name,
      name: item.display_place || item.name || locality,
      locality: locality || city,
      city: city,
      state: state,
      postcode: postcode,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
    });
  }
  return results;
}

function parseSingleNominatimItem(item: any, lat: number, lon: number, prefix: string): LocationResult {
  const addr = item.address || {};
  const locality =
    item.display_place ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.residential ||
    addr.quarter ||
    addr.village ||
    addr.town ||
    addr.city_district ||
    addr.road ||
    item.name ||
    'Area';

  const state = addr.state || 'Uttar Pradesh';
  const postcode = addr.postcode || '';

  const rawDistrict = addr.district || addr.state_district || addr.county || '';
  let city = addr.city || '';
  if (!city && rawDistrict && Object.keys(POPULAR_CITY_NEIGHBOURHOODS).some((k) => k.toLowerCase() === rawDistrict.toLowerCase())) {
    city = rawDistrict;
  }
  if (!city) {
    city = addr.town || rawDistrict || state || 'Agra';
  }

  if (city.toLowerCase() === 'india' || city.toLowerCase() === 'republic of india') {
    city = state || 'Agra';
  }

  return {
    id: `${prefix}-rev-${item.place_id || Date.now()}`,
    displayName: item.display_name || `${locality}, ${city}, ${state}`,
    name: item.display_place || locality,
    locality: locality,
    city: city,
    state: state,
    postcode: postcode,
    lat: lat,
    lon: lon,
  };
}

// ── Upstream Provider Search Implementations ──

async function searchLocationIQ(query: string, apiKey: string): Promise<LocationResult[]> {
  // 1. Try Autocomplete endpoint first for instant keystroke suggestions
  const autocompleteUrl = `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&countrycodes=in&format=json&addressdetails=1&normalizecity=1&limit=8`;

  try {
    const res = await fetch(autocompleteUrl, {
      headers: { 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return parseNominatimItems(data, 'locationiq');
      }
    }
  } catch (err) {
    console.warn('[LocationIQ] Autocomplete query failed, trying forward search:', err);
  }

  // 2. Fallback to LocationIQ forward search endpoint for specific street / place queries
  const searchUrl = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&countrycodes=in&format=json&addressdetails=1&normalizecity=1&limit=8`;

  const searchRes = await fetch(searchUrl, {
    headers: { 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(3500),
  });

  if (!searchRes.ok) {
    throw new Error(`LocationIQ search status ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  return parseNominatimItems(searchData, 'locationiq');
}

async function reverseLocationIQ(lat: number, lon: number, apiKey: string): Promise<LocationResult | null> {
  const url = `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lon}&format=json&addressdetails=1&normalizecity=1`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(3500),
  });

  if (!res.ok) {
    throw new Error(`LocationIQ reverse status ${res.status}`);
  }

  const data = await res.json();
  return parseSingleNominatimItem(data, lat, lon, 'locationiq');
}

async function searchGeoapify(query: string, apiKey: string): Promise<LocationResult[]> {
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
    query
  )}&filter=countrycode:in&apiKey=${apiKey}&limit=8`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(3500),
  });

  if (!res.ok) {
    throw new Error(`Geoapify autocomplete status ${res.status}`);
  }

  const data = await res.json();
  const results: LocationResult[] = [];

  for (const feature of data.features || []) {
    const props = feature.properties || {};
    const locality = props.suburb || props.district || props.neighbourhood || props.quarter || props.name;
    let city = props.city || props.county || props.state || 'Agra';
    if (city.toLowerCase() === 'india' && props.state) {
      city = props.state;
    }
    const state = props.state || '';

    results.push({
      id: `geoapify-${props.place_id || Math.random()}`,
      displayName: props.formatted || [props.name, locality, city, state].filter(Boolean).join(', '),
      name: props.name || locality,
      locality: locality || city,
      city: city,
      state: state,
      postcode: props.postcode,
      lat: props.lat,
      lon: props.lon,
      type: props.result_type,
    });
  }

  return results;
}

async function reverseGeoapify(lat: number, lon: number, apiKey: string): Promise<LocationResult | null> {
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(3500),
  });

  if (!res.ok) {
    throw new Error(`Geoapify reverse status ${res.status}`);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const props = feature.properties || {};
  const locality = props.suburb || props.district || props.neighbourhood || props.quarter || props.name || 'Area';
  let city = props.city || props.county || props.state || 'Agra';
  if (city.toLowerCase() === 'india' && props.state) {
    city = props.state;
  }
  const state = props.state || 'Uttar Pradesh';

  return {
    id: `geoapify-rev-${props.place_id || Date.now()}`,
    displayName: props.formatted || `${locality}, ${city}, ${state}`,
    name: locality,
    locality: locality,
    city: city,
    state: state,
    postcode: props.postcode || '',
    lat: lat,
    lon: lon,
  };
}

async function searchNominatim(query: string): Promise<LocationResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&countrycodes=in&format=jsonv2&addressdetails=1&limit=8`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'KnowUrCoach-App/1.0 (contact@knowurcoach.in)',
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!res.ok) {
    throw new Error(`Nominatim returned status ${res.status}`);
  }

  const data = await res.json();
  return parseNominatimItems(data, 'osm');
}

async function reverseNominatim(lat: number, lon: number): Promise<LocationResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'KnowUrCoach-App/1.0 (contact@knowurcoach.in)',
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!res.ok) {
    throw new Error(`Nominatim reverse returned status ${res.status}`);
  }

  const data = await res.json();
  return parseSingleNominatimItem(data, lat, lon, 'osm');
}

async function searchPhoton(query: string): Promise<LocationResult[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    query
  )}&limit=6&bbox=68.1,6.7,97.4,35.5`;

  const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) {
    throw new Error(`Photon returned status ${res.status}`);
  }

  const data = await res.json();
  const results: LocationResult[] = [];

  for (const feature of data.features || []) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0];
    let city = props.city || props.district || props.state || 'Agra';
    if (city.toLowerCase() === 'india' && props.state) {
      city = props.state;
    }
    results.push({
      id: `photon-${props.osm_id || Math.random()}`,
      displayName: [props.name, props.district, city, props.state]
        .filter(Boolean)
        .join(', '),
      name: props.name || '',
      locality: props.district || props.city || props.name,
      city: city,
      state: props.state || '',
      postcode: props.postcode,
      lat: coords[1],
      lon: coords[0],
    });
  }

  return results;
}

// ── Orchestrators: Forward Search & Reverse Geocode ──

export async function searchGeocodedLocations(query: string): Promise<LocationResult[]> {
  const results: LocationResult[] = [];
  const lowerQuery = query.toLowerCase();

  // 1. PIN code matching for instant Indian postal code resolution
  const cleanPincode = query.trim().replace(/\D/g, '');
  if (/^\d{6}$/.test(cleanPincode)) {
    const pin = parseInt(cleanPincode, 10);
    let pinCity = '';
    let pinState = '';
    let pinLat = 28.6139;
    let pinLon = 77.2090;

    if (pin >= 110001 && pin <= 110096) {
      pinCity = 'Delhi NCR';
      pinState = 'Delhi';
      pinLat = 28.6139;
      pinLon = 77.2090;
    } else if (pin >= 201301 && pin <= 201318) {
      pinCity = 'Noida';
      pinState = 'Uttar Pradesh';
      pinLat = 28.5355;
      pinLon = 77.3910;
    } else if (pin >= 122001 && pin <= 122052) {
      pinCity = 'Gurugram';
      pinState = 'Haryana';
      pinLat = 28.4595;
      pinLon = 77.0266;
    } else if (pin >= 282001 && pin <= 282010) {
      pinCity = 'Agra';
      pinState = 'Uttar Pradesh';
      pinLat = 27.1767;
      pinLon = 78.0081;
    } else if (pin >= 281001 && pin <= 281006) {
      pinCity = 'Mathura';
      pinState = 'Uttar Pradesh';
      pinLat = 27.4924;
      pinLon = 77.6737;
    } else if (pin >= 302001 && pin <= 302039) {
      pinCity = 'Jaipur';
      pinState = 'Rajasthan';
      pinLat = 26.9124;
      pinLon = 75.7873;
    } else if (pin >= 226001 && pin <= 226030) {
      pinCity = 'Lucknow';
      pinState = 'Uttar Pradesh';
      pinLat = 26.8467;
      pinLon = 80.9462;
    } else if (pin >= 560001 && pin <= 560115) {
      pinCity = 'Bengaluru';
      pinState = 'Karnataka';
      pinLat = 12.9716;
      pinLon = 77.5946;
    } else if (pin >= 400001 && pin <= 400104) {
      pinCity = 'Mumbai';
      pinState = 'Maharashtra';
      pinLat = 19.0760;
      pinLon = 72.8777;
    } else if (pin >= 411001 && pin <= 411062) {
      pinCity = 'Pune';
      pinState = 'Maharashtra';
      pinLat = 18.5204;
      pinLon = 73.8567;
    } else if (pin >= 500001 && pin <= 500095) {
      pinCity = 'Hyderabad';
      pinState = 'Telangana';
      pinLat = 17.3850;
      pinLon = 78.4867;
    } else if (pin >= 160001 && pin <= 160071) {
      pinCity = 'Chandigarh';
      pinState = 'Chandigarh';
      pinLat = 30.7333;
      pinLon = 76.7794;
    } else if (pin >= 380001 && pin <= 380063) {
      pinCity = 'Ahmedabad';
      pinState = 'Gujarat';
      pinLat = 23.0225;
      pinLon = 72.5714;
    } else if (pin >= 700001 && pin <= 700160) {
      pinCity = 'Kolkata';
      pinState = 'West Bengal';
      pinLat = 22.5726;
      pinLon = 88.3639;
    } else if (pin >= 600001 && pin <= 600134) {
      pinCity = 'Chennai';
      pinState = 'Tamil Nadu';
      pinLat = 13.0827;
      pinLon = 80.2707;
    }

    if (pinCity) {
      results.push({
        id: `pin-${cleanPincode}`,
        displayName: `PIN Code ${cleanPincode}, ${pinCity}, ${pinState}`,
        name: `PIN ${cleanPincode}`,
        locality: `Sector / Area (${cleanPincode})`,
        city: pinCity,
        state: pinState,
        postcode: cleanPincode,
        lat: pinLat,
        lon: pinLon,
        type: 'postcode',
      });
    }
  }

  // 2. Check pre-indexed Agra localities first for zero-latency local matches
  for (const loc of AGRA_LOCALITIES) {
    if (loc.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: `local-agra-${loc.name.toLowerCase().replace(/\s+/g, '-')}`,
        displayName: `${loc.name}, Agra, Uttar Pradesh`,
        name: loc.name,
        locality: loc.name,
        city: 'Agra',
        state: 'Uttar Pradesh',
        lat: loc.lat,
        lon: loc.lon,
        type: 'suburb',
      });
    }
  }

  // 3. Check pre-indexed Top Indian cities
  for (const item of TOP_INDIAN_CITIES) {
    if (item.city.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: `city-${item.city.toLowerCase().replace(/\s+/g, '-')}`,
        displayName: `${item.city}, ${item.state}`,
        name: item.city,
        locality: item.city,
        city: item.city,
        state: item.state,
        lat: item.lat,
        lon: item.lon,
        type: 'city',
      });
    }
  }

  // 3. Upstream Provider Request with Graceful Multi-tier Fallback
  const config = getConfiguredProvider();
  let upstreamResults: LocationResult[] = [];

  try {
    if (config.provider === 'locationiq' && config.apiKey) {
      upstreamResults = await searchLocationIQ(query, config.apiKey);
    } else if (config.provider === 'geoapify' && config.apiKey) {
      upstreamResults = await searchGeoapify(query, config.apiKey);
    } else {
      upstreamResults = await searchNominatim(query);
    }
  } catch (primaryErr) {
    console.warn(`[Location Service] Primary provider (${config.provider}) failed:`, primaryErr);

    // Fallback: If commercial failed, try Nominatim or Photon
    try {
      if (config.provider !== 'osm') {
        upstreamResults = await searchNominatim(query);
      } else {
        upstreamResults = await searchPhoton(query);
      }
    } catch (fallbackErr) {
      console.warn('[Location Service] Secondary Nominatim fallback failed:', fallbackErr);
      try {
        upstreamResults = await searchPhoton(query);
      } catch (photonErr) {
        console.warn('[Location Service] Photon mirror fallback failed:', photonErr);
      }
    }
  }

  // 4. Deduplicate items against pre-indexed results
  for (const item of upstreamResults) {
    const isDuplicate = results.some(
      (r) =>
        Math.abs(r.lat - item.lat) < 0.005 &&
        Math.abs(r.lon - item.lon) < 0.005
    );
    if (!isDuplicate) {
      results.push(item);
    }
  }

  return results;
}

export async function reverseGeocodeLocation(lat: number, lon: number): Promise<LocationResult | null> {
  const config = getConfiguredProvider();

  // Try primary provider
  try {
    if (config.provider === 'locationiq' && config.apiKey) {
      return await reverseLocationIQ(lat, lon, config.apiKey);
    } else if (config.provider === 'geoapify' && config.apiKey) {
      return await reverseGeoapify(lat, lon, config.apiKey);
    } else {
      return await reverseNominatim(lat, lon);
    }
  } catch (primaryErr) {
    console.warn(`[Location Service] Primary reverse (${config.provider}) failed:`, primaryErr);

    // Fallback to OSM Nominatim (if not already tried)
    if (config.provider !== 'osm') {
      try {
        return await reverseNominatim(lat, lon);
      } catch (osmErr) {
        console.warn('[Location Service] Reverse OSM fallback failed:', osmErr);
      }
    }
  }

  return null;
}

// ── LocationIQ Maps, Routing & Value-Add Utilities ──────────────────────────

export interface StaticMapOptions {
  lat: number;
  lon: number;
  zoom?: number;
  width?: number;
  height?: number;
  scale?: number;
  format?: 'jpg' | 'png';
  markerColor?: string;
}

/**
 * Generates high-definition Static Map URL powered by LocationIQ Maps
 */
export function getLocationIQStaticMapUrl(options: StaticMapOptions): string {
  const config = getConfiguredProvider();
  const apiKey =
    (config.provider === 'locationiq' ? config.apiKey : '') ||
    process.env.LOCATIONIQ_API_KEY ||
    process.env.LOCATION_API_KEY ||
    process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY ||
    '';

  const {
    lat,
    lon,
    zoom = 15,
    width = 600,
    height = 320,
    scale = 2,
    format = 'jpg',
    markerColor = 'red',
  } = options;

  if (!apiKey) {
    return '';
  }

  return `https://maps.locationiq.com/v2/staticmap?key=${apiKey}&center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&scale=${scale}&format=${format}&markers=icon:large-${markerColor}-cutout|${lat},${lon}`;
}

/**
 * Returns LocationIQ vector or raster map tile template URL
 */
export function getLocationIQTilesUrl(): string {
  const config = getConfiguredProvider();
  const apiKey =
    (config.provider === 'locationiq' ? config.apiKey : '') ||
    process.env.LOCATIONIQ_API_KEY ||
    process.env.LOCATION_API_KEY ||
    process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY ||
    '';
  return `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${apiKey}`;
}

export interface DrivingRouteResult {
  distanceKm: number;
  distanceMeters: number;
  durationMinutes: number;
  durationSeconds: number;
  durationText: string;
  distanceText: string;
  geometry?: any;
}

/**
 * Calculates live driving directions & travel duration via LocationIQ Directions API
 */
export async function getDrivingRoute(
  origin: GeoCoordinates,
  destination: GeoCoordinates,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<DrivingRouteResult | null> {
  const config = getConfiguredProvider();
  const apiKey =
    (config.provider === 'locationiq' ? config.apiKey : '') ||
    process.env.LOCATIONIQ_API_KEY ||
    process.env.LOCATION_API_KEY ||
    '';

  if (!apiKey) {
    const distKm = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
    const approxMins = Math.max(2, Math.round(distKm * 2.5));
    return {
      distanceKm: distKm,
      distanceMeters: Math.round(distKm * 1000),
      durationMinutes: approxMins,
      durationSeconds: approxMins * 60,
      durationText: `${approxMins} mins`,
      distanceText: formatDistanceText(distKm),
    };
  }

  try {
    const url = `https://us1.locationiq.com/v1/directions/${mode}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?key=${apiKey}&overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) {
      throw new Error(`LocationIQ directions status ${res.status}`);
    }
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));
    const durationText =
      durationMinutes < 60
        ? `${durationMinutes} mins`
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

    return {
      distanceKm,
      distanceMeters: Math.round(route.distance),
      durationMinutes,
      durationSeconds: Math.round(route.duration),
      durationText,
      distanceText: formatDistanceText(distanceKm),
      geometry: route.geometry,
    };
  } catch (err) {
    console.warn('[LocationIQ Directions Error, using Haversine fallback]', err);
    const distKm = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
    const approxMins = Math.max(2, Math.round(distKm * 2.5));
    return {
      distanceKm: distKm,
      distanceMeters: Math.round(distKm * 1000),
      durationMinutes: approxMins,
      durationSeconds: approxMins * 60,
      durationText: `${approxMins} mins`,
      distanceText: formatDistanceText(distKm),
    };
  }
}

/**
 * Resolves IANA timezone identifier via LocationIQ Timezone API
 */
export async function getTimeZone(lat: number, lon: number): Promise<string> {
  const config = getConfiguredProvider();
  const apiKey =
    (config.provider === 'locationiq' ? config.apiKey : '') ||
    process.env.LOCATIONIQ_API_KEY ||
    process.env.LOCATION_API_KEY ||
    '';

  if (apiKey) {
    try {
      const url = `https://us1.locationiq.com/v1/timezone?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data.timezone?.name) {
          return data.timezone.name;
        }
      }
    } catch (err) {
      console.warn('[LocationIQ Timezone Error]', err);
    }
  }
  return 'Asia/Kolkata';
}
