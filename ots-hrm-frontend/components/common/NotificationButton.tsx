"use client";

interface NotificationButtonProps {
  onClick?: () => void;
  hasUnread?: boolean;
  className?: string;
}

const NotificationButton = ({
  onClick,
  hasUnread = false,
  className = "",
}: NotificationButtonProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-[15px] bg-g-background-100 cursor-pointer hover:bg-g-gray-alpha-100 rounded-[var(--g-radius-sm)] transition-all duration-200 focus-ring-geist ${className}`}
    >
      <svg
        width="20"
        height="21"
        viewBox="0 0 20 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-g-gray-800"
        aria-hidden="true"
      >
        <path
          d="M11.4417 18.0755C11.2952 18.3281 11.0849 18.5377 10.8319 18.6835C10.5788 18.8292 10.292 18.9059 10 18.9059C9.70802 18.9059 9.42116 18.8292 9.16814 18.6835C8.91513 18.5377 8.70484 18.3281 8.55833 18.0755M15 7.24219C15 5.9161 14.4732 4.64434 13.5355 3.70665C12.5979 2.76897 11.3261 2.24219 10 2.24219C8.67392 2.24219 7.40215 2.76897 6.46447 3.70665C5.52678 4.64434 5 5.9161 5 7.24219C5 13.0755 2.5 14.7422 2.5 14.7422H17.5C17.5 14.7422 15 13.0755 15 7.24219Z"
          stroke="currentColor"
          strokeWidth="1.67"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">Notifications</span>

      {hasUnread && (
        <span className="absolute top-3.5 right-4.5 w-1.5 h-1.5 bg-g-blue-700 rounded-full" />
      )}
    </div>
  );
};

export default NotificationButton;
