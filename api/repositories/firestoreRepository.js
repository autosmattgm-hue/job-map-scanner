import { randomUUID } from "node:crypto";
import { firestoreClient } from "../config/firebase.js";

const memoryStore = new Map();

function collectionStore(name) {
  if (!memoryStore.has(name)) memoryStore.set(name, new Map());
  return memoryStore.get(name);
}

function applyWhere(items, where = []) {
  return items.filter((item) => where.every(({ field, op, value }) => {
    if (op !== "==") return true;
    return item[field] === value;
  }));
}

export class FirestoreRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  client() {
    return firestoreClient();
  }

  async create(data) {
    const id = data.id || randomUUID();
    const now = new Date().toISOString();
    const payload = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };

    const client = this.client();
    if (client) {
      return client.set(this.collectionName, id, payload);
    }

    collectionStore(this.collectionName).set(id, payload);
    return payload;
  }

  async upsert(id, data) {
    const now = new Date().toISOString();
    const existing = await this.findById(id);
    const payload = { ...(existing || {}), ...data, id, updatedAt: now, createdAt: existing?.createdAt || now };

    const client = this.client();
    if (client) {
      return client.set(this.collectionName, id, payload);
    }

    collectionStore(this.collectionName).set(id, payload);
    return payload;
  }

  async findById(id) {
    const client = this.client();
    if (client) {
      return client.get(this.collectionName, id);
    }

    return collectionStore(this.collectionName).get(id) || null;
  }

  async list({ where = [], limit = 50, orderBy = "updatedAt" } = {}) {
    const client = this.client();
    if (client) {
      const items = await client.list(this.collectionName, { limit: Math.max(limit, 100) });
      return applyWhere(items, where)
        .sort((a, b) => String(b[orderBy] || "").localeCompare(String(a[orderBy] || "")))
        .slice(0, limit);
    }

    const items = Array.from(collectionStore(this.collectionName).values());
    return applyWhere(items, where)
      .sort((a, b) => String(b[orderBy] || "").localeCompare(String(a[orderBy] || "")))
      .slice(0, limit);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;
    return this.upsert(id, { ...existing, ...data });
  }
}
