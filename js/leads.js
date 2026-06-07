import { apiFetch, byId, requireAuth, scoreClass } from "./api.js";

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Ireland",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Portugal",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Poland",
  "Czech Republic",
  "Finland",
  "Sweden",
  "Norway",
  "Denmark",
  "Australia",
  "New Zealand",
  "Singapore",
  "Hong Kong",
  "Taiwan",
  "Japan",
  "South Korea",
  "India",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Panama",
  "Costa Rica",
  "South Africa",
  "Nigeria",
  "Ghana",
  "Kenya",
  "Egypt",
  "Morocco",
  "Turkey",
  "Israel",
  "Malaysia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "Indonesia",
  "Senegal",
  "The Gambia",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
  "Jordan",
  "United Arab Emirates",
  "Saudi Arabia"
];

const businessTypes = [
  ["restaurants", "Restaurants"],
  ["coffee_shops", "Coffee Shops"],
  ["bakeries", "Bakeries"],
  ["hotels", "Hotels"],
  ["boutiques", "Boutiques"],
  ["car_dealers", "Car Dealers"],
  ["car_wash", "Car Wash"],
  ["auto_repair", "Auto Repair"],
  ["beauty_spas", "Beauty Salons & Spas"],
  ["dental", "Dentists"],
  ["medical", "Doctors & Clinics"],
  ["gyms", "Gyms & Fitness"],
  ["real_estate", "Real Estate Agencies"],
  ["law", "Law Firms"],
  ["accounting", "Accountants"],
  ["marketing_agencies", "Marketing Agencies"],
  ["contractors", "Contractors"],
  ["roofing", "Roofing Contractors"],
  ["hvac", "HVAC Contractors"],
  ["plumbers_electricians", "Plumbers & Electricians"],
  ["pharmacies", "Pharmacies"],
  ["veterinary", "Veterinarians"],
  ["schools", "Private Schools"],
  ["daycare", "Daycare Centers"],
  ["retail", "Retail Stores"],
  ["jewelers", "Jewelers"],
  ["furniture", "Furniture Stores"],
  ["electronics", "Electronics Stores"],
  ["travel_agencies", "Travel Agencies"],
  ["event_venues", "Event Venues"],
  ["finance_insurance", "Finance & Insurance"],
  ["laundromats", "Laundromats"],
  ["moving_storage", "Moving & Storage"],
  ["coworking", "Coworking Spaces"],
  ["photographers", "Photographers"]
];

const countryCallingCodesByIso = {
  US: "1",
  CA: "1",
  GB: "44",
  IE: "353",
  DE: "49",
  FR: "33",
  ES: "34",
  IT: "39",
  PT: "351",
  NL: "31",
  BE: "32",
  CH: "41",
  AT: "43",
  PL: "48",
  CZ: "420",
  FI: "358",
  SE: "46",
  NO: "47",
  DK: "45",
  AU: "61",
  NZ: "64",
  SG: "65",
  HK: "852",
  TW: "886",
  JP: "81",
  KR: "82",
  IN: "91",
  MX: "52",
  BR: "55",
  AR: "54",
  CL: "56",
  CO: "57",
  PE: "51",
  PA: "507",
  CR: "506",
  ZA: "27",
  NG: "234",
  GH: "233",
  KE: "254",
  EG: "20",
  MA: "212",
  TR: "90",
  IL: "972",
  MY: "60",
  PH: "63",
  TH: "66",
  VN: "84",
  ID: "62",
  SN: "221",
  GM: "220",
  KW: "965",
  QA: "974",
  BH: "973",
  OM: "968",
  JO: "962",
  AE: "971",
  SA: "966"
};

const countryCallingCodesByName = {
  "united states": "1",
  canada: "1",
  "united kingdom": "44",
  ireland: "353",
  germany: "49",
  france: "33",
  spain: "34",
  italy: "39",
  portugal: "351",
  netherlands: "31",
  belgium: "32",
  switzerland: "41",
  austria: "43",
  poland: "48",
  "czech republic": "420",
  finland: "358",
  sweden: "46",
  norway: "47",
  denmark: "45",
  australia: "61",
  "new zealand": "64",
  singapore: "65",
  "hong kong": "852",
  taiwan: "886",
  japan: "81",
  "south korea": "82",
  india: "91",
  mexico: "52",
  brazil: "55",
  argentina: "54",
  chile: "56",
  colombia: "57",
  peru: "51",
  panama: "507",
  "costa rica": "506",
  "south africa": "27",
  nigeria: "234",
  ghana: "233",
  kenya: "254",
  egypt: "20",
  morocco: "212",
  turkey: "90",
  israel: "972",
  malaysia: "60",
  philippines: "63",
  thailand: "66",
  vietnam: "84",
  indonesia: "62",
  senegal: "221",
  "the gambia": "220",
  gambia: "220",
  kuwait: "965",
  qatar: "974",
  bahrain: "973",
  oman: "968",
  jordan: "962",
  "united arab emirates": "971",
  "saudi arabia": "966"
};

let activeLeadReport = null;
let currentLeadResults = [];
const localSavedLeadsKey = "mat_local_saved_leads_v1";
const defaultCountries = ["Germany"];
const defaultBusinessTypes = ["restaurants", "hotels", "boutiques", "car_dealers"];
const defaultMapLinks = [
  "https://www.google.com/maps/@13.4053888,-16.6887424,11z?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
  "https://www.google.com/maps/@13.4053888,-16.6887424,11z?entry=ttu",
  "https://www.google.com/maps/place/Germany/@51.0635856,5.1719926,6z/data=!3m1!4b1!4m6!3m5!1s0x479a721ec2b1be6b:0x75e85d6b8e91e55b!8m2!3d51.165691!4d10.451526!16zL20vMDM0NWg?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function displayValue(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value ?? "";
}

function socialLinksFromLead(lead = {}) {
  return {
    ...(lead.details?.social || {}),
    ...(lead.details?.publicWebsiteProfile?.socialLinks || {}),
    ...(lead.audit?.publicProfile?.socialLinks || {})
  };
}

function firstSocialUrl(lead = {}) {
  return safeExternalUrl(lead.social) || safeExternalUrl(Object.values(socialLinksFromLead(lead))[0]);
}

function normalizedName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isWhatsappUrl(value) {
  const url = safeExternalUrl(value);
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "wa.me" || host === "whatsapp.com" || host.endsWith(".whatsapp.com");
  } catch {
    return false;
  }
}

