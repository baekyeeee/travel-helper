"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ListId } from "@/lib/lists";
import { createStore, STORES_QUERY_KEY } from "@/lib/stores";

const schema = z.object({
  name: z.string().trim().min(1, "請輸入店家名稱"),
});

type FormValues = z.infer<typeof schema>;

export function NewStoreForm({
  destinationId,
  listId,
  onCreated,
}: {
  destinationId: string;
  listId: ListId;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });
  const createMutation = useMutation({
    mutationFn: ({ name }: FormValues) =>
      createStore(destinationId, listId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      onCreated();
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
      <FieldGroup className="py-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor={field.name}>名稱</FieldLabel>
              <Input
                id={field.name}
                placeholder="例如：星巴克、Olive Young"
                autoFocus
                {...field}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          儲存
        </Button>
      </DialogFooter>
    </form>
  );
}
