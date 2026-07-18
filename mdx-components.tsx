import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight mb-6 border-b-2 border-ink pb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-2xl uppercase tracking-tight mb-4 mt-10">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display text-xl uppercase tracking-tight mb-3 mt-8">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="font-serif text-[1.05rem] leading-relaxed mb-4 text-ink/90">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside pl-5 mb-4 space-y-2 text-ink/90">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-5 mb-4 space-y-2 text-ink/90">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="font-serif text-[1.05rem] leading-relaxed">
        {children}
      </li>
    ),
    code: ({ children }) => (
      <code className="bg-manila px-1 py-0.5 text-sm font-mono border border-ink/30">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-manila p-4 overflow-x-auto mb-4 border-2 border-ink font-mono text-sm">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-ink underline decoration-marker decoration-2 underline-offset-4 hover:text-marker transition-colors"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-marker bg-kraft/60 px-4 py-2 italic my-6 text-ink/85">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="card-paper grain overflow-x-auto my-6">
        <table className="w-full font-mono text-[0.78rem] border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="text-left uppercase tracking-widest text-[0.64rem] text-ink/55 border-b-2 border-ink">
        {children}
      </thead>
    ),
    th: ({ children }) => <th className="py-2 px-3 font-semibold">{children}</th>,
    td: ({ children }) => (
      <td className="py-2 px-3 border-b border-dotted border-ink/30 align-top">
        {children}
      </td>
    ),
    img: ({ src, alt }) => (
      <div className="my-6 text-center">
        <img
          src={src}
          alt={alt}
          className="w-full border-2 border-ink inline-block"
        />
        {alt && (
          <p className="text-xs mt-2 text-ink/60 font-mono uppercase tracking-widest">
            {alt}
          </p>
        )}
      </div>
    ),
    hr: () => <hr className="divider-ink border-0 my-8" />,
    ...components,
  };
}
