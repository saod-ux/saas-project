import { Button } from "@/components/ui/button";

interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function Empty({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}: EmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 text-gray-400">
            {icon}
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      
      {action && (
        <Button 
          onClick={action.onClick} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}


