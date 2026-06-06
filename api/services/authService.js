import crypto from "node:crypto";
import { promisify } from "node:util";
import { env } from "../config/env.js";
import { isFirebaseAuthConfigured } from "../config/firebase.js";
import { FirestoreRepository } from "../repositories/firestoreRepository.js";
import { AppError } from "../utils/errors.js";
import { applyAdminEntitlements } from "../utils/entitlements.js";
import { signAccessToken, signRefreshToken } from "../middleware/auth.js";

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
  const [scheme, salt, key] = String(passwordHash).split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

export class AuthService {
  constructor() {
    this.users = new FirestoreRepository("users");
  }

  isOwnerLogin(email, password) {
    return email.toLowerCase() === env.owner.email && password === env.owner.password;
  }

  ownerSession() {
    const user = applyAdminEntitlements({
      uid: "owner",
      name: "Owner",
      email: env.owner.email,
      role: "admin",
      subscription: "enterprise",
      billingStatus: "owner_free",
      monthlyLeadLimit: null
    });

    return {
      user,
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken({ ...user, tokenVersion: 1 })
    };
  }

  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase();
    let user;

    if (isFirebaseAuthConfigured()) {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${env.firebase.webApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          returnSecureToken: true
        })
      });
      if (!response.ok) throw new AppError("Unable to create Firebase account.", 400, "FIREBASE_SIGNUP_FAILED");
      const payload = await response.json();
      user = {
        uid: payload.localId,
        name,
        email: normalizedEmail,
        role: "user",
        idToken: payload.idToken,
        firebaseRefreshToken: payload.refreshToken
      };
    } else {
      const existing = await this.users.list({
        where: [{ field: "email", op: "==", value: normalizedEmail }],
        limit: 1
      });
      if (existing.length) throw new AppError("Account already exists.", 409, "ACCOUNT_EXISTS");
      const passwordHash = await hashPassword(password);
      user = await this.users.create({ name, email: normalizedEmail, passwordHash, role: "user", tokenVersion: 1 });
    }

    await this.users.upsert(user.uid || user.id, {
      uid: user.uid || user.id,
      name,
      email: normalizedEmail,
      role: user.role,
      subscription: "starter",
      emailVerified: false,
      tokenVersion: user.tokenVersion || 1
    });

    return {
      user: applyAdminEntitlements({ uid: user.uid || user.id, name, email: normalizedEmail, role: user.role }),
      idToken: user.idToken,
      firebaseRefreshToken: user.firebaseRefreshToken,
      accessToken: signAccessToken({ uid: user.uid || user.id, email: normalizedEmail, role: user.role }),
      refreshToken: signRefreshToken({ uid: user.uid || user.id, tokenVersion: user.tokenVersion || 1 })
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase();

    if (this.isOwnerLogin(normalizedEmail, password)) {
      return this.ownerSession();
    }

    if (env.firebase.webApiKey) {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebase.webApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          returnSecureToken: true
        })
      });

      if (!response.ok) throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
      const payload = await response.json();
      const user = applyAdminEntitlements({ uid: payload.localId, email: normalizedEmail, role: "user" });
      return {
        user,
        idToken: payload.idToken,
        firebaseRefreshToken: payload.refreshToken,
        accessToken: signAccessToken(user),
        refreshToken: signRefreshToken(user)
      };
    }

    const users = await this.users.list({
      where: [{ field: "email", op: "==", value: normalizedEmail }],
      limit: 1
    });
    const user = users[0];
    if (!user || !user.passwordHash) throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");

    const entitledUser = applyAdminEntitlements({
      uid: user.uid || user.id,
      name: user.name,
      email: normalizedEmail,
      role: user.role || "user",
      subscription: user.subscription,
      billingStatus: user.billingStatus,
      permissions: user.permissions
    });

    return {
      user: entitledUser,
      accessToken: signAccessToken(entitledUser),
      refreshToken: signRefreshToken({ uid: user.uid || user.id, tokenVersion: user.tokenVersion || 1 })
    };
  }
}
