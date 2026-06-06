import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const supportedCountries = new Map([
  ["United States", "US"],
  ["Canada", "CA"],
  ["United Kingdom", "GB"],
  ["Ireland", "IE"],
  ["Germany", "DE"],
  ["France", "FR"],
  ["Spain", "ES"],
  ["Italy", "IT"],
  ["Portugal", "PT"],
  ["Netherlands", "NL"],
  ["Belgium", "BE"],
  ["Switzerland", "CH"],
  ["Austria", "AT"],
  ["Poland", "PL"],
  ["Czech Republic", "CZ"],
  ["Finland", "FI"],
  ["Sweden", "SE"],
  ["Norway", "NO"],
  ["Denmark", "DK"],
  ["Australia", "AU"],
  ["New Zealand", "NZ"],
  ["Singapore", "SG"],
  ["Japan", "JP"],
  ["South Korea", "KR"],
  ["India", "IN"],
  ["Mexico", "MX"],
  ["Brazil", "BR"],
  ["South Africa", "ZA"],
  ["Nigeria", "NG"],
  ["Ghana", "GH"],
  ["Kenya", "KE"],
  ["Egypt", "EG"],
  ["Morocco", "MA"],
  ["Turkey", "TR"],
  ["Israel", "IL"],
  ["Malaysia", "MY"],
  ["Philippines", "PH"],
  ["Thailand", "TH"],
  ["Indonesia", "ID"],
  ["Senegal", "SN"],
  ["The Gambia", "GM"],
  ["Kuwait", "KW"],
  ["Qatar", "QA"],
  ["United Arab Emirates", "AE"],
  ["Saudi Arabia", "SA"]
]);

