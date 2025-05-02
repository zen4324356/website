import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Card = ({ 
  title, 
  children, 
  collapsible = false, 
  icon: Icon = null, 
  className = '', 
  headerClassName = '',
  titleClassName = '',
  bodyClassName = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-dark-lighter rounded-lg shadow overflow-hidden ${className}`}>
      {title && (
        <div 
          className={`px-4 py-3 border-b border-dark-border flex justify-between items-center ${headerClassName} ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-5 w-5 text-primary-500" />}
            <h3 className={`font-medium text-white ${titleClassName}`}>{title}</h3>
          </div>
          
          {collapsible && (
            <button type="button" className="text-gray-400 hover:text-white">
              {isCollapsed ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronUpIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      )}
      
      {!isCollapsed && (
        <div className={`px-4 py-4 ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Card; 