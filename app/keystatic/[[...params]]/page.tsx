import { notFound } from 'next/navigation';
import KeystaticApp from './keystatic-app';

// Keystatic uses local-storage mode: it can only write to the repo on a dev
// machine, so the admin UI must never ship on production.
export default function KeystaticPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <KeystaticApp />;
}
