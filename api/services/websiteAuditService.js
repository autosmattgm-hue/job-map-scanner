import dns from "node:dns/promises";
import net from "node:net";
import { performance } from "node:perf_hooks";
import { AppError } from "../utils/errors.js";

function normalizeWebsiteUrl(input) {
  if (!input) return "";
  const trimmed = String(input).trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AppError("Only HTTP and HTTPS websites can be audited.", 422, "INVALID_WEBSITE_URL");
  }
  return url;
}

function isPrivateIp(address) {
  if (net.isIP(address) === 4) {
    const parts = address.split(".").map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      parts[0] === 0
    );
  }

  if (net.isIP(address) === 6) {
    const value = address.toLowerCase();
    return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80");
  }

  return true;
}

async function assertPublicHostname(url) {
  if (["localhost", "metadata.google.internal"].includes(url.hostname)) {
    throw new AppError("Website host is not allowed.", 422, "SSRF_HOST_BLOCKED");
  }

  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new AppError("Website host resolves to a private network.", 422, "SSRF_IP_BLOCKED");
  }
}

function hasPattern(html, pattern) {
  return pattern.test(html);
}

function categorize(score) {
  if (score >= 80) return "Very High Opportunity";
  if (score >= 55) return "High Opportunity";
  if (score >= 30) return "Medium Opportunity";
  return "Low Opportunity";
}

function computeScore(checks, elapsedMs) {
  let score = 0;
  if (!checks.websiteExists) score += 50;
  if (!checks.mobileFriendly) score += 20;
  if (!checks.seoMetadata) score += 20;
  if (!checks.https) score += 10;
  if (elapsedMs > 2500) score += 15;
  if (checks.outdatedDesign) score += 20;
  if (!checks.contactForm) score += 10;
  if (!checks.bookingSystem) score += 15;
  return Math.min(score, 100);
}

export class WebsiteAuditService {
  async audit(lead) {
    if (!lead.websiteUrl) {
      const checks = {
        websiteExists: false,
        https: false,
        mobileFriendly: false,
        seoMetadata: false,
        contactForm: false,
        socialLinksFound: false,
        businessEmailDetected: false,
        bookingSystem: false,
        outdatedDesign: true
      };
      const score = computeScore(checks, 0);
      return { score, category: categorize(score), checks, elapsedMs: 0 };
    }

    const url = normalizeWebsiteUrl(lead.websiteUrl);
    await assertPublicHostname(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const started = performance.now();

    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "MATLeadsAIProX-AuditBot/1.0",
          "Range": "bytes=0-524288"
        }
      });
      const elapsedMs = Math.round(performance.now() - started);
      const html = (await response.text()).slice(0, 524288).toLowerCase();
      const finalUrl = new URL(response.url);
      const title = hasPattern(html, /<title[^>]*>[^<]{8,}<\/title>/i);
      const description = hasPattern(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i);
      const checks = {
        websiteExists: response.ok,
        https: finalUrl.protocol === "https:",
        mobileFriendly: hasPattern(html, /<meta[^>]+name=["']viewport["']/i),
        seoMetadata: title && description,
        contactForm: hasPattern(html, /<form[\s>]/i) && hasPattern(html, /(contact|email|phone|message|name)/i),
        socialLinksFound: hasPattern(html, /(facebook|instagram|linkedin|x\.com|twitter|tiktok|youtube)\.com/i),
        businessEmailDetected: hasPattern(html, /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i),
        bookingSystem: hasPattern(html, /(book now|appointment|reservation|calendly|opentable|resy|acuityscheduling|mindbody|squareup)/i),
        outdatedDesign: !hasPattern(html, /(viewport|srcset|webp|avif|application\/ld\+json|module)/i)
      };
      const score = computeScore(checks, elapsedMs);
      return { score, category: categorize(score), checks, elapsedMs, status: response.status };
    } finally {
      clearTimeout(timeout);
    }
  }
}
