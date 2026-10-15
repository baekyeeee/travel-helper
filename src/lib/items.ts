import { getDb, type Item } from "./db";
import { nextCreatedAt } from "./timestamps";

export type { Item };

export const ITEMS_QUERY_KEY = ["items"];

export async function createItem(
  destinationId: string,
  storeId: string,
  name: string,
): Promise<Item> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Item name must not be blank");
  const item: Item = {
    id: crypto.randomUUID(),
    destinationId,
    storeId,
    name: trimmed,
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
