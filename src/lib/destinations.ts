import { getDb } from "./db";

export type Destination = {
  id: string;
  name: string;
  createdAt: number;
};

export const DESTINATIONS_QUERY_KEY = ["destinations"];

// Strictly increasing so destinations created in the same millisecond keep their order.
let lastCreatedAt = 0;
function nextCreatedAt() {
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  return lastCreatedAt;
}

function normalizeName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Destination name must not be blank");
  return trimmed;
}

export async function createDestination(name: string): Promise<Destination> {
  const destination: Destination = {
    id: crypto.randomUUID(),
    name: normalizeName(name),
    createdAt: nextCreatedAt(),
  };
  const db = await getDb();
  await db.put("destinations", destination);
  return destination;
}

export async function listDestinations(): Promise<Destination[]> {
  const db = await getDb();
  const destinations = await db.getAll("destinations");
  return destinations.sort((a, b) => a.createdAt - b.createdAt);
}

export async function renameDestination(id: string, name: string) {
  const normalized = normalizeName(name);
  const db = await getDb();
  const tx = db.transaction("destinations", "readwrite");
  const existing = await tx.store.get(id);
  if (!existing) throw new Error(`Destination ${id} not found`);
  await tx.store.put({ ...existing, name: normalized });
  await tx.done;
}

export async function deleteDestination(id: string) {
  const db = await getDb();
  const tx = db.transaction(["destinations", "destinationStores"], "readwrite");
  await tx.objectStore("destinations").delete(id);
  const links = tx.objectStore("destinationStores");
  for (const key of await links.index("byDestination").getAllKeys(id)) {
    await links.delete(key);
  }
  await tx.done;
}
