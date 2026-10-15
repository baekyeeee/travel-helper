// @vitest-environment jsdom
import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDestination } from "@/lib/destinations";
import { createStore, listStores } from "@/lib/stores";
import { StoreFormModal } from "./store-form-modal";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

afterEach(cleanup);

function openModal(destinationId: string, listId: "buy" | "eat") {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <NuqsTestingAdapter>
        <NiceModal.Provider>
          <div />
        </NiceModal.Provider>
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
  act(() => {
    NiceModal.show(StoreFormModal, { destinationId, listId });
  });
}

describe("StoreFormModal", () => {
  it("starts on creating a store when there is nothing to reuse", async () => {
    const korea = await createDestination("Korea");

    openModal(korea.id, "eat");

    expect(await screen.findByLabelText("名稱")).toBeTruthy();
  });

  it("links an existing store picked from the search results", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    const starbucks = await createStore(korea.id, "eat", "Starbucks");
    await createStore(korea.id, "eat", "Cafe");
    const user = userEvent.setup();

    openModal(japan.id, "eat");
    await user.type(await screen.findByPlaceholderText("搜尋既有店家"), "star");
    expect(screen.queryByRole("button", { name: "Cafe" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Starbucks" }));

    await waitFor(async () =>
      expect(await listStores(japan.id, "eat")).toEqual([starbucks]),
    );
  });

  it("shows an empty message when the search matches nothing", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    await createStore(korea.id, "eat", "Starbucks");
    const user = userEvent.setup();

    openModal(japan.id, "eat");
    await user.type(await screen.findByPlaceholderText("搜尋既有店家"), "zzz");

    expect(screen.getByText("沒有可選的既有店家")).toBeTruthy();
  });

  it("creates a new store from the other tab", async () => {
    const korea = await createDestination("Korea");
    const japan = await createDestination("Japan");
    await createStore(korea.id, "eat", "Starbucks");
    const user = userEvent.setup();

    openModal(japan.id, "eat");
    await user.click(await screen.findByRole("tab", { name: "建立新店家" }));
    await user.type(screen.getByLabelText("名稱"), "Ichiran");
    await user.click(screen.getByRole("button", { name: "儲存" }));

    await waitFor(async () =>
      expect((await listStores(japan.id, "eat")).map((s) => s.name)).toEqual([
        "Ichiran",
      ]),
    );
  });
});
