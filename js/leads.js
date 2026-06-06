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
  "Japan",
  "South Korea",
  "India",
  "Mexico",
  "Brazil",
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
  "Indonesia",
  "Senegal",
  "The Gambia",
  "Kuwait",
  "Qatar",
  "United Arab Emirates",
  "Saudi Arabia"
];

const businessTypes = [
  ["restaurants", "Restaurants"],
  ["hotels", "Hotels"],
  ["boutiques", "Boutiques"],
  ["car_dealers", "Car Dealers"],
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
  ["finance_insurance", "Finance & Insurance"]
];

let activeLeadReport = null;
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

function renderExternalLink(value) {
  const url = safeExternalUrl(value);
  if (!url) return escapeHtml(displayValue(value));
  return `<a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`;
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
    const isLink = /url|website|link|maps|osm/i.test(key);
    return `
      <div class="audit-item">
        <span>${escapeHtml(label)}</span>
        <strong>${isLink ? renderExternalLink(value) : escapeHtml(displayValue(value))}</strong>
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
  payload.limit = normalizedInteger(payload.limit, 20, 1, 50);
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
    meta.textContent = "Paste a Google Maps link with coordinates to search around that exact area.";
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
        ${source}
      </div>
      <p>${website}</p>
      <div class="lead-actions">
        <a class="btn btn-secondary" href="/lead-details.html?id=${encodeURIComponent(lead.id)}">View</a>
        <button class="btn btn-primary" type="button" data-save-lead="${lead.id}">Save Lead</button>
        ${mapsUrl ? `<a class="btn btn-ghost" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>` : ""}
      </div>
    </article>
  `;
}

function renderResults(leads) {
  const target = byId("leadResults");
  if (!target) return;

  if (!leads.length) {
    target.innerHTML = `<div class="empty-state">No leads found for this search.</div>`;
    return;
  }

  target.innerHTML = leads.map(renderLead).join("");
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
        note.textContent = `Real ${provider} results loaded${locationText}.${countryText} Query: ${result.query || "businesses"}.`;
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
          </div>
          <div class="lead-actions" style="margin-top:16px;">
            ${websiteUrl ? `<a class="btn btn-secondary" href="${websiteUrl}" target="_blank" rel="noreferrer">Website</a>` : ""}
            ${mapsUrl ? `<a class="btn btn-secondary" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>` : ""}
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
          </div>
          <h2 style="margin-top:20px;">Online Presence</h2>
          <div class="audit-list">
            ${renderRows(dossier.onlinePresence, { empty: "No online presence details found yet." })}
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
            ${renderRows(dossier.social, { empty: "No social links found yet." })}
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
  initLeadDetails();
  initAiButtons();
  initLeadDossierActions();
});
