import Image from "next/image";

interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const SPINNER_COLOR = "#E1511E";
const RING_SIZE = 96; // px — container the ring is drawn in
const RING_RADIUS = 44; // px — leaves room for the 3px stroke inside the box
const RING_STROKE = 3; // px

const LoadingSpinner = ({
  label = "Loading...",
  fullScreen = true,
  className = "",
}: LoadingSpinnerProps) => {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "fixed inset-0 z-[999] bg-g-background-100" : "py-16 w-full"
      } ${className}`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        {/* Glow layer — blurred duplicate of the ring, same color, sitting behind it */}
        <svg
          aria-hidden
          className="absolute inset-0 animate-spin-slow blur-md opacity-70"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          fill="none"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={SPINNER_COLOR}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${RING_RADIUS * Math.PI} ${RING_RADIUS * Math.PI * 2}`}
          />
        </svg>
        {/* Crisp rotating ring */}
        <svg
          aria-hidden
          className="absolute inset-0 animate-spin-slow"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          fill="none"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={SPINNER_COLOR}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${RING_RADIUS * Math.PI} ${RING_RADIUS * Math.PI * 2}`}
          />
        </svg>
        <Image
          src="/HRM-2.svg"
          alt=""
          width={80}
          height={80}
          className="relative z-10"
          priority
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