const profitableMarkets = {
  europe: [
    ["London", 51.5072, -0.1276],
    ["Paris", 48.8566, 2.3522],
    ["Berlin", 52.52, 13.405],
    ["Amsterdam", 52.3676, 4.9041],
    ["Madrid", 40.4168, -3.7038],
    ["Milan", 45.4642, 9.19],
    ["Zurich", 47.3769, 8.5417],
    ["Vienna", 48.2082, 16.3738],
    ["Stockholm", 59.3293, 18.0686],
    ["Dublin", 53.3498, -6.2603],
    ["Copenhagen", 55.6761, 12.5683],
    ["Oslo", 59.9139, 10.7522]
  ],
  "united states": [
    ["New York", 40.7128, -74.006],
    ["Los Angeles", 34.0522, -118.2437],
    ["Chicago", 41.8781, -87.6298],
    ["Houston", 29.7604, -95.3698],
    ["Miami", 25.7617, -80.1918],
    ["Dallas", 32.7767, -96.797],
    ["San Francisco", 37.7749, -122.4194],
    ["Seattle", 47.6062, -122.3321],
    ["Atlanta", 33.749, -84.388],
    ["Boston", 42.3601, -71.0589],
    ["Denver", 39.7392, -104.9903],
    ["Phoenix", 33.4484, -112.074]
  ],
  germany: [
    ["Berlin", 52.52, 13.405],
    ["Munich", 48.1351, 11.582],
    ["Hamburg", 53.5511, 9.9937],
    ["Frankfurt", 50.1109, 8.6821],
    ["Cologne", 50.9375, 6.9603],
    ["Stuttgart", 48.7758, 9.1829]
  ],
  canada: [
    ["Toronto", 43.6532, -79.3832],
    ["Vancouver", 49.2827, -123.1207],
    ["Montreal", 45.5017, -73.5673],
    ["Calgary", 51.0447, -114.0719]
  ],
  australia: [
    ["Sydney", -33.8688, 151.2093],
    ["Melbourne", -37.8136, 144.9631],
    ["Brisbane", -27.4698, 153.0251],
    ["Perth", -31.9523, 115.8613]
  ],
  "united kingdom": [
    ["London", 51.5072, -0.1276],
    ["Manchester", 53.4808, -2.2426],
    ["Birmingham", 52.4862, -1.8904],
    ["Leeds", 53.8008, -1.5491],
    ["Glasgow", 55.8642, -4.2518]
  ],
  ireland: [
    ["Dublin", 53.3498, -6.2603],
    ["Cork", 51.8985, -8.4756],
    ["Galway", 53.2707, -9.0568]
  ],
  france: [
    ["Paris", 48.8566, 2.3522],
    ["Lyon", 45.764, 4.8357],
    ["Marseille", 43.2965, 5.3698],
    ["Nice", 43.7102, 7.262]
  ],
  spain: [
    ["Madrid", 40.4168, -3.7038],
    ["Barcelona", 41.3874, 2.1686],
    ["Valencia", 39.4699, -0.3763],
    ["Seville", 37.3891, -5.9845]
  ],
  italy: [
    ["Milan", 45.4642, 9.19],
    ["Rome", 41.9028, 12.4964],
    ["Florence", 43.7696, 11.2558],
    ["Naples", 40.8518, 14.2681]
  ],
  portugal: [
    ["Lisbon", 38.7223, -9.1393],
    ["Porto", 41.1579, -8.6291],
    ["Faro", 37.0194, -7.9304]
  ],
  netherlands: [
    ["Amsterdam", 52.3676, 4.9041],
    ["Rotterdam", 51.9244, 4.4777],
    ["The Hague", 52.0705, 4.3007]
  ],
  belgium: [
    ["Brussels", 50.8503, 4.3517],
    ["Antwerp", 51.2194, 4.4025],
    ["Ghent", 51.0543, 3.7174]
  ],
  switzerland: [
    ["Zurich", 47.3769, 8.5417],
    ["Geneva", 46.2044, 6.1432],
    ["Basel", 47.5596, 7.5886]
  ],
  austria: [
    ["Vienna", 48.2082, 16.3738],
    ["Salzburg", 47.8095, 13.055],
    ["Graz", 47.0707, 15.4395]
  ],
  poland: [
    ["Warsaw", 52.2297, 21.0122],
    ["Krakow", 50.0647, 19.945],
    ["Wroclaw", 51.1079, 17.0385]
  ],
  "czech republic": [
    ["Prague", 50.0755, 14.4378],
    ["Brno", 49.1951, 16.6068],
    ["Ostrava", 49.8209, 18.2625]
  ],
  finland: [
    ["Helsinki", 60.1699, 24.9384],
    ["Tampere", 61.4978, 23.761],
    ["Turku", 60.4518, 22.2666]
  ],
  sweden: [
    ["Stockholm", 59.3293, 18.0686],
    ["Gothenburg", 57.7089, 11.9746],
    ["Malmo", 55.605, 13.0038]
  ],
  norway: [
    ["Oslo", 59.9139, 10.7522],
    ["Bergen", 60.3913, 5.3221],
    ["Trondheim", 63.4305, 10.3951]
  ],
  denmark: [
    ["Copenhagen", 55.6761, 12.5683],
    ["Aarhus", 56.1629, 10.2039],
    ["Odense", 55.4038, 10.4024]
  ],
  "new zealand": [
    ["Auckland", -36.8509, 174.7645],
    ["Wellington", -41.2865, 174.7762],
    ["Christchurch", -43.5321, 172.6362]
  ],
  singapore: [
    ["Singapore", 1.3521, 103.8198]
  ],
  japan: [
    ["Tokyo", 35.6762, 139.6503],
    ["Osaka", 34.6937, 135.5023],
    ["Yokohama", 35.4437, 139.638]
  ],
  "south korea": [
    ["Seoul", 37.5665, 126.978],
    ["Busan", 35.1796, 129.0756],
    ["Incheon", 37.4563, 126.7052]
  ],
  india: [
    ["Mumbai", 19.076, 72.8777],
    ["Delhi", 28.6139, 77.209],
    ["Bengaluru", 12.9716, 77.5946],
    ["Hyderabad", 17.385, 78.4867]
  ],
  mexico: [
    ["Mexico City", 19.4326, -99.1332],
    ["Guadalajara", 20.6597, -103.3496],
    ["Monterrey", 25.6866, -100.3161]
  ],
  brazil: [
    ["Sao Paulo", -23.5558, -46.6396],
    ["Rio de Janeiro", -22.9068, -43.1729],
    ["Brasilia", -15.8267, -47.9218]
  ],
  "south africa": [
    ["Johannesburg", -26.2041, 28.0473],
    ["Cape Town", -33.9249, 18.4241],
    ["Durban", -29.8587, 31.0218]
  ],
  nigeria: [
    ["Lagos", 6.5244, 3.3792],
    ["Abuja", 9.0765, 7.3986],
    ["Port Harcourt", 4.8156, 7.0498]
  ],
  ghana: [
    ["Accra", 5.6037, -0.187],
    ["Kumasi", 6.6666, -1.6163],
    ["Takoradi", 4.9016, -1.7831]
  ],
  kenya: [
    ["Nairobi", -1.2921, 36.8219],
    ["Mombasa", -4.0435, 39.6682],
    ["Kisumu", -0.0917, 34.768]
  ],
  egypt: [
    ["Cairo", 30.0444, 31.2357],
    ["Alexandria", 31.2001, 29.9187],
    ["Giza", 30.0131, 31.2089]
  ],
  morocco: [
    ["Casablanca", 33.5731, -7.5898],
    ["Marrakesh", 31.6295, -7.9811],
    ["Rabat", 34.0209, -6.8416]
  ],
  turkey: [
    ["Istanbul", 41.0082, 28.9784],
    ["Ankara", 39.9334, 32.8597],
    ["Izmir", 38.4237, 27.1428]
  ],
  israel: [
    ["Tel Aviv", 32.0853, 34.7818],
    ["Jerusalem", 31.7683, 35.2137],
    ["Haifa", 32.794, 34.9896]
  ],
  malaysia: [
    ["Kuala Lumpur", 3.1319, 101.6841],
    ["Penang", 5.4141, 100.3288],
    ["Johor Bahru", 1.4927, 103.7414]
  ],
  philippines: [
    ["Manila", 14.5995, 120.9842],
    ["Cebu City", 10.3157, 123.8854],
    ["Davao City", 7.1907, 125.4553]
  ],
  thailand: [
    ["Bangkok", 13.7563, 100.5018],
    ["Chiang Mai", 18.7883, 98.9853],
    ["Phuket", 7.8804, 98.3923]
  ],
  indonesia: [
    ["Jakarta", -6.2088, 106.8456],
    ["Surabaya", -7.2575, 112.7521],
    ["Bali", -8.4095, 115.1889]
  ],
  senegal: [
    ["Dakar", 14.7167, -17.4677],
    ["Thies", 14.791, -16.9359],
    ["Saly", 14.438, -17.0105]
  ],
  gambia: [
    ["Banjul", 13.4549, -16.579],
    ["Serrekunda", 13.4432, -16.6819],
    ["Brikama", 13.2714, -16.6494]
  ],
  kuwait: [
    ["Kuwait City", 29.3759, 47.9774],
    ["Salmiya", 29.3339, 48.0761],
    ["Hawally", 29.3375, 48.0286]
  ],
  qatar: [
    ["Doha", 25.2854, 51.531],
    ["Al Rayyan", 25.2919, 51.4244],
    ["Lusail", 25.4164, 51.4904]
  ],
  "united arab emirates": [
    ["Dubai", 25.2048, 55.2708],
    ["Abu Dhabi", 24.4539, 54.3773],
    ["Sharjah", 25.3463, 55.4209]
  ],
  "saudi arabia": [
    ["Riyadh", 24.7136, 46.6753],
    ["Jeddah", 21.5433, 39.1728],
    ["Dammam", 26.4207, 50.0888]
  ]
};

