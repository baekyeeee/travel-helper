"use client";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { ITEMS_QUERY_KEY, listItems } from "@/lib/items";
import { type ListId, selectionParsers } from "@/lib/lists";
import { listStores, STORES_QUERY_KEY } from "@/lib/stores";
import { NewItemForm } from "./new-item-form";

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
      <h2 className="font-semibold">{store.name}</h2>
      {/* Keyed so a half-typed name doesn't carry over to another store. */}
      <NewItemForm
        key={store.id}
        destinationId={destinationId}
        storeId={store.id}
      />
      {isPending ? null : items.length === 0 ? (
        <Empty>
          <EmptyDescription>這間店還沒有品項</EmptyDescription>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border px-3 py-2">
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
