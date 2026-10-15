"use client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListId } from "@/lib/lists";
import {
  createStore,
  linkStore,
  listLinkableStores,
  STORES_QUERY_KEY,
} from "@/lib/stores";

const schema = z.object({
  name: z.string().trim().min(1, "請輸入店家名稱"),
});

type Mode = "existing" | "new";

type FormValues = z.infer<typeof schema>;

export const StoreFormModal = NiceModal.create<{
  destinationId: string;
  listId: ListId;
}>(({ destinationId, listId }) => {
  const modal = useModal();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [search, setSearch] = useState("");

  const { data: linkable = [] } = useQuery({
    queryKey: [...STORES_QUERY_KEY, "linkable", destinationId, listId],
    queryFn: () => listLinkableStores(destinationId, listId),
  });
  // Fresh catalogs have nothing to pick, so start on creating a store.
  const mode = chosenMode ?? (linkable.length > 0 ? "existing" : "new");
  const matches = linkable.filter((store) =>
    store.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const linkMutation = useMutation({
    mutationFn: (storeId: string) => linkStore(destinationId, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      modal.hide();
    },
  });

  const mutation = useMutation({
    mutationFn: ({ name }: FormValues) =>
      createStore(destinationId, listId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      modal.hide();
    },
  });

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <DialogHeader>
            <DialogTitle>新增店家</DialogTitle>
          </DialogHeader>
          <Tabs
            value={mode}
            onValueChange={(value) => setChosenMode(value as Mode)}
          >
            <TabsList>
              <TabsTrigger value="existing">使用既有店家</TabsTrigger>
              <TabsTrigger value="new">建立新店家</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "existing" ? (
            <div className="flex flex-col gap-2 py-4">
              <Input
                placeholder="搜尋既有店家"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) =>
                  event.key === "Enter" && event.preventDefault()
                }
              />
              {matches.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  沒有可選的既有店家
                </p>
              ) : (
                <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                  {matches.map((store) => (
                    <li key={store.id}>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        disabled={linkMutation.isPending}
                        onClick={() => linkMutation.mutate(store.id)}
                      >
                        {store.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
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
                <Button type="submit" disabled={mutation.isPending}>
                  儲存
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
});
