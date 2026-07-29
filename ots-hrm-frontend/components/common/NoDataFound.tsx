import Image from "next/image";

interface NoDataFoundProps {
  text?: string;
  className?: string;
}

const NoDataFound = ({ text = "No data found.", className = "" }: NoDataFoundProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-6 ${className}`}>
      <Image
        src="/no-data-found.svg"
        alt="No data found"
        width={200}
        height={200}
      />
      <p className="text-g-gray-800 text-sm">{text}</p>
    </div>
  );
};

export default NoDataFound;
