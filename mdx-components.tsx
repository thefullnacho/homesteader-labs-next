import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-6 border-b-2 border-border-primary pb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mb-4 mt-8 uppercase border-l-4 border-[var(--accent)] pl-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-bold mb-3 mt-6 uppercase">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="leading-relaxed mb-4 text-foreground-secondary">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-foreground-secondary">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground-secondary">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),
    code: ({ children }) => (
      <code className="bg-background-secondary px-1 py-0.5 text-sm font-mono border border-border-primary/30">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-background-secondary p-4 overflow-x-auto mb-4 border border-border-primary font-mono text-sm">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="text-[var(--accent)] hover:underline underline-offset-4"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[var(--accent)] pl-4 italic my-6 text-foreground-secondary">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <div className="my-6 text-center">
        <img 
          src={src} 
          alt={alt} 
          className="w-full border-2 border-border-primary inline-block"
        />
        {alt && <p className="text-[10px] mt-2 opacity-40 font-mono uppercase tracking-widest">{alt}</p>}
      </div>
    ),
    hr: () => (
      <hr className="border-border-primary my-8" />
    ),
    ...components,
  };
}