function countryCallingCodeForLead(lead = {}) {
  const iso = String(lead.countryCode || lead.details?.location?.countryCode || "").toUpperCase();
  if (countryCallingCodesByIso[iso]) return countryCallingCodesByIso[iso];
  const countryNames = [
    lead.country,
    lead.countryName,
    lead.details?.location?.country,
    lead.details?.location?.countryName
  ].map(normalizedName);
  return countryNames.map((name) => countryCallingCodesByName[name]).find(Boolean) || "";
}

function firstPhoneFromLead(lead = {}) {
  return [
    lead.details?.contact?.mobile,
    lead.details?.contact?.phone,
    lead.phone,
    lead.details?.publicWebsiteProfile?.phones?.[0],
    lead.audit?.publicProfile?.phones?.[0]
  ].find(Boolean) || "";
}

function normalizePhoneForWhatsapp(phone, lead = {}) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  const firstNumber = raw.split(/[\/|;]/)[0].replace(/\s*(?:ext\.?|extension|x)\s*\d+$/i, "").trim();
  let digits = firstNumber.replace(/\D/g, "");
  if (!digits) return "";

  if (firstNumber.startsWith("+")) {
    // Already includes an international prefix.
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else {
    const callingCode = countryCallingCodeForLead(lead);
    if (!callingCode) return "";
    const nationalNumber = digits.replace(/^0+/, "");
    digits = digits.startsWith(callingCode) && digits.length > callingCode.length + 5
      ? digits
      : `${callingCode}${nationalNumber}`;
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

function whatsappLinkFromPhone(phone, lead = {}) {
  const normalized = normalizePhoneForWhatsapp(phone, lead);
  return normalized ? `https://wa.me/${normalized}` : "";
}

function whatsappActionFromLead(lead = {}) {
  const socialLinks = socialLinksFromLead(lead);
  const explicitWhatsapp = safeExternalUrl(socialLinks.whatsapp || lead.details?.contact?.whatsappLink || "");
  if (explicitWhatsapp && isWhatsappUrl(explicitWhatsapp)) {
    return {
      url: explicitWhatsapp,
      label: "WhatsApp",
      status: "WhatsApp link",
      note: "Public WhatsApp link found"
    };
  }

  const leadSocial = safeExternalUrl(lead.social || "");
  if (leadSocial && isWhatsappUrl(leadSocial)) {
    return {
      url: leadSocial,
      label: "WhatsApp",
      status: "WhatsApp link",
      note: "Public WhatsApp link found"
    };
  }

  const phone = firstPhoneFromLead(lead);
  const phoneLink = whatsappLinkFromPhone(phone, lead);
  if (!phoneLink) return null;

  return {
    url: phoneLink,
    label: "Check WhatsApp",
    status: "WhatsApp check",
    note: "Uses real business phone number"
  };
}

function renderWhatsappButton(lead = {}, className = "btn btn-secondary") {
  const action = whatsappActionFromLead(lead);
  if (!action) return "";
  return `<a class="${escapeHtml(className)}" href="${escapeHtml(action.url)}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>`;
}

function renderWhatsappContact(lead = {}) {
  const action = whatsappActionFromLead(lead);
  const note = action
    ? `${action.note}. WhatsApp will confirm if the number is registered.`
    : "No valid WhatsApp-ready phone or public WhatsApp link found.";
  return `
    <div class="audit-item">
      <span>WhatsApp</span>
      <strong>${action ? `<a href="${escapeHtml(action.url)}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>` : `<span class="muted-value">${escapeHtml(note)}</span>`}</strong>
    </div>
    ${action ? `<div class="audit-item"><span>WhatsApp note</span><strong>${escapeHtml(note)}</strong></div>` : ""}
  `;
}

function localLeadId(lead = {}) {
  return String(lead.id || `${lead.name || "lead"}-${lead.address || ""}-${lead.googleMapsLink || ""}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180) || `lead-${Date.now()}`;
}

function readLocalSavedLeads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(localSavedLeadsKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((lead) => lead?.id || lead?.name) : [];
  } catch {
    return [];
  }
}

function writeLocalSavedLeads(leads = []) {
  let items = leads.slice(0, 500);
  while (items.length >= 0) {
    try {
      localStorage.setItem(localSavedLeadsKey, JSON.stringify(items));
      return items;
    } catch {
      if (items.length <= 50) throw new Error("Browser local storage is full. Export saved leads, delete old leads, then try again.");
      items = items.slice(0, Math.ceil(items.length * 0.75));
    }
  }
  return [];
}

function compactLeadForLocalStorage(lead = {}) {
  const copy = JSON.parse(JSON.stringify(lead || {}));
  const id = localLeadId(copy);
  delete copy.raw;
  if (copy.details?.source) {
    delete copy.details.source.rawTags;
    delete copy.details.source.rawPlace;
    delete copy.details.source.raw;
  }
  return {
    ...copy,
    id,
    localSavedAt: new Date().toISOString()
  };
}

function saveLeadsToLocalStorage(leads = []) {
  const existing = readLocalSavedLeads();
  const byId = new Map(existing.map((lead) => [localLeadId(lead), lead]));
  for (const lead of leads) {
    if (!lead) continue;
    const compact = compactLeadForLocalStorage(lead);
    byId.set(compact.id, {
      ...(byId.get(compact.id) || {}),
      ...compact
    });
  }
  const saved = [...byId.values()].sort((left, right) => String(right.localSavedAt || "").localeCompare(String(left.localSavedAt || "")));
  return writeLocalSavedLeads(saved);
}

function deleteLocalSavedLead(id) {
  const remaining = readLocalSavedLeads().filter((lead) => localLeadId(lead) !== id);
  return writeLocalSavedLeads(remaining);
}

function findLocalSavedLead(id) {
  const requested = String(id || "");
  const requestedNormalized = localLeadId({ id: requested });
  return readLocalSavedLeads().find((lead) => (
    String(lead.id || "") === requested ||
    localLeadId(lead) === requested ||
    localLeadId(lead) === requestedNormalized
  )) || null;
}

