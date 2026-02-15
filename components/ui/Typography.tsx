import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'code';
  style?: React.CSSProperties;
}

const Typography = ({
  children,
  className = '',
  as,
  variant = 'body',
  style,
}: TypographyProps) => {
  const Component = as || (variant.startsWith('h') ? (variant as React.ElementType) : variant === 'body' ? 'p' : 'span');

  const variants = {
    h1: "text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight mb-6",
    h2: "text-2xl md:text-4xl font-bold uppercase tracking-tight mb-4",
    h3: "text-xl md:text-2xl font-bold uppercase mb-3",
    h4: "text-lg font-bold uppercase mb-2",
    body: "text-base md:text-lg leading-relaxed mb-4",
    small: "text-sm text-foreground-secondary",
    code: "font-mono bg-background-secondary px-1 py-0.5 rounded-sm text-sm",
  };

  return (
    <Component className={`${variants[variant]} ${className}`} style={style}>
      {children}
    </Component>
  );
};

export default Typography;
