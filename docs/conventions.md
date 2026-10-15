---
title: Project Conventions
description: Company-wide tech stack, project structure, constraints, and coding conventions for Next.js frontend projects.
---

> This file is shared across all company frontend projects. Keep a verbatim copy in each repo and don't edit it locally. Put project-specific rules, exceptions, and reference pages in the project's `AGENTS.md`.

## Tech Stack

Baseline for new projects. Existing projects on older majors follow the same conventions where their versions allow.

| Category | Tools |
|----------|-------|
| Core | TypeScript, Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| UI | shadcn/ui (Base UI), reui (shadcn registry), lucide-react icons |
| Data fetching | TanStack Query v5; ky + openapi-fetch for HTTP |
| Forms | react-hook-form + zod (via `@hookform/resolvers/zod`) |
| State | nuqs (filters & pagination in the URL), immer (immutable updates), ahooks (utilities) |
| Modals | @ebay/nice-modal-react |
| Formatting | dayjs (dates), numeral (numbers) |
| Logic | ts-pattern |
| Styling | clsx + tailwind-merge, tw-animate-css |
| Tooling | pnpm, Biome (`pnpm lint` + `pnpm format` — **not** ESLint/Prettier) |

## Project Structure

```
src/app/          → file-based routing (Next.js App Router)
src/components/   → shared UI components (shadcn primitives in ui/)
src/hooks/        → shared custom React hooks
src/lib/          → shared helpers, types, constants
src/providers/    → context providers
src/services/     → API call functions + generated OpenAPI types (types/openapi.ts)
```

### Colocation

Keep code next to the route that uses it. Route-private folders are prefixed with `_` so the App Router excludes them from routing:

```
src/app/(protected)/orders/
├── page.tsx
├── _components/   → route-only components (e.g. order-columns.tsx)
├── _hooks/        → route-only hooks
└── _lib/          → route-only helpers, types, constants

src/app/api/orders/
├── route.ts
├── _lib/          → handler helpers, stores
└── _mocks/        → mock data (JSON)
```

- Use only these names: `_components`, `_hooks`, `_lib`, `_mocks`. Don't add `_utils`, `_types`, or `_helpers`; that code goes in `_lib`.
- Create a folder only when it has content. Don't scaffold empty folders.
- Never import from another route's `_` folders. Once a second route needs the code, move it to the shared `src/components`, `src/hooks`, or `src/lib`.
- The shared `src/` folders hold only code used by 2+ routes or app-wide (layout, providers, `ui/`).

## Constraints

> Never violate these rules.

- Place `"use client"` at the very top of client components — no imports above it
- Never use `useEffect` for data fetching — always use `useQuery`
- Never use ESLint or Prettier — Biome only
- All UI elements must use shadcn/ui components (including shadcn-registry components such as reui) — no raw HTML controls or other UI libraries
- Keep list-page filters and pagination in the URL with nuqs — never in `useState`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) format

## Conventions

### App root setup

Mount these providers once in the root layout (a `"use client"` wrapper component):

```tsx
"use client";
import NiceModal from "@ebay/nice-modal-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NiceModal.Provider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </NiceModal.Provider>
    </QueryClientProvider>
  );
}
```

### TypeScript types

Prefer importing types from `src/services/types/openapi.ts` (generated from the OpenAPI spec) over writing your own. Only hand-write a type when nothing suitable exists there.

```ts
import type { components } from "@/services/types/openapi";

type User = components["schemas"]["User"];
```

### Conditional logic

Use `ts-pattern` for complex conditionals instead of `if/else` chains or `switch` statements.

```ts
import { match, P } from "ts-pattern";

const message = match(result)
  .with({ type: "loading" }, () => "Loading...")
  .with({ type: "error" }, ({ error }) => `Error: ${error.message}`)
  .with({ type: "ok", data: P.select() }, (data) => data)
  .exhaustive();
```

Use `.exhaustive()` whenever matching a discriminated union — it ensures all cases are handled at compile time. Use `.otherwise(() => ...)` when a fallback is intentional.

### Data fetching