const businessProfiles = {
  restaurants: {
    label: "Restaurant",
    aliases: ["restaurant", "restaurants", "resturant", "resturants", "food", "dining", "cafe", "bar"],
    filters: [["amenity", "restaurant"], ["amenity", "cafe"], ["amenity", "fast_food"], ["amenity", "bar"], ["amenity", "pub"]]
  },
  hotels: {
    label: "Hotel",
    aliases: ["hotel", "hotels", "motel", "guest house", "guesthouse", "hostel", "lodging", "resort"],
    filters: [["tourism", "hotel"], ["tourism", "motel"], ["tourism", "guest_house"], ["tourism", "hostel"], ["tourism", "apartment"], ["tourism", "resort"]]
  },
  boutiques: {
    label: "Boutique",
    aliases: ["boutique", "botique", "boutiques", "clothing", "fashion", "apparel", "dress", "shoes"],
    filters: [["shop", "boutique"], ["shop", "clothes"], ["shop", "fashion"], ["shop", "shoes"], ["shop", "bag"], ["shop", "fabric"]]
  },
  car_dealers: {
    label: "Car Dealer",
    aliases: ["car dealer", "car dealers", "dealership", "auto sales", "vehicle sales", "cars"],
    filters: [["shop", "car"], ["shop", "motorcycle"], ["shop", "car_parts"], ["amenity", "car_rental"]]
  },
  auto_repair: {
    label: "Auto Repair",
    aliases: ["auto repair", "mechanic", "garage", "tyres", "tires", "car wash"],
    filters: [["shop", "car_repair"], ["shop", "tyres"], ["shop", "car_parts"], ["amenity", "car_wash"], ["craft", "mechanic"]]
  },
  beauty_spas: {
    label: "Beauty & Spa",
    aliases: ["beauty", "spa", "salon", "hair", "barber", "cosmetics", "nails"],
    filters: [["shop", "beauty"], ["shop", "hairdresser"], ["shop", "cosmetics"], ["shop", "perfumery"], ["amenity", "spa"], ["craft", "beauty"]]
  },
  dental: {
    label: "Dentist",
    aliases: ["dentist", "dentists", "dental", "orthodontist"],
    filters: [["amenity", "dentist"], ["healthcare", "dentist"]]
  },
  medical: {
    label: "Medical Clinic",
    aliases: ["doctor", "doctors", "clinic", "medical", "healthcare", "physiotherapy"],
    filters: [["amenity", "doctors"], ["amenity", "clinic"], ["healthcare", "doctor"], ["healthcare", "clinic"], ["healthcare", "physiotherapist"]]
  },
  gyms: {
    label: "Gym & Fitness",
    aliases: ["gym", "gyms", "fitness", "yoga", "pilates", "trainer"],
    filters: [["leisure", "fitness_centre"], ["leisure", "sports_centre"], ["sport", "fitness"], ["amenity", "gym"]]
  },
  real_estate: {
    label: "Real Estate Agency",
    aliases: ["real estate", "realtor", "estate agent", "property"],
    filters: [["office", "estate_agent"], ["shop", "estate_agent"]]
  },
  law: {
    label: "Law Firm",
    aliases: ["law", "lawyer", "lawyers", "attorney", "legal", "notary"],
    filters: [["office", "lawyer"], ["office", "notary"]]
  },
  accounting: {
    label: "Accountant",
    aliases: ["accountant", "accountants", "tax", "bookkeeping", "payroll"],
    filters: [["office", "accountant"], ["office", "tax_advisor"], ["office", "financial"]]
  },
  marketing_agencies: {
    label: "Marketing Agency",
    aliases: ["marketing", "agency", "advertising", "design agency", "seo", "media agency"],
    filters: [["office", "advertising_agency"], ["office", "it"], ["office", "company"]]
  },
  contractors: {
    label: "Contractor",
    aliases: ["contractor", "construction", "builder", "roofer", "painter", "carpenter"],
    filters: [["craft", "builder"], ["craft", "carpenter"], ["craft", "roofer"], ["craft", "painter"], ["shop", "hardware"]]
  },
  plumbers_electricians: {
    label: "Plumber & Electrician",
    aliases: ["plumber", "plumbers", "electrician", "electricians", "hvac"],
    filters: [["craft", "plumber"], ["craft", "electrician"], ["craft", "hvac"], ["shop", "electrical"]]
  },
  pharmacies: {
    label: "Pharmacy",
    aliases: ["pharmacy", "pharmacies", "chemist", "drugstore"],
    filters: [["amenity", "pharmacy"], ["shop", "chemist"]]
  },
  veterinary: {
    label: "Veterinarian",
    aliases: ["vet", "vets", "veterinarian", "veterinary", "animal clinic"],
    filters: [["amenity", "veterinary"], ["healthcare", "veterinary"]]
  },
  schools: {
    label: "Private School",
    aliases: ["school", "schools", "academy", "training", "language school", "music school"],
    filters: [["amenity", "school"], ["amenity", "language_school"], ["amenity", "music_school"], ["office", "educational_institution"]]
  },
  daycare: {
    label: "Daycare",
    aliases: ["daycare", "childcare", "kindergarten", "nursery"],
    filters: [["amenity", "childcare"], ["amenity", "kindergarten"]]
  },
  retail: {
    label: "Retail Store",
    aliases: ["retail", "store", "shop", "supermarket", "grocery", "bakery"],
    filters: [["shop", "supermarket"], ["shop", "convenience"], ["shop", "bakery"], ["shop", "butcher"], ["shop", "greengrocer"], ["shop", "department_store"]]
  },
  jewelers: {
    label: "Jeweler",
    aliases: ["jeweler", "jewellery", "jewelry", "watch"],
    filters: [["shop", "jewelry"], ["shop", "watches"]]
  },
  furniture: {
    label: "Furniture Store",
    aliases: ["furniture", "home decor", "interior"],
    filters: [["shop", "furniture"], ["shop", "interior_decoration"], ["shop", "kitchen"]]
  },
  electronics: {
    label: "Electronics Store",
    aliases: ["electronics", "computer", "phone shop", "mobile phone"],
    filters: [["shop", "electronics"], ["shop", "computer"], ["shop", "mobile_phone"]]
  },
  travel_agencies: {
    label: "Travel Agency",
    aliases: ["travel", "tour", "tourism agency", "travel agency"],
    filters: [["shop", "travel_agency"], ["office", "travel_agent"], ["tourism", "information"]]
  },
  event_venues: {
    label: "Event Venue",
    aliases: ["event", "venue", "wedding", "conference", "banquet"],
    filters: [["amenity", "events_venue"], ["amenity", "conference_centre"], ["amenity", "community_centre"]]
  },
  finance_insurance: {
    label: "Finance & Insurance",
    aliases: ["insurance", "finance", "financial advisor", "bank", "broker"],
    filters: [["office", "insurance"], ["office", "financial_advisor"], ["amenity", "bank"], ["office", "financial"]]
  }
};

