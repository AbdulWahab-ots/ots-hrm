"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import Meeting from "../../../../public/Meeting.svg";
import Image from "next/image";
interface Event {
  date: string; // YYYY-MM-DD
  time: string;
  role: string;
  title: string;
  color: string;
}

export default function Calendar() {
  // "Today" depends on the render instant, which differs between the server's SSR pass
  // and the client's hydration pass — don't compute it until after mount, so the initial
  // server/client markup match and React doesn't report a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
    setMounted(true);
  }, []);

  const events: Event[] = [
    {
      date: "2025-08-29",
      time: "12:00",
      role: "CEO",
      title: "One to one",
      color: "border-red-500",
    },
    {
      date: "2025-08-29",
      time: "13:40",
      role: "Creative director",
      title: "Design brainstorm",
      color: "border-orange-400",
    },
    {
      date: "2025-09-02",
      time: "17:00",
      role: "Art director",
      title: "Project Deadline",
      color: "border-green-500",
    },
    {
      date: "2025-09-05",
      time: "9:00",
      role: "Art director",
      title: "One to one",
      color: "border-blue-500",
    },
  ];

  // Format helpers
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    setSelectedDate(new Date(year, currentDate.getMonth(), day));
  };

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const filteredEvents = events.filter((e) => e.date === selectedDateStr);

  if (!mounted) {
    return (
      <div className="xl:col-span-3 rounded-[var(--g-radius-md)] border-[1px] border-g-gray-alpha-400 p-6 bg-g-background-100 shadow-geist-card animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-8 rounded-full bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="xl:col-span-3 rounded-[var(--g-radius-md)] border-[1px] border-g-gray-alpha-400 p-6 bg-g-background-100 shadow-geist-card ">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-g-gray-1000 text-heading-20">
          {monthName} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-3 rounded-[var(--g-radius-sm)] bg-g-gray-100 border border-g-gray-100 focus-ring-geist"
          >
            <ChevronLeft
              className="text-g-blue-700"
              style={{ width: "20px", height: "20px" }}
            />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-3 rounded-[var(--g-radius-sm)] bg-g-gray-100 border border-g-gray-100 focus-ring-geist"
          >
            <ChevronRight
              className="text-g-blue-700"
              style={{ width: "20px", height: "20px" }}
            />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center text-sm text-g-gray-1000 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div className="text-label-14 sm:text-label-18 text-g-gray-1000" key={d}>
            {d}
          </div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isSelected =
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === year;

          return (
            <button
              key={day}
              onClick={() => handleSelectDate(day)}
              className={`py-2 text-[20px] font-normal rounded-[var(--g-radius-full)] cursor-pointer transition focus-ring-geist ${isSelected
                ? "bg-g-blue-700 text-white"
                : "text-g-gray-1000 hover:bg-g-gray-100"
                }`}
            >
              {day < 10 ? `0${day}` : day}
            </button>
          );
        })}
      </div>

      {/* Events */}
      <div className="space-y-3 px-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3  transition"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-label-14 text-g-gray-800 font-medium">aug 12</p>

                  <p className="text-g-gray-1000 text-copy-16 font-medium">
                    {event.time}
                  </p>
                </div>
                <div className={`w-1 h-10 rounded-full bg-g-red-700`} />
                <div>
                  <p className="text-label-14 text-g-gray-800 font-medium">
                    {event.role}
                  </p>
                  <p className="text-g-gray-1000 text-copy-16 font-medium ">
                    {event.title}
                  </p>
                </div>
              </div>
              <Image
                src={Meeting}
                alt="Meeting icon"
                className=" w-[32px] h-[32px]"
              />
            </div>
          ))
        ) : (
          <p className="text-g-gray-700 text-sm">No events for this date</p>
        )}
      </div>
    </div>
  );
}
