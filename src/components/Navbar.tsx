"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LayoutGrid, List, Info, LogIn, LogOut } from "lucide-react";
import { LayoutDensity } from "@/types/pokemon";

interface NavbarProps {
  layout: LayoutDensity;
  onLayoutChange: (layout: LayoutDensity) => void;
  onAboutOpen: () => void;
}

export default function Navbar({
  layout,
  onLayoutChange,
  onAboutOpen,
}: NavbarProps) {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated" && Boolean(session?.user);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/10 backdrop-blur-md dark:bg-black/20">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <a
          href="/"
          className="font-mono text-lg font-semibold tracking-tight text-white transition-opacity duration-200 hover:opacity-80"
        >
          PokeArt<span className="text-white/40">.ai</span>
        </a>

        <nav className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => onLayoutChange("grid")}
              className={`rounded-md p-1.5 transition-all duration-200 ${
                layout === "grid"
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              aria-label="Grid layout"
              aria-pressed={layout === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange("list")}
              className={`rounded-md p-1.5 transition-all duration-200 ${
                layout === "list"
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              aria-label="List layout"
              aria-pressed={layout === "list"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onAboutOpen}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              About
            </span>
          </button>

          {status === "loading" ? (
            <span className="h-8 w-20 animate-pulse rounded-lg border border-white/10 bg-white/5" />
          ) : isSignedIn ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
              title={session?.user?.email ?? "Sign out"}
            >
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span className="hidden max-w-[7rem] truncate sm:inline">
                {session?.user?.name?.split(" ")[0] ?? "Account"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-all duration-200 hover:border-white/25 hover:bg-white/15 hover:text-white"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
