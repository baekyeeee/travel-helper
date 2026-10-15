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
import {
  createDestination,
  DESTINATIONS_QUERY_KEY,
  type Destination,
  renameDestination,
} from "@/lib/destinations";

const schema = z.object({
  name: z.string().trim().min(1, "請輸入目的地名稱"),
});

type FormValues = z.infer<typeof schema>;

export const DestinationFormModal = NiceModal.create<{
  destination?: Destination;
}>(({ destination }) => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: destination?.name ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async ({ name }: FormValues) => {
      if (destination) await renameDestination(destination.id, name);
      else await createDestination(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEY });
      modal.hide();
    },
  });

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <DialogHeader>
            <DialogTitle>
              {destination ? "重新命名目的地" : "新增目的地"}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor={field.name}>名稱</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="例如：韓國、首爾"
                    autoFocus
                    {...field}
                  />
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
});
