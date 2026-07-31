import Link from 'next/link';

/**
 * Links to the two deeper caloric-security tools.
 *
 * Rendered twice on purpose. The dashboard shows them in context under "Shore
 * It Up", but the dashboard only mounts once `ready` flips in an effect and the
 * visitor already has a saved config, so a crawler and a first-time visitor
 * both miss them entirely. The tool page therefore also renders this inside its
 * always-rendered SEO anchor block, which is what left /roi/ and /companions/
 * with no inbound internal link a crawler could follow.
 *
 * No hooks here, so it renders identically on the server and after hydration.
 */

const DRAWERS = [
  {
    href: '/tools/caloric-security/roi/',
    title: 'Caloric ROI report',
    blurb: 'kcal per square foot, ranked',
  },
  {
    href: '/tools/caloric-security/companions/',
    title: 'Companion planting',
    blurb: 'antagonist alerts + suggestions',
  },
] as const;

export default function DeeperDrawers({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${className}`}>
      {DRAWERS.map(({ href, title, blurb }) => (
        <Link
          key={href}
          href={href}
          className="group border-2 border-ink bg-paper px-5 py-4 flex items-center gap-4 hover:bg-kraft transition-colors"
        >
          <span className="flex-1">
            <span className="block font-display uppercase text-base group-hover:text-marker transition-colors">
              {title}
            </span>
            <span className="block font-mono text-[0.64rem] uppercase tracking-widest text-ink/55 mt-0.5">
              {blurb}
            </span>
          </span>
          <span className="font-display text-xl text-ink/40 group-hover:text-marker transition-colors">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