function localWebsiteBrief(lead) {
  const whatsapp = whatsappActionFromLead(lead);
  return [
    "LOCAL SAVED LEAD BRIEF",
    "",
    `Business name: ${displayValue(lead.name)}`,
    `Business type: ${displayValue(lead.businessType || lead.category)}`,
    `Phone: ${displayValue(lead.phone)}`,
    `WhatsApp contact: ${displayValue(whatsapp?.url)}`,
    `WhatsApp note: ${whatsapp ? `${whatsapp.note}. WhatsApp confirms if the number is registered.` : "Not found in public data"}`,
    `Email: ${displayValue(lead.email)}`,
    `Website: ${displayValue(lead.websiteUrl)}`,
    `Google Maps: ${displayValue(lead.googleMapsLink)}`,
    `Social links: ${displayValue(lead.details?.social || lead.social)}`,
    `Address: ${displayValue(lead.address)}`,
    `Market: ${displayValue(lead.marketName || lead.countryName)}`,
    `Opportunity score: ${displayValue(lead.opportunityScore ?? lead.audit?.score)}`,
    "",
    "NOTE",
    "This lead is saved in browser local storage and remains after logout until deleted."
  ].join("\n");
}

function searchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function localVerificationLinks(lead = {}) {
  const baseQuery = [lead.name, lead.address].filter(Boolean).join(" ") || "business";
  const whatsapp = whatsappActionFromLead(lead);
  return {
    facebookSearch: searchUrl(`${baseQuery} Facebook`),
    instagramSearch: searchUrl(`${baseQuery} Instagram`),
    linkedinSearch: searchUrl(`${baseQuery} LinkedIn owner manager`),
    tiktokSearch: searchUrl(`${baseQuery} TikTok`),
    youtubeSearch: searchUrl(`${baseQuery} YouTube`),
    xSearch: searchUrl(`${baseQuery} X Twitter`),
    whatsappContact: whatsapp?.url || ""
  };
}

function localReportFromLead(lead) {
  const details = lead.details || {};
  const whatsapp = whatsappActionFromLead(lead);
  const contact = {
    phone: lead.phone,
    email: lead.email,
    website: lead.websiteUrl,
    social: lead.social,
    ...(details.contact || {}),
    whatsappLink: whatsapp?.url,
    whatsappSource: whatsapp?.status,
    whatsappVerificationNote: whatsapp ? `${whatsapp.note}. WhatsApp confirms if the number is registered.` : ""
  };
  const location = {
    address: lead.address,
    latitude: lead.latitude,
    longitude: lead.longitude,
    googleMapsLink: lead.googleMapsLink,
    marketName: lead.marketName,
    countryName: lead.countryName,
    ...(details.location || {})
  };
  const business = {
    name: lead.name,
    category: lead.category,
    businessType: lead.businessType,
    opportunityScore: lead.opportunityScore,
    ...(details.business || {})
  };
  const dossier = {
    summary: {
      name: lead.name,
      businessType: lead.businessType || lead.category,
      source: lead.source,
      score: lead.opportunityScore ?? lead.audit?.score
    },
    ownerContact: details.ownerContact || {},
    contact,
    social: details.social || {},
    location,
    business,
    operations: details.operations || {},
    websiteDiscovery: details.publicWebsiteProfile || {},
    verificationLinks: localVerificationLinks(lead),
    audit: lead.audit || {},
    source: details.source || { provider: lead.source || "local_storage" },
    copyReady: {
      websiteBuildBrief: localWebsiteBrief(lead)
    }
  };
  return { lead, dossier, aiSummary: "This lead was loaded from local browser storage." };
}

function renderExternalLink(value) {
  const url = safeExternalUrl(value);
  if (!url) return escapeHtml(displayValue(value));
  return `<a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`;
}

function renderCellValue(key, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const rows = Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "");
    if (!rows.length) return "";
    return rows.map(([nestedKey, nestedValue]) => {
      const label = nestedKey.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
      const rendered = safeExternalUrl(nestedValue)
        ? renderExternalLink(nestedValue)
        : escapeHtml(displayValue(nestedValue));
      return `<span class="inline-link-row"><em>${escapeHtml(label)}:</em> ${rendered}</span>`;
    }).join("");
  }
  const shouldLink = /url|website|link|maps|osm|facebook|instagram|linkedin|twitter|youtube|tiktok|pinterest|threads|snapchat|whatsapp|social/i.test(key)
    || Boolean(safeExternalUrl(value));
  return shouldLink ? renderExternalLink(value) : escapeHtml(displayValue(value));
}

function renderSocialLinks(social = {}, empty = "No social links found yet.") {
  const entries = Object.entries(social || {}).filter(([, value]) => safeExternalUrl(value));
  if (!entries.length) return `<div class="empty-state">${escapeHtml(empty)}</div>`;
  return entries.map(([platform, url]) => `
    <div class="audit-item">
      <span>${escapeHtml(platform.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim())}</span>
      <strong>${renderExternalLink(url)}</strong>
    </div>
  `).join("");
}

function renderRows(data = {}, options = {}) {
  const entries = Object.entries(data).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  });
  if (!entries.length) return `<div class="empty-state">${escapeHtml(options.empty || "No details available yet.")}</div>`;

  return entries.map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
    return `
      <div class="audit-item">
        <span>${escapeHtml(label)}</span>
        <strong>${renderCellValue(key, value)}</strong>
      </div>
    `;
  }).join("");
}

function renderExpectedRows(data = {}, fields = []) {
  return fields.map(([key, label, type]) => {
    const value = data?.[key];
    const found = !(value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length));
    const rendered = found
      ? (/url|website|link|maps|osm/i.test(type || key) ? renderExternalLink(value) : escapeHtml(displayValue(value)))
      : `<span class="muted-value">Not found in public data</span>`;
    return `
      <div class="audit-item">
        <span>${escapeHtml(label)}</span>
        <strong>${rendered}</strong>
      </div>
    `;
  }).join("");
}

function flattenObject(value, prefix = "", output = {}) {
  if (!value || typeof value !== "object") return output;
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item)) {
      flattenObject(item, path, output);
    } else {
      output[path] = displayValue(item);
    }
  }
  return output;
}

function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dossierCsv(report) {
  const flat = flattenObject(report?.dossier || {});
  const rows = [["Field", "Value"], ...Object.entries(flat)];
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, "\"\"")}"`).join(",")).join("\n");
}

