import { apiFetch, byId } from "./api.js";

function statusPill(enabled) {
  return `<span class="status-pill ${enabled ? "success" : "danger"}">${enabled ? "Connected" : "Required"}</span>`;
}

async function initIntegrationStatus() {
  const target = byId("integrationStatus");
  const missing = byId("missingConfig");
  if (!target) return;

  try {
    const health = await apiFetch("/api/health");
    const integrations = health.integrations || {};
    target.innerHTML = `
      <div class="audit-item"><span>Google Places API</span>${statusPill(integrations.googlePlaces)}</div>
      <div class="audit-item"><span>OpenStreetMap Overpass</span>${statusPill(integrations.openStreetMap)}</div>
      <div class="audit-item"><span>Firebase Firestore</span>${statusPill(integrations.firebase)}</div>
      <div class="audit-item"><span>NVIDIA API</span>${statusPill(integrations.nvidia)}</div>
      <div class="audit-item"><span>Stripe Billing</span>${statusPill(integrations.stripe)}</div>
      <div class="audit-item"><span>PayPal Billing</span>${statusPill(integrations.paypal)}</div>
    `;

    if (missing) {
      const items = health.missingRequiredForLiveOperation || [];
      missing.textContent = items.length
        ? `Missing for complete live operation: ${items.join(", ")}.`
        : "All live provider credentials are configured.";
    }
  } catch (error) {
    target.innerHTML = `<div class="error-state">${error.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initIntegrationStatus);
