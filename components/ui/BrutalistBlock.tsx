import React from 'react';

interface BrutalistBlockProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'terminal';
  title?: string;
  refTag?: string;
  as?: React.ElementType;
}

const BrutalistBlock = ({
  children,
  className = '',
  variant = 'default',
  title,
  refTag,
  as: Component = 'div',
}: BrutalistBlockProps) => {
  const baseStyles = "relative p-6 border-2 shadow-brutalist transition-all hover:shadow-brutalist-lg";
  
  const variants = {
    default: "bg-background-secondary border-border-primary text-foreground-primary",
    accent: "bg-accent border-foreground-primary text-white shadow-[4px_4px_0px_0px_var(--text-primary)]",
    terminal: "bg-black border-accent text-accent animate-condensation",
  };

  return (
    <Component className={`${baseStyles} ${variants[variant]} ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-bold uppercase tracking-tight border-b border-current pb-2 inline-block">
            {title}
          </h3>
        </div>
      )}
      
      {children}
      
      {refTag && (
        <div className="absolute -bottom-3 right-4 bg-background-secondary border border-border-primary px-2 py-0.5 text-[10px] font-mono opacity-70 z-20">
          {refTag}
        </div>
      )}
    </Component>
  );
};

export default BrutalistBlock;
