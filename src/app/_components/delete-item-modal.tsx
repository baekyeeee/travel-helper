"use client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { deleteItem, ITEMS_QUERY_KEY, type Item } from "@/lib/items";

export const DeleteItemModal = NiceModal.create<{ item: Item }>(({ item }) => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteItem(item.id),
    onSuccess: () => {
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
          <AlertDialogTitle>刪除「{item.name}」？</AlertDialogTitle>
          <AlertDialogDescription>此動作無法復原。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
