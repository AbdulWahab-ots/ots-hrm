interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  color: 'blue' | 'purple' | 'green' | 'pink';
  iconColor: 'blue' | 'purple' | 'green' | 'pink';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ComponentType<any>;
}

const LeavesCard: React.FC<MetricCardProps> = ({
  title,
  value,
  color,
  size = 'medium',
  icon: Icon,
  iconColor
}) => {
  const colorClasses = {
    blue: 'bg-g-blue-100',
    purple: 'bg-g-purple-100',
    green: 'bg-g-green-100',
    pink: 'bg-g-pink-100',
  };
  const iconColorClass = {
    blue: 'text-g-blue-700',
    purple: 'text-g-purple-600',
    green: 'text-g-green-600',
    pink: 'text-g-pink-600',
  }
  const sizeClasses = {
    small: 'p-4 min-h-[100px]',
    medium: 'p-6 min-h-[120px]',
    large: 'p-8 min-h-[140px]'
  };
  return (
    <div className={`
      ${colorClasses[color]}
      ${sizeClasses[size]}
      rounded-[var(--g-radius-md)]
      flex flex-col justify-between
      backdrop-blur-sm
      relative overflow-hidden
      group
    `}>
      {Icon && (
        <Icon className={`${iconColorClass[iconColor]} w-12 h-12 absolute top-1/2 -translate-y-1/2 right-0`} />
      )}

      <div className="relative z-10">
        <h3 className="text-label-14 sm:text-label-16 font-medium text-g-gray-800 mb-2">
          {title}
        </h3>

        <div className="text-heading-24 sm:text-heading-32 md:text-heading-40 text-g-gray-900 mb-1">
          {value}
        </div>
      </div>
    </div>
  );
};

export default LeavesCard;
