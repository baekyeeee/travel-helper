"use client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListId } from "@/lib/lists";
import { listLinkableStores, STORES_QUERY_KEY } from "@/lib/stores";
import { ExistingStorePicker } from "./existing-store-picker";
import { NewStoreForm } from "./new-store-form";

type Mode = "existing" | "new";

export const StoreFormModal = NiceModal.create<{
  destinationId: string;
  listId: ListId;
}>(({ destinationId, listId }) => {
  const modal = useModal();
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [search, setSearch] = useQueryState(
    "storeSearch",
    parseAsString.withDefault(""),
  );

  const { data: linkable = [] } = useQuery({
    queryKey: [...STORES_QUERY_KEY, "linkable", destinationId, listId],
    queryFn: () => listLinkableStores(destinationId, listId),
  });
  // Fresh catalogs have nothing to pick, so start on creating a store.
  const mode = chosenMode ?? (linkable.length > 0 ? "existing" : "new");

  // The search term is only meaningful while the dialog is open.
  const close = () => {
    setSearch(null);
    modal.hide();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增店家</DialogTitle>
        </DialogHeader>
        <Tabs
          value={mode}
          onValueChange={(value) => setChosenMode(value as Mode)}
        >
          <TabsList>
            <TabsTrigger value="existing">使用既有店家</TabsTrigger>
            <TabsTrigger value="new">建立新店家</TabsTrigger>
          </TabsList>
          <TabsContent value="existing">
            <ExistingStorePicker
              destinationId={destinationId}
              stores={linkable}
              search={search}
              onSearchChange={setSearch}
              onLinked={close}
            />
          </TabsContent>
          <TabsContent value="new">
            <NewStoreForm
              destinationId={destinationId}
              listId={listId}
              onCreated={close}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
