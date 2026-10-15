import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { createDestination } from "./destinations";
import { createItem, deleteItem, listItems, updateItem } from "./items";
import { createStore, linkStore } from "./stores";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("items", () => {
  it("lists a created item under its destination and store", async () => {
    const korea = await createDestination("Korea");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    const latte = await createItem(korea.id, starbucks.id, {
      name: "Hojicha Latte",
    });

    expect(latte.name).toBe("Hojicha Latte");
    expect(await listItems(korea.id, starbucks.id)).toEqual([latte]);
  });

  it("keeps each destination's items separate under a shared store", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    const cafe = await createStore(korea.id, "eat", "Cafe");
    await linkStore(japan.id, starbucks.id);
    const latte = await createItem(korea.id, starbucks.id, {
      name: "Hojicha Latte",
    });
    await createItem(japan.id, starbucks.id, { name: "Sakura Frappuccino" });
    await createItem(korea.id, cafe.id, { name: "Croffle" });

    expect(await listItems(korea.id, starbucks.id)).toEqual([latte]);
  });

  it("keeps creation order and trims names, rejecting blank ones", async () => {
    const korea = await createDestination("Korea");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");

    await expect(
      createItem(korea.id, oliveYoung.id, { name: "  " }),
    ).rejects.toThrow();
    await createItem(korea.id, oliveYoung.id, { name: " Sheet Mask " });
    await createItem(korea.id, oliveYoung.id, { name: "Lip Tint" });

    expect(
      (await listItems(korea.id, oliveYoung.id)).map((item) => item.name),
    ).toEqual(["Sheet Mask", "Lip Tint"]);
  });

  it("saves an optional description and photo with the item", async () => {
    const korea = await createDestination("Korea");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");
    const photo = new Blob(["mask-photo"], { type: "image/png" });

    await createItem(korea.id, oliveYoung.id, {
      name: "Sheet Mask",
      description: " 買十片送一片 ",
      photo,
    });

    const [saved] = await listItems(korea.id, oliveYoung.id);
    expect(saved.description).toBe("買十片送一片");
    expect(saved.photo?.type).toBe("image/png");
    expect(await saved.photo?.text()).toBe("mask-photo");
  });

  it("edits an item's name, description and photo in place", async () => {
    const korea = await createDestination("Korea");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");
    const mask = await createItem(korea.id, oliveYoung.id, {
      name: "Sheet Mask",
      description: "十片",
      photo: new Blob(["old"], { type: "image/png" }),
    });
    const tint = await createItem(korea.id, oliveYoung.id, {
      name: "Lip Tint",
    });

    await updateItem(mask.id, {
      name: " Mask Pack ",
      photo: new Blob(["new"], { type: "image/jpeg" }),
    });
    await expect(updateItem(tint.id, { name: " " })).rejects.toThrow();

    const [edited, untouched] = await listItems(korea.id, oliveYoung.id);
    expect(edited.id).toBe(mask.id);
    expect(edited.name).toBe("Mask Pack");
    expect(edited.description).toBeUndefined();
    expect(await edited.photo?.text()).toBe("new");
    expect(untouched).toEqual(tint);
  });

  it("removes the photo when an edit leaves it out", async () => {
    const korea = await createDestination("Korea");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");
    const mask = await createItem(korea.id, oliveYoung.id, {
      name: "Sheet Mask",
      photo: new Blob(["old"], { type: "image/png" }),
    });

    await updateItem(mask.id, { name: "Sheet Mask" });

    const [edited] = await listItems(korea.id, oliveYoung.id);
    expect(edited.photo).toBeUndefined();
  });

  it("deletes only the chosen item", async () => {
    const korea = await createDestination("Korea");
    const oliveYoung = await createStore(korea.id, "buy", "Olive Young");
    const mask = await createItem(korea.id, oliveYoung.id, {
      name: "Sheet Mask",
    });
    const tint = await createItem(korea.id, oliveYoung.id, {
      name: "Lip Tint",
    });

    await deleteItem(mask.id);

    expect(await listItems(korea.id, oliveYoung.id)).toEqual([tint]);
  });

  it("shows nothing for a store without items", async () => {
    const korea = await createDestination("Korea");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");

    expect(await listItems(korea.id, starbucks.id)).toEqual([]);
  });
});
