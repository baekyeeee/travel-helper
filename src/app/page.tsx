import { DestinationSidebar } from "./_components/destination-sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1">
      <DestinationSidebar />
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        選擇或新增一個目的地
      </main>
    </div>
  );
}
