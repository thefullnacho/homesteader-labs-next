import React from 'react';

interface MarginaliaProps {
  children: React.ReactNode;
  className?: string;
  rotation?: number;
}

const Marginalia = ({ 
  children, 
  className = '', 
  rotation = -2 
}: MarginaliaProps) => {
  return (
    <div 
      className={`marginalia ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
};

export default Marginalia;