function leadsCsv(leads = []) {
  const rows = [
    ["Name", "Business Type", "Address", "Phone", "WhatsApp", "Email", "Website", "Maps", "Score", "Market", "Source", "Social Links"],
    ...leads.map((lead) => {
      const whatsapp = whatsappActionFromLead(lead);
      return [
        lead.name,
        lead.businessType || lead.category,
        lead.address,
        lead.phone,
        whatsapp?.url || "",
        lead.email,
        lead.websiteUrl,
        lead.googleMapsLink,
        lead.opportunityScore ?? lead.audit?.score ?? "",
        lead.marketName || lead.countryName || lead.country,
        lead.source,
        displayValue(lead.details?.social || lead.social || "")
      ];
    })
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, "\"\"")}"`).join(",")).join("\n");
}

function websiteBrief(report) {
  return report?.dossier?.copyReady?.websiteBuildBrief || JSON.stringify(report?.dossier || report?.lead || {}, null, 2);
}

function populateCountries() {
  const select = byId("country");
  if (!select) return;
  select.innerHTML = countries.map((country) => (
    `<option value="${escapeHtml(country)}"${defaultCountries.includes(country) ? " selected" : ""}>${escapeHtml(country)}</option>`
  )).join("");
}

function populateBusinessTypes() {
  const select = byId("businessTypes");
  if (!select) return;
  const selectedDefaults = new Set(defaultBusinessTypes);
  select.innerHTML = businessTypes.map(([value, label]) => (
    `<option value="${escapeHtml(value)}"${selectedDefaults.has(value) ? " selected" : ""}>${escapeHtml(label)}</option>`
  )).join("");
}

function selectedValues(select, fallback = []) {
  if (!select) return [...fallback];
  const values = Array.from(select.selectedOptions || []).map((option) => option.value).filter(Boolean);
  if (values.length) return values;
  if (select.value) return [select.value];
  return [...fallback];
}

function normalizedMapLink(value) {
  return decodeURIComponent(String(value || "").trim()).replace(/&amp;/g, "&");
}

function isDefaultMapLink(value) {
  const normalized = normalizedMapLink(value);
  return defaultMapLinks.some((link) => normalized === normalizedMapLink(link));
}

