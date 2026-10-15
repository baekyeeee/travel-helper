import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { createDestination, deleteDestination } from "./destinations";
import { createItem, listItems } from "./items";
import {
  createStore,
  filterStoresByName,
  linkStore,
  listLinkableStores,
  listStores,
  removeStoreFromDestination,
  renameStore,
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

  it("filters stores by a case-insensitive, trimmed name search", async () => {
    const korea = await createDestination("Korea");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    const cafe = await createStore(korea.id, "eat", "Cafe");

    expect(filterStoresByName([starbucks, cafe], " STAR ")).toEqual([
      starbucks,
    ]);
    expect(filterStoresByName([starbucks, cafe], "")).toEqual([
      starbucks,
      cafe,
    ]);
  });

  it("renames a shared store everywhere it is used", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    await linkStore(japan.id, starbucks.id);

    await renameStore(starbucks.id, " Starbucks Reserve ");
    await expect(renameStore(starbucks.id, "  ")).rejects.toThrow();

    for (const destination of [korea, japan]) {
      expect(
        (await listStores(destination.id, "eat")).map((s) => s.name),
      ).toEqual(["Starbucks Reserve"]);
    }
  });

  it("removes a shared store from one destination only, with that destination's items", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    await linkStore(japan.id, starbucks.id);
    await createItem(korea.id, starbucks.id, { name: "Hojicha Latte" });
    const sakura = await createItem(japan.id, starbucks.id, {
      name: "Sakura Frappuccino",
    });

    await removeStoreFromDestination(korea.id, starbucks.id);

    expect(await listStores(korea.id, "eat")).toEqual([]);
    expect(await listItems(korea.id, starbucks.id)).toEqual([]);
    expect(await listStores(japan.id, "eat")).toEqual([starbucks]);
    expect(await listItems(japan.id, starbucks.id)).toEqual([sakura]);
  });

  it("deletes a store from the catalog once no destination uses it", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    await removeStoreFromDestination(korea.id, starbucks.id);

    expect(await listLinkableStores(japan.id, "eat")).toEqual([]);
    await expect(linkStore(japan.id, starbucks.id)).rejects.toThrow();
  });

  it("cleans up like unlinking each store when a destination is deleted", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const taiwan = await createDestination("Taiwan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");
    await linkStore(japan.id, starbucks.id);
    await createItem(korea.id, starbucks.id, { name: "Hojicha Latte" });

    await deleteDestination(korea.id);

    expect(await listItems(korea.id, starbucks.id)).toEqual([]);
    expect(await listStores(japan.id, "eat")).toEqual([starbucks]);
    expect(await listLinkableStores(taiwan.id, "buy")).toEqual([]);
    await expect(linkStore(taiwan.id, oliveYoung.id)).rejects.toThrow();
  });
});
