import Link from "next/link";
import { UserNav } from "./user-nav";
import { Logo } from "../icons/logo";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Link
        href="#"
        className="flex items-center gap-2 text-lg font-semibold text-primary"
      >
        <Logo className="h-6 w-6" />
        <span className="font-headline">CampusConnect</span>
      </Link>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search can be added here */}
      </div>
      <UserNav />
    </header>
  );
}
