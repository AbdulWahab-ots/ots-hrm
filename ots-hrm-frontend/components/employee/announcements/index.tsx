"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Megaphone, Calendar, User } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { getAllAnnouncementsAPI } from "@/services/adminServices";
import NoDataFound from "@/components/common/NoDataFound";

interface Announcement {
  id: string;
  title: string;
  description: string;
  createdBy?: string;
  createdAt?: string;
}

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

const EmployeeAnnouncements = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllAnnouncementsAPI(dispatch);
      setItems((res?.result?.data ?? res?.data ?? []) as Announcement[]);
    } catch (e) {
      console.error("Failed to fetch announcements", e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-[var(--g-radius-sm)] bg-g-blue-100 text-g-blue-700">
          <Megaphone size={18} />
        </span>
        <div>
          <h1 className="text-heading-20 text-g-gray-1000">Announcements</h1>
          <p className="text-label-13 text-g-gray-700">
            Company-wide updates from your admin.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-background-100 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-background-100 py-10 shadow-geist-card">
          <NoDataFound text="No announcements yet." />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-background-100 p-5 shadow-geist-card transition-shadow hover:shadow-geist-menu"
            >
              <h2 className="text-heading-16 text-g-gray-1000 mb-1.5">
                {a.title}
              </h2>
              <p className="text-copy-14 text-g-gray-900 whitespace-pre-line mb-4">
                {a.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-label-12 text-g-gray-700">
                {a.createdBy && (
                  <span className="flex items-center gap-1.5">
                    <User size={13} /> {a.createdBy}
                  </span>
                )}
                {a.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} /> {fmtDate(a.createdAt)}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeAnnouncements;
