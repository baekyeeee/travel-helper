import { CLEANUP_STORES, type CleanupTx, getDb, type Store } from "./db";
import type { ListId } from "./lists";
import { nextCreatedAt } from "./timestamps";

export type { Store };

export const STORES_QUERY_KEY = ["stores"];

function normalizeName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Store name must not be blank");
  return trimmed;
}

export async function createStore(
  destinationId: string,
  listId: ListId,
  name: string,
): Promise<Store> {
  const createdAt = nextCreatedAt();
  const store: Store = {
    id: crypto.randomUUID(),
    name: normalizeName(name),
    listId,
    createdAt,
  };
  const db = await getDb();
  const tx = db.transaction(["stores", "destinationStores"], "readwrite");
  await tx.objectStore("stores").put(store);
  await tx
    .objectStore("destinationStores")
    .put({ destinationId, storeId: store.id, createdAt });
  await tx.done;
  return store;
}

export async function renameStore(id: string, name: string) {
  const normalized = normalizeName(name);
  const db = await getDb();
  const tx = db.transaction("stores", "readwrite");
  const existing = await tx.store.get(id);
  if (!existing) throw new Error(`Store ${id} not found`);
  await tx.store.put({ ...existing, name: normalized });
  await tx.done;
}

export async function listStores(
  destinationId: string,
  listId: ListId,
): Promise<Store[]> {
  const db = await getDb();
  const links = await db.getAllFromIndex(
    "destinationStores",
    "byDestination",
    destinationId,
  );
  const stores = await Promise.all(
    links.map((link) => db.get("stores", link.storeId)),
  );
  return stores
    .filter((store): store is Store => store?.listId === listId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function listLinkableStores(
  destinationId: string,
  listId: ListId,
): Promise<Store[]> {
  const db = await getDb();
  const [stores, links] = await Promise.all([
    db.getAll("stores"),
    db.getAllFromIndex("destinationStores", "byDestination", destinationId),
  ]);
  const linked = new Set(links.map((link) => link.storeId));
  return stores
    .filter((store) => store.listId === listId && !linked.has(store.id))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function filterStoresByName(stores: Store[], query: string): Store[] {
  const needle = query.trim().toLowerCase();
  return stores.filter((store) => store.name.toLowerCase().includes(needle));
}

export async function linkStore(destinationId: string, storeId: string) {
  const db = await getDb();
  const tx = db.transaction(["stores", "destinationStores"], "readwrite");
  if (!(await tx.objectStore("stores").get(storeId))) {
    throw new Error("Store does not exist");
  }
  const links = tx.objectStore("destinationStores");
  if (!(await links.get([destinationId, storeId]))) {
    await links.put({ destinationId, storeId, createdAt: nextCreatedAt() });
  }
  await tx.done;
}

export async function removeStoreFromDestination(
  destinationId: string,
  storeId: string,
) {
  const db = await getDb();
  const tx = db.transaction(CLEANUP_STORES, "readwrite");
  await unlinkInTx(tx, destinationId, storeId);
  await tx.done;
}

// Drops the link and that Destination's Items under the Store; the shared Store
// itself is only deleted once no Destination links it any more.
async function unlinkInTx(
  tx: CleanupTx,
  destinationId: string,
  storeId: string,
) {
  const links = tx.objectStore("destinationStores");
  await links.delete([destinationId, storeId]);
  const items = tx.objectStore("items");
  const itemKeys = await items
    .index("byDestinationStore")
    .getAllKeys([destinationId, storeId]);
  await Promise.all(itemKeys.map((key) => items.delete(key)));
  if ((await links.index("byStore").count(storeId)) === 0) {
    await tx.objectStore("stores").delete(storeId);
  }
}

export async function removeDestinationStores(
  tx: CleanupTx,
  destinationId: string,
) {
  const storeIds = await tx
    .objectStore("destinationStores")
    .index("byDestination")
    .getAll(destinationId);
  for (const { storeId } of storeIds) {
    await unlinkInTx(tx, destinationId, storeId);
  }
}
