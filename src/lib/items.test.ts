import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { createDestination } from "./destinations";
import { createItem, listItems } from "./items";
import { createStore, linkStore } from "./stores";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("items", () => {
  it("lists a created item under its destination and store", async () => {
    const korea = await createDestination("Korea");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    const latte = await createItem(korea.id, starbucks.id, "Hojicha Latte");

    expect(latte.name).toBe("Hojicha Latte");
    expect(await listItems(korea.id, starbucks.id)).toEqual([latte]);
  });

  it("keeps each destination's items separate under a shared store", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    const cafe = await createStore(korea.id, "eat", "Cafe");
    await linkStore(japan.id, starbucks.id);
    const latte = await createItem(korea.id, starbucks.id, "Hojicha Latte");
    await createItem(japan.id, starbucks.id, "Sakura Frappuccino");
    await createItem(korea.id, cafe.id, "Croffle");

    expect(await listItems(korea.id, starbucks.id)).toEqual([latte]);
  });

  it("keeps creation order and trims names, rejecting blank ones", async () => {
    const korea = await createDestination("Korea");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");

    await expect(createItem(korea.id, oliveYoung.id, "  ")).rejects.toThrow();
    await createItem(korea.id, oliveYoung.id, " Sheet Mask ");
    await createItem(korea.id, oliveYoung.id, "Lip Tint");

    expect(
      (await listItems(korea.id, oliveYoung.id)).map((item) => item.name),
    ).toEqual(["Sheet Mask", "Lip Tint"]);
  });

  it("shows nothing for a store without items", async () => {
    const korea = await createDestination("Korea");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    expect(await listItems(korea.id, starbucks.id)).toEqual([]);
  });
});
