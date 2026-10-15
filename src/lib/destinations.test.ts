import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createDestination,
  deleteDestination,
  listDestinations,
  renameDestination,
} from "./destinations";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("destinations", () => {
  it("lists a created destination", async () => {
    const created = await createDestination("Korea");

    expect(created.name).toBe("Korea");
    expect(await listDestinations()).toEqual([created]);
  });

  it("renames an existing destination", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");

    await renameDestination(korea.id, "Seoul");

    expect((await listDestinations()).map((d) => d.name)).toEqual([
      "Seoul",
      "Japan",
    ]);
    expect(japan.name).toBe("Japan");
  });

  it("deletes only the given destination", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");

    await deleteDestination(korea.id);

    expect(await listDestinations()).toEqual([japan]);
  });

  it("rejects blank names and trims surrounding whitespace", async () => {
    await expect(createDestination("   ")).rejects.toThrow();

    const korea = await createDestination("  Korea ");
    expect(korea.name).toBe("Korea");

    await expect(renameDestination(korea.id, "")).rejects.toThrow();
    await renameDestination(korea.id, " Seoul ");
    expect((await listDestinations())[0].name).toBe("Seoul");
  });
});
