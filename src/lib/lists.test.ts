import { describe, expect, it } from "vitest";
import { LISTS, resolveSelectedDestination } from "./lists";

const destinations = [
  { id: "a", name: "Korea", createdAt: 1 },
  { id: "b", name: "Japan", createdAt: 2 },
];

describe("LISTS", () => {
  it("has the two fixed lists, buy first", () => {
    expect(LISTS.map((list) => list.id)).toEqual(["buy", "eat"]);
    expect(LISTS.map((list) => list.label)).toEqual(["💸", "🐷"]);
  });
});

describe("resolveSelectedDestination", () => {
  it("returns the destination matching the id", () => {
    expect(resolveSelectedDestination(destinations, "b")).toBe(destinations[1]);
  });

  it("returns null when nothing is selected", () => {
    expect(resolveSelectedDestination(destinations, "")).toBeNull();
  });

  it("returns null when the id no longer exists (e.g. deleted)", () => {
    expect(resolveSelectedDestination(destinations, "gone")).toBeNull();
  });
});
