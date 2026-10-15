"use client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ITEMS_QUERY_KEY } from "@/lib/items";
import { selectionParsers } from "@/lib/lists";
import {
  removeStoreFromDestination,
  STORES_QUERY_KEY,
  type Store,
} from "@/lib/stores";

export const RemoveStoreModal = NiceModal.create<{
  destinationId: string;
  store: Store;
}>(({ destinationId, store }) => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useQueryStates(selectionParsers);
  const mutation = useMutation({
    mutationFn: () => removeStoreFromDestination(destinationId, store.id),
    onSuccess: () => {
      if (selection.store === store.id) setSelection({ store: null });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      modal.hide();
    },
  });

  return (
    <AlertDialog
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移除「{store.name}」？</AlertDialogTitle>
          <AlertDialogDescription>
            這個目的地在這家店的品項會一併刪除，其他目的地不受影響。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
