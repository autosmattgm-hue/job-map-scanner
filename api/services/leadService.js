import { FirestoreRepository } from "../repositories/firestoreRepository.js";
import { env } from "../config/env.js";
import { getPlan } from "../config/plans.js";
import { GooglePlacesService } from "./googlePlacesService.js";
import { WebsiteAuditService } from "./websiteAuditService.js";
import { AppError } from "../utils/errors.js";
import { isAdminUser } from "../utils/entitlements.js";

const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_SEARCH_CACHE_ENTRIES = 80;

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  }));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cacheKeyForSearch(search, isAdmin) {
  return stableJson({ search, isAdmin });
}

function getCachedSearch(cacheKey) {
  const cached = searchCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    searchCache.delete(cacheKey);
    return null;
  }
  return { ...cached.result, cached: true };
}

function setCachedSearch(cacheKey, result) {
  searchCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS
  });
  while (searchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
    searchCache.delete(searchCache.keys().next().value);
  }
}

function hasContact(lead) {
  return Boolean(lead.phone || lead.email || lead.details?.contact?.mobile || lead.social || Object.keys(lead.details?.social || {}).length);
}

function hasOwnerData(lead) {
  const owner = lead.details?.ownerContact || {};
  return Boolean(owner.ownerName || owner.operator || owner.contactPerson);
}

function contactScore(lead) {
  return [
    lead.phone,
    lead.email,
    lead.details?.contact?.mobile,
    lead.websiteUrl,
    lead.social || Object.keys(lead.details?.social || {}).length
  ].filter(Boolean).length;
}

function isPaidUser(user = {}) {
  return Boolean(user.entitlements?.activePlan || user.planActivatedAt || user.paypalCheckoutSessionId);
}

function isTrialUser(user = {}) {
  if (isAdminUser(user) || user?.entitlements?.unlimitedAccess || user?.permissions?.includes?.("unlimited")) return false;
  if (isPaidUser(user)) return false;
  return !user.subscription || user.subscription === "trial" || user.billingStatus === "trial" || user.subscription === "starter";
}

function trialUsage(user = {}) {
  const trialPlan = getPlan("trial");
  const used = Math.max(0, Number(user.trialSearchesUsed || user.entitlements?.trialSearchesUsed || 0));
  return {
    used,
    remaining: Math.max(0, trialPlan.trialSearchLimit - used),
    searchLimit: trialPlan.trialSearchLimit,
    leadLimit: trialPlan.trialLeadLimit
  };
}

function normalizeSearchForUser(search, user) {
  const admin = isAdminUser(user) || user?.entitlements?.unlimitedAccess || user?.permissions?.includes?.("unlimited");
  const trial = isTrialUser(user);
  const trialPlan = getPlan("trial");
  return {
    ...search,
    limit: trial ? trialPlan.trialLeadLimit : Math.min(Math.max(Number(search.limit) || 20, 1), admin ? 200 : 50),
    searchDepth: admin ? search.searchDepth : (search.searchDepth === "maximum" || trial ? "deep" : search.searchDepth)
  };
}

function candidateLimitForSearch(search, admin) {
  const multiplier = {
    quick: 1.2,
    standard: 1.8,
    deep: 2.6,
    maximum: 4
  }[search.searchDepth] || 2.6;
  return Math.min(Math.ceil(search.limit * multiplier), admin ? 300 : 120);
}

function applyLeadFilters(leads, search) {
  const minScore = Number(search.minOpportunityScore || 0);
  const filtered = leads.filter((lead) => {
    const score = lead.opportunityScore ?? lead.audit?.score ?? 0;
    if (score < minScore) return false;
    if (search.requireContact && !hasContact(lead)) return false;
    if (search.missingWebsiteOnly && lead.websiteUrl) return false;
    if (search.leadQuality === "contact_ready" && !hasContact(lead)) return false;
    if (search.leadQuality === "needs_website" && lead.websiteUrl) return false;
    if (search.leadQuality === "high_opportunity" && score < 70) return false;
    if (search.leadQuality === "owner_data" && !hasOwnerData(lead)) return false;
    return true;
  });

  const sorters = {
    opportunity: (left, right) => (right.opportunityScore ?? right.audit?.score ?? 0) - (left.opportunityScore ?? left.audit?.score ?? 0),
    contact: (left, right) => contactScore(right) - contactScore(left),
    website_missing: (left, right) => Number(!right.websiteUrl) - Number(!left.websiteUrl),
    name: (left, right) => String(left.name || "").localeCompare(String(right.name || ""))
  };
  const sorter = sorters[search.sortBy] || sorters.opportunity;
  return filtered.sort((left, right) => sorter(left, right) || String(left.name || "").localeCompare(String(right.name || "")));
}

