const SkeletonCard: React.FC = () => {
  return (
    <div className="mlg:col-span-3 bg-g-background-100 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden border-[1px] border-g-gray-alpha-400">
      <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--g-gray-200) 25%,
            var(--g-gray-300) 50%,
            var(--g-gray-200) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      <div className="flex items-center justify-between border-b-[1px] border-gray-200 p-4 lg:p-6">
        <div className="skeleton h-8 w-1/3 rounded" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="p-4 lg:p-6 flex items-center">
        <div className="skeleton w-12 h-12 rounded-full mr-4" />
        <div>
          <div className="skeleton h-5 w-40 rounded mb-2" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="skeleton h-4 w-32 rounded ml-auto" />
      </div>
      <div className="p-4 lg:p-6 flex gap-6">
        <div className="flex flex-col gap-6">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="skeleton h-6 w-20 rounded-2xl" />
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-5 w-48 rounded" />
        </div>
      </div>
    </div>
  );
};
export default SkeletonCard;
