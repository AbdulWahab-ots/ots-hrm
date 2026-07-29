"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedTabsProps<T>) {
  const containerRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = itemRefs.current[value];
    if (!container || !el) return;
    const containerRect = container.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setIndicator({ left: rect.left - containerRect.left, width: rect.width });
  }, [value, options]);

  return (
    <ul
      ref={containerRef}
      role="tablist"
      className={`relative inline-flex gap-1 border border-g-gray-alpha-400 bg-g-gray-100 rounded-full p-1 ${className}`}
    >
      {indicator.width > 0 && (
        <li
          aria-hidden
          className="absolute top-1 left-0 bottom-1 rounded-full bg-g-background-100 shadow-geist-card transition-transform duration-200 ease-[var(--g-ease-out)]"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      )}
      {options.map((opt) => (
        <li
          key={opt.value}
          ref={(node) => {
            itemRefs.current[opt.value] = node;
          }}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 px-4 py-3 rounded-full text-button-14 flex items-center gap-2 cursor-pointer transition-colors duration-150 ease focus-ring-geist ${
            value === opt.value ? "text-g-blue-700" : "text-g-gray-800"
          }`}
        >
          {opt.label}
        </li>
      ))}
    </ul>
  );
}