Put every HTTP call in a typed function in `src/services/<resource>.ts`; components never call `ky` or `openapi-fetch` directly. Inside services, use the `openapi-fetch` client for endpoints defined in the OpenAPI spec and `ky` for everything else (e.g. the app's own `/api/*` route handlers).

Call services from `useQuery` / `useInfiniteQuery`; `queryKey` format: `["/api/path", payload]`.

```ts
// src/services/orders.ts
export function listOrders(payload: ListOrdersPayload) {
  return ky.get("/api/orders", { searchParams: payload }).json<ListOrdersResponse>();
}

// component
const { data } = useQuery({
  queryKey: ["/api/orders", payload],
  queryFn: () => listOrders(payload),
});
```

### Mutations

Use `useMutation`; always call `queryClient.invalidateQueries` on success to keep data fresh.

```ts
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data: CreateOrderInput) => createOrder(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/orders"] }),
});
```

### Modals

Use `nice-modal-react` (`NiceModal.show/hide`) for modals triggered imperatively (e.g. from buttons, actions, or outside the component tree). Use local state only for simple inline toggles that are tightly coupled to a single component.

```tsx
import NiceModal, { useModal } from "@ebay/nice-modal-react";

const ConfirmModal = NiceModal.create<{ message: string }>(({ message }) => {
  const modal = useModal();
  return (
    <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
      <DialogContent>
        <p>{message}</p>
        <Button onClick={() => { modal.resolve(true); modal.hide(); }}>Confirm</Button>
      </DialogContent>
    </Dialog>
  );
});

// Show by component reference — no registration needed
NiceModal.show(ConfirmModal, { message: "Delete this item?" }).then(() => deleteItem());
```

### Search/filter pages

Keep filters and pagination in the URL with nuqs `useQueryStates`, so refresh, back/forward, and shared links restore the same view. Define the parsers once per page (in `_lib/` if reused), and derive the API payload from them.

- Free-text inputs keep a local draft in `useState` and write to the URL after a `useDebounceEffect` (ahooks, 500 ms). Select/checkbox filters write to the URL directly.
- Any filter change resets `page` to 1.
- Use `.withDefault()` on every parser so defaults stay out of the URL and values are never `null`.

```ts
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const STATUSES = ["ALL", "ACTIVE", "PAUSED"] as const;

const filterParsers = {
  keyword: parseAsString.withDefault(""),
  status: parseAsStringLiteral(STATUSES).withDefault("ALL"),
  page: parseAsInteger.withDefault(1),
};

const [filters, setFilters] = useQueryStates(filterParsers);
const [keywordDraft, setKeywordDraft] = useState(filters.keyword);

useDebounceEffect(() => {
  if (keywordDraft !== filters.keyword) setFilters({ keyword: keywordDraft, page: 1 });
}, [keywordDraft], { wait: 500 });

// select filter
<Select value={filters.status} onValueChange={(status) => setFilters({ status, page: 1 })} />

const payload = { ...filters, page_size: PAGE_SIZE };
```

### Tables

Build every list table with the reui `DataGrid` (`@/components/reui/data-grid/*`) + TanStack Table — never the raw shadcn `Table`.

- Define columns as an exported `ColumnDef<T>[]` in the route's `_components/<feature>-columns.tsx` (or inline in the page for one-off tables). Use `meta.headerClassName` / `meta.cellClassName` for styling.
- Paginate server-side: `manualPagination: true`, derive `pagination` state from the nuqs `page`, and write `onPaginationChange` back to it. Render `<DataGridPagination sizes={[PAGE_SIZE]} />` — no hand-rolled prev/next buttons.
- Pin identifying/action columns with `columnPinning` (+ `tableLayout.columnsPinnable`), not CSS `sticky`. Give pinned cells `bg-background` so scrolled content doesn't show through.
- Use `isLoading` / `loadingMessage` / `emptyMessage` on `DataGrid` instead of manual placeholder rows; render the error message above the grid.

```tsx
const table = useReactTable({
  data: response?.data ?? [],
  columns: orderColumns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  pageCount: totalPages,
  state: {
    pagination: { pageIndex: filters.page - 1, pageSize: PAGE_SIZE },
    columnPinning: { left: ["order_code"], right: ["actions"] },
  },
  onPaginationChange: (updater) => {
    const current = { pageIndex: filters.page - 1, pageSize: PAGE_SIZE };
    const next = typeof updater === "function" ? updater(current) : updater;
    setFilters({ page: next.pageIndex + 1 });
  },
});

<DataGrid
  table={table}
  recordCount={response?.pagination.total ?? 0}
  isLoading={query.isLoading}
  loadingMessage="載入資料中…"
  emptyMessage="沒有符合條件的資料"
  tableLayout={{ width: "fixed", columnsPinnable: true }}
  tableClassNames={{ edgeCell: "first:pl-4 last:pr-4" }}
>
  <DataGridContainer>
    <DataGridScrollArea orientation="horizontal">
      <DataGridTable />
    </DataGridScrollArea>
  </DataGridContainer>
  <DataGridPagination sizes={[PAGE_SIZE]} className="my-2 p-4" />
</DataGrid>
```

### Forms

Use `react-hook-form` with `zod` (via `zodResolver`) for validation. Build layouts with the `Field` primitives (`FieldGroup`, `Field`, `FieldLabel`, `FieldError`) from `@/components/ui/field` instead of raw `<label>`/`<p>` elements. Use `Controller` (not `register`) since shadcn/Base UI inputs (`Select`, `Combobox`, `Checkbox`, etc.) aren't plain `<input>` elements.

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

function ExampleForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      <FieldGroup>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input id={field.name} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
```

### Date formatting

Use `dayjs`, imported directly. Use `dayjs.unix()` for Unix timestamps (seconds) and `.unix()` to convert back. Fall back to `"-"` when the value may be missing:

```ts
value ? dayjs(value).format("YYYY-MM-DD") : "-"
value ? dayjs.unix(value).format("YYYY/MM/DD HH:mm") : "-"
```

### Number formatting

Use `numeral`, imported directly: `"0,0"` for counts, `"0%"` for ratios, `"0.[0]a"` for compact stats/badges (`1.5m`, `300k`). Guard values that may be `undefined` or `0`:

```ts
value ? numeral(value).format("0.[0]a") : undefined
```

## Workflow

- Proposals: keep them concise and focused on user-facing value, and include a "Non-goals" section to scope the change.
- Tasks: break work into small, independently testable chunks, each referencing the file(s) to modify.
- After implementing, run `pnpm lint` then `pnpm format`.
