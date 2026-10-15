"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  filterStoresByName,
  linkStore,
  STORES_QUERY_KEY,
  type Store,
} from "@/lib/stores";

export function ExistingStorePicker({
  destinationId,
  stores,
  search,
  onSearchChange,
  onLinked,
}: {
  destinationId: string;
  stores: Store[];
  search: string;
  onSearchChange: (search: string) => void;
  onLinked: () => void;
}) {
  const queryClient = useQueryClient();
  const linkMutation = useMutation({
    mutationFn: (storeId: string) => linkStore(destinationId, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      onLinked();
    },
  });
  const matches = filterStoresByName(stores, search);

  return (
    <div className="flex flex-col gap-2 py-4">
      <Input
        placeholder="搜尋既有店家"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {matches.length === 0 ? (
        <Empty>
          <EmptyDescription>沒有可選的既有店家</EmptyDescription>
        </Empty>
      ) : (
        <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
          {matches.map((store) => (
            <li key={store.id}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={linkMutation.isPending}
                onClick={() => linkMutation.mutate(store.id)}
              >
                {store.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
