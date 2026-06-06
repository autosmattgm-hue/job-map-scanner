function validationError(fieldErrors) {
  const error = new Error("Validation failed");
  error.fieldErrors = fieldErrors;
  return error;
}

function schema(validator) {
  return {
    safeParse(input) {
      try {
        return { success: true, data: validator(input || {}) };
      } catch (error) {
        return {
          success: false,
          error: {
            flatten: () => ({ fieldErrors: error.fieldErrors || { form: [error.message] } })
          }
        };
      }
    }
  };
}

function stringField(input, field, options = {}) {
  const value = input[field] === undefined || input[field] === null ? "" : String(input[field]).trim();
  const errors = [];

  if (options.required && !value) errors.push("Required");
  if (options.min && value.length < options.min) errors.push(`Must be at least ${options.min} characters`);
  if (options.max && value.length > options.max) errors.push(`Must be at most ${options.max} characters`);
  if (options.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push("Must be a valid email");

  if (errors.length) throw validationError({ [field]: errors });
  return value || options.default || "";
}

function stringListField(input, field, options = {}) {
  const raw = input[field];
  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[,;\n|]/)
      : [];
  const cleaned = [...new Set(values
    .map((value) => String(value || "").trim())
    .filter(Boolean))]
    .slice(0, options.maxItems || 20);

  for (const value of cleaned) {
    if (options.max && value.length > options.max) {
      throw validationError({ [field]: [`Each value must be at most ${options.max} characters`] });
    }
  }

  return cleaned;
}

function numberField(input, field, options = {}) {
  const value = input[field] === undefined || input[field] === "" ? options.default : Number(input[field]);
  if (!Number.isFinite(value)) throw validationError({ [field]: ["Must be a number"] });
  if (options.int && !Number.isInteger(value)) throw validationError({ [field]: ["Must be an integer"] });
  if (options.min !== undefined && value < options.min) throw validationError({ [field]: [`Must be at least ${options.min}`] });
  if (options.max !== undefined && value > options.max) throw validationError({ [field]: [`Must be at most ${options.max}`] });
  return value;
}

function optionalCoordinate(input, field, min, max) {
  if (input[field] === undefined || input[field] === "") return null;
  const value = Number(input[field]);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw validationError({ [field]: [`Must be between ${min} and ${max}`] });
  }
  return value;
}

function enumField(input, field, allowed, options = {}) {
  const value = input[field] || options.default;
  if (!allowed.includes(value)) throw validationError({ [field]: [`Must be one of: ${allowed.join(", ")}`] });
  return value;
}

export const authSchemas = {
  register: schema((input) => ({
    name: stringField(input, "name", { required: true, min: 2, max: 120 }),
    email: stringField(input, "email", { required: true, email: true, max: 255 }).toLowerCase(),
    password: stringField(input, "password", { required: true, min: 8, max: 128 })
  })),
  login: schema((input) => ({
    email: stringField(input, "email", { required: true, email: true, max: 255 }).toLowerCase(),
    password: stringField(input, "password", { required: true, min: 8, max: 128 })
  }))
};

export const leadSearchSchema = schema((input) => {
  const mapLink = stringField(input, "mapLink", { max: 1200 });
  const latitude = optionalCoordinate(input, "latitude", -90, 90);
  const longitude = optionalCoordinate(input, "longitude", -180, 180);
  const hasMapLocation = Boolean(mapLink || (latitude !== null && longitude !== null));
  const country = stringField(input, "country", { max: 80 });
  const countries = stringListField(input, "countries", { max: 80, maxItems: 12 });
  const selectedCountries = [...new Set([country, ...countries].filter(Boolean))];

  if (!hasMapLocation && selectedCountries.length === 0) {
    throw validationError({ country: ["Required unless a Google Maps link or coordinates are provided"] });
  }

  return {
    country: selectedCountries[0] || "",
    countries: selectedCountries,
    state: stringField(input, "state", { max: 80 }),
    city: stringField(input, "city", { max: 80 }),
    zip: stringField(input, "zip", { max: 24 }),
    industry: stringField(input, "industry", { max: 120 }),
    keyword: stringField(input, "keyword", { max: 160 }),
    businessTypes: stringListField(input, "businessTypes", { max: 80, maxItems: 20 }),
    mapLink,
    latitude,
    longitude,
    radiusMeters: numberField(input, "radiusMeters", { int: true, min: 500, max: 50000, default: 15000 }),
    limit: numberField(input, "limit", { int: true, min: 1, max: 50, default: 20 })
  };
});

const stages = ["New", "Contacted", "Follow Up", "Proposal Sent", "Meeting Scheduled", "Negotiation", "Won", "Lost"];

export const crmSchemas = {
  stage: schema((input) => ({
    stage: enumField(input, "stage", stages)
  })),
  note: schema((input) => {
    const rawTags = Array.isArray(input.tags) ? input.tags : [];
    const tags = rawTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12);
    return {
      note: stringField(input, "note", { required: true, min: 1, max: 4000 }),
      tags
    };
  })
};

const outreachTypes = ["cold_email", "follow_up", "website_redesign", "seo", "marketing", "ai_automation", "business_audit"];

export const aiSchemas = {
  chat: schema((input) => ({
    prompt: stringField(input, "prompt", { required: true, min: 1, max: 4000 })
  })),
  analyze: schema((input) => ({
    leadId: stringField(input, "leadId", { required: true, min: 1, max: 160 })
  })),
  outreach: schema((input) => ({
    leadId: stringField(input, "leadId", { required: true, min: 1, max: 160 }),
    type: enumField(input, "type", outreachTypes, { default: "cold_email" })
  }))
};

export const billingSchema = schema((input) => ({
  plan: enumField(input, "plan", ["starter", "professional", "agency"])
}));
