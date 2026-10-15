import { getDb, type Store } from "./db";
import type { ListId } from "./lists";
import { nextCreatedAt } from "./timestamps";

export type { Store };

export const STORES_QUERY_KEY = ["stores"];

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

export async function removeDestinationStores(destinationId: string) {
  const db = await getDb();
  const tx = db.transaction("destinationStores", "readwrite");
  const keys = await tx.store.index("byDestination").getAllKeys(destinationId);
  await Promise.all(keys.map((key) => tx.store.delete(key)));
  await tx.done;
}
