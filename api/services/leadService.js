import { FirestoreRepository } from "../repositories/firestoreRepository.js";
import { env } from "../config/env.js";
import { GooglePlacesService } from "./googlePlacesService.js";
import { WebsiteAuditService } from "./websiteAuditService.js";

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  }));
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
  const contact = compactObject({
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
    onlinePresence: compactObject({
      website: lead.websiteUrl,
      googleMapsLink: lead.googleMapsLink,
      osmUrl: details.source?.osmUrl,
      hasWebsite: Boolean(lead.websiteUrl),
      hasPhone: Boolean(contact.phone || contact.mobile),
      hasEmail: Boolean(contact.email),
      hasSocial: Boolean(Object.keys(details.social || {}).length || lead.social)
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
  }

  async search(search, user) {
    const result = await this.googlePlaces.search(search);
    const audited = await Promise.all(result.leads.map(async (lead) => {
      try {
        const audit = lead.audit || await this.websiteAudit.audit(lead);
        return { ...lead, audit, opportunityScore: audit.score, opportunityCategory: audit.category };
      } catch (error) {
        return {
          ...lead,
          audit: { score: 0, category: "Audit Pending", checks: {}, error: error.message },
          opportunityScore: 0,
          opportunityCategory: "Audit Pending"
        };
      }
    }));

    await Promise.all(audited.map((lead) => this.leads.upsert(lead.id, {
      ...lead,
      source: result.source || "google_places",
      discoveredBy: user?.uid,
      discoveredAt: new Date().toISOString()
    })));

    await this.auditLogs.create({
      actor: user?.email || "guest",
      action: "lead_search",
      query: search,
      count: audited.length
    });

    return { ...result, leads: audited };
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
    const audit = lead.audit || await this.websiteAudit.audit(lead);
    const enrichedLead = { ...lead, audit, opportunityScore: audit.score, opportunityCategory: audit.category };
    return {
      lead: enrichedLead,
      dossier: buildLeadDossier(enrichedLead, audit),
      aiSummary: env.nvidia.apiKey
        ? "NVIDIA analysis is ready for this lead."
        : "Real NVIDIA analysis requires NVIDIA_API_KEY in .env."
    };
  }
}
