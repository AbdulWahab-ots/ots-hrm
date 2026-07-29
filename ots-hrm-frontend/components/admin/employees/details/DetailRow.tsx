export default function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-label-13">
      <div className="flex items-center text-g-gray-800">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
      <div className="text-g-gray-1000 font-medium text-right">
        {value}
      </div>
    </div>
  );
}