function freshLeadOrder(leads, refreshSeed) {
  if (!refreshSeed) return leads;
  return [...leads]
    .map((lead, index) => ({
      lead,
      rank: hashString(`${refreshSeed}:${lead.id || lead.name || "lead"}:${lead.address || ""}:${index}`)
    }))
    .sort((left, right) => left.rank - right.rank)
    .map(({ lead }) => lead);
}

function mergePublicWebsiteProfile(lead, audit) {
  const profile = audit?.publicProfile;
  if (!profile) return lead;

  const details = lead.details || {};
  const contact = compactObject({
    ...(details.contact || {}),
    phone: lead.phone || details.contact?.phone || profile.phones?.[0],
    email: lead.email || details.contact?.email || profile.emails?.[0],
    website: lead.websiteUrl || details.contact?.website || profile.finalUrl
  });
  const social = compactObject({
    ...(details.social || {}),
    ...(profile.socialLinks || {})
  });
  const business = compactObject({
    ...(details.business || {}),
    websiteTitle: profile.metadata?.title,
    websiteDescription: profile.metadata?.description
  });
  const source = compactObject({
    ...(details.source || {}),
    websiteScanUrl: profile.finalUrl,
    websiteScanSource: profile.source,
    websiteExtractedAt: new Date().toISOString()
  });

  return {
    ...lead,
    phone: lead.phone || contact.phone || "",
    email: lead.email || contact.email || "",
    websiteUrl: lead.websiteUrl || contact.website || "",
    social: lead.social || Object.values(social)[0] || "",
    details: {
      ...details,
      contact,
      social,
      business,
      source,
      publicWebsiteProfile: compactObject({
        finalUrl: profile.finalUrl,
        emails: profile.emails || [],
        phones: profile.phones || [],
        socialLinks: profile.socialLinks || {},
        metadata: profile.metadata || {},
        source: profile.source
      })
    }
  };
}

function valueOrNotFound(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not found in public data";
  if (value === undefined || value === null || value === "") return "Not found in public data";
  if (typeof value === "object") return Object.keys(value).length ? JSON.stringify(value) : "Not found in public data";
  return String(value);
}

function searchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function hostnameFromWebsite(website) {
  if (!website) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    return url.hostname;
  } catch {
    return "";
  }
}

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

function normalizedName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function isWhatsappUrl(value) {
  const url = safeHttpUrl(value);
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "wa.me" || host === "whatsapp.com" || host.endsWith(".whatsapp.com");
  } catch {
    return false;
  }
}

function socialLinksForLead(lead = {}, audit = {}) {
  return {
    ...(lead.details?.social || {}),
    ...(lead.details?.publicWebsiteProfile?.socialLinks || {}),
    ...(audit?.publicProfile?.socialLinks || {})
  };
}

function countryCallingCodeForLead(lead = {}, location = {}) {
  const iso = String(
    lead.countryCode ||
    lead.details?.location?.countryCode ||
    location.countryCode ||
    ""
  ).toUpperCase();
  if (countryCallingCodesByIso[iso]) return countryCallingCodesByIso[iso];

  const names = [
    lead.country,
    lead.countryName,
    lead.details?.location?.country,
    lead.details?.location?.countryName,
    location.country,
    location.countryName
  ].map(normalizedName);

  return names.map((name) => countryCallingCodesByName[name]).find(Boolean) || "";
}

