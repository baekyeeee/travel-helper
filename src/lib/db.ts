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

interface TravelDb extends DBSchema {
  destinations: { key: string; value: Destination };
  stores: { key: string; value: Store };
  destinationStores: {
    key: [string, string];
    value: DestinationStore;
    indexes: { byDestination: string };
  };
}

export function getDb() {
  return openDB<TravelDb>("travel-helper", 2, {
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
    },
  });
}
