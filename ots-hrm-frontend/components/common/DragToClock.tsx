"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { LiaCheckDoubleSolid } from "react-icons/lia";
import { IoExitOutline } from "react-icons/io5";
import { RiArrowRightDoubleLine } from "react-icons/ri";

interface DragToClockProps {
    onClockIn: () => Promise<void> | void;
    onClockOut: () => Promise<void> | void;
    isPunchedIn: boolean;
    isDisabled?: boolean;
}

const DragToClock: React.FC<DragToClockProps> = ({
    onClockIn,
    onClockOut,
    isPunchedIn,
    isDisabled = false,
}) => {
    const [completed, setCompleted] = useState(false);
    const [fillPercent, setFillPercent] = useState(0); // 0..1 background fill
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0); // horizontal position

    // Helper to animate back to start smoothly instead of an abrupt jump.
    const resetPosition = () => {
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    };

    // Update fill percent on drag movement
    useEffect(() => {
        const unsub = x.on("change", (latest) => {
            if (!containerRef.current) return;
            const maxTravel = containerRef.current.offsetWidth - 120; // knob width
            if (maxTravel <= 0) return;
            if (!isPunchedIn) {
                // Clock in phase: fill from left
                setFillPercent(Math.min(1, Math.max(0, latest / maxTravel)));
            } else {
                // Clock out phase: fill from right
                setFillPercent(Math.min(1, Math.max(0, (maxTravel - latest) / maxTravel)));
            }
        });
        return () => unsub();
    }, [isPunchedIn, x]);

    // Keep knob at appropriate edge depending on punched state
    useEffect(() => {
        if (!containerRef.current) return;
        const maxTravel = containerRef.current.offsetWidth - 120;
        if (isPunchedIn) {
            // Move knob to end position after clock in
            animate(x, maxTravel, { type: "spring", stiffness: 300, damping: 30 });
            setFillPercent(0); // background returns to normal color until user starts dragging left
        } else {
            // Reset to start when clocked out
            animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
            setFillPercent(0);
        }
    }, [isPunchedIn]);

    const handleDragEnd = () => {
        if (!containerRef.current) return;
        const maxTravel = containerRef.current.offsetWidth - 120; // knob width
        const currentX = x.get();
        const threshold = 1; // 100%
        if (!isPunchedIn) {
            // Attempting clock in
            if (currentX / maxTravel >= threshold) {
                setCompleted(true);
                onClockIn();
                // After parent updates isPunchedIn we keep knob at end; no reset here
            } else {
                resetPosition();
            }
        } else {
            // Attempting clock out: drag left
            const leftTravel = (maxTravel - currentX) / maxTravel; // proportion moved left
            if (leftTravel >= threshold) {
                setCompleted(true);
                onClockOut();
                // Parent should set isDisabled & isPunchedIn false; component will move knob back to start
            } else {
                // Return to end position
                animate(x, maxTravel, { type: "spring", stiffness: 300, damping: 30 });
                setFillPercent(0);
            }
        }
    };

    const bgColor = isPunchedIn
        ? "bg-[var(--error-400)]"
        : "bg-[var(--primary-blue-400)]";

    return (
        <div
            ref={containerRef}
            className={`relative w-full mx-auto h-[40px] sm:h-[60px] rounded-full border border-gray-300 flex items-center select-none   ${isDisabled ? " cursor-not-allowed" : "cursor-grab"}`}
        >
            {/* Dynamic background fill */}
            <div
                className={`absolute top-0 bottom-0 rounded-full ${isPunchedIn ? "right-0" : "left-0"} ${isPunchedIn ? "bg-[var(--error-400)]" : "bg-[var(--primary-blue-400)]"}`}
                style={{ width: `${fillPercent * 100}%` }}
            />
            <motion.div
                className={`absolute left-0 top-0 h-full w-full flex items-center justify-center  font-semibold pointer-events-none ${isDisabled ? "text-[var(--chevron-color)]" : "text-[var(--primary-dark-gray)]"}`}
            >
                {isDisabled
                    ? "You have checked Out"
                    : isPunchedIn
                        ? "Drag to Clock Out"
                        : "Drag to Clock In"}
            </motion.div>

            <motion.div
                drag={isDisabled ? false : "x"} // Restrict dragging to horizontal axis only
                dragConstraints={containerRef}
                style={{ x }}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                className={` h-[40px] sm:h-[60px] w-[120px] flex items-center justify-center border-[6px] rounded-full border-[var(--chevron-bg)] focus-ring-geist border-solid
                    ${isPunchedIn ? "rounded-tl-full rounded-bl-full" : "rounded-br-full rounded-tr-full"}
                    ${isDisabled ? "bg-[var(--drag-disable)] rounded-full" : "" + bgColor}`}
            >
                <motion.span
                    animate={{
                        x: isDisabled
                            ? 0
                            : isPunchedIn
                                ? [-10, 10, -10]
                                : [10, -10, 10],
                    }}
                    transition={{
                        repeat: isDisabled ? 0 : Infinity,
                        duration: 1,
                        ease: "easeInOut",
                    }}
                    className="flex"
                >
                    <RiArrowRightDoubleLine
                        className={`w-8 h-8 text-white ${isPunchedIn ? "rotate-180" : ""}`}
                    />
                </motion.span>
            </motion.div>
        </div>
    );
};

// export default DragToClock;
// Provide a named export as well to guard against default/named import confusion.
export { DragToClock };
