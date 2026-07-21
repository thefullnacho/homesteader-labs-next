import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Can You Beat the AI? Wild Plant ID Game',
    template: '%s · Forager Game',
  },
  description:
    'A wild plant and mushroom identification game pitting you against the trained vision model that powers WALKING MAN PRO. 10 rounds, real species, real lookalikes.',
  openGraph: {
    title: 'Can You Beat the AI? · Wild Plant ID Game',
    description:
      'Identify wild plants, berries, and mushrooms, then see how the trained AI did on the same image. 10 rounds vs the WALKING MAN PRO brain.',
    type: 'website',
  },
};

export default function ForagerGameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