function normalizedInteger(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function getSearchPayload(form) {
  const params = new URLSearchParams(window.location.search);
  const payload = Object.fromEntries(new FormData(form).entries());
  for (const [key, value] of params.entries()) {
    if (!payload[key] && value) payload[key] = value;
  }
  const countrySelect = byId("country");
  const selectedCountries = selectedValues(countrySelect, defaultCountries);
  payload.countries = selectedCountries;
  payload.country = selectedCountries[0] || payload.country || "";

  const businessTypeSelect = byId("businessTypes");
  const selectedBusinessTypes = selectedValues(businessTypeSelect, defaultBusinessTypes);
  payload.businessTypes = selectedBusinessTypes;
  if (!payload.industry && selectedBusinessTypes.length) {
    payload.industry = selectedBusinessTypes.join(", ");
  }
  payload.mapLink = String(payload.mapLink || "").trim();
  payload.radiusMeters = normalizedInteger(payload.radiusMeters, 15000, 500, 50000);
  payload.limit = normalizedInteger(payload.limit, 20, 1, 200);
  payload.minOpportunityScore = normalizedInteger(payload.minOpportunityScore, 0, 0, 100);
  payload.searchDepth = payload.searchDepth || "deep";
  payload.leadQuality = payload.leadQuality || "all";
  payload.sortBy = payload.sortBy || "opportunity";
  payload.requireContact = Boolean(byId("requireContact")?.checked);
  payload.missingWebsiteOnly = Boolean(byId("missingWebsiteOnly")?.checked);
  return payload;
}

function parseMapLink(mapLink) {
  if (!mapLink) return null;
  const decoded = decodeURIComponent(mapLink);
  const atMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/i.exec(decoded);
  if (atMatch) {
    return {
      latitude: Number(atMatch[1]),
      longitude: Number(atMatch[2]),
      zoom: atMatch[3] ? Number(atMatch[3]) : 11
    };
  }
  const queryMatch = /[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i.exec(decoded);
  if (queryMatch) {
    return {
      latitude: Number(queryMatch[1]),
      longitude: Number(queryMatch[2]),
      zoom: 11
    };
  }
  return null;
}

function updateMapPreview() {
  const field = byId("mapLink");
  const preview = byId("mapPreview");
  const meta = byId("mapMeta");
  const radius = byId("radiusMeters");
  if (!field || !preview || !meta) return;

  const parsed = parseMapLink(field.value);
  if (!parsed) {
    preview.innerHTML = `<iframe title="Germany default map preview" src="https://www.google.com/maps?q=52.52,13.405&z=6&output=embed" loading="lazy"></iframe>`;
    meta.textContent = "Default country scan: Germany. Paste a Google Maps link only for an exact area.";
    return;
  }

  const zoom = Math.max(3, Math.min(18, Math.round(parsed.zoom || 11)));
  preview.innerHTML = `<iframe title="Google Maps location preview" src="https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}&z=${zoom}&output=embed" loading="lazy"></iframe>`;
  meta.textContent = `Centered at ${parsed.latitude}, ${parsed.longitude}. Radius: ${Number(radius?.value || 15000).toLocaleString()} meters.`;
}

function renderLead(lead) {
  const score = lead.opportunityScore ?? lead.audit?.score ?? 0;
  const websiteUrl = safeExternalUrl(lead.websiteUrl);
  const mapsUrl = safeExternalUrl(lead.googleMapsLink);
  const website = websiteUrl ? `<a href="${websiteUrl}" target="_blank" rel="noreferrer">${escapeHtml(websiteUrl)}</a>` : "Website missing";
  const market = lead.marketName ? `<span class="tag">${escapeHtml(lead.marketName)}</span>` : "";
  const email = lead.email ? `<span class="tag">${escapeHtml(lead.email)}</span>` : "";
  const hours = lead.openingHours ? `<span class="tag">Hours found</span>` : "";
  const source = lead.source ? `<span class="tag">${escapeHtml(lead.source.replaceAll("_", " "))}</span>` : "";
  const socialLinks = socialLinksFromLead(lead);
  const socialUrl = firstSocialUrl(lead);
  const whatsapp = whatsappActionFromLead(lead);
  const socialFound = socialUrl || Object.keys(socialLinks).length
    ? `<span class="tag success">Social found</span>`
    : "";
  const whatsappFound = whatsapp ? `<span class="tag success">${escapeHtml(whatsapp.status)}</span>` : "";
  const contactReady = (lead.phone || lead.email || lead.social || Object.keys(socialLinks).length) ? `<span class="tag success">Contact ready</span>` : "";
  const websiteGap = !lead.websiteUrl ? `<span class="tag warning">Needs website</span>` : "";
  return `
    <article class="lead-card">
      <div class="lead-card__top">
        <div>
          <h3>${escapeHtml(lead.name)}</h3>
          <p>${escapeHtml(lead.businessType || lead.category || "Local business")} - ${escapeHtml(lead.address || "Address unavailable")}</p>
        </div>
        <span class="score-pill ${scoreClass(score)}">${score}/100</span>
      </div>
      <div class="lead-meta">
        <span class="tag">${escapeHtml(lead.rating || "No")} rating</span>
        <span class="tag">${escapeHtml(lead.reviewsCount || 0)} reviews</span>
        <span class="tag">${escapeHtml(lead.phone || "No phone")}</span>
        ${market}
        ${email}
        ${hours}
        ${socialFound}
        ${whatsappFound}
        ${contactReady}
        ${websiteGap}
        ${source}
      </div>
      <p>${website}</p>
      <div class="lead-actions">
        <a class="btn btn-secondary" href="/lead-details.html?id=${encodeURIComponent(lead.id)}">View</a>
        <button class="btn btn-primary" type="button" data-save-lead="${lead.id}">Save Lead</button>
        ${renderWhatsappButton(lead, "btn btn-secondary")}
        ${socialUrl ? `<a class="btn btn-ghost" href="${socialUrl}" target="_blank" rel="noreferrer">Social</a>` : ""}
        ${mapsUrl ? `<a class="btn btn-ghost" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>` : ""}
      </div>
    </article>
  `;
}

function renderLocalSavedLead(lead) {
  const score = lead.opportunityScore ?? lead.audit?.score ?? 0;
  const mapsUrl = safeExternalUrl(lead.googleMapsLink);
  const websiteUrl = safeExternalUrl(lead.websiteUrl);
  const socialUrl = firstSocialUrl(lead);
  const whatsapp = whatsappActionFromLead(lead);
  const savedAt = lead.localSavedAt ? new Date(lead.localSavedAt).toLocaleString() : "Saved locally";
  return `
    <article class="lead-card local-lead-card">
      <div class="lead-card__top">
        <div>
          <h3>${escapeHtml(lead.name || "Saved lead")}</h3>
          <p>${escapeHtml(lead.businessType || lead.category || "Local business")} - ${escapeHtml(lead.address || "Address unavailable")}</p>
        </div>
        <span class="score-pill ${scoreClass(score)}">${score}/100</span>
      </div>
      <div class="lead-meta">
        <span class="tag success">Local saved</span>
        ${socialUrl ? `<span class="tag success">Social found</span>` : ""}
        ${whatsapp ? `<span class="tag success">${escapeHtml(whatsapp.status)}</span>` : ""}
        <span class="tag">${escapeHtml(lead.phone || "No phone")}</span>
        ${lead.email ? `<span class="tag">${escapeHtml(lead.email)}</span>` : ""}
        ${lead.marketName ? `<span class="tag">${escapeHtml(lead.marketName)}</span>` : ""}
      </div>
      <p>${websiteUrl ? `<a href="${websiteUrl}" target="_blank" rel="noreferrer">${escapeHtml(websiteUrl)}</a>` : "Website missing"}</p>
      <p class="muted-value">${escapeHtml(savedAt)}</p>
      <div class="lead-actions">
        <a class="btn btn-secondary" href="/lead-details.html?id=${encodeURIComponent(localLeadId(lead))}">View</a>
        ${renderWhatsappButton(lead, "btn btn-secondary")}
        ${socialUrl ? `<a class="btn btn-ghost" href="${socialUrl}" target="_blank" rel="noreferrer">Social</a>` : ""}
        ${mapsUrl ? `<a class="btn btn-ghost" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>` : ""}
        <button class="btn btn-ghost" type="button" data-delete-local-lead="${escapeHtml(localLeadId(lead))}">Delete</button>
      </div>
    </article>
  `;
}

function renderLocalSavedLeads() {
  const target = byId("localSavedLeads");
  const summary = byId("localSavedLeadSummary");
  if (!target) return;

  const leads = readLocalSavedLeads();
  if (summary) {
    summary.textContent = leads.length
      ? `${leads.length} leads saved in this browser. They stay after logout until you delete them.`
      : "No local saved leads yet.";
  }
  target.innerHTML = leads.length
    ? leads.map(renderLocalSavedLead).join("")
    : `<div class="empty-state">Saved leads will appear here after you press Save Lead or Save All.</div>`;
}

function renderLocalLeadDetail(target, lead) {
  const report = localReportFromLead(lead);
  activeLeadReport = report;
  const dossier = report.dossier;
  const score = lead.opportunityScore ?? lead.audit?.score ?? 0;
  const websiteUrl = safeExternalUrl(lead.websiteUrl);
  const mapsUrl = safeExternalUrl(lead.googleMapsLink);
  const socialLinks = socialLinksFromLead(lead);
  const socialUrl = firstSocialUrl(lead);
  const whatsapp = whatsappActionFromLead(lead);
  target.innerHTML = `
    <section class="panel">
      <div class="lead-card__top">
        <div>
          <h2>${escapeHtml(lead.name || "Saved lead")}</h2>
          <p>${escapeHtml(lead.businessType || lead.category || "Local business")} - ${escapeHtml(lead.address || "Address unavailable")}</p>
        </div>
        <span class="score-pill ${scoreClass(score)}">${score}/100</span>
      </div>
      <div class="lead-meta" style="margin-top:14px;">
        <span class="tag success">Loaded from local storage</span>
        <span class="tag">${lead.phone ? "Phone found" : "Phone missing"}</span>
        <span class="tag">${lead.email ? "Email found" : "Email missing"}</span>
        <span class="tag">${lead.websiteUrl ? "Website found" : "Website missing"}</span>
        ${socialUrl ? `<span class="tag success">Social found</span>` : ""}
        ${whatsapp ? `<span class="tag success">${escapeHtml(whatsapp.status)}</span>` : ""}
      </div>
      <div class="lead-actions" style="margin-top:16px;">
        ${websiteUrl ? `<a class="btn btn-secondary" href="${websiteUrl}" target="_blank" rel="noreferrer">Website</a>` : ""}
        ${mapsUrl ? `<a class="btn btn-secondary" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>` : ""}
        ${renderWhatsappButton(lead, "btn btn-secondary")}
        ${socialUrl ? `<a class="btn btn-secondary" href="${socialUrl}" target="_blank" rel="noreferrer">Social</a>` : ""}
        <button class="btn btn-secondary" type="button" data-copy-dossier>Copy All Data</button>
        <button class="btn btn-primary" type="button" data-copy-brief>Copy Website Brief</button>
        <button class="btn btn-secondary" type="button" data-download-json>JSON</button>
        <button class="btn btn-secondary" type="button" data-download-csv>CSV</button>
        <button class="btn btn-ghost" type="button" data-delete-local-lead="${escapeHtml(localLeadId(lead))}">Delete Local</button>
      </div>
    </section>

    <section class="panel" style="grid-column:1 / -1;">
      <h2>Copy-Ready Website Build Brief</h2>
      <pre class="copy-brief">${escapeHtml(localWebsiteBrief(lead))}</pre>
    </section>

    <section class="panel">
      <h2>Contact Details</h2>
      <div class="audit-list">
        ${renderExpectedRows(dossier.contact, [
          ["phone", "Phone"],
          ["mobile", "Mobile"],
          ["email", "Email"],
          ["website", "Website", "website"]
        ])}
        ${renderWhatsappContact(lead)}
      </div>
    </section>

    <section class="panel">
      <h2>Social Links</h2>
      <div class="audit-list">${renderSocialLinks({ ...dossier.social, ...socialLinks }, "No social links saved locally.")}</div>
      <h2 style="margin-top:20px;">Website Discovery</h2>
      <div class="audit-list">${renderRows(dossier.websiteDiscovery, { empty: "No website discovery data saved locally." })}</div>
      <h2 style="margin-top:20px;">Social Finder Links</h2>
      <div class="audit-list">${renderRows({
        facebookSearch: dossier.verificationLinks?.facebookSearch,
        instagramSearch: dossier.verificationLinks?.instagramSearch,
        linkedinSearch: dossier.verificationLinks?.linkedinSearch,
        tiktokSearch: dossier.verificationLinks?.tiktokSearch,
        youtubeSearch: dossier.verificationLinks?.youtubeSearch,
        xSearch: dossier.verificationLinks?.xSearch,
        whatsappContact: dossier.verificationLinks?.whatsappContact
      }, { empty: "No social finder links saved locally." })}</div>
    </section>

    <section class="panel">
      <h2>Business Details</h2>
      <div class="audit-list">${renderRows(dossier.business, { empty: "No business details saved locally." })}</div>
    </section>

    <section class="panel">
      <h2>Location</h2>
      <div class="audit-list">${renderRows(dossier.location, { empty: "No location details saved locally." })}</div>
    </section>

    <section class="panel">
      <h2>Local Storage Data</h2>
      <p>This data is stored in this browser and remains after logout until deleted.</p>
      <pre class="code-block">${escapeHtml(JSON.stringify(lead, null, 2))}</pre>
    </section>
  `;
}

function renderResults(leads) {
  const target = byId("leadResults");
  if (!target) return;
  currentLeadResults = Array.isArray(leads) ? leads : [];

  if (!currentLeadResults.length) {
    target.innerHTML = `<div class="empty-state">No leads found for this search.</div>`;
    return;
  }

  target.innerHTML = currentLeadResults.map(renderLead).join("");
}

function initLeadSearch() {
  const form = byId("leadSearchForm");
  const target = byId("leadResults");
  if (!form || !target) return;
  if (!requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params.entries()) {
    const field = form.elements.namedItem(key);
    if (field?.multiple) {
      const values = new Set(params.getAll(key).flatMap((item) => item.split(",")));
      Array.from(field.options).forEach((option) => {
        option.selected = values.has(option.value);
      });
    } else if (field) {
      field.value = value;
    } else if (key === "country" || key === "countries") {
      const countrySelect = byId("country");
      const values = new Set(params.getAll(key).flatMap((item) => item.split(",")));
      Array.from(countrySelect?.options || []).forEach((option) => {
        option.selected = values.has(option.value);
      });
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireAuth()) return;
    target.innerHTML = `<div class="skeleton">Searching real business map data...</div>`;

    try {
      const result = await apiFetch("/api/leads/search", {
        method: "POST",
        body: JSON.stringify(getSearchPayload(form))
      });
      renderResults(result.leads || []);
      const note = byId("searchNote");
      if (note) {
        const locationText = result.location
          ? ` around ${result.location.latitude}, ${result.location.longitude}`
          : "";
        const provider = result.providerLabel || (result.source === "openstreetmap_overpass" ? "OpenStreetMap Overpass" : "Google Places");
        const countryText = result.selectedCountries?.length ? ` Countries: ${result.selectedCountries.join(", ")}.` : "";
        const stats = result.searchStats
          ? ` Scanned ${result.searchStats.rawCount} raw, qualified ${result.searchStats.qualifiedCount}, depth ${result.searchStats.searchDepth}.`
          : "";
        const cacheText = result.cached ? " Cached repeat search." : "";
        note.textContent = `Real ${provider} results loaded${locationText}.${countryText}${stats}${cacheText} Query: ${result.query || "businesses"}.`;
      }
    } catch (error) {
      target.innerHTML = `<div class="error-state">${error.message}</div>`;
      const note = byId("searchNote");
      if (note) note.textContent = "Real map-link search needs valid coordinates and an available map data provider.";
    }
  });

  if (params.size > 0) form.requestSubmit();
}

function initMapLinkPreview() {
  const field = byId("mapLink");
  const radius = byId("radiusMeters");
  const country = byId("country");
  if (!field) return;
  field.addEventListener("input", updateMapPreview);
  radius?.addEventListener("change", updateMapPreview);
  country?.addEventListener("change", () => {
    if (isDefaultMapLink(field.value)) {
      field.value = "";
    }
    updateMapPreview();
  });
  updateMapPreview();
}

function initLeadActions() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-save-lead]");
    if (!button) return;
    if (!requireAuth()) return;

    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const lead = currentLeadResults.find((item) => item.id === button.dataset.saveLead);
      if (lead) {
        saveLeadsToLocalStorage([lead]);
        renderLocalSavedLeads();
      }
      await apiFetch(`/api/leads/${encodeURIComponent(button.dataset.saveLead)}/save`, {
        method: "POST",
        body: JSON.stringify({})
      });
      button.textContent = "Saved";
    } catch (error) {
      button.textContent = error.message;
      button.disabled = false;
    }
  });
}

