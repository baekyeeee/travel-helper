import { getDb, type Store } from "./db";
import type { ListId } from "./lists";

export type { Store };

export const STORES_QUERY_KEY = ["stores"];

// Strictly increasing so stores created in the same millisecond keep their order.
let lastCreatedAt = 0;
function nextCreatedAt() {
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  return lastCreatedAt;
}

export async function createStore(
  destinationId: string,
  listId: ListId,
  name: string,
): Promise<Store> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Store name must not be blank");
  const createdAt = nextCreatedAt();
  const store: Store = {
    id: crypto.randomUUID(),
    name: trimmed,
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
