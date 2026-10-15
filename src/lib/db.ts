import { type DBSchema, openDB } from "idb";
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
  createdAt: number;
};

interface TravelDb extends DBSchema {
  destinations: { key: string; value: Destination };
  stores: { key: string; value: Store };
  destinationStores: {
    key: [string, string];
    value: DestinationStore;
    indexes: { byDestination: string };
  };
  items: {
    key: string;
    value: Item;
    indexes: { byDestinationStore: [string, string] };
  };
}

export function getDb() {
  return openDB<TravelDb>("travel-helper", 3, {
    upgrade(db) {
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
      if (!db.objectStoreNames.contains("items")) {
        const items = db.createObjectStore("items", { keyPath: "id" });
        items.createIndex("byDestinationStore", ["destinationId", "storeId"]);
      }
    },
  });
}
