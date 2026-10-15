import { type DBSchema, type IDBPTransaction, openDB } from "idb";
import type { Destination } from "./destinations";
import type { ListId } from "./lists";

export type Store = {
  id: string;
  name: string;
  listId: ListId;
  createdAt: number;
};

// Stores are a shared catalog; a link row places a Store under a Destination.
export type DestinationStore = {
  destinationId: string;
  storeId: string;
  createdAt: number;
};

// Items belong to one Destination's use of a Store, so they're keyed by the pair.
export type Item = {
  id: string;
  destinationId: string;
  storeId: string;
  name: string;
  description?: string;
  photo?: Blob;
  createdAt: number;
};

interface TravelDb extends DBSchema {
  destinations: { key: string; value: Destination };
  stores: { key: string; value: Store };
  destinationStores: {
    key: [string, string];
    value: DestinationStore;
    indexes: { byDestination: string; byStore: string };
  };
  items: {
    key: string;
    value: Item;
    indexes: { byDestinationStore: [string, string] };
  };
}

type CleanupStore = "destinations" | "stores" | "destinationStores" | "items";

// A read-write transaction over every store that removing a Store link touches.
export type CleanupTx = IDBPTransaction<
  TravelDb,
  ArrayLike<CleanupStore>,
  "readwrite"
>;

export const CLEANUP_STORES = [
  "destinations",
  "stores",
  "destinationStores",
  "items",
] as const satisfies CleanupStore[];

export function getDb() {
  return openDB<TravelDb>("travel-helper", 4, {
    upgrade(db, _oldVersion, _newVersion, tx) {
      if (!db.objectStoreNames.contains("destinations")) {
        db.createObjectStore("destinations", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("stores")) {
        db.createObjectStore("stores", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("destinationStores")) {
        const links = db.createObjectStore("destinationStores", {
          keyPath: ["destinationId", "storeId"],
        });
        links.createIndex("byDestination", "destinationId");
      }
      const links = tx.objectStore("destinationStores");
      if (!links.indexNames.contains("byStore")) {
        links.createIndex("byStore", "storeId");
      }
      if (!db.objectStoreNames.contains("items")) {
        const items = db.createObjectStore("items", { keyPath: "id" });
        items.createIndex("byDestinationStore", ["destinationId", "storeId"]);
      }
    },
    // Let a newer version (another tab, or a hot reload) upgrade instead of hanging.
    blocking(_currentVersion, _blockedVersion, event) {
      (event.target as IDBDatabase).close();
    },
  });
}