const defaultBusinessProfileKeys = [
  "restaurants",
  "hotels",
  "boutiques",
  "car_dealers",
  "auto_repair",
  "beauty_spas",
  "dental",
  "medical",
  "gyms",
  "real_estate",
  "law",
  "accounting",
  "contractors",
  "pharmacies",
  "retail"
];

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function marketKey(placeName) {
  return normalize(placeName)
    .replace(/^the /, "")
    .replace(/\bof\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function supportedCountryName(value) {
  const key = marketKey(value);
  return [...supportedCountries.keys()].find((country) => marketKey(country) === key || normalize(country) === normalize(value)) || "";
}

function selectedCountryNames(search) {
  const values = [
    ...(Array.isArray(search.countries) ? search.countries : []),
    search.country
  ].filter(Boolean);
  return unique(values.map(supportedCountryName));
}

function unsupportedCountryNames(search) {
  const values = unique([
    ...(Array.isArray(search.countries) ? search.countries : []),
    search.country
  ].filter(Boolean));
  return values.filter((country) => !supportedCountryName(country));
}

function countryCodesFor(names) {
  return names.map((name) => supportedCountries.get(name)).filter(Boolean);
}

function marketsForCountries(countryNames) {
  return countryNames.flatMap((countryName) => {
    const key = marketKey(countryName);
    return (profitableMarkets[key] || []).map(([name, latitude, longitude]) => ({
      name,
      latitude,
      longitude,
      countryName,
      countryCode: supportedCountries.get(countryName)
    }));
  });
}

function normalizeMarketEntry(market) {
  return Array.isArray(market)
    ? { name: market[0], latitude: market[1], longitude: market[2] }
    : market;
}

function profileKeyFromValue(value) {
  const normalized = normalize(value);
  if (businessProfiles[normalized]) return normalized;
  return Object.entries(businessProfiles).find(([key, profile]) => (
    normalize(key) === normalized || profile.aliases.some((alias) => normalized.includes(normalize(alias)))
  ))?.[0] || "";
}

function textProfileKeys(search) {
  const text = normalize(`${search.industry || ""} ${search.keyword || ""}`);
  if (!text || ["business", "businesses", "website", "websites", "website redesign", "lead", "leads"].includes(text)) return [];
  return Object.entries(businessProfiles)
    .filter(([, profile]) => profile.aliases.some((alias) => text.includes(normalize(alias))))
    .map(([key]) => key);
}

function selectedBusinessProfileKeys(search) {
  const explicit = unique((Array.isArray(search.businessTypes) ? search.businessTypes : [])
    .map(profileKeyFromValue));
  const inferred = textProfileKeys(search);
  const keys = explicit.length ? unique([...explicit, ...inferred]) : inferred;
  return keys.length ? keys : defaultBusinessProfileKeys;
}

function buildTextQuery(search) {
  const businessLabels = selectedBusinessProfileKeys(search)
    .slice(0, 6)
    .map((key) => businessProfiles[key]?.label)
    .filter(Boolean);
  const text = [
    search.keyword,
    search.industry,
    businessLabels.join(", "),
    search.city,
    search.state,
    search.zip,
    selectedCountryNames(search).join(", ")
  ].filter(Boolean).join(" ").trim();
  return text || "target businesses";
}

function parseGoogleMapsLink(mapLink) {
  if (!mapLink) return null;
  const decoded = decodeURIComponent(mapLink);
  const placeSlugMatch = /\/maps\/place\/([^/@?]+)/i.exec(decoded);
  const placeName = placeSlugMatch
    ? placeSlugMatch[1].replace(/\+/g, " ").replace(/%20/g, " ").trim()
    : "";
  const placeMatch = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i.exec(decoded);
  if (placeMatch) {
    const viewportMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/i.exec(decoded);
    return {
      latitude: Number(placeMatch[1]),
      longitude: Number(placeMatch[2]),
      zoom: viewportMatch?.[3] ? Number(viewportMatch[3]) : null,
      source: "place_coordinates",
      placeName
    };
  }

  const atMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/i.exec(decoded);
  if (atMatch) {
    return {
      latitude: Number(atMatch[1]),
      longitude: Number(atMatch[2]),
      zoom: atMatch[3] ? Number(atMatch[3]) : null,
      source: "viewport_coordinates",
      placeName
    };
  }

  const queryMatch = /[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i.exec(decoded);
  if (queryMatch) {
    return {
      latitude: Number(queryMatch[1]),
      longitude: Number(queryMatch[2]),
      zoom: null,
      source: "query_coordinates"
    };
  }

  return null;
}

async function resolveGoogleMapsLink(mapLink) {
  if (!mapLink) return "";
  try {
    const url = new URL(mapLink);
    const host = url.hostname.toLowerCase();
    const canResolve = ["maps.app.goo.gl", "goo.gl"].includes(host);
    if (!canResolve || !["http:", "https:"].includes(url.protocol)) return mapLink;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "MATLeadsAIProX/1.0"
        }
      });
      return response.url || mapLink;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return mapLink;
  }
}

function isLegacyDefaultMapLink(mapLink) {
  const normalized = decodeURIComponent(String(mapLink || "")).trim();
  return normalized.includes("@13.4053888,-16.6887424,11z");
}

function zoomToRadiusMeters(zoom) {
  if (!Number.isFinite(zoom)) return null;
  if (zoom >= 15) return 2500;
  if (zoom >= 13) return 6000;
  if (zoom >= 11) return 15000;
  if (zoom >= 9) return 30000;
  return 50000;
}

function searchLocation(search) {
  const parsed = parseGoogleMapsLink(search.mapLink);
  const latitude = parsed?.latitude ?? search.latitude;
  const longitude = parsed?.longitude ?? search.longitude;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    zoom: parsed?.zoom || null,
    radiusMeters: Math.min(search.radiusMeters || zoomToRadiusMeters(parsed?.zoom) || 15000, 50000),
    mapLink: search.mapLink || `https://www.google.com/maps/@${latitude},${longitude},12z`,
    coordinateSource: parsed?.source || "manual_coordinates",
    placeName: parsed?.placeName || ""
  };
}

