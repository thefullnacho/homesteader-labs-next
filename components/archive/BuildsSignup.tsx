import NewsletterSignup from "@/components/home/NewsletterSignup";

/** The newsletter signup as it reads on /builds/ and at the foot of every build
 *  log. Same monthly list as the homepage; signups here carry source "builds"
 *  so the maker side of the audience can be counted on its own. */
export default function BuildsSignup({ className = "mt-16 max-w-3xl no-print" }: { className?: string }) {
  return (
    <NewsletterSignup
      source="builds"
      kicker="From the workbench"
      heading="New builds, by mail"
      blurb="The monthly dispatch, with every new build from the property: what went up, what it measured, and what broke."
      className={className}
    />
  );
}
