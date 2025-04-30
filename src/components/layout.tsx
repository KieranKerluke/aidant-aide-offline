import { ReactNode } from "react";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { NetworkStatus } from "./network-status";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:px-8">
        <MobileNav />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NetworkStatus showText={false} />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden lg:block w-[240px] border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
