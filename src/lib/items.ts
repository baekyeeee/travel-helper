import { getDb, type Item } from "./db";
import { nextCreatedAt } from "./timestamps";

export type { Item };

export const ITEMS_QUERY_KEY = ["items"];

export type ItemDetails = Pick<Item, "name" | "description" | "photo">;

// Blank descriptions and missing photos are left off the record entirely.
function normalizeDetails({ name, description, photo }: ItemDetails) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Item name must not be blank");
  const trimmedDescription = description?.trim();
  return {
    name: trimmedName,
    ...(trimmedDescription && { description: trimmedDescription }),
    ...(photo && { photo }),
  };
}

export async function createItem(
  destinationId: string,
  storeId: string,
  details: ItemDetails,
): Promise<Item> {
  const item: Item = {
    id: crypto.randomUUID(),
    destinationId,
    storeId,
    ...normalizeDetails(details),
    createdAt: nextCreatedAt(),
  };
  const db = await getDb();
  await db.put("items", item);
  return item;
}

export async function listItems(
  destinationId: string,
  storeId: string,
): Promise<Item[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex("items", "byDestinationStore", [
    destinationId,
    storeId,
  ]);
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateItem(id: string, details: ItemDetails) {
  const normalized = normalizeDetails(details);
  const db = await getDb();
  const tx = db.transaction("items", "readwrite");
  const existing = await tx.store.get(id);
  if (!existing) throw new Error(`Item ${id} not found`);
  // Keep everything else on the record; a blank description or no photo clears it.
  const { description: _description, photo: _photo, ...kept } = existing;
  await tx.store.put({ ...kept, ...normalized });
  await tx.done;
}

export async function deleteItem(id: string) {
  const db = await getDb();
  await db.delete("items", id);
}
