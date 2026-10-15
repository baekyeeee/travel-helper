"use client";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DESTINATIONS_QUERY_KEY, listDestinations } from "@/lib/destinations";
import {
  LISTS,
  type ListId,
  resolveSelectedDestination,
  selectionParsers,
} from "@/lib/lists";

import { StoreList } from "./store-list";

export function DestinationPanel() {
  const [selection, setSelection] = useQueryStates(selectionParsers);
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: DESTINATIONS_QUERY_KEY,
    queryFn: listDestinations,
  });
  const destination = resolveSelectedDestination(
    destinations,
    selection.destination,
  );

  if (!destination) {
    return (
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        {!isLoading && "選擇或新增一個目的地"}
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{destination.name}</h1>
      <Tabs
        value={selection.list}
        onValueChange={(list) => setSelection({ list: list as ListId })}
      >
        <TabsList>
          {LISTS.map((list) => (
            <TabsTrigger key={list.id} value={list.id}>
              {list.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {LISTS.map((list) => (
          <TabsContent key={list.id} value={list.id}>
            <StoreList
              destinationId={destination.id}
              listId={list.id}
              emptyText={list.emptyText}
            />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
