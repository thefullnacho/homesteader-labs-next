import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'outline' | 'solid' | 'status';
  className?: string;
  pulse?: boolean;
}

const Badge = ({
  children,
  variant = 'outline',
  className = '',
  pulse = false,
}: BadgeProps) => {
  const baseStyles = "inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider";
  
  const variants = {
    outline: "border border-foreground-primary text-foreground-primary",
    solid: "bg-foreground-primary text-background-primary",
    status: "border border-foreground-primary text-foreground-primary bg-background-primary/50",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {pulse && (
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      <span>{children}</span>
    </div>
  );
};

export default Badge;
