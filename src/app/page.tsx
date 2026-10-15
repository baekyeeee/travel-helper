import { Suspense } from "react";
import { DestinationPanel } from "./_components/destination-panel";
import { DestinationSidebar } from "./_components/destination-sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1">
      <Suspense>
        <DestinationSidebar />
        <DestinationPanel />
      </Suspense>
    </div>
  );
}
