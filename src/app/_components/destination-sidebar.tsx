"use client";
import NiceModal from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESTINATIONS_QUERY_KEY, listDestinations } from "@/lib/destinations";
import { DeleteDestinationModal } from "./delete-destination-modal";
import { DestinationFormModal } from "./destination-form-modal";

export function DestinationSidebar() {
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: DESTINATIONS_QUERY_KEY,
    queryFn: listDestinations,
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-semibold">目的地</h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label="新增目的地"
          onClick={() => NiceModal.show(DestinationFormModal)}
        >
          <Plus />
        </Button>
      </div>
      <ul className="flex flex-col gap-1 px-2">
        {destinations.map((destination) => (
          <li
            key={destination.id}
            className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted"
          >
            <span className="truncate">{destination.name}</span>
            <span className="flex shrink-0">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`重新命名 ${destination.name}`}
                onClick={() =>
                  NiceModal.show(DestinationFormModal, { destination })
                }
              >
                <Pencil />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`刪除 ${destination.name}`}
                onClick={() =>
                  NiceModal.show(DeleteDestinationModal, { destination })
                }
              >
                <Trash2 />
              </Button>
            </span>
          </li>
        ))}
      </ul>
      {!isLoading && destinations.length === 0 && (
        <p className="px-4 text-sm text-muted-foreground">
          還沒有目的地，按 + 新增一個
        </p>
      )}
    </aside>
  );
}
