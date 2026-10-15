"use client";
import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* Modals render inside NiceModal.Provider, so nuqs must wrap it. */}
      <NuqsAdapter>
        <NiceModal.Provider>{children}</NiceModal.Provider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
