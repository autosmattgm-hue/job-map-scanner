import { env } from "../config/env.js";
import { getPlan } from "../config/plans.js";
import { AppError } from "../utils/errors.js";
import { isAdminUser } from "../utils/entitlements.js";

function cents(usd) {
  return Math.round(usd * 100);
}

function paypalBaseUrl() {
  return env.paypal.env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export class BillingService {
  async createStripePaymentIntent(planKey, user, idempotencyKey) {
    const plan = getPlan(planKey);
    if (!plan) throw new AppError("Unknown plan.", 422, "UNKNOWN_PLAN");
    if (isAdminUser(user)) {
      return {
        configured: true,
        included: true,
        provider: "stripe",
        plan: "enterprise",
        message: "Admin unlimited access is active. Billing is not required."
      };
    }
    if (!env.stripe.secretKey) {
      throw new AppError("Real Stripe billing requires STRIPE_SECRET_KEY in .env.", 503, "STRIPE_NOT_CONFIGURED");
    }

    const body = new URLSearchParams({
      amount: String(cents(plan.priceUsd)),
      currency: "usd",
      "automatic_payment_methods[enabled]": "true",
      "metadata[plan]": planKey,
      "metadata[userId]": user?.uid || "anonymous"
    });

    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.stripe.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
      },
      body
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new AppError("Stripe payment intent failed.", response.status, "STRIPE_PAYMENT_ERROR", payload.slice(0, 400));
    }

    const paymentIntent = await response.json();
    return {
      configured: true,
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    };
  }

  async createPaypalOrder(planKey, user) {
    const plan = getPlan(planKey);
    if (!plan) throw new AppError("Unknown plan.", 422, "UNKNOWN_PLAN");
    if (isAdminUser(user)) {
      return {
        configured: true,
        included: true,
        provider: "paypal",
        plan: "enterprise",
        message: "Admin unlimited access is active. Billing is not required."
      };
    }
    if (!env.paypal.clientId || !env.paypal.clientSecret) {
      throw new AppError("Real PayPal billing requires PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.", 503, "PAYPAL_NOT_CONFIGURED");
    }

    const tokenResponse = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${env.paypal.clientId}:${env.paypal.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    if (!tokenResponse.ok) {
      throw new AppError("PayPal OAuth failed.", tokenResponse.status, "PAYPAL_OAUTH_ERROR");
    }

    const token = await tokenResponse.json();
    const orderResponse = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${user?.uid || "anonymous"}-${planKey}-${Date.now()}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `${planKey}-${user?.uid || "anonymous"}`,
          amount: {
            currency_code: "USD",
            value: String(plan.priceUsd)
          }
        }]
      })
    });

    if (!orderResponse.ok) {
      throw new AppError("PayPal order creation failed.", orderResponse.status, "PAYPAL_ORDER_ERROR");
    }

    const order = await orderResponse.json();
    return { configured: true, orderId: order.id, links: order.links };
  }
}