function initBulkLeadActions() {
  document.addEventListener("click", async (event) => {
    const exportButton = event.target.closest("[data-export-visible-leads]");
    const saveButton = event.target.closest("[data-save-visible-leads]");
    if (!exportButton && !saveButton) return;
    if (!requireAuth()) return;

    const note = byId("searchNote");
    if (!currentLeadResults.length) {
      if (note) note.textContent = "Run a search first, then save or export the visible leads.";
      return;
    }

    if (exportButton) {
      downloadFile(`mat-leads-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv", leadsCsv(currentLeadResults));
      if (note) note.textContent = `Exported ${currentLeadResults.length} visible leads to CSV.`;
      return;
    }

    const original = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    try {
      saveLeadsToLocalStorage(currentLeadResults);
      renderLocalSavedLeads();
      for (let index = 0; index < currentLeadResults.length; index += 10) {
        const batch = currentLeadResults.slice(index, index + 10);
        await Promise.all(batch.map((lead) => (
          apiFetch(`/api/leads/${encodeURIComponent(lead.id)}/save`, {
            method: "POST",
            body: JSON.stringify({})
          })
        )));
      }
      if (note) note.textContent = `Saved ${currentLeadResults.length} visible leads to CRM.`;
    } catch (error) {
      if (note) note.textContent = error.message;
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = original;
    }
  });
}

function initLocalSavedLeadActions() {
  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-local-lead]");
    const exportButton = event.target.closest("[data-export-local-leads]");
    const clearButton = event.target.closest("[data-clear-local-leads]");
    if (!deleteButton && !exportButton && !clearButton) return;

    const note = byId("localSavedLeadSummary");
    const leads = readLocalSavedLeads();

    if (exportButton) {
      if (!leads.length) {
        if (note) note.textContent = "No local saved leads to export.";
        return;
      }
      downloadFile(`mat-local-saved-leads-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv", leadsCsv(leads));
      if (note) note.textContent = `Exported ${leads.length} local saved leads.`;
      return;
    }

    if (clearButton) {
      if (!leads.length) return;
      const confirmed = window.confirm("Delete all local saved leads from this browser?");
      if (!confirmed) return;
      writeLocalSavedLeads([]);
      renderLocalSavedLeads();
      return;
    }

    if (deleteButton) {
      deleteLocalSavedLead(deleteButton.dataset.deleteLocalLead);
      renderLocalSavedLeads();
      if (document.body.dataset.page === "lead-details") {
        const detail = byId("leadDetail");
        if (detail) detail.innerHTML = `<div class="empty-state">Local saved lead deleted from this browser.</div>`;
      }
    }
  });
}

function initLeadDetails() {
  const target = byId("leadDetail");
  if (!target) return;
  if (!requireAuth()) return;
  const leadId = new URLSearchParams(window.location.search).get("id");

  if (!leadId) {
    target.innerHTML = `<div class="empty-state">Open a real lead from the dashboard search results to view website audit and AI analysis.</div>`;
    return;
  }

  target.innerHTML = `<div class="skeleton">Loading lead intelligence...</div>`;

  apiFetch(`/api/leads/${encodeURIComponent(leadId)}/report`)
    .then((result) => {
      activeLeadReport = result;
      const lead = result.lead;
      const dossier = result.dossier || {};
      const audit = lead.audit || {};
      const checks = audit.checks || {};
      const score = audit.score || lead.opportunityScore || 0;
      const websiteUrl = safeExternalUrl(lead.websiteUrl);
      const mapsUrl = safeExternalUrl(lead.googleMapsLink);
      const socialLinks = socialLinksFromLead(lead);
      const socialUrl = firstSocialUrl(lead);
      const whatsapp = whatsappActionFromLead(lead);
      const rawSnapshot = dossier.source?.rawTags || lead.raw || {};
      const brief = websiteBrief(result);
      target.innerHTML = `
        <section class="panel">
          <div class="lead-card__top">
            <div>
              <h2>${escapeHtml(lead.name)}</h2>
              <p>${escapeHtml(lead.businessType || lead.category || "Local business")} - ${escapeHtml(lead.address || "Address unavailable")}</p>
            </div>
            <span class="score-pill ${scoreClass(score)}">${score}/100</span>
          </div>
          <div class="lead-meta" style="margin-top:14px;">
            <span class="tag">${escapeHtml(lead.source || "map data")}</span>
            <span class="tag">${lead.websiteUrl ? "Website found" : "Website missing"}</span>
            <span class="tag">${lead.phone ? "Phone found" : "Phone missing"}</span>
            <span class="tag">${lead.email ? "Email found" : "Email missing"}</span>
            ${socialUrl ? `<span class="tag success">Social found</span>` : ""}
            ${whatsapp ? `<span class="tag success">${escapeHtml(whatsapp.status)}</span>` : ""}
          </div>
          <div class="lead-actions" style="margin-top:16px;">
            ${websiteUrl ? `<a class="btn btn-secondary" href="${websiteUrl}" target="_blank" rel="noreferrer">Website</a>` : ""}
            ${mapsUrl ? `<a class="btn btn-secondary" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>` : ""}
            ${renderWhatsappButton(lead, "btn btn-secondary")}
            ${socialUrl ? `<a class="btn btn-secondary" href="${socialUrl}" target="_blank" rel="noreferrer">Social</a>` : ""}
            <button class="btn btn-secondary" type="button" data-copy-dossier>Copy All Data</button>
            <button class="btn btn-primary" type="button" data-copy-brief>Copy Website Brief</button>
            <button class="btn btn-secondary" type="button" data-download-json>JSON</button>
            <button class="btn btn-secondary" type="button" data-download-csv>CSV</button>
          </div>
        </section>

        <section class="panel" style="grid-column:1 / -1;">
          <h2>Copy-Ready Website Build Brief</h2>
          <p>Use this directly to build the website, write outreach, or brief a designer.</p>
          <pre class="copy-brief">${escapeHtml(brief)}</pre>
        </section>

        <section class="panel">
          <h2>Owner / Decision Maker</h2>
          <div class="audit-list">
            ${renderExpectedRows(dossier.ownerContact, [
              ["ownerName", "Owner name"],
              ["operator", "Operator / company"],
              ["contactPerson", "Contact person / manager"],
              ["contactRole", "Contact role"],
              ["publicContactNote", "Public source note"]
            ])}
          </div>
          <h2 style="margin-top:20px;">Owner / Contact Finder Links</h2>
          <div class="audit-list">
            ${renderRows(dossier.verificationLinks, { empty: "No verification links could be generated." })}
          </div>
        </section>

        <section class="panel">
          <h2>Contact Details</h2>
          <div class="audit-list">
            ${renderExpectedRows(dossier.contact, [
              ["phone", "Phone"],
              ["mobile", "Mobile"],
              ["email", "Email"],
              ["website", "Website", "website"],
              ["fax", "Fax"]
            ])}
            ${renderWhatsappContact(lead)}
          </div>
          <h2 style="margin-top:20px;">Online Presence</h2>
          <div class="audit-list">
            ${renderRows(dossier.onlinePresence, { empty: "No online presence details found yet." })}
          </div>
        </section>

        <section class="panel">
          <h2>Website Discovery</h2>
          <p>Public contact and social data extracted from the business website when available.</p>
          <div class="audit-list">
            ${renderRows(dossier.websiteDiscovery, { empty: "No website discovery data found yet." })}
          </div>
          <h2 style="margin-top:20px;">Social Finder Links</h2>
          <div class="audit-list">
            ${renderRows({
              facebookSearch: dossier.verificationLinks?.facebookSearch,
              instagramSearch: dossier.verificationLinks?.instagramSearch,
              linkedinSearch: dossier.verificationLinks?.linkedinSearch,
              tiktokSearch: dossier.verificationLinks?.tiktokSearch,
              youtubeSearch: dossier.verificationLinks?.youtubeSearch,
              xSearch: dossier.verificationLinks?.xSearch,
              whatsappContact: dossier.verificationLinks?.whatsappContact
            }, { empty: "No social finder links available." })}
          </div>
        </section>

        <section class="panel">
          <h2>Business Details</h2>
          <div class="audit-list">
            ${renderRows(dossier.business, { empty: "No business profile details found yet." })}
          </div>
          <h2 style="margin-top:20px;">Operations</h2>
          <div class="audit-list">
            ${renderRows(dossier.operations, { empty: "No operations data found yet." })}
          </div>
        </section>

        <section class="panel">
          <h2>Location</h2>
          <div class="audit-list">
            ${renderRows(dossier.location, { empty: "No location details found yet." })}
          </div>
          <h2 style="margin-top:20px;">Social Links</h2>
          <div class="audit-list">
            ${renderSocialLinks({ ...dossier.social, ...socialLinks }, "No social links found yet.")}
          </div>
        </section>

        <section class="panel">
          <h2>Website Audit</h2>
          <div class="audit-list">
            ${Object.entries(checks).map(([key, value]) => `
              <div class="audit-item">
                <span>${escapeHtml(key.replace(/([A-Z])/g, " $1").trim())}</span>
                <span class="status-pill ${value ? "success" : "warning"}">${value ? "Found" : "Missing"}</span>
              </div>
            `).join("")}
          </div>
          <h2 style="margin-top:20px;">Sales Use</h2>
          <div class="audit-list">
            ${renderRows(dossier.salesUse, { empty: "No sales-use guidance available yet." })}
          </div>
        </section>

        <section class="panel">
          <h2>AI Opportunity</h2>
          <p>${result.aiSummary || "Ready for NVIDIA-powered analysis."}</p>
          <div class="lead-actions">
            <button class="btn btn-primary" type="button" data-ai-analyze="${lead.id}">Analyze</button>
            <button class="btn btn-secondary" type="button" data-ai-outreach="${lead.id}">Write Outreach</button>
          </div>
          <div id="aiOutput" class="notice" style="margin-top:12px;">Ready</div>
        </section>

        <section class="panel" style="grid-column:1 / -1;">
          <h2>Provider Source Data</h2>
          <p>Raw public map/source fields captured for website builds, outreach, and verification.</p>
          <pre class="code-block">${escapeHtml(JSON.stringify(rawSnapshot, null, 2))}</pre>
        </section>
      `;
    })
    .catch((error) => {
      const localLead = findLocalSavedLead(leadId);
      if (localLead) {
        renderLocalLeadDetail(target, localLead);
        return;
      }
      target.innerHTML = `<div class="error-state">${error.message}</div>`;
    });
}

function initAiButtons() {
  document.addEventListener("click", async (event) => {
    const analyze = event.target.closest("[data-ai-analyze]");
    const outreach = event.target.closest("[data-ai-outreach]");
    if (!analyze && !outreach) return;
    if (!requireAuth()) return;

    const output = byId("aiOutput");
    const button = analyze || outreach;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Running...";
    if (output) output.textContent = "Running NVIDIA analysis...";

    try {
      const endpoint = analyze ? "/api/ai/analyze" : "/api/ai/outreach";
      const result = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ leadId: (analyze || outreach).dataset.aiAnalyze || (analyze || outreach).dataset.aiOutreach })
      });
      if (output) output.textContent = result.content || result.message || "Complete";
    } catch (error) {
      if (output) output.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}

