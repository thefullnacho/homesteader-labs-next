import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const Button = ({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-bold uppercase transition-all active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-accent text-white border-2 border-accent hover:brightness-110 shadow-brutalist active:shadow-none",
    secondary: "bg-background-secondary text-foreground-primary border-2 border-foreground-primary hover:bg-foreground-primary hover:text-background-primary shadow-brutalist active:shadow-none",
    outline: "bg-transparent text-foreground-primary border-2 border-foreground-primary hover:bg-foreground-primary hover:text-background-primary",
    ghost: "bg-transparent text-foreground-primary hover:bg-foreground-primary/10",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base",
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
