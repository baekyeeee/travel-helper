"use client";
import NiceModal from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { type ListId, selectionParsers } from "@/lib/lists";
import { listStores, STORES_QUERY_KEY } from "@/lib/stores";
import { StoreFormModal } from "./store-form-modal";

export function StoreList({
  destinationId,
  listId,
  emptyText,
}: {
  destinationId: string;
  listId: ListId;
  emptyText: string;
}) {
  const { data: stores = [] } = useQuery({
    queryKey: [...STORES_QUERY_KEY, destinationId, listId],
    queryFn: () => listStores(destinationId, listId),
  });
  const [selection, setSelection] = useQueryStates(selectionParsers);

  return (
    <aside className="flex w-64 flex-col gap-2 py-4">
      <Button
        variant="outline"
        onClick={() =>
          NiceModal.show(StoreFormModal, { destinationId, listId })
        }
      >
        <Plus /> 新增店家
      </Button>
      {stores.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {stores.map((store) => (
            <li key={store.id}>
              <Button
                variant={store.id === selection.store ? "secondary" : "ghost"}
                className="w-full justify-start"
                aria-current={store.id === selection.store}
                onClick={() => setSelection({ store: store.id })}
              >
                <span className="truncate">{store.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
