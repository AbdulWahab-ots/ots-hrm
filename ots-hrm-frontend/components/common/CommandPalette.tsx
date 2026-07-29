"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Search, CornerDownLeft } from "lucide-react";
import ModalPortal from "./ModalPortal";
import {
  adminNavDestinations,
  employeeNavDestinations,
  superadminNavDestinations,
  type NavDestination,
} from "@/utils/constants";

/* ==========================================================================
   Command palette (⌘K) — fuzzy jump to any navigable page for the current
   role. Purely client-side over the flattened nav destinations, so there is
   no network dependency and it works on every page.
   ========================================================================== */

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role?.code || null;

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const destinations: NavDestination[] = useMemo(() => {
    switch (userRole) {
      case "superAdmin":
        return superadminNavDestinations;
      case "employee":
        return employeeNavDestinations;
      case "admin":
      default:
        return adminNavDestinations;
    }
  }, [userRole]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) =>
      [d.label, d.group, d.parent ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, destinations]);

  // Reset transient state whenever the palette opens.
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Focus after the portal has mounted.
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  // Keep the active row within bounds as results shrink.
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, results.length - 1)));
  }, [results.length]);

  // Lock body scroll while open.
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const go = (dest?: NavDestination) => {
    if (!dest) return;
    router.push(dest.href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll the active row into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  let lastGroup = "";

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]"
        style={{ background: "var(--g-overlay)" }}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="w-full max-w-xl bg-g-background-100 rounded-[var(--g-radius-lg)] shadow-geist-modal border border-g-gray-alpha-400 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-3 px-4 border-b border-g-gray-alpha-400">
            <Search size={18} className="text-g-gray-700 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-full py-4 bg-transparent text-copy-16 text-g-gray-1000 placeholder:text-g-gray-700 outline-none"
            />
            <kbd className="hidden sm:inline text-label-12 text-g-gray-700 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] px-1.5 py-0.5">
              Esc
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-copy-14 text-g-gray-700">
                No pages match &ldquo;{query}&rdquo;
              </p>
            ) : (
              results.map((dest, index) => {
                const showGroup = dest.group !== lastGroup;
                lastGroup = dest.group;
                const Icon = dest.icon;
                const isActive = index === activeIndex;
                return (
                  <div key={`${dest.href}-${index}`}>
                    {showGroup && (
                      <p className="px-4 pt-3 pb-1 text-label-12 uppercase tracking-wider text-g-gray-700">
                        {dest.group}
                      </p>
                    )}
                    <button
                      type="button"
                      data-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(dest)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? "bg-g-gray-alpha-200" : "hover:bg-g-gray-alpha-100"
                      }`}
                    >
                      <span
                        className={
                          isActive ? "text-g-blue-700" : "text-g-gray-800"
                        }
                      >
                        {Icon && <Icon size={16} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-copy-14 text-g-gray-1000 truncate">
                          {dest.label}
                        </span>
                        {dest.parent && (
                          <span className="block text-label-12 text-g-gray-700 truncate">
                            {dest.parent}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <CornerDownLeft
                          size={14}
                          className="text-g-gray-600 shrink-0"
                        />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-g-gray-alpha-400 text-label-12 text-g-gray-700">
            <span className="flex items-center gap-1">
              <kbd className="border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] px-1">
                ↑
              </kbd>
              <kbd className="border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] px-1">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] px-1">
                ↵
              </kbd>
              to open
            </span>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

/* Topbar affordance — a search-styled button that opens the palette and
   advertises the ⌘K shortcut. */
export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /mac|iphone|ipad|ipod/i.test(navigator.platform)
    );
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open command palette"
      className="flex items-center gap-2 rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-background-200 text-g-gray-700 hover:text-g-gray-1000 hover:bg-g-gray-alpha-100 transition-colors focus-ring-geist px-2 py-2 md:px-3"
    >
      <Search size={16} />
      <span className="hidden md:inline text-label-14">Search…</span>
      <kbd className="hidden md:inline text-label-12 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] px-1.5 py-0.5">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
