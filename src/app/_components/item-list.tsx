"use client";
import NiceModal from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { ITEMS_QUERY_KEY, listItems } from "@/lib/items";
import { type ListId, selectionParsers } from "@/lib/lists";
import { listStores, STORES_QUERY_KEY } from "@/lib/stores";
import { DeleteItemModal } from "./delete-item-modal";
import { ItemFormModal } from "./item-form-modal";
import { ItemPhoto } from "./item-photo";

export function ItemList({
  destinationId,
  listId,
}: {
  destinationId: string;
  listId: ListId;
}) {
  const [selection] = useQueryStates(selectionParsers);
  const { data: stores = [] } = useQuery({
    queryKey: [...STORES_QUERY_KEY, destinationId, listId],
    queryFn: () => listStores(destinationId, listId),
  });
  // Only a store shown in this destination's list counts as selected.
  const store = stores.find((store) => store.id === selection.store);
  const storeId = store?.id ?? "";
  const { data: items = [], isPending } = useQuery({
    queryKey: [...ITEMS_QUERY_KEY, destinationId, storeId],
    queryFn: () => listItems(destinationId, storeId),
    enabled: !!store,
  });

  if (!store) {
    return (
      <Empty>
        <EmptyDescription>選擇一個店家來查看品項</EmptyDescription>
      </Empty>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{store.name}</h2>
        <Button
          variant="outline"
          onClick={() =>
            NiceModal.show(ItemFormModal, { destinationId, storeId })
          }
        >
          <Plus /> 新增品項
        </Button>
      </div>
      {isPending ? null : items.length === 0 ? (
        <Empty>
          <EmptyDescription>這間店還沒有品項</EmptyDescription>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-md border p-3"
            >
              {item.photo && (
                <ItemPhoto
                  photo={item.photo}
                  alt={item.name}
                  className="size-16"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                {item.description && (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="flex shrink-0">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`編輯 ${item.name}`}
                  onClick={() =>
                    NiceModal.show(ItemFormModal, {
                      destinationId,
                      storeId,
                      item,
                    })
                  }
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`刪除 ${item.name}`}
                  onClick={() => NiceModal.show(DeleteItemModal, { item })}
                >
                  <Trash2 />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
