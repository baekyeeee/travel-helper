"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createItem, ITEMS_QUERY_KEY } from "@/lib/items";

const schema = z.object({
  name: z.string().trim().min(1, "請輸入品名"),
});

type FormValues = z.infer<typeof schema>;

export function NewItemForm({
  destinationId,
  storeId,
}: {
  destinationId: string;
  storeId: string;
}) {
  const queryClient = useQueryClient();
  const { control, getValues, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });
  const createMutation = useMutation({
    mutationFn: ({ name }: FormValues) =>
      createItem(destinationId, storeId, name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY }),
    // Give the name back if saving failed and nothing new was typed since.
    onError: (_error, values) => {
      if (!getValues("name")) reset(values);
    },
  });
  // Clear on submit, not on save, so typing the next name right away isn't merged.
  const submit = (values: FormValues) => {
    createMutation.mutate(values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <FieldGroup>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              {/* Not field.name: the store modal's "name" input can be open alongside. */}
              <FieldLabel htmlFor="item-name">品名</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="item-name"
                  placeholder="例如：焙茶拿鐵、面膜"
                  {...field}
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  <Plus /> 新增
                </Button>
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
