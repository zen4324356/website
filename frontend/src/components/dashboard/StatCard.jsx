import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  change = null,
  iconBgColor = 'bg-primary-500',
  onClick = null
}) => {
  const isPositiveChange = change && change > 0;
  const isClickable = !!onClick;
  
  return (
    <div 
      className={`bg-dark-lighter rounded-lg shadow p-4 ${
        isClickable ? 'cursor-pointer transition-transform hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="mt-1 text-white text-2xl font-semibold">{value}</p>
          
          {change !== null && (
            <div className="flex items-center mt-1">
              <span className={`
                inline-flex items-center text-xs font-medium
                ${isPositiveChange ? 'text-green-500' : 'text-red-500'}
              `}>
                {isPositiveChange ? (
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                )}
                {Math.abs(change)}%
              </span>
              <span className="text-gray-500 text-xs ml-1">from last period</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-2 rounded-full ${iconBgColor} bg-opacity-20`}>
            <Icon className={`h-6 w-6 ${iconBgColor.replace('bg-', 'text-')}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard; 