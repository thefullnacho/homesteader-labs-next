import React from 'react';

interface DymoLabelProps {
  children: React.ReactNode;
  className?: string;
}

const DymoLabel = ({ children, className = '' }: DymoLabelProps) => {
  return (
    <div className={`dymo-label ${className}`}>
      {children}
    </div>
  );
};

export default DymoLabel;
