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
import { Textarea } from "@/components/ui/textarea";
import {
  createItem,
  ITEMS_QUERY_KEY,
  type Item,
  updateItem,
} from "@/lib/items";
import { ItemPhoto } from "./item-photo";

const schema = z.object({
  name: z.string().trim().min(1, "請輸入品名"),
  description: z.string(),
  photo: z.instanceof(Blob).optional(),
});

type FormValues = z.infer<typeof schema>;

export const ItemFormModal = NiceModal.create<{
  destinationId: string;
  storeId: string;
  item?: Item;
}>(({ destinationId, storeId, item }) => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      photo: item?.photo,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (item) await updateItem(item.id, values);
      else await createItem(destinationId, storeId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      modal.hide();
    },
  });

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <DialogHeader>
            <DialogTitle>{item ? "編輯品項" : "新增品項"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor={field.name}>品名</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="例如：焙茶拿鐵、面膜"
                    autoFocus
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>描述（選填）</FieldLabel>
                  <Textarea
                    id={field.name}
                    placeholder="例如：口味、價格、要買幾個"
                    {...field}
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="photo"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>照片（選填）</FieldLabel>
                  {field.value && (
                    <div className="flex items-end gap-2">
                      <ItemPhoto
                        photo={field.value}
                        alt="照片預覽"
                        className="size-24"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(undefined)}
                      >
                        移除照片
                      </Button>
                    </div>
                  )}
                  <Input
                    id={field.name}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) field.onChange(file);
                      // Reset so picking the same file again still fires.
                      event.target.value = "";
                    }}
                  />
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