function initLeadDossierActions() {
  document.addEventListener("click", async (event) => {
    const copy = event.target.closest("[data-copy-dossier]");
    const copyBrief = event.target.closest("[data-copy-brief]");
    const json = event.target.closest("[data-download-json]");
    const csv = event.target.closest("[data-download-csv]");
    if (!copy && !copyBrief && !json && !csv) return;

    const report = activeLeadReport;
    if (!report) return;
    const leadName = String(report.lead?.name || "lead").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lead";

    if (copy) {
      const original = copy.textContent;
      await navigator.clipboard.writeText(JSON.stringify(report.dossier || report.lead, null, 2));
      copy.textContent = "Copied";
      setTimeout(() => {
        copy.textContent = original;
      }, 1400);
    }

    if (copyBrief) {
      const original = copyBrief.textContent;
      await navigator.clipboard.writeText(websiteBrief(report));
      copyBrief.textContent = "Brief Copied";
      setTimeout(() => {
        copyBrief.textContent = original;
      }, 1400);
    }

    if (json) {
      downloadFile(`${leadName}-dossier.json`, "application/json", JSON.stringify(report, null, 2));
    }

    if (csv) {
      downloadFile(`${leadName}-dossier.csv`, "text/csv", dossierCsv(report));
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateCountries();
  populateBusinessTypes();
  initMapLinkPreview();
  initLeadSearch();
  initLeadActions();
  initBulkLeadActions();
  initLocalSavedLeadActions();
  renderLocalSavedLeads();
  initLeadDetails();
  initAiButtons();
  initLeadDossierActions();
});
