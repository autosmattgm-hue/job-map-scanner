export const plans = {
  starter: {
    name: "Starter",
    monthlyLeadLimit: 100,
    priceUsd: 29,
    stripePriceEnv: "STRIPE_STARTER_PRICE_ID"
  },
  professional: {
    name: "Professional",
    monthlyLeadLimit: 1000,
    priceUsd: 99,
    stripePriceEnv: "STRIPE_PRO_PRICE_ID"
  },
  agency: {
    name: "Agency",
    monthlyLeadLimit: null,
    priceUsd: 249,
    stripePriceEnv: "STRIPE_AGENCY_PRICE_ID"
  },
  enterprise: {
    name: "Enterprise",
    monthlyLeadLimit: null,
    priceUsd: null,
    stripePriceEnv: null
  }
};

export function getPlan(planKey) {
  return plans[planKey];
}
