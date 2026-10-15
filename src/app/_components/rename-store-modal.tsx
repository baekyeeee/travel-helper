"use client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { renameStore, STORES_QUERY_KEY, type Store } from "@/lib/stores";

const schema = z.object({
  name: z.string().trim().min(1, "請輸入店家名稱"),
});

type FormValues = z.infer<typeof schema>;

export const RenameStoreModal = NiceModal.create<{ store: Store }>(
  ({ store }) => {
    const modal = useModal();
    const queryClient = useQueryClient();
    const { control, handleSubmit } = useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { name: store.name },
    });
    const mutation = useMutation({
      mutationFn: ({ name }: FormValues) => renameStore(store.id, name),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
        modal.hide();
      },
    });

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <DialogContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <DialogHeader>
              <DialogTitle>重新命名店家</DialogTitle>
              <DialogDescription>
                所有使用這家店的目的地都會看到新名稱。
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={field.name}>名稱</FieldLabel>
                    <Input id={field.name} autoFocus {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                儲存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);