function normalizePhoneForWhatsapp(phone, lead = {}, location = {}) {
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
    const callingCode = countryCallingCodeForLead(lead, location);
    if (!callingCode) return "";
    const nationalNumber = digits.replace(/^0+/, "");
    digits = digits.startsWith(callingCode) && digits.length > callingCode.length + 5
      ? digits
      : `${callingCode}${nationalNumber}`;
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

function whatsappLinkFromPhone(phone, lead = {}, location = {}) {
  const normalized = normalizePhoneForWhatsapp(phone, lead, location);
  return normalized ? `https://wa.me/${normalized}` : "";
}

function whatsappContactForLead(lead = {}, contact = {}, location = {}, audit = {}) {
  const socialLinks = socialLinksForLead(lead, audit);
  const explicitWhatsapp = safeHttpUrl(socialLinks.whatsapp || contact.whatsapp || "");
  if (explicitWhatsapp && isWhatsappUrl(explicitWhatsapp)) {
    return {
      url: explicitWhatsapp,
      source: "public_whatsapp_link",
      note: "A public WhatsApp link was found in map or website data."
    };
  }

  const leadSocial = safeHttpUrl(lead.social || "");
  if (leadSocial && isWhatsappUrl(leadSocial)) {
    return {
      url: leadSocial,
      source: "public_whatsapp_link",
      note: "A public WhatsApp link was found in map or website data."
    };
  }

  const phone = [
    contact.mobile,
    contact.phone,
    lead.details?.contact?.mobile,
    lead.details?.contact?.phone,
    lead.phone,
    lead.details?.publicWebsiteProfile?.phones?.[0],
    audit?.publicProfile?.phones?.[0]
  ].find(Boolean);
  const phoneLink = whatsappLinkFromPhone(phone, lead, location);
  if (!phoneLink) return {};

  return {
    url: phoneLink,
    source: "business_phone_number",
    note: "Opens WhatsApp with the real business phone number; WhatsApp confirms whether the number is registered."
  };
}

function buildVerificationLinks(lead, dossier) {
  const businessName = lead.name || "business";
  const address = dossier.location?.address || lead.address || "";
  const website = dossier.contact?.website || lead.websiteUrl || "";
  const hostname = hostnameFromWebsite(website);
  const baseQuery = [businessName, address].filter(Boolean).join(" ");

  return compactObject({
    googleBusinessSearch: searchUrl(baseQuery),
    ownerSearch: searchUrl(`${baseQuery} owner manager founder`),
    phoneEmailSearch: searchUrl(`${baseQuery} phone email contact`),
    facebookSearch: searchUrl(`${baseQuery} Facebook`),
    instagramSearch: searchUrl(`${baseQuery} Instagram`),
    linkedinSearch: searchUrl(`${baseQuery} LinkedIn owner manager`),
    tiktokSearch: searchUrl(`${baseQuery} TikTok`),
    youtubeSearch: searchUrl(`${baseQuery} YouTube`),
    xSearch: searchUrl(`${baseQuery} X Twitter`),
    whatsappContact: dossier.contact?.whatsappLink || "",
    websiteContactSearch: hostname ? searchUrl(`site:${hostname} contact email phone owner`) : ""
  });
}

function formatWebsiteBuildBrief(lead, dossier) {
  const missing = dossier.salesUse?.missingData?.length
    ? dossier.salesUse.missingData.join(", ")
    : "No critical missing public fields detected";
  const auditChecks = Object.entries(dossier.audit?.checks || {})
    .map(([key, value]) => `${key}: ${value ? "found" : "missing"}`)
    .join("; ");

  return [
    "WEBSITE BUILD BRIEF",
    "",
    `Business name: ${valueOrNotFound(lead.name)}`,
    `Business type: ${valueOrNotFound(lead.businessType || lead.category)}`,
    `Owner name: ${valueOrNotFound(dossier.ownerContact?.ownerName)}`,
    `Operator/manager: ${valueOrNotFound(dossier.ownerContact?.operator || dossier.ownerContact?.contactPerson)}`,
    `Contact role: ${valueOrNotFound(dossier.ownerContact?.contactRole)}`,
    `Phone: ${valueOrNotFound(dossier.contact?.phone || dossier.contact?.mobile)}`,
    `WhatsApp contact: ${valueOrNotFound(dossier.contact?.whatsappLink)}`,
    `WhatsApp source note: ${valueOrNotFound(dossier.contact?.whatsappVerificationNote)}`,
    `Email: ${valueOrNotFound(dossier.contact?.email)}`,
    `Current website: ${valueOrNotFound(dossier.contact?.website || lead.websiteUrl)}`,
    `Google Maps: ${valueOrNotFound(dossier.location?.googleMapsLink || lead.googleMapsLink)}`,
    `OpenStreetMap source: ${valueOrNotFound(dossier.source?.osmUrl)}`,
    `Address: ${valueOrNotFound(dossier.location?.address || lead.address)}`,
    `City: ${valueOrNotFound(dossier.location?.city)}`,
    `Country: ${valueOrNotFound(dossier.location?.country || dossier.location?.countryName)}`,
    `Latitude/longitude: ${valueOrNotFound(dossier.location?.latitude)}, ${valueOrNotFound(dossier.location?.longitude)}`,
    `Opening hours: ${valueOrNotFound(dossier.operations?.openingHours || lead.openingHours)}`,
    `Services/cuisine/category notes: ${valueOrNotFound(dossier.business?.cuisine || dossier.business?.description || dossier.business?.businessType)}`,
    `Social links: ${valueOrNotFound(dossier.social)}`,
    `Website-discovered social links: ${valueOrNotFound(dossier.websiteDiscovery?.socialLinks)}`,
    `Website-discovered emails: ${valueOrNotFound(dossier.websiteDiscovery?.emails)}`,
    `Payment info: ${valueOrNotFound(dossier.payments)}`,
    `Owner search link: ${valueOrNotFound(dossier.verificationLinks?.ownerSearch)}`,
    `Phone/email search link: ${valueOrNotFound(dossier.verificationLinks?.phoneEmailSearch)}`,
    "",
    "WEBSITE OPPORTUNITY",
    `Opportunity score: ${valueOrNotFound(dossier.audit?.score)}/100`,
    `Opportunity category: ${valueOrNotFound(dossier.audit?.category)}`,
    `Best offer: ${valueOrNotFound(dossier.salesUse?.bestOffer)}`,
    `Missing data to collect: ${missing}`,
    `Audit checks: ${auditChecks || "No audit checks available"}`,
    "",
    "RECOMMENDED WEBSITE STRUCTURE",
    "Home: clear offer, location, phone, primary CTA",
    "About: trust, owner/operator story if available",
    "Services/Menu/Inventory: based on business type",
    "Gallery: business photos and proof",
    "Reviews: Google/social proof",
    "Contact: map, phone, email, opening hours, form",
    "Booking/Quote CTA: appointment, reservation, or inquiry flow",
    "",
    "OWNER/CONTACT NOTE",
    dossier.ownerContact?.ownerName || dossier.ownerContact?.operator || dossier.ownerContact?.contactPerson
      ? "Owner/operator/contact information was found in the public source data."
      : "Owner or direct contact person was not publicly listed. Use the owner search link, business phone, email, website contact form, Google Maps link, Facebook, Instagram, or LinkedIn to verify the decision maker before outreach."
  ].join("\n");
}

function buildLeadDossier(lead, audit) {
  const details = lead.details || {};
  const rawTags = details.source?.rawTags || lead.raw?.tags || {};
  const ownerContact = compactObject({
    ownerName: details.ownerContact?.ownerName || rawTags.owner || rawTags["contact:owner"],
    operator: details.ownerContact?.operator || rawTags.operator || rawTags["operator:name"],
    contactPerson: details.ownerContact?.contactPerson || rawTags["contact:person"] || rawTags["contact:name"] || rawTags.manager,
    contactRole: details.ownerContact?.contactRole || rawTags["contact:role"],
    publicContactNote: details.ownerContact?.publicContactNote
  });
  let contact = compactObject({
    phone: lead.phone,
    email: lead.email,
    website: lead.websiteUrl,
    social: lead.social,
    ...(details.contact || {})
  });
  const location = compactObject({
    address: lead.address,
    latitude: lead.latitude,
    longitude: lead.longitude,
    googleMapsLink: lead.googleMapsLink,
    marketName: lead.marketName,
    countryName: lead.countryName,
    ...(details.location || {})
  });
  const whatsappContact = whatsappContactForLead(lead, contact, location, audit);
  contact = compactObject({
    ...contact,
    whatsappLink: whatsappContact.url,
    whatsappSource: whatsappContact.source,
    whatsappVerificationNote: whatsappContact.note
  });
  const business = compactObject({
    name: lead.name,
    category: lead.category,
    businessType: lead.businessType,
    rating: lead.rating,
    reviewsCount: lead.reviewsCount,
    opportunityScore: lead.opportunityScore,
    opportunityCategory: lead.opportunityCategory,
    ...(details.business || {})
  });

  const dossier = {
    summary: compactObject({
      name: lead.name,
      businessType: lead.businessType || lead.category,
      source: lead.source,
      score: audit?.score ?? lead.opportunityScore,
      opportunity: audit?.category || lead.opportunityCategory
    }),
    ownerContact,
    contact,
    social: details.social || {},
    location,
    business,
    operations: details.operations || {},
    payments: details.payments || {},
    websiteDiscovery: details.publicWebsiteProfile || audit?.publicProfile || {},
    onlinePresence: compactObject({
      website: lead.websiteUrl,
      googleMapsLink: lead.googleMapsLink,
      osmUrl: details.source?.osmUrl,
      hasWebsite: Boolean(lead.websiteUrl),
      hasPhone: Boolean(contact.phone || contact.mobile),
      hasEmail: Boolean(contact.email),
      hasWhatsapp: Boolean(contact.whatsappLink),
      whatsappLink: contact.whatsappLink,
      hasSocial: Boolean(Object.keys(details.social || {}).length || lead.social),
      socialLinks: details.social || {},
      websiteDiscoveredSocialLinks: details.publicWebsiteProfile?.socialLinks || audit?.publicProfile?.socialLinks || {},
      websiteDiscoveredEmails: details.publicWebsiteProfile?.emails || audit?.publicProfile?.emails || [],
      websiteDiscoveredPhones: details.publicWebsiteProfile?.phones || audit?.publicProfile?.phones || []
    }),
    audit: compactObject({
      score: audit?.score,
      category: audit?.category,
      elapsedMs: audit?.elapsedMs,
      status: audit?.status,
      checks: audit?.checks || {},
      error: audit?.error
    }),
    source: details.source || compactObject({
      provider: lead.source,
      raw: lead.raw
    }),
    salesUse: {
      bestOffer: lead.websiteUrl ? "Website audit, SEO improvement, booking/contact conversion, AI outreach automation" : "New website build, Google Maps conversion, local SEO, booking/contact setup",
      missingData: [
        !lead.websiteUrl && "website",
        !contact.phone && "phone",
        !contact.email && "email",
        !Object.keys(details.social || {}).length && !lead.social && "social links",
        !details.operations?.openingHours && !lead.openingHours && "opening hours"
      ].filter(Boolean)
    }
  };
  const verificationLinks = buildVerificationLinks(lead, dossier);
  const dossierWithLinks = { ...dossier, verificationLinks };

  return {
    ...dossierWithLinks,
    copyReady: {
      websiteBuildBrief: formatWebsiteBuildBrief(lead, dossierWithLinks)
    }
  };
}

export class LeadService {
  constructor() {
    this.googlePlaces = new GooglePlacesService();
    this.websiteAudit = new WebsiteAuditService();
    this.leads = new FirestoreRepository("leads");
    this.auditLogs = new FirestoreRepository("auditLogs");
    this.users = new FirestoreRepository("users");
  }

  async currentAccessUser(user) {
    if (!user?.uid || isAdminUser(user)) return user;
    const stored = await this.users.findById(user.uid);
    return { ...user, ...(stored || {}) };
  }

  async assertTrialAccess(user) {
    if (!isTrialUser(user)) return null;
    const usage = trialUsage(user);
    if (usage.remaining <= 0) {
      throw new AppError(
        "Your free trial includes 2 lead searches with up to 5 leads each. Subscribe to unlock more lead searches.",
        402,
        "TRIAL_LIMIT_REACHED",
        { trial: usage, upgradeUrl: "/pricing.html" }
      );
    }
    return usage;
  }

  async recordTrialSearch(user, usage) {
    if (!usage || !user?.uid) return null;
    const used = usage.used + 1;
    const nextUsage = {
      used,
      remaining: Math.max(0, usage.searchLimit - used),
      searchLimit: usage.searchLimit,
      leadLimit: usage.leadLimit
    };
    await this.users.upsert(user.uid, {
      trialSearchesUsed: used,
      subscription: "trial",
      planName: "Free Trial",
      billingStatus: "trial",
      monthlyLeadLimit: usage.leadLimit,
      entitlements: {
        billingRequired: true,
        trial: true,
        trialSearchesUsed: used,
        trialSearchLimit: usage.searchLimit,
        trialLeadLimit: usage.leadLimit,
        upgradeRequiredAfterTrial: true
      }
    });
    return nextUsage;
  }

  async search(search, user) {
    const accessUser = await this.currentAccessUser(user);
    const startingTrialUsage = await this.assertTrialAccess(accessUser);
    const admin = isAdminUser(accessUser) || accessUser?.entitlements?.unlimitedAccess || accessUser?.permissions?.includes?.("unlimited");
    const effectiveSearch = normalizeSearchForUser(search, accessUser);
    const bypassCache = Boolean(effectiveSearch.bypassCache || effectiveSearch.refreshSeed);
    const refreshSeed = effectiveSearch.refreshSeed || (bypassCache ? String(Date.now()) : "");
    const providerSearch = {
      ...effectiveSearch,
      refreshSeed,
      limit: candidateLimitForSearch(effectiveSearch, admin)
    };
    const cacheKey = cacheKeyForSearch(providerSearch, admin);
    const cached = bypassCache ? null : getCachedSearch(cacheKey);
    if (cached) {
      const updatedTrialUsage = await this.recordTrialSearch(accessUser, startingTrialUsage);
      await this.auditLogs.create({
        actor: accessUser?.email || "guest",
        action: "lead_search_cached",
        query: effectiveSearch,
        count: cached.leads?.length || 0
      });
      return {
        ...cached,
        trial: updatedTrialUsage ? {
          ...updatedTrialUsage,
          limited: true,
          upgradeUrl: "/pricing.html"
        } : cached.trial
      };
    }

    const result = await this.googlePlaces.search(providerSearch);
    const audited = await Promise.all(result.leads.map(async (lead) => {
      try {
        const audit = lead.audit?.publicProfile ? lead.audit : await this.websiteAudit.audit(lead);
        const enrichedLead = mergePublicWebsiteProfile(lead, audit);
        return { ...enrichedLead, audit, opportunityScore: audit.score, opportunityCategory: audit.category };
      } catch (error) {
        return {
          ...lead,
          audit: { score: 0, category: "Audit Pending", checks: {}, error: error.message },
          opportunityScore: 0,
          opportunityCategory: "Audit Pending"
        };
      }
    }));
    const qualifiedPool = freshLeadOrder(applyLeadFilters(audited, effectiveSearch), refreshSeed);
    const qualified = qualifiedPool.slice(0, effectiveSearch.limit);

    await Promise.all(qualified.map((lead) => this.leads.upsert(lead.id, {
      ...lead,
      source: result.source || "google_places",
      discoveredBy: accessUser?.uid,
      discoveredAt: new Date().toISOString()
    })));

    const updatedTrialUsage = await this.recordTrialSearch(accessUser, startingTrialUsage);

    await this.auditLogs.create({
      actor: accessUser?.email || "guest",
      action: "lead_search",
      query: effectiveSearch,
      count: qualified.length
    });

    const response = {
      ...result,
      leads: qualified,
      cached: false,
      refreshed: bypassCache,
      refreshSeed,
      adminUnlimited: admin,
      searchStats: {
        requestedLimit: effectiveSearch.limit,
        providerCandidateLimit: providerSearch.limit,
        rawCount: result.leads.length,
        auditedCount: audited.length,
        qualifiedCount: qualified.length,
        qualifiedPoolCount: qualifiedPool.length,
        bypassCache,
        searchDepth: effectiveSearch.searchDepth,
        leadQuality: effectiveSearch.leadQuality,
        sortBy: effectiveSearch.sortBy
      },
      trial: updatedTrialUsage ? {
        ...updatedTrialUsage,
        limited: true,
        upgradeUrl: "/pricing.html"
      } : undefined
    };
    if (!bypassCache) setCachedSearch(cacheKey, response);
    return response;
  }

  async save(leadId, user) {
    const existing = await this.getById(leadId);
    const lead = existing;
    if (!lead) return null;
    return this.leads.upsert(lead.id, {
      ...lead,
      ownerId: user?.uid,
      stage: lead.stage || "New",
      savedAt: new Date().toISOString()
    });
  }

  async getById(id) {
    return await this.leads.findById(id) || null;
  }

  async getReport(id) {
    const lead = await this.getById(id);
    if (!lead) return null;
    const audit = lead.audit?.publicProfile ? lead.audit : await this.websiteAudit.audit(lead);
    const publicEnrichedLead = mergePublicWebsiteProfile(lead, audit);
    const enrichedLead = { ...publicEnrichedLead, audit, opportunityScore: audit.score, opportunityCategory: audit.category };
    return {
      lead: enrichedLead,
      dossier: buildLeadDossier(enrichedLead, audit),
      aiSummary: env.nvidia.apiKey
        ? "NVIDIA analysis is ready for this lead."
        : "Real NVIDIA analysis requires NVIDIA_API_KEY in .env."
    };
  }
}
