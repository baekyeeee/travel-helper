"use client";
import NiceModal from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { type ListId, selectionParsers } from "@/lib/lists";
import { listStores, STORES_QUERY_KEY } from "@/lib/stores";
import { RemoveStoreModal } from "./remove-store-modal";
import { RenameStoreModal } from "./rename-store-modal";
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
            <li
              key={store.id}
              className="flex items-center rounded-md hover:bg-muted data-[selected=true]:bg-secondary"
              data-selected={store.id === selection.store}
            >
              <Button
                variant="ghost"
                className="min-w-0 flex-1 justify-start hover:bg-transparent"
                aria-current={store.id === selection.store}
                onClick={() => setSelection({ store: store.id })}
              >
                <span className="truncate">{store.name}</span>
              </Button>
              <span className="flex shrink-0">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`重新命名 ${store.name}`}
                  onClick={() => NiceModal.show(RenameStoreModal, { store })}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`移除 ${store.name}`}
                  onClick={() =>
                    NiceModal.show(RemoveStoreModal, { destinationId, store })
                  }
                >
                  <Trash2 />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
