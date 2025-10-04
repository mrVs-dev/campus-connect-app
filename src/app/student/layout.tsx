
import { Header } from "@/components/dashboard/header";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}

    