function broadMarketsFor(location) {
  if (!location?.placeName) return null;
  const key = marketKey(location.placeName);
  if (profitableMarkets[key]) return profitableMarkets[key].map(([name, latitude, longitude]) => ({ name, latitude, longitude }));
  if (location.zoom && location.zoom <= 5 && key.includes("europe")) {
    return profitableMarkets.europe.map(([name, latitude, longitude]) => ({ name, latitude, longitude }));
  }
  if (location.zoom && location.zoom <= 5 && key.includes("united states")) {
    return profitableMarkets["united states"].map(([name, latitude, longitude]) => ({ name, latitude, longitude, countryName: "United States", countryCode: "US" }));
  }
  return null;
}

function tagValue(tags, keys) {
  for (const key of keys) {
    if (tags?.[key]) return tags[key];
  }
  return "";
}

function splitTagValues(value) {
  return String(value || "").split(";").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function tagMatchesFilter(tags, [key, value]) {
  if (!tags?.[key]) return false;
  return splitTagValues(tags[key]).includes(String(value).toLowerCase());
}

function profileFromTags(tags = {}, profileKeys = Object.keys(businessProfiles)) {
  return profileKeys
    .map((key) => ({ key, profile: businessProfiles[key] }))
    .find(({ profile }) => profile?.filters.some((filter) => tagMatchesFilter(tags, filter))) || null;
}

function categoryFromTags(tags = {}, profileKeys) {
  const profileMatch = profileFromTags(tags, profileKeys);
  if (profileMatch) return profileMatch.profile.label;
  const category = tagValue(tags, ["amenity", "shop", "office", "tourism", "craft", "healthcare", "leisure"]);
  return category ? category.replaceAll("_", " ") : "Local business";
}

function addressFromTags(tags = {}) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:postcode"],
    tags["addr:country"]
  ].filter(Boolean);
  return parts.join(", ");
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  }));
}

function socialLinksFromTags(tags = {}) {
  return compactObject({
    facebook: tagValue(tags, ["contact:facebook", "facebook"]),
    instagram: tagValue(tags, ["contact:instagram", "instagram"]),
    linkedin: tagValue(tags, ["contact:linkedin", "linkedin"]),
    x: tagValue(tags, ["contact:twitter", "twitter", "x"]),
    youtube: tagValue(tags, ["contact:youtube", "youtube"]),
    tiktok: tagValue(tags, ["contact:tiktok", "tiktok"]),
    whatsapp: tagValue(tags, ["contact:whatsapp", "whatsapp"])
  });
}

function osmDetailsFromTags(tags = {}, coords = {}, element = {}) {
  const websiteUrl = tagValue(tags, ["website", "contact:website", "url"]);
  const email = tagValue(tags, ["email", "contact:email"]);
  const phone = tagValue(tags, ["phone", "contact:phone"]);
  const mobile = tagValue(tags, ["mobile", "contact:mobile"]);
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "";
  const country = tags["addr:country"] || tags["is_in:country"] || "";
  const ownerName = tagValue(tags, ["owner", "contact:owner"]);
  const operator = tagValue(tags, ["operator", "operator:name"]);
  const contactPerson = tagValue(tags, ["contact:person", "contact:name", "contact:contact_person", "manager"]);

  return {
    ownerContact: compactObject({
      ownerName,
      operator,
      contactPerson,
      contactRole: tags["contact:role"],
      publicContactNote: ownerName || operator || contactPerson
        ? "Owner/operator/contact fields were found in public map data."
        : "Owner or direct contact person was not listed in the public map data."
    }),
    contact: compactObject({
      phone,
      mobile,
      email,
      website: websiteUrl,
      fax: tagValue(tags, ["fax", "contact:fax"])
    }),
    social: socialLinksFromTags(tags),
    location: compactObject({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: addressFromTags(tags),
      houseNumber: tags["addr:housenumber"],
      street: tags["addr:street"],
      city,
      postcode: tags["addr:postcode"],
      country,
      countryCode: tags["addr:country"],
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tags.name || tags.brand || ""} ${coords.latitude},${coords.longitude}`)}`
    }),
    business: compactObject({
      brand: tags.brand,
      ownerName,
      operator,
      cuisine: tags.cuisine,
      branch: tags.branch,
      description: tags.description,
      officialName: tags.official_name,
      altName: tags.alt_name
    }),
    operations: compactObject({
      openingHours: tags.opening_hours,
      delivery: tags.delivery,
      takeaway: tags.takeaway,
      reservation: tags.reservation,
      outdoorSeating: tags.outdoor_seating,
      wheelchair: tags.wheelchair,
      internetAccess: tags.internet_access
    }),
    payments: compactObject({
      cash: tags["payment:cash"],
      cards: tags["payment:cards"],
      visa: tags["payment:visa"],
      mastercard: tags["payment:mastercard"],
      mobilePay: tags["payment:mobile_pay"]
    }),
    source: compactObject({
      provider: "OpenStreetMap Overpass",
      osmType: element.type,
      osmId: element.id,
      osmUrl: element.type && element.id ? `https://www.openstreetmap.org/${element.type}/${element.id}` : "",
      rawTags: tags
    })
  };
}

function osmCoordinates(element) {
  return {
    latitude: element.lat ?? element.center?.lat,
    longitude: element.lon ?? element.center?.lon
  };
}

function mapOsmElement(element, profileKeys) {
  const tags = element.tags || {};
  const coords = osmCoordinates(element);
  const name = tags.name || tags.brand || "Unnamed business";
  const profileMatch = profileFromTags(tags, profileKeys);
  const category = categoryFromTags(tags, profileKeys);
  const phone = tagValue(tags, ["phone", "contact:phone", "mobile", "contact:mobile"]);
  const websiteUrl = tagValue(tags, ["website", "contact:website", "url"]);
  const email = tagValue(tags, ["email", "contact:email"]);
  const social = tagValue(tags, ["contact:facebook", "contact:instagram", "contact:linkedin", "facebook", "instagram"]);
  const address = addressFromTags(tags);
  const mapsQuery = encodeURIComponent(`${name} ${coords.latitude},${coords.longitude}`);
  const details = osmDetailsFromTags(tags, coords, element);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category,
    businessType: profileMatch?.profile.label || category,
    address,
    phone,
    rating: null,
    reviewsCount: 0,
    websiteUrl,
    googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
    latitude: coords.latitude,
    longitude: coords.longitude,
    email,
    social,
    openingHours: tags.opening_hours || "",
    details,
    source: "openstreetmap_overpass",
    raw: { osmType: element.type, osmId: element.id, tags }
  };
}

function overpassEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function overpassRegexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function overpassFiltersForSearch(search) {
  const filters = selectedBusinessProfileKeys(search)
    .flatMap((key) => businessProfiles[key]?.filters || []);
  const seen = new Set();
  return filters.filter(([key, value]) => {
    const id = `${key}:${value}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function buildOverpassQuery(location, limit, elementTypes = ["node"], search) {
  const radius = Math.min(Math.max(Number(location.radiusMeters || 15000), 500), 50000);
  const lat = location.latitude;
  const lon = location.longitude;
  const filters = overpassFiltersForSearch(search);
  const grouped = filters.reduce((groups, [key, value]) => {
    const values = groups.get(key) || new Set();
    values.add(value);
    groups.set(key, values);
    return groups;
  }, new Map());
  const selectors = [...grouped.entries()].flatMap(([key, values]) => {
    const pattern = `^(${[...values].map(overpassRegexEscape).join("|")})$`;
    return elementTypes.map((type) => (
      `${type}(around:${radius},${lat},${lon})["name"]["${overpassEscape(key)}"~"${pattern}"];`
    ));
  });
  const outLimit = Math.min(Math.max(limit * 10, 80), 250);

  return `[out:json][timeout:12];(${selectors.join("")});out center tags ${outLimit};`;
}

function leadCountryAllowed(lead, countryCodes) {
  if (!countryCodes.length) return true;
  const tags = lead.raw?.tags || {};
  const country = tagValue(tags, ["addr:country", "ISO3166-1", "is_in:country_code"]);
  if (!country) return true;
  return countryCodes.includes(String(country).toUpperCase());
}

function scoreLead(lead, profileKeys) {
  const tags = lead.raw?.tags || {};
  let score = profileFromTags(tags, profileKeys) ? 50 : 0;
  if (!lead.websiteUrl) score += 22;
  if (lead.phone || lead.email) score += 16;
  if (lead.social) score += 6;
  if (lead.address) score += 5;
  if (tags.opening_hours) score += 4;
  if (lead.websiteUrl) score += 3;
  return score;
}

function filterOsmLeads(leads, search) {
  const profileKeys = selectedBusinessProfileKeys(search);
  const countryCodes = countryCodesFor(selectedCountryNames(search));

  return leads
    .filter((lead) => profileFromTags(lead.raw?.tags || {}, profileKeys))
    .filter((lead) => leadCountryAllowed(lead, countryCodes))
    .map((lead) => ({ ...lead, searchRelevance: scoreLead(lead, profileKeys) }))
    .sort((left, right) => right.searchRelevance - left.searchRelevance || left.name.localeCompare(right.name));
}

function viewboxFor(location) {
  const radius = Math.min(Math.max(Number(location.radiusMeters || 3000), 500), 15000);
  const latDelta = radius / 111320;
  const lonDelta = radius / (111320 * Math.max(Math.cos(location.latitude * Math.PI / 180), 0.2));
  return [
    location.longitude - lonDelta,
    location.latitude + latDelta,
    location.longitude + lonDelta,
    location.latitude - latDelta
  ].join(",");
}

function nominatimTerm(profileKey) {
  const terms = {
    restaurants: "restaurant",
    hotels: "hotel",
    boutiques: "boutique",
    car_dealers: "car dealer",
    auto_repair: "auto repair",
    beauty_spas: "beauty salon",
    dental: "dentist",
    medical: "clinic",
    gyms: "gym",
    real_estate: "real estate agency",
    law: "lawyer",
    accounting: "accountant",
    marketing_agencies: "marketing agency",
    contractors: "contractor",
    plumbers_electricians: "plumber",
    pharmacies: "pharmacy",
    veterinary: "veterinary",
    schools: "private school",
    daycare: "daycare",
    retail: "retail store",
    jewelers: "jewelry",
    furniture: "furniture store",
    electronics: "electronics store",
    travel_agencies: "travel agency",
    event_venues: "event venue",
    finance_insurance: "insurance"
  };
  return terms[profileKey] || businessProfiles[profileKey]?.label || "business";
}

function mapNominatimPlace(place, profileKey) {
  const profile = businessProfiles[profileKey];
  const tags = place.extratags || {};
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  const name = place.namedetails?.name || place.name || String(place.display_name || "Unknown business").split(",")[0];
  const phone = tagValue(tags, ["phone", "contact:phone", "mobile", "contact:mobile"]);
  const websiteUrl = tagValue(tags, ["website", "contact:website", "url"]);
  const email = tagValue(tags, ["email", "contact:email"]);
  const social = tagValue(tags, ["contact:facebook", "contact:instagram", "contact:linkedin", "facebook", "instagram"]);
  const mapsQuery = encodeURIComponent(`${name} ${latitude},${longitude}`);
  const details = {
    ...osmDetailsFromTags(tags, { latitude, longitude }, { type: place.osm_type, id: place.osm_id }),
    source: compactObject({
      provider: "OpenStreetMap Nominatim",
      osmType: place.osm_type,
      osmId: place.osm_id,
      osmUrl: place.osm_type && place.osm_id ? `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}` : "",
      placeRank: place.place_rank,
      importance: place.importance,
      rawTags: tags
    })
  };

  return {
    id: `nominatim-${place.osm_type}-${place.osm_id}`,
    name,
    category: profile?.label || place.type || "Local business",
    businessType: profile?.label || place.type || "Local business",
    address: place.display_name || "",
    phone,
    rating: null,
    reviewsCount: 0,
    websiteUrl,
    googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
    latitude,
    longitude,
    email,
    social,
    openingHours: tags.opening_hours || "",
    details,
    source: "openstreetmap_nominatim",
    raw: { osmType: place.osm_type, osmId: place.osm_id, tags, nominatim: place }
  };
}

async function searchNominatimFallback(search, location, limitOverride, profileKeys) {
  if (!location) return [];
  const selectedCountries = selectedCountryNames(search);
  const countrycodes = countryCodesFor(selectedCountries).map((code) => code.toLowerCase()).join(",");
  const collected = [];
  const seen = new Set();

  for (const profileKey of profileKeys.slice(0, 6)) {
    if (collected.length >= limitOverride) break;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", nominatimTerm(profileKey));
      url.searchParams.set("limit", String(Math.min(10, Math.max(1, limitOverride - collected.length))));
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("bounded", "1");
      url.searchParams.set("viewbox", viewboxFor(location));
      if (countrycodes) url.searchParams.set("countrycodes", countrycodes);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "MATLeadsAIProX/1.0"
        }
      });
      if (!response.ok) continue;

      const places = await response.json();
      for (const place of places || []) {
        const lead = mapNominatimPlace(place, profileKey);
        if (!lead.name || !Number.isFinite(lead.latitude) || !Number.isFinite(lead.longitude)) continue;
        const key = normalize(`${lead.name}-${lead.latitude.toFixed(5)}-${lead.longitude.toFixed(5)}`);
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push({ ...lead, searchRelevance: scoreLead(lead, profileKeys) });
        if (collected.length >= limitOverride) break;
      }
    } catch {
      // Nominatim is a fallback path; failed fallback requests should not mask the primary Overpass error.
    } finally {
      clearTimeout(timeout);
    }
  }

  return collected;
}

function mapPlace(place) {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || "";
  const websiteUrl = place.websiteUri || "";
  const openingHours = (place.regularOpeningHours?.weekdayDescriptions || []).join("; ");
  const details = {
    contact: compactObject({
      phone,
      website: websiteUrl
    }),
    social: {},
    location: compactObject({
      latitude,
      longitude,
      address: place.formattedAddress,
      googleMapsLink: place.googleMapsUri
    }),
    business: compactObject({
      businessStatus: place.businessStatus,
      priceLevel: place.priceLevel,
      primaryType: place.primaryTypeDisplayName?.text,
      types: place.types || [],
      summary: place.editorialSummary?.text
    }),
    operations: compactObject({
      openingHours,
      openNow: place.regularOpeningHours?.openNow
    }),
    payments: {},
    source: compactObject({
      provider: "Google Places",
      placeId: place.id,
      rawPlace: place
    })
  };

  return {
    id: place.id || place.name?.split("/").pop(),
    name: place.displayName?.text || "Unknown business",
    category: place.primaryTypeDisplayName?.text || place.types?.[0] || "Local business",
    address: place.formattedAddress || "",
    phone,
    rating: place.rating || null,
    reviewsCount: place.userRatingCount || 0,
    websiteUrl,
    googleMapsLink: place.googleMapsUri || "",
    latitude,
    longitude,
    openingHours,
    details,
    raw: place
  };
}

export class GooglePlacesService {
  async search(search) {
    const initialSelectedCountries = selectedCountryNames(search);
    const shouldIgnoreLegacyDefaultMap = initialSelectedCountries.length > 0 && isLegacyDefaultMapLink(search.mapLink);
    const normalizedSearch = {
      ...search,
      mapLink: shouldIgnoreLegacyDefaultMap ? "" : await resolveGoogleMapsLink(search.mapLink)
    };
    const location = searchLocation(normalizedSearch);
    const selectedCountries = selectedCountryNames(normalizedSearch);
    const unsupportedCountries = unsupportedCountryNames(normalizedSearch);

    if (unsupportedCountries.length) {
      throw new AppError(`Unsupported countries: ${unsupportedCountries.join(", ")}.`, 422, "UNSUPPORTED_COUNTRY");
    }

    if (!location && selectedCountries.length === 0) {
      throw new AppError("Select at least one supported country or paste a Google Maps link with coordinates.", 422, "COUNTRY_OR_MAP_LINK_REQUIRED");
    }

    if (!env.google.placesApiKey) {
      return this.searchOpenStreetMap(normalizedSearch, location);
    }

    const requestBody = {
      textQuery: buildTextQuery(normalizedSearch),
      maxResultCount: normalizedSearch.limit,
      languageCode: "en"
    };

    if (location) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          radius: location.radiusMeters
        }
      };
    } else if (selectedCountries.length) {
      requestBody.includedRegionCodes = countryCodesFor(selectedCountries);
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.google.placesApiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.primaryTypeDisplayName",
          "places.formattedAddress",
          "places.internationalPhoneNumber",
          "places.nationalPhoneNumber",
          "places.rating",
          "places.userRatingCount",
          "places.websiteUri",
          "places.googleMapsUri",
          "places.location",
          "places.businessStatus",
          "places.priceLevel",
          "places.regularOpeningHours",
          "places.editorialSummary",
          "places.types"
        ].join(",")
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new AppError("Google Places request failed.", response.status, "GOOGLE_PLACES_ERROR", body.slice(0, 400));
    }

    const payload = await response.json();
    return {
      source: "google_places",
      selectedCountries,
      location,
      query: requestBody.textQuery,
      leads: (payload.places || []).map(mapPlace)
    };
  }

  async searchOpenStreetMap(search, location) {
    const selectedCountries = selectedCountryNames(search);
    const selectedCountryMarkets = marketsForCountries(selectedCountries);
    const broadMarkets = broadMarketsFor(location);
    const markets = selectedCountryMarkets.length && (!location || broadMarkets)
      ? selectedCountryMarkets
      : broadMarkets;

    if (markets?.length) {
      return this.searchOpenStreetMapMarkets(search, location, markets);
    }

    if (!location) {
      throw new AppError("Select at least one supported country or paste a Google Maps link with coordinates to search real businesses without a Google API key.", 422, "COUNTRY_OR_MAP_LINK_REQUIRED");
    }

    let lastError = null;
    let emptyResult = null;
    const queryVariants = [
      { label: "nodes_and_ways", elementTypes: ["node", "way"] },
      { label: "relations", elementTypes: ["relation"] }
    ];

    for (const variant of queryVariants) {
      const query = buildOverpassQuery(location, search.limit, variant.elementTypes, search);
      const profileKeys = selectedBusinessProfileKeys(search);
      for (const endpoint of env.osm.overpassEndpoints) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 16000);
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "Accept": "application/json",
              "User-Agent": "MATLeadsAIProX/1.0"
            },
            body: new URLSearchParams({ data: query })
          });

          if (!response.ok) {
            lastError = new AppError(`OpenStreetMap Overpass request failed with ${response.status}.`, response.status, "OVERPASS_ERROR");
            continue;
          }

          const payload = await response.json();
          const seen = new Set();
          const leads = filterOsmLeads((payload.elements || [])
            .map((element) => mapOsmElement(element, profileKeys))
            .filter((lead) => lead.name && Number.isFinite(lead.latitude) && Number.isFinite(lead.longitude))
            .filter((lead) => {
              const key = normalize(`${lead.name}-${lead.latitude.toFixed(5)}-${lead.longitude.toFixed(5)}`);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }), search).slice(0, search.limit);

          const result = {
            source: "openstreetmap_overpass",
            providerLabel: "OpenStreetMap Overpass",
            selectedCountries,
            endpoint,
            queryVariant: variant.label,
            location,
            query: buildTextQuery(search),
            leads
          };

          if (leads.length) return result;
          emptyResult = result;
        } catch (error) {
          lastError = error;
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    const fallbackLeads = await searchNominatimFallback(search, location, search.limit, selectedBusinessProfileKeys(search));
    if (fallbackLeads.length) {
      return {
        source: "openstreetmap_nominatim",
        providerLabel: "OpenStreetMap Nominatim",
        selectedCountries,
        queryVariant: "nominatim_fallback",
        location,
        query: buildTextQuery(search),
        leads: fallbackLeads.slice(0, search.limit)
      };
    }

    if (emptyResult) return emptyResult;
    throw new AppError(`OpenStreetMap Overpass search failed: ${lastError?.message || "all endpoints unavailable"}`, 503, "OVERPASS_UNAVAILABLE");
  }

  async searchOpenStreetMapMarkets(search, originalLocation, markets) {
    const perMarketLimit = Math.max(3, Math.ceil(search.limit / Math.min(markets.length, 5)));
    const collected = [];
    const seen = new Set();
    const selectedCountries = selectedCountryNames(search);
    const baseLocation = originalLocation || {
      radiusMeters: search.radiusMeters || 15000,
      placeName: selectedCountries.join(", "),
      coordinateSource: "selected_countries"
    };
    const sampled = markets.slice(0, Math.min(markets.length, Math.max(selectedCountries.length * 2, 2, Math.ceil(search.limit / perMarketLimit))));

    const marketResults = await Promise.allSettled(sampled.map(async (market) => {
      const normalizedMarket = normalizeMarketEntry(market);
      const marketLocation = {
        ...baseLocation,
        latitude: normalizedMarket.latitude,
        longitude: normalizedMarket.longitude,
        radiusMeters: Math.min(baseLocation.radiusMeters || 15000, 3000),
        marketName: normalizedMarket.name,
        countryName: normalizedMarket.countryName,
        countryCode: normalizedMarket.countryCode
      };
      const result = await this.searchOpenStreetMapSingle(search, marketLocation, perMarketLimit);
      return { normalizedMarket, leads: result.leads };
    }));

    for (const marketResult of marketResults) {
      if (marketResult.status !== "fulfilled") continue;
      for (const lead of marketResult.value.leads) {
        const key = normalize(`${lead.name}-${lead.latitude?.toFixed?.(4)}-${lead.longitude?.toFixed?.(4)}`);
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push({
          ...lead,
          marketName: marketResult.value.normalizedMarket.name,
          countryName: marketResult.value.normalizedMarket.countryName,
          countryCode: marketResult.value.normalizedMarket.countryCode
        });
        if (collected.length >= search.limit) break;
      }
      if (collected.length >= search.limit) break;
    }

    return {
      source: "openstreetmap_overpass",
      providerLabel: "OpenStreetMap Overpass",
      selectedCountries,
      queryVariant: "profitable_markets",
      location: {
        ...baseLocation,
        broadPlace: true,
        sampledMarkets: sampled.map((market) => {
          const normalizedMarket = normalizeMarketEntry(market);
          return {
            name: normalizedMarket.name,
            latitude: normalizedMarket.latitude,
            longitude: normalizedMarket.longitude,
            countryName: normalizedMarket.countryName
          };
        })
      },
      query: buildTextQuery(search),
      leads: collected
    };
  }

  async searchOpenStreetMapSingle(search, location, limitOverride = search.limit) {
    const query = buildOverpassQuery(location, limitOverride, ["node", "way"], search);
    const profileKeys = selectedBusinessProfileKeys(search);
    let lastError = null;
    let emptyResult = null;

    for (const endpoint of env.osm.overpassEndpoints) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 16000);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": "MATLeadsAIProX/1.0"
          },
          body: new URLSearchParams({ data: query })
        });

        if (!response.ok) {
          lastError = new AppError(`OpenStreetMap Overpass request failed with ${response.status}.`, response.status, "OVERPASS_ERROR");
          continue;
        }

        const payload = await response.json();
        const seen = new Set();
        const leads = filterOsmLeads((payload.elements || [])
          .map((element) => mapOsmElement(element, profileKeys))
          .filter((lead) => lead.name && Number.isFinite(lead.latitude) && Number.isFinite(lead.longitude))
          .filter((lead) => {
            const key = normalize(`${lead.name}-${lead.latitude.toFixed(5)}-${lead.longitude.toFixed(5)}`);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }), search).slice(0, limitOverride);

        const result = {
          source: "openstreetmap_overpass",
          endpoint,
          location,
          leads
        };
        if (leads.length) return result;
        emptyResult = result;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }

    const fallbackLeads = await searchNominatimFallback(search, location, limitOverride, profileKeys);
    if (fallbackLeads.length) {
      return {
        source: "openstreetmap_nominatim",
        endpoint: "https://nominatim.openstreetmap.org/search",
        location,
        leads: fallbackLeads.slice(0, limitOverride)
      };
    }

    if (emptyResult) return emptyResult;
    throw new AppError(`OpenStreetMap Overpass market search failed: ${lastError?.message || "all endpoints unavailable"}`, 503, "OVERPASS_UNAVAILABLE");
  }
}
