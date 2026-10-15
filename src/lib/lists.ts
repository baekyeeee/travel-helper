import { parseAsString, parseAsStringLiteral } from "nuqs";
import type { Destination } from "./destinations";

export const LISTS = [
  { id: "buy", label: "💸", emptyText: "還沒有想買的東西" },
  { id: "eat", label: "🐷", emptyText: "還沒有想吃的店家" },
] as const;

export type ListId = (typeof LISTS)[number]["id"];

const LIST_IDS = LISTS.map((list) => list.id);

// Selection lives in the URL so switching lists keeps the selected destination.
export const selectionParsers = {
  destination: parseAsString.withDefault(""),
  list: parseAsStringLiteral(LIST_IDS).withDefault("buy"),
  store: parseAsString.withDefault(""),
};

export function resolveSelectedDestination(
  destinations: Destination[],
  id: string,
) {
  return destinations.find((destination) => destination.id === id) ?? null;
}
