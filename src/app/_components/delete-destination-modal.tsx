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
import {
  DESTINATIONS_QUERY_KEY,
  type Destination,
  deleteDestination,
} from "@/lib/destinations";

export const DeleteDestinationModal = NiceModal.create<{
  destination: Destination;
}>(({ destination }) => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteDestination(destination.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEY });
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
          <AlertDialogTitle>刪除「{destination.name}」？</AlertDialogTitle>
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
