import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { createDestination, deleteDestination } from "./destinations";
import {
  createStore,
  linkStore,
  listLinkableStores,
  listStores,
} from "./stores";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("stores", () => {
  it("lists a created store under its destination and list", async () => {
    const korea = await createDestination("Korea");

    const starbucks = await createStore(korea.id, "buy", "Starbucks");

    expect(starbucks.name).toBe("Starbucks");
    expect(starbucks.listId).toBe("buy");
    expect(await listStores(korea.id, "buy")).toEqual([starbucks]);
  });

  it("only lists stores of the selected destination and list", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");
    await createStore(korea.id, "eat", "Starbucks");
    await createStore(japan.id, "buy", "Don Quijote");

    expect(await listStores(korea.id, "buy")).toEqual([oliveYoung]);
  });

  it("keeps creation order and trims names, rejecting blank ones", async () => {
    const korea = await createDestination("Korea");

    await expect(createStore(korea.id, "eat", "  ")).rejects.toThrow();
    await createStore(korea.id, "eat", " Tteokbokki ");
    await createStore(korea.id, "eat", "Cafe");

    expect((await listStores(korea.id, "eat")).map((s) => s.name)).toEqual([
      "Tteokbokki",
      "Cafe",
    ]);
  });

  it("drops a deleted destination's stores from its lists", async () => {
    const korea = await createDestination("Korea");
    await createStore(korea.id, "buy", "Starbucks");

    await deleteDestination(korea.id);

    expect(await listStores(korea.id, "buy")).toEqual([]);
  });

  it("reuses an existing store under another destination without duplicating it", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    await linkStore(japan.id, starbucks.id);

    expect(await listStores(japan.id, "eat")).toEqual([starbucks]);
    expect(await listStores(korea.id, "eat")).toEqual([starbucks]);
    expect(await listStores(japan.id, "buy")).toEqual([]);
  });

  it("offers only same-list stores not yet in the destination", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    await createStore(korea.id, "buy", "Olive Young");
    await createStore(japan.id, "eat", "Ichiran");

    expect(await listLinkableStores(japan.id, "eat")).toEqual([starbucks]);
  });

  it("ignores linking the same store to a destination twice", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    await linkStore(japan.id, starbucks.id);
    await linkStore(japan.id, starbucks.id);

    expect(await listStores(japan.id, "eat")).toEqual([starbucks]);
  });
